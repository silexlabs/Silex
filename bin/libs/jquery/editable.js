(function( $, undefined ) {

$.widget('silexlabs.editable', {
	version: '1.0.0',
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
		this.enableEditable();
	},
	_destroy: function() {
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
	},
	enableEditable: function(){
		if (this.options.isResizable != false)
			this.element.resizable({
				handles : 'all'
			});
		//this.element.draggable({ revert: 'invalid', snap: true });
		//this.element.draggable({ revert: 'invalid', grid: [ 20, 20 ] });
		if (this.options.isDraggable != false)
			this.element.draggable({ revert: 'invalid' });
		if (this.options.isResizable != false)
			this.element.resizable('enable').draggable('enable');
		if (this.options.isContainer && this.options.isDroppable != false){
			this.element.droppable({
				// prevent propagation
				greedy: true,
				
				drop: function( event, ui ) {
					// reference to the elements
					var dropped = ui.draggable;
					var droppedFrom = $(dropped).parent();
					var droppedTo = this;

					// compute new position in the container

					// keep initial position
					var initialOffset = $(dropped).offset();
					
					// move to the new container
					$(dropped).detach().appendTo($(droppedTo));
					
					// compute new position
					var newOffset = $(dropped).offset();
					var deltaTop = initialOffset.top - newOffset.top;
					var deltaLeft = initialOffset.left - newOffset.left;
					var newPosTop = $(dropped).position().top + deltaTop;
					var newPosLeft = $(dropped).position().left + deltaLeft;

					// put back at the same position
					$(dropped).css({top: newPosTop+'px',left: newPosLeft+'px'});
		    	}
		    });
		    this.element.droppable('enable');
		}
	},
});
})(jQuery);