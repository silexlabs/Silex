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
// fade in for images
$(function(){
    //$("img").css('opacity', '0');
    $("img").hide().bind("load", function () { 
        $(this).fadeIn(); 
    }).each(function(){
        if(this.complete) $(this).trigger("load");
    });
});
////////////////////////////////////
