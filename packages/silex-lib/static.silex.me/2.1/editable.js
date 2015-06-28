(function( $, undefined ) {

$.widget('silexlabs.editable', {
  version: '1.0.1',
  options: {
        isContainer: false,
        isResizable: true,
        isDroppable: true,
        isDraggable: true
  },
  // _setOption is called for each individual option that is changing
  _setOption: function( key, value ) {
    switch(key){
      case 'isContainer':
        this.options[key] = value;
        this.disableEditable();
        this.enableEditable();
        break;
      case 'disabled':
        this.options[key] = value;
        if (value==true){
          this.disableEditable();
        }
        else{
          this.enableEditable();
        }
        break;
      case 'isDroppable':
      case 'isDraggable':
      case 'isResizable':
        if (this.options.disabled==false){
          this.disableEditable();
          this.options[key] = value;
          this.enableEditable();
        }
        break;
    }
  },
  _create: function() {
    $(this.element).addClass('editable-plugin-created')
    this.enableEditable();
  },
  _destroy: function() {
    $(this.element).removeClass('editable-plugin-created')
    if (this.options.isDraggable != false)
      this.element.draggable('destroy');
    if (this.options.isResizable != false)
      this.element.resizable('destroy');
    if (this.options.isContainer && this.options.isDroppable != false){
      this.element.droppable('destroy');
    }
  },
  disableEditable: function(){
    if (this.options.isDraggable != false)
      this.element.draggable({revert:undefined});
    if (this.options.isContainer && this.options.isDroppable != false){
      this.element.droppable('disable');
    }
    if (this.options.isDraggable != false)
      this.element.draggable('disable');
    if (this.options.isResizable != false)
      this.element.resizable('disable');
    // restore links
    $('a').unbind('click');
  },
  enableEditable: function(){
    // prevent links while editing
    $('a', this.element).bind('click', function(e){
        e.preventDefault();
    })
    // handle resizeable options
    if (this.options.isResizable != false)
      this.element.resizable({
        handles : 'all'
      });
    //this.element.draggable({ revert: 'invalid', snap: true, scroll: true });
    //this.element.draggable({ revert: 'invalid', grid: [ 20, 20 ], scroll: true });
    if (this.options.isDraggable != false)
      this.element.draggable({
        revert: (function(droppedTo) {
          if (!droppedTo){
            // dropped out of the stage, so just move it to stage
            // usually this is because the stage was too small, and it will make it bigger
            // trigger an event the old fashion way because it has to be catched by old fashioned addEventListener
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent('droppedOutOfStage', true, true);
            this.get(0).dispatchEvent(event);
          }
        })
     });
    if (this.options.isResizable != false)
      this.element.resizable('enable').draggable('enable');
    if (this.options.isContainer && this.options.isDroppable != false){
      this.element.droppable({
        // prevent propagation
        greedy: true,
        // display drop zone highlight
        hoverClass: "ui-dropzone-active",

        drop: function( event, ui ) {
          // reference to the elements
          var dropped = ui.draggable[0];
          var droppedFrom = $(dropped).parent()[0];
          var droppedTo = this;

          /*
          // **
          // prevent drop on every container beneeth the dropped element
          // greedy: true should do that, but it only works with parent elements,
          // not with overlapping simblings
          if (dropped.dropPending) {
            var comparedPosition = dropped.dropPending.compareDocumentPosition(droppedTo);
            if ((comparedPosition & 2) !== 0){
              // block becaus the new container is bellow the old one
              return false;
            }
          }
          dropped.dropPending = droppedTo;
          var resetPending = function () {
            this.dropPending = null;
          };
          setTimeout(resetPending.bind(dropped), 1);
          // **
          /* */

          // compute new position in the container
          var initialOffset = $(dropped).offset();

          // move to the new container
          var oldPos = $(dropped).offset();
          // round position and size to integers
          //oldPos.left = Math.round(oldPos.left);
          //oldPos.top = Math.round(oldPos.top);
          // move to the new container
          $(dropped).detach().appendTo($(droppedTo));
          // keep initial position
          $(dropped).offset(oldPos);

          // dispatch event to notify that the element changed container
          if (droppedTo !== droppedFrom){
            // trigger an event the old fashion way because it has to be catched by old fashioned addEventListener
            //$(dropped).trigger('newContainer', [dropped, droppedTo, droppedFrom]);
            var event = document.createEvent('Event');
            event.initEvent('newContainer', true, true);
            dropped.dispatchEvent(event);
          }
          else{
          }
        }
      });
      this.element.droppable('enable');
    }
  },
});
})(jQuery);
