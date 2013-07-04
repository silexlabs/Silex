goog.provide('silex.view.CKEditor');

var silex = silex || {}; 
silex.view = silex.view || {}; 


//////////////////////////////////////////////////////////////////
// CKEditor class
//////////////////////////////////////////////////////////////////
/**
 * the Silex CKEditor class
 * @constructor
 */
silex.view.CKEditor = function(element, cbk){
	this.element = element;
	
	var that = this;
	silex.TemplateHelper.loadTemplateFile('js/view/templates/ckeditor.html', element, function(){
		console.log('template loaded');
		if (cbk) cbk();
		if(that.onReady) that.onReady();
		if (that.onCKEditorEvent){
			that.onCKEditorEvent({
				type: 'ready',
			});
		}
	});
}
/**
 * reference to the attached element
 */
silex.view.Menu.prototype.element;
/**
 * on ready callback
 * used by the controller to be notified when the component is ready
 * called 1 time after template loading and rendering
 */
silex.view.CKEditor.prototype.onReady;
/**
 * callback for the events, set by the controller
 */
silex.view.CKEditor.prototype.onCKEditorEvent;
/**
 * last value of the html content
 */
silex.view.CKEditor.prototype.lastHtml;
/**
 * instance of the ckeditor
 */
silex.view.CKEditor.prototype.editorInstance;
silex.view.CKEditor.prototype.timer;
/**
 * retrieve the editor html content
 */
silex.view.CKEditor.prototype.getData = function(){
	return this.editorInstance.getData();
}
/**
 * Open the editor
 */
silex.view.CKEditor.prototype.openEditor = function(initialHtml){
	console.log('openEditor '+initialHtml);

	var that = this;
	var textArea = goog.dom.getElementByClass('ck-editor');
	textArea.innerHTML = initialHtml;
	this.lastHtml = initialHtml;

	this.editorInstance = CKEDITOR.replace( 'ck-editor', {
		contentsCss: 'libs/ckeditor/outputxhtml.css',
        height: 500,
        width: "100%",
		stylesSet: [
			{ name: 'Strong Emphasis', element: 'strong' },
			{ name: 'Emphasis', element: 'em' },

			{ name: 'Computer Code', element: 'code' },
			{ name: 'Keyboard Phrase', element: 'kbd' },
			{ name: 'Sample Text', element: 'samp' },
			{ name: 'Variable', element: 'var' },

			{ name: 'Deleted Text', element: 'del' },
			{ name: 'Inserted Text', element: 'ins' },

			{ name: 'Cited Work', element: 'cite' },
			{ name: 'Inline Quotation', element: 'q' }
		]
	});
	this.editorInstance.on("instanceReady", function(){

		// listen the keyboard events to call the callback when the user enters text
		that.editorInstance.document.on("keyup", function(){that.onUserInput();});
		// for the combo boxes to be taken into account
		that.timer = setInterval(function(){
			that.onUserInput();
		},1000);

		that.editorInstance.setData(initialHtml);
	});

	// background
	var background = goog.dom.getElementByClass('dialogs-background');
	// show
	goog.style.setStyle(background, 'display', 'inherit');
	// close
	goog.events.listen(background, goog.events.EventType.CLICK, function(e){
		that.closeEditor();
	});
}
/**
 * close ckeditor 
 */
silex.view.CKEditor.prototype.closeEditor = function(){
	this.editorInstance.destroy();
	clearTimeout(this.timer);
	// background
	var background = goog.dom.getElementByClass('dialogs-background');
	goog.style.setStyle(background, 'display', 'none');
}
/**
 * text changed in ckeditor 
 */
silex.view.CKEditor.prototype.onUserInput = function(){
	if (this.lastHtml != this.getData()){
		console.log("onUserInput ");
		if (this.onCKEditorEvent){
			this.onCKEditorEvent({
				type: 'changed',
			});
		}
		this.lastHtml = this.getData();
	}
}
