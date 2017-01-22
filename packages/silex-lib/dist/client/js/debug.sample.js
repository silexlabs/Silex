
silexApp.view.$newWebsiteDialog$.$modalDialog$.close();

var url = 'http://localhost:6805/api/1.0/www/exec/get/a.html';
console.warn('debug.js loading', url);
console.time('a');
silexApp.$model$.file.openFromUrl(url, function (rawHtml) {
  console.warn('debug.js done loading');
  console.timeEnd('a');
  console.time('b');
  silexApp.$model$.file.setHtml(rawHtml, function() {
    console.timeEnd('b');
    console.warn('debug.js ready');

    silexApp.$controller$.$insertMenuController$.addElement('section');
    silexApp.$controller$.$insertMenuController$.addElement('text');
    silexApp.$controller$.$insertMenuController$.addElement('html');

  }, true);
}, function(err) {
  console.error('opening template error');
});
