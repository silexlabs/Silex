//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
// 
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
// 
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

$(function() {
	// list all pages from the head section
	var firstPageName = null;
	var metaPages = $('head meta[name="page"]');
	if (metaPages && metaPages.length>0){
		var firstMeta = metaPages[0];
		firstPageName = firstMeta.getAttribute('content');
	}
	// init page system
	$( 'body' ).pageable({
		currentPage: firstPageName, 
		useDeeplink:true
	});
	// silex links
	$('[data-silex-href]').click(function () {
		window.location.href = this.getAttribute('data-silex-href');
	});
	// apply the default style to all elements
	$('[data-style-normal]').each(function () {
		silexSetState(this, 'normal')
	});
	// roll over effect
	$('[data-style-normal]').mouseout(function () {
		silexSetState(this, 'normal');
	});
	$('[data-style-hover]').mouseover(function () {
		silexSetState(this, 'hover');
	});
	$('[data-style-pressed]').mousedown(function () {
		silexSetState(this, 'pressed');
		$(this).mouseup(function () {
			if (this.getAttribute('data-style-hover'))
				silexSetState(this, 'hover');
			else
				silexSetState(this, 'normal');
		});
	});
	function silexSetState (element, state) {
		// apply normal style first
		element.setAttribute('style', element.getAttribute('data-style-normal'));

		// apply specific style
		if (state != 'normal'){
			var stylesStr = element.getAttribute('data-style-'+state).split(';');
			var styles = {};
			for (var idx=0; idx<stylesStr.length; idx++){
				var pair = stylesStr[idx].split(':');
				styles[pair[0]] = pair[1];
			}
			console.log(styles);
			$(element).css(styles);
		}
	}
})
