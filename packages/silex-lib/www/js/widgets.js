var isWebWorker = (typeof(importScripts) != 'undefined');
if (isWebWorker){
  onmessage = function (event) {
    switch(event.data.operation){
      case 'silex_github_widget':
        silex_github_widget(event.data.selector, event.data.labels, event.data.imageMode, function (html) {
          postMessage({
            operation: 'silex_github_widget',
            selector: event.data.selector,
            html: html
          })
        })
      break;
      case 'silex_rss_widget':
        silex_rss_widget(event.data.selector, event.data.url, event.data.count, function (html) {
          postMessage({
            operation: 'silex_rss_widget',
            selector: event.data.selector,
            html: html
          })
        })
      break;
    }
  }
}

////////////////////////////////////
// github issues
function silex_github_widget(containerSelector, labels, imageMode, cbk){
    var g = getJSON;
    var githubUrl = 'https://api.github.com/repos/silexlabs/Silex/issues?labels='+labels;
    if (!isWebWorker) {
      g = $.getJSON;
      githubUrl += '&callback=?';
    }
    g(githubUrl, function (data) {
      if (!isWebWorker) {
        for (idx in data){
          data = data[idx];
          break;
        }
      }
      var listHtml = '<ul>';
      for (issueIndex in data){
        var issue = data[issueIndex];
        var issueHtml = "<li>";
        issueHtml += '<a target="_blank" href="';
        issueHtml += issue.html_url;
        issueHtml += '">';
        if (imageMode){
          var re = /(https?:\/\/\S+\.(?:jpg|png|gif|jpg<.|png<.|gif<.))/i;
          var imageUrlArray = issue.body.match(re);
          if (imageUrlArray && imageUrlArray.length > 0){
            var firstImageUrl = imageUrlArray[0];
            issueHtml += '<img src="' + firstImageUrl + '" alt="download ' + issue.title + '" title="' + issue.title + '" />';
          }
        }
        else{
          issueHtml += issue.title;
        }
        issueHtml += "</a>";
        issueHtml += "</li>";
        listHtml += issueHtml;
      }
      listHtml += '</ul>';
      if(isWebWorker){
        cbk(listHtml);
      }
      else{
        $(containerSelector+' p.loading').remove();
        $(containerSelector).append(listHtml);
      }
    });
}
////////////////////////////////////
// rss feed
var jsonpCallbackIdx = 0;
function silex_rss_widget (containerSelector, feedUrl, count, cbk) {
    var callbackName = 'handleRssWidgetResult' + (jsonpCallbackIdx++);
    var base = "https://ajax.googleapis.com/ajax/services/feed/load",
        params = "?v=1.0&num=" + count + "&callback="+callbackName+"&q=" + feedUrl,
        url = base + params;

    (self || window)[callbackName] = function (data) {
      var listHtml = '<ul>';
      for (issueIndex in data.responseData.feed.entries){
        var item = data.responseData.feed.entries[issueIndex];
        var issueHtml = "<li>";
        issueHtml += '<a target="_blank" href="' + item.link+ '">';
        issueHtml += item.title;
        issueHtml += "</a>";
        var style = "";
        issueHtml += "</li>";
        listHtml += issueHtml;
      }
      listHtml += '</ul>';
      if(isWebWorker){
        cbk(listHtml);
      }
      else{
        $(containerSelector+' p.loading').remove();
        $(containerSelector).append(listHtml);
      }
    };
    if (isWebWorker){
      importScripts(url);
    }
    else{
      $.getScript(url);
    }
}
////////////////////////////////////
function getJSON (url, cbk){
  var xhr;
  xhr = new XMLHttpRequest();
  xhr.onreadystatechange = ensureReadiness;

  function ensureReadiness() {
    if(xhr.readyState < 4) {
      return;
    }

    if(xhr.status !== 200) {
      return;
    }

    // all is well
    if(xhr.readyState === 4) {
      cbk(JSON.parse(xhr.responseText));
    }
  }
  xhr.open('GET', url, true);
  xhr.send('');
}
