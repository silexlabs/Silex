(function( $, undefined ) {

$.widget('silexlabs.pageable', {
	version: '1.0.0',
	options: {
		currentPage:"home",
        useDeeplink:true
	},
	// _setOption is called for each individual option that is changing
	_setOption: function( key, value ) {
        console.log('pageable set option '+key+' = '+value);
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
        console.log("_create ");
        var that=this;
        if(this.options.useDeeplink){
            $(window).bind( 'hashchange', this.cbk = function(){that.updatePage()});
        }
        else{
            this.element.find('a').each(function(){
                $(this).bind('click', function(event){
                    event.preventDefault();
                    console.log($(this).attr('href'));
                    that.options.currentPage = $(this).attr('href');
                    that.updatePage();
                });
            });
        }
        this.updatePage();
	},
	_destroy: function() {
		console.log("_destroy ");
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
        console.log(this);
        if(this.options.useDeeplink){
            this.options.currentPage = window.location.hash;
        }
        if (this.options.currentPage.charAt(0)=='#') this.options.currentPage = this.options.currentPage.substr(1);
        
        console.log('pageable show page '+this.options.currentPage+' - '+this.options.useDeeplink);

        $('#current-page-style').remove();
        $('head').append('<style id="current-page-style">.'+this.options.currentPage+'{display:inherit !important;}</style>');
    }
});
})(jQuery);