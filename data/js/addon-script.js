let self = require("sdk/self");
let data = self.data;
const pageMod = require("sdk/page-mod");
let pref = require("sdk/preferences/service");
const prefPath = "extensions.@quickdraw-helper.";
const {translate} = require("./google-translate");
let language = require("sdk/window/utils").getMostRecentBrowserWindow().getLocale();
let targetLanguage;

let quickdrawMod = null;
let cache = {};
let cacheList = [];

function setLanguage() {
  targetLanguage = pref.get(prefPath + "language");
  if(targetLanguage === "default") {
    targetLanguage = language;
  }
  cache = {};
  cacheList = [];
}

require("sdk/simple-prefs").on("language", function(prefName){
  setLanguage();
});

function loadPageMod () {
  // add launch icon to video embeds
  quickdrawMod = pageMod.PageMod({
    include: "*.quickdraw.withgoogle.com",
    attachTo: ["existing", "top", "frame"],
    contentScriptFile: data.url("js/content-script.js"),
    onAttach: function(worker) {
    //   worker.port.on("msg", function(msg) {
    //       console.log(msg.msg);
    //   });
      worker.port.on("challengetext", function(msg) {
        if(cache[msg.text] === undefined) {
          cache[msg.text] = "";
          //call translet api
          const fromCode = "en";
          if(fromCode !== targetLanguage) {
            translate(fromCode, targetLanguage, msg.text, res => {
              cache[msg.text] = res.translation;
              cacheList.push(msg.text);
              //console.log('add to cache: ' + msg.text + ' => ' + cache[msg.text]);
              if(cacheList.length>100) {
                let oldWord = cacheList.shift();
                if(cache[oldWord]) {
                  //console.log('remove from cache: ' + oldWord + ' => ' + cache[oldWord]);
                  delete cache[oldWord];
                }
              }
              worker.port.emit("setText", {text: res.translation});
            });
          }
        }
        else if(cache[msg.text] === "") {
          //console.log("ignore");
        }
        else {
          //console.log('use cache: ' + msg.text + ' => ' + cache[msg.text]);
          worker.port.emit("setText", {text: cache[msg.text]});
        }
      });
    }
  });
}

exports.main = function() {
  loadPageMod();
  setLanguage();
};

exports.onUnload = function(reason) {
  if(quickdrawMod) {
    quickdrawMod.destroy();
    quickdrawMod = null;
  }
};
