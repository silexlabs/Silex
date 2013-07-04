goog.provide('silex.view.TextEditor');

var silex = silex || {}; 
silex.view = silex.view || {}; 

goog.require('goog.dom');
goog.require('goog.editor.Command');
goog.require('goog.editor.Field');
goog.require('goog.editor.plugins.BasicTextFormatter');
goog.require('goog.editor.plugins.EnterHandler');
goog.require('goog.editor.plugins.HeaderFormatter');
goog.require('goog.editor.plugins.LinkBubble');
goog.require('goog.editor.plugins.LinkDialogPlugin');
goog.require('goog.editor.plugins.ListTabHandler');
goog.require('goog.editor.plugins.RemoveFormatting');
goog.require('goog.editor.plugins.SpacesTabHandler');
goog.require('goog.editor.plugins.UndoRedo');
goog.require('goog.ui.editor.DefaultToolbar');
goog.require('goog.ui.editor.ToolbarController');

//////////////////////////////////////////////////////////////////
// TextEditor class
//////////////////////////////////////////////////////////////////
/**
 * the Silex TextEditor class
 * @constructor
 */
silex.view.TextEditor = function(element, cbk){
	this.element = element;
	
	var that = this;
	silex.TemplateHelper.loadTemplateFile('js/view/templates/texteditor.html', element, function(){
		console.log('template loaded');
		that.initUI();
		if (cbk) cbk();
		if(that.onReady) that.onReady();
		if (that.onTextEditorEvent){
			that.onTextEditorEvent({
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
silex.view.TextEditor.prototype.onReady;
/**
 * on ready callback
 * used by the controller to be notified when the component is ready
 * called 1 time after template loading and rendering
 */
silex.view.TextEditor.prototype.onReady;
/**
 * callback for the events, set by the controller
 */
silex.view.TextEditor.prototype.onTextEditorEvent;
/**
 * the editable text field
 */
silex.view.TextEditor.prototype.textField;
/**
 * init the menu and UIs
 */
silex.view.TextEditor.prototype.initUI = function () {
	// Create an editable field.
	this.textField = new goog.editor.Field(goog.dom.getElementByClass('text-field', this.element));

	// Create and register all of the editing plugins you want to use.
	this.textField.registerPlugin(new goog.editor.plugins.BasicTextFormatter());
	this.textField.registerPlugin(new goog.editor.plugins.RemoveFormatting());
	this.textField.registerPlugin(new goog.editor.plugins.UndoRedo());
	this.textField.registerPlugin(new goog.editor.plugins.ListTabHandler());
	this.textField.registerPlugin(new goog.editor.plugins.SpacesTabHandler());
	this.textField.registerPlugin(new goog.editor.plugins.EnterHandler());
	this.textField.registerPlugin(new goog.editor.plugins.HeaderFormatter());
	this.textField.registerPlugin(new goog.editor.plugins.LinkDialogPlugin());
	this.textField.registerPlugin(new goog.editor.plugins.LinkBubble());

	// Specify the buttons to add to the toolbar, using built in default buttons.
	var buttons = [
	goog.editor.Command.BOLD,
	goog.editor.Command.ITALIC,
	goog.editor.Command.UNDERLINE,
	goog.editor.Command.FONT_COLOR,
	goog.editor.Command.BACKGROUND_COLOR,
	goog.editor.Command.FONT_FACE,
	goog.editor.Command.FONT_SIZE,
	goog.editor.Command.LINK,
	goog.editor.Command.UNDO,
	goog.editor.Command.REDO,
	goog.editor.Command.UNORDERED_LIST,
	goog.editor.Command.ORDERED_LIST,
	goog.editor.Command.INDENT,
	goog.editor.Command.OUTDENT,
	goog.editor.Command.JUSTIFY_LEFT,
	goog.editor.Command.JUSTIFY_CENTER,
	goog.editor.Command.JUSTIFY_RIGHT,
	goog.editor.Command.SUBSCRIPT,
	goog.editor.Command.SUPERSCRIPT,
	goog.editor.Command.STRIKE_THROUGH,
	goog.editor.Command.REMOVE_FORMAT
	];
	var myToolbar = goog.ui.editor.DefaultToolbar.makeToolbar(buttons, 
		goog.dom.getElementByClass('toolbar', this.element));

	// Hook the toolbar into the field.
	var myToolbarController = new goog.ui.editor.ToolbarController(this.textField, myToolbar);

	var that = this;
	// Watch for field changes, to display below.
	goog.events.listen(this.textField, goog.editor.Field.EventType.DELAYEDCHANGE, function(){
		that.contentChanged();
	});

	this.textField.makeEditable();

	// close button
	goog.events.listen(goog.dom.getElementByClass('close-btn', this.element), goog.events.EventType.CLICK, function(){
		that.closeEditor();
	});

}
/**
 * Open the editor
 */
silex.view.TextEditor.prototype.openEditor = function(initialHtml){
	console.log('openEditor '+initialHtml);
	this.textField.setHtml(false, initialHtml);
	// background
	var background = goog.dom.getElementByClass('dialogs-background');
	// show
	goog.style.setStyle(background, 'display', 'inherit');
	goog.style.setStyle(this.element, 'display', 'inherit');
	// close
	var that = this;
	goog.events.listen(background, goog.events.EventType.CLICK, function(e){
		that.closeEditor();
	});
}
/**
 * close text editor 
 */
silex.view.TextEditor.prototype.closeEditor = function(){
	// background
	var background = goog.dom.getElementByClass('dialogs-background');
	// hide
	goog.style.setStyle(background, 'display', 'none');
	goog.style.setStyle(this.element, 'display', 'none');
}
/**
 * retrieve the editor html content
 */
silex.view.TextEditor.prototype.getData = function(){
	return this.textField.getCleanContents();
}
/**
 * the content has changed, notify the controler
 */
silex.view.TextEditor.prototype.contentChanged = function () {
	console.log('content changed '+this.textField.getCleanContents());
	if (this.onTextEditorEvent){
		this.onTextEditorEvent({
			type: 'changed',
		});
	}
}