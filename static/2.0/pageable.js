(function( $, undefined ) {

$.widget('silexlabs.pageable', {
	version: '1.0.0',
	options: {
		currentPage:"home",
		useDeeplink:true
	},
	// _setOption is called for each individual option that is changing
	_setOption: function( key, value ) {
		this.options[key] = value;
		switch (key) {
			case 'useDeeplink':
				this._destroy();
				this._create();
				break;
			case 'currentPage':
				this.updatePage();
				break;
		}
	},
	_create: function() {
		var that=this;
		if(this.options.useDeeplink){
			$(window).bind( 'hashchange', this.cbk = function(){that.updatePage()});
		}
		else{
			this.element.find('a').each(function(){
				$(this).bind('click', function(event){
					event.preventDefault();
					that.options.currentPage = $(this).attr('href');
					that.updatePage();
				});
			});
		}
		this.updatePage();
	},
	_destroy: function() {
		if(this.options.useDeeplink){
			$(window).unbind( 'hashchange', this.cbk);
		}
		else{
			this.element.find('a').each(function(){
				$(this).unbind('click');
			});
		}
	},
	updatePage: function (event){
		if(this.options.useDeeplink){
			if (window.location.hash)
				this.options.currentPage = window.location.hash;
		}
		if (this.options.currentPage.charAt(0)=='#') this.options.currentPage = this.options.currentPage.substr(1);
		

		$('#current-page-style').remove();
		$('head').append('<style id="current-page-style">.'+this.options.currentPage+'{display:inherit !important; opacity:inherit; }</style>');
	}
});
})(jQuery);