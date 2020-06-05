(function( $, undefined ) {
$.widget('silexlabs.pageable', {
  version: '1.0.1',
  options: {
    currentPage: 'home',
    useDeeplink: true,
    pageClass: 'paged-element',
    onPageChanged: null,
    window: window // useful if you are in an iframe and want to set window = window.parent
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
        this.currentPageChanged = true;
        this.updatePage();
        break;
    }
  },
  _create: function() {
    // store the initial page
    this.initialPage = this.options.currentPage;
    // mark the body
    $(document.body).addClass('pageable-plugin-created');
    // listen for page change
    var that=this;
    if(this.options.useDeeplink){
      $(this.options.window).bind( 'hashchange', this.cbk = function(){that.updatePage()});
    }
    else{
      // FIXME: this is wrong? it will prevent all links, whereas it should check indexOf('#!')
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
      if (this.options.window.location.hash && this.options.window.location.hash.indexOf('#!') >= 0) {
        this.options.currentPage = this.options.window.location.hash;
      }
      else if(!this.currentPageChanged) {
        this.options.currentPage = this.initialPage;
      }
    }
    this.currentPageChanged = false;
    var idxDeeplink = 0;
    if (this.options.currentPage && (idxDeeplink = this.options.currentPage.indexOf('#!')) >= 0){
      var newPage = this.options.currentPage.substr(idxDeeplink + 2);
      // ignore "real" anchor
      var idxAnchor = newPage.indexOf("#");
      if(idxAnchor >= 0) newPage = newPage.substring(0, idxAnchor);
      // change to the new page
      this.options.currentPage = newPage;
    }
    // mark all paged elements as hidden
    $('.' + this.options.pageClass)
      .addClass('paged-element-hidden')
      .removeClass('paged-element-visible');
    // mark elements of the current page visible
    $('.' + this.options.pageClass + '.' + this.options.currentPage)
      .removeClass('paged-element-hidden')
      .addClass('paged-element-visible');
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
