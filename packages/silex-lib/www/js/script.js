////////////////////////////////////
// animate.js
document.write('<link href="./css/animate.min.css" rel="stylesheet">');
////////////////////////////////////
// anchors and scrolling
$(function(){
    newAnchorLink('home', 0);
    newAnchorLink('showcase', 641);
    newAnchorLink('silex', 1134);
    newAnchorLink('templates', 1782);
    newAnchorLink('contact', 2215);
});
function newAnchorLink(link, pos){
    $('a[href="#'+link+'"]').click(function(){
        $('html, body').animate({
            scrollTop: pos
        }, 500);
        return false;
    });
}
/*
window.onscroll = function(e){
    if (typeof console !== "undefined") console.log(document.body.scrollTop)
}
*/
////////////////////////////////////
// github issues
var widgetScriptUrl = 'js/widgets.js';
if(typeof(Worker) !== 'undefined'){
  // web workers supported
  // create the worker
  var worker = new Worker(widgetScriptUrl);
  // define silex_github_widget
  window.silex_github_widget = function (containerSelector, labels, imageMode) {
    $(containerSelector).append('<p class="loading">Loading...</p>');
    worker.postMessage({
      operation: 'silex_github_widget',
      selector: containerSelector,
      labels: labels,
      imageMode: imageMode
    });
  };
  // define silex_rss_widget
  window.silex_rss_widget = function (containerSelector, feedUrl, count) {
    $(containerSelector).append('<p class="loading">Loading...</p>');
    worker.postMessage({
      operation: 'silex_rss_widget',
      selector: containerSelector,
      url: feedUrl,
      count: count
    });
  }
  // result of the web worker calls
  worker.onmessage = function (event) {
    $(event.data.selector+' p.loading').remove();
    $(event.data.selector).append(event.data.html);
  };
}
else{
  // no web workers, so load the script
  if (typeof console !== "undefined") console.error('NO WEBWORKER');
  document.write('<script src="'+widgetScriptUrl+'"></'+'script>')
}

////////////////////////////////////
// google analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','http://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-19608894-18', 'silex.me');
ga('send', 'pageview');
////////////////////////////////////

