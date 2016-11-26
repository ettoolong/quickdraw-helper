let observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    self.port.emit("challengetext", {text: mutation.target.textContent });
  });
});

// configuration of the observer:
let config = { childList: true };
let target = document.getElementById("challengetext-word");

// pass in the target node, as well as the observer options
observer.observe(target, config);

function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function cleanup() {
  let node = document.getElementById("translation-word");
  if(node) {
    node.parentNode.removeChild(node);
  }
}

self.port.on("setText", function(data) {
  cleanup();
  let textNode = document.createTextNode(data.text);
  let node = document.createElement("span");
  node.setAttribute("id", "translation-word");
  node.appendChild(textNode);
  insertAfter(node, target);
});

self.port.on("detach", function() {
  cleanup();
});
