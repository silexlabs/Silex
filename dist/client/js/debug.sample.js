// wait some time so that the black website loads
setTimeout(function(){
  // insert elements
  window.controller.$insertMenuController$.addElement('text');
  window.controller.$insertMenuController$.addElement('html');
  window.controller.$insertMenuController$.addElement('container');
}, 2000);
