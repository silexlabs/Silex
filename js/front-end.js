$(function() {
	var firstPageName = null;
	var metaPages = $('head meta[name="page"]');
	if (metaPages && metaPages.length>0){
		var firstMeta = metaPages[0];
		firstPageName = firstMeta.getAttribute('content');
	}
	$( 'body' ).pageable({currentPage: firstPageName, useDeeplink:true});
})
