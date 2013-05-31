(function( $, undefined ) {

$.widget('silexlabs.pageable', {
	version: '1.0.0',
	options: {
		defaultPage:"home"
	},
	// _setOption is called for each individual option that is changing
	_setOption: function( key, value ) {
		this.options[key] = value;
	},
	_create: function() {
		console.log("_create ");
        $(window).bind( 'hashchange', this.updatePage);
        this.updatePage();
	},
	_destroy: function() {
		console.log("_destroy ");
        $(window).unbind( 'hashchange', this.updatePage);
	},
    updatePage: function (){
        var newPage = window.location.hash;
        if (newPage=='') newPage = this.options.defaultPage;
        else if (newPage.charAt(0)=='#') newPage = newPage.substr(1);
        console.log(newPage);

        $('#current-page-style').remove();
        $('head').append('<style id="current-page-style">.'+newPage+'{display:inherit;}</style>');
    }
});
})(jQuery);