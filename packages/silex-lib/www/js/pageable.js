(function( $, undefined ) {
$.widget('silexlabs.pageable', {
  version: '1.0.1',
  options: {
    currentPage:"home",
    useDeeplink:true,
    pageClass: 'paged-element',
    onPageChanged: null,
    window: window // useful if you are in an iframe to set window = window.parent
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
      case 'pageClass':
        this.updatePage();
        break;
    }
  },
  _create: function() {

    // mark the body
    $(document.body).addClass('pageable-plugin-created');
    // listen for page change
    var that=this;
    if(this.options.useDeeplink){
      $(this.options.window).bind( 'hashchange', this.cbk = function(){that.updatePage()});
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
    // mark all paged elements as hidden
    $('.' + this.options.pageClass).each(function() {
      if (!$(this).hasClass('paged-element-hidden'))
        $(this).addClass('paged-element-hidden');
    });
    this.updatePage();
  },
  _destroy: function() {
    if(this.options.useDeeplink){
      $(this.options.window).unbind( 'hashchange', this.cbk);
    }
    else{
      this.element.find('a').each(function(){
        $(this).unbind('click');
      });
    }
  },
  updatePage: function (){
    if(this.options.useDeeplink){
      if (this.options.window.location.hash && this.options.window.location.hash.indexOf('#!') >= 0)
        this.options.currentPage = this.options.window.location.hash;
    }
    if (this.options.currentPage && this.options.currentPage.indexOf('#!') >= 0){
      this.options.currentPage = this.options.currentPage.substr(this.options.currentPage.indexOf('#!') + 2);
    }
    // show elements which belong to this page
    $('#current-page-style').remove();
    $('head').append('<style id="current-page-style">.'+this.options.currentPage+'{display:inherit; }</style>');
    // mark these elements as visible
    $('.paged-element-visible').each(function() {
      $(this).removeClass('paged-element-visible');
      $(this).addClass('paged-element-hidden');
    });
    $('.'+this.options.currentPage).each(function() {
      $(this).addClass('paged-element-visible');
      $(this).removeClass('paged-element-hidden');
    });
    // mark all links as not active
    $('.page-link-active').removeClass('page-link-active');
    // mark links to the current page as active
    $('[href="#!'+this.options.currentPage+'"]').addClass('page-link-active');
    // dispatch a change event
    $(this.element).trigger('pageChanged', [this.options.currentPage]);
    if (this.options.onPageChanged) this.options.onPageChanged(this.options.currentPage);
  }
});
})(jQuery);
