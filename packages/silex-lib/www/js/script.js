////////////////////////////////////
// animate.js
document.write('<link href="./css/animate.min.css" rel="stylesheet">');
////////////////////////////////////
// fade in for images
/*
$(function(){
    $("img").hide().bind("load", function () {
        $(this).fadeIn();
    }).each(function(){
        if(this.complete || $(this).height() <= 0) $(this).trigger("load");
    });
});
*/
////////////////////////////////////
// anchors and scrolling
$(function(){
    var offset = 40;
    newAnchorLink('home', 0);
    newAnchorLink('showcase', 665-offset);
    newAnchorLink('silex', 890-offset);
    newAnchorLink('links', 585-offset);
    newAnchorLink('contact', 135+2710);
});
function newAnchorLink(link, pos){
    $('a[href="http://#'+link+'"]').click(function(){
        $('html, body').animate({
            scrollTop: pos
        }, 500);
        return false;
    });
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
// github issues
function silex_github_widget(containerSelector, labels){
    $(containerSelector).append('<p class="loading">Loading...</p>');
    $.getJSON('https://api.github.com/repos/silexlabs/Silex/issues?labels='+labels, function (data) {
        var list = $('<ul></ul>');
        $.each(data, function (issueIndex, issue) {
          var issueHtml = "<li>";
          issueHtml += '<a target="_blank" href="' + issue.html_url+ '">';
          issueHtml += issue.title;
          issueHtml += "</a>";
          var style = "";
        /*
        $.each(issue.labels, function (labelIndex, label) {
            style = 'background-color:#' + label.color + ';';
            if(label.color == "000000"){
              style = 'color: white;' + style;
            }
            issueHtml += '<span class="label" style="' + style + '">' + label.name + '</span>';
          });
        */
          issueHtml += "</li>";
          list.append(issueHtml);
        });
        $(containerSelector+' p.loading').remove();
        $(containerSelector).append(list);
    });
}
////////////////////////////////////
// rss feed
function silex_rss_widget (containerSelector, feedUrl, count) {
    $(containerSelector).append('<p class="loading">Loading...</p>');
    var base = "https://ajax.googleapis.com/ajax/services/feed/load",
        params = "?v=1.0&num=" + count + "&callback=?&q=" + feedUrl,
        url = base + params;
    $.ajax({
        url: url,
        dataType: "json",
        success: function (res) {
            var data = res.responseData.feed.entries;
            var list = $('<ul></ul>');
            $.each(data, function (itemIdx) {
                var item = data[itemIdx];
                console.log(item);
                var issueHtml = "<li>";
                issueHtml += '<a target="_blank" href="' + item.link+ '">';
                issueHtml += item.title;
                issueHtml += "</a>";
                var style = "";
                issueHtml += "</li>";
                list.append(issueHtml);
            });
            $(containerSelector+' p.loading').remove();
            $(containerSelector).append(list);
        }
    });
}
////////////////////////////////////

