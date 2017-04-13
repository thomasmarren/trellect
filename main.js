var s = document.createElement('script');
s.src = chrome.extension.getURL('trelloApi.js');
s.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);

var s = document.createElement('script');
s.src = chrome.extension.getURL('trellect.js');
s.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);
