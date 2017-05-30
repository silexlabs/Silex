/**inst
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */


/**
 * @fileoverview define externs for libs used in Silex
 */


/**
 * Parse and consume source maps. By Mozilla
 * @see https://github.com/mozilla/source-map/
 * @type {Object.<*>}
 */
var sourceMap = {};


/**
 * Prodotype
 * @see https://github.com/lexoyo/Prodotype
 * @constructor
 */
function Prodotype(container, rootPath) {}


/**
 * @typedef {{
 *          faIconClass:?string,
 *          initialCss:?Array,
 *          initialCssContentContainer:?Array,
 *          initialCssClass:?Array,
 *          baseElement:?string,
 *          name:?string,
 *          category:?string,
 *          isPrivate:?boolean
 *          }}
 */
var ProdotypeCompDef;


/**
 * @type {ProdotypeCompDef}
 */
Prodotype.prototype.componentsDef;


/**
 * @param {string} templateName
 * @param {Object.<*>} data
 */
Prodotype.prototype.decorate = function(templateName, data) {};


/**
 * @param {function(?Object)} cbk
 */
Prodotype.prototype.ready = function(cbk) {};


/**
 * @param {?Object.<*>=} data
 * @param {?Array.<{name:string, displayName:string, templateName:string}>=} list
 * @param {?string=} templateName
 * @param {?Object.<function()>=} events
 */
Prodotype.prototype.edit = function(data, list, templateName, events) {};


/**
 *
 */
Prodotype.prototype.reset = function() {};


/**
 * @return {string}
 */
Prodotype.prototype.createName = function(type, list) {};


/**
 * @param {Element} container the element containing the dependencies (scripts and style sheets)
 * @param {Array.<{templateName:string}>} componentNames the list of all the component names
 * @return {Array.<Element>} the elements to be added to the site
 */
Prodotype.prototype.getMissingDependencies = function(container, componentNames) {};


/**
 * @param {Array.<Element>} dependencyElements depencies, i.e. scripts and style sheets
 * @param {Array.<{templateName:string}>} componentNames the list of all the component names
 */
Prodotype.prototype.getUnusedDependencies = function(dependencyElements, componentNames) {};


/**
 * @param {string} rawSourceMap
 * @constructor
 */
sourceMap.SourceMapConsumer = function (rawSourceMap) {}


/**
 * @param {{line:*, column:*, bias:*}} generatedPosition
 * @return {{source:string, line:number, column:number, name:*}}
 */
sourceMap.SourceMapConsumer.prototype.originalPositionFor = function(generatedPosition) {};

/**
 * piwik analytics
 * @constructor
 */
function Piwik() {}

/**
 * @type {Array.<string|number>}
 */
var _paq = [];

/**
 * @static
 * @return {Piwik}
 */
Piwik.getAsyncTracker = function() {};


/**
 * @param {string} c
 * @param {string} d
 * @param {?string=} e
 * @param {?number=} f
 */
Piwik.prototype.trackEvent = function(c, d, e, f) {};



/**
 * pixlr lib, in /dist/client/libs/pixlr/pixlr.js
 * @param {string} pixlrSendImageUrl
 * @param {string} pixlrCloseWindowUrl
 * @param {?Object=} opt_settings
 * @constructor
 */
function Pixlr(pixlrSendImageUrl, pixlrCloseWindowUrl, opt_settings) {}


/**
 * pixlr lib, in /dist/client/libs/pixlr/pixlr.js
 * @param {string|HTMLElement} image
 * @param {?string=} opt_imageDst
 * @param {?string=} opt_target
 */
Pixlr.prototype.edit = function(image, opt_imageDst, opt_target) {};


/**
 * pixlr lib, in /dist/client/libs/pixlr/pixlr.js
 * @param {string|HTMLElement} image
 * @param {?string=} opt_imageDst
 * @param {?string=} opt_target
 */
Pixlr.prototype.express = function(image, opt_imageDst, opt_target) {};



/**
 * pixlr lib, in /dist/client/libs/pixlr/pixlr.js
 * callback for update events
 * @type {?function()}
 */
Pixlr.prototype.onUpdate = null;



/**
 * jquery externs
 * @constructor
 */
function JQuery() {}


/**
 * jquery externs
 * @param {?Object|string=} options
 */
JQuery.prototype.editable = function(options) {};


/**
 * jquery externs
 * @param {?Object|string=} option
 * @param {?string=} value
 */
JQuery.prototype.pageable = function(option, value) {};


/**
 * jquery externs
 * @param {*} any
 * @return {JQuery}
 */
window.jQuery = function(any) {};


/**
 * cloud explorer externs
 * @type {Object.<*>}
 */
var ce = {};


/**
 * cloud explorer externs
 * @type {Object.<*>}
 */
ce.api = {};



/**
 * cloud explorer externs
 * @constructor
 */
ce.api.CloudExplorer = function() {};


/**
 * cloud explorer externs
 * @param {string} className
 */
ce.api.CloudExplorer.get = function(className) {};


/**
 * cloud explorer externs
 * TODO: add the real params names and types
 * @param arg1
 * @param arg2
 * @param arg3
 * @param arg4
 * @param arg5
 */
ce.api.CloudExplorer.prototype.read = function(arg1, arg2, arg3, arg4, arg5) {};


/**
 * cloud explorer externs
 * TODO: add the real params names and types
 * @param arg1
 * @param arg2
 * @param arg3
 * @param arg4
 * @param arg5
 * @param arg6
 */
ce.api.CloudExplorer.prototype.write = function(arg1, arg2, arg3, arg4, arg5, arg6) {};


/**
 * cloud explorer externs
 * TODO: add the real params names and types
 * @param arg1
 * @param arg2
 * @param arg3
 */
ce.api.CloudExplorer.prototype.pick = function(arg1, arg2, arg3) {};


/**
 * cloud explorer externs
 * TODO: add the real params names and types
 * @param arg1
 * @param arg2
 * @param arg3
 */
ce.api.CloudExplorer.prototype.requestAuthorize = function(arg1, arg2, arg3) {};


/**
 * cloud explorer externs
 * TODO: add the real params names and types
 * @param arg1
 * @param arg2
 * @param arg3
 * @param arg4
 */
ce.api.CloudExplorer.prototype.exportFile = function(arg1, arg2, arg3, arg4) {};


/**
 * unifile externs
 * @constructor
 */
var UnifileResponse = function() {};


/**
 * @type {boolean}
 */
UnifileResponse.prototype.success = false;


/**
 * @type {?string}
 */
UnifileResponse.prototype.message = null;


/**
 * @type {?string}
 */
UnifileResponse.prototype.tempLink = null;


/**
 * @type {?string}
 */
UnifileResponse.prototype.code = null;



/**
 * ace externs
 * @constructor
 */
var Ace = function() {};


/**
 * ace externs
 * @type {Object.<*>}
 */
var ace;


/**
 * Embeds the Ace editor into the DOM, at the element provided by `el`.
 * @param {string | Element} el Either the id of an element, or the element itself
 * @return {Ace}
 */
ace.edit = function(el) {};


/**
 * @type {{setShowGutter}}
 */
Ace.prototype.renderer = {'setShowGutter': function() {}};


/**
 * Sets a new key handler, such as "vim" or "windows".
 * @param {string} keyboardHandler The new key handler
 *
 */
Ace.prototype.setKeyboardHandler = function(keyboardHandler) {};


/**
 * Returns the keyboard handler, such as "vim" or "windows".
 *
 * @return {string}
 *
 */
Ace.prototype.getKeyboardHandler = function() {};


/**
 * Sets a new editsession to use. This method also emits the `'changeSession'` event.
 * @param {Object.<*>} session The new session to use
 *
 *
 */
Ace.prototype.setSession = function(session) {};


/**
 * Returns the current session being used.
 * for some reason, this.ace.getSession().* is undefined,
 *    closure renames it despite the fact that that it is declared in the externs.js file
 * @return {{on:function(string, function(Object)), setMode: function(string)}}
 */
Ace.prototype.getSession = function() {};


/**
 * Sets the current document to `val`.
 * @param {string} val The new value to set for the document
 * @param {?number=} cursorPos Where to set the new value. `undefined` or 0 is selectAll, -1 is at the document start, and 1 is at the end
 *
 * @return {string} The current document value
 */
Ace.prototype.setValue = function(val, cursorPos) {};


/**
 * Returns the current session's content.
 *
 * @return {string}
 */
Ace.prototype.getValue = function() {};


/**
 *
 * Returns the currently highlighted selection.
 * @return {string} The highlighted selection
 */
Ace.prototype.getSelection = function() {};


/**
 * {:VirtualRenderer.onResize}
 * @param {?boolean=} force If `true`, recomputes the size, even if the height and width haven't changed
 *
 *
 */
Ace.prototype.resize = function(force) {};


/**
 * {:VirtualRenderer.setTheme}
 * @param {string} theme The path to a theme
 *
 *
 */
Ace.prototype.setTheme = function(theme) {};


/**
 * {:VirtualRenderer.getTheme}
 *
 * @return {string} The set theme
 */
Ace.prototype.getTheme = function() {};


/**
 * {:VirtualRenderer.setStyle}
 * @param {string} style A class name
 *
 *
 */
Ace.prototype.setStyle = function(style) {};


/**
 * {:VirtualRenderer.unsetStyle}
 */
Ace.prototype.unsetStyle = function(style) {};


/**
 * Gets the current font size of the editor text.
 */
Ace.prototype.getFontSize = function() {};


/**
 * Set a new font size (in pixels) for the editor text.
 * @param {string} size A font size ( _e.g._ "12px")
 *
 *
 */
Ace.prototype.setFontSize = function(size) {};


/**
 *
 * Brings the current `textInput` into focus.
 */
Ace.prototype.focus = function() {};


/**
 * Returns `true` if the current `textInput` is in focus.
 * @return {boolean}
 */
Ace.prototype.isFocused = function() {};


/**
 *
 * Blurs the current `textInput`.
 */
Ace.prototype.blur = function() {};


/**
 * Emitted once the editor comes into focus.
 * @event focus
 *
 *
 */
Ace.prototype.onFocus = function() {};


/**
 * Emitted once the editor has been blurred.
 * @event blur
 *
 *
 */
Ace.prototype.onBlur = function() {};


/**
 * Emitted whenever the document is changed.
 * @event change
 * @param {Object.<*>} e Contains a single property, `data`, which has the delta of changes
 *
 *
 *
 */
Ace.prototype.onDocumentChange = function(e) {};


/**
 * Emitted when the selection changes.
 *
 */
Ace.prototype.onCursorChange = function() {};


/**
 * Returns the string of text currently highlighted.
 * @return {string}
 */
Ace.prototype.getSelectedText = function() {};


/**
 * Returns the string of text currently highlighted.
 * @return {string}
 * @deprecated Use getSelectedText instead.
 */
Ace.prototype.getCopyText = function() {};


/**
 * Called whenever a text "copy" happens.
 */
Ace.prototype.onCopy = function() {};


/**
 * Called whenever a text "cut" happens.
 */
Ace.prototype.onCut = function() {};


/**
 * Called whenever a text "paste" happens.
 * @param {string} text The pasted text
 *
 *
 */
Ace.prototype.onPaste = function(text) {};


/**
 * Inserts `text` into wherever the cursor is pointing.
 * @param {string} text The new text to add
 *
 *
 */
Ace.prototype.insert = function(text) {};


/**
 * Pass in `true` to enable overwrites in your session, or `false` to disable. If overwrites is enabled, any text you enter will type over any text after it. If the value of `overwrite` changes, this function also emites the `changeOverwrite` event.
 * @param {boolean} overwrite Defines wheter or not to set overwrites
 *
 *
 */
Ace.prototype.setOverwrite = function(overwrite) {};


/**
 * Returns `true` if overwrites are enabled; `false` otherwise.
 * @return {boolean}
 */
Ace.prototype.getOverwrite = function() {};


/**
 * Sets the value of overwrite to the opposite of whatever it currently is.
 */
Ace.prototype.toggleOverwrite = function() {};


/**
 * Sets how fast the mouse scrolling should do.
 * @param {number} speed A value indicating the new speed (in milliseconds)
 */
Ace.prototype.setScrollSpeed = function(speed) {};


/**
 * Returns the value indicating how fast the mouse scroll speed is (in milliseconds).
 * @return {number}
 */
Ace.prototype.getScrollSpeed = function() {};


/**
 * Sets the delay (in milliseconds) of the mouse drag.
 * @param {number} dragDelay A value indicating the new delay
 */
Ace.prototype.setDragDelay = function(dragDelay) {};


/**
 * Returns the current mouse drag delay.
 * @return {number}
 */
Ace.prototype.getDragDelay = function() {};


/**
 * Draw selection markers spanning whole line, or only over selected text. Default value is "line"
 * @param {string} style The new selection style "line"|"text"
 *
 */
Ace.prototype.setSelectionStyle = function(style) {};


/**
 * Returns the current selection style.
 * @return {string}
 */
Ace.prototype.getSelectionStyle = function() {};


/**
 * Determines whether or not the current line should be highlighted.
 * @param {boolean} shouldHighlight Set to `true` to highlight the current line
 */
Ace.prototype.setHighlightActiveLine = function(shouldHighlight) {};


/**
 * Returns `true` if current lines are always highlighted.
 * @return {boolean}
 */
Ace.prototype.getHighlightActiveLine = function() {};


/**
 * Determines if the currently selected word should be highlighted.
 * @param {boolean} shouldHighlight Set to `true` to highlight the currently selected word
 *
 */
Ace.prototype.setHighlightSelectedWord = function(shouldHighlight) {};


/**
 * Returns `true` if currently highlighted words are to be highlighted.
 * @return {boolean}
 */
Ace.prototype.getHighlightSelectedWord = function() {};


/**
 * If `showInvisibles` is set to `true`, invisible characters&mdash;like spaces or new lines&mdash;are show in the editor.
 * @param {boolean} showInvisibles Specifies whether or not to show invisible characters
 *
 */
Ace.prototype.setShowInvisibles = function(showInvisibles) {};


/**
 * Returns `true` if invisible characters are being shown.
 * @return {boolean}
 */
Ace.prototype.getShowInvisibles = function() {};


/**
 * If `showPrintMargin` is set to `true`, the print margin is shown in the editor.
 * @param {boolean} showPrintMargin Specifies whether or not to show the print margin
 *
 */
Ace.prototype.setShowPrintMargin = function(showPrintMargin) {};


/**
 * Returns `true` if the print margin is being shown.
 * @return {boolean}
 */
Ace.prototype.getShowPrintMargin = function() {};


/**
 * Sets the column defining where the print margin should be.
 * @param {number} showPrintMargin Specifies the new print margin
 *
 */
Ace.prototype.setPrintMarginColumn = function(showPrintMargin) {};


/**
 * Returns the column number of where the print margin is.
 * @return {number}
 */
Ace.prototype.getPrintMarginColumn = function() {};


/**
 * If `readOnly` is true, then the editor is set to read-only mode, and none of the content can change.
 * @param {boolean} readOnly Specifies whether the editor can be modified or not
 *
 */
Ace.prototype.setReadOnly = function(readOnly) {};


/**
 * Returns `true` if the editor is set to read-only mode.
 * @return {boolean}
 */
Ace.prototype.getReadOnly = function() {};


/**
 * Specifies whether to use behaviors or not. ["Behaviors" in this case is the auto-pairing of special characters, like quotation marks, parenthesis, or brackets.]{: #BehaviorsDef}
 * @param {boolean} enabled Enables or disables behaviors
 *
 */
Ace.prototype.setBehavioursEnabled = function(enabled) {};


/**
 * Returns `true` if the behaviors are currently enabled. {:BehaviorsDef}
 *
 * @return {boolean}
 */
Ace.prototype.getBehavioursEnabled = function() {};


/**
 * Specifies whether to use wrapping behaviors or not, i.e. automatically wrapping the selection with characters such as brackets
 * when such a character is typed in.
 * @param {boolean} enabled Enables or disables wrapping behaviors
 *
 */
Ace.prototype.setWrapBehavioursEnabled = function(enabled) {};


/**
 * Returns `true` if the wrapping behaviors are currently enabled.
 */
Ace.prototype.getWrapBehavioursEnabled = function() {};


/**
 * Indicates whether the fold widgets should be shown or not.
 * @param {boolean} show Specifies whether the fold widgets are shown
 */
Ace.prototype.setShowFoldWidgets = function(show) {};


/**
 * Returns `true` if the fold widgets are shown.
 * @return {boolean}
 */
Ace.prototype.getShowFoldWidgets = function() {};


/**
 * Removes words of text from the editor. A "word" is defined as a string of characters bookended by whitespace.
 * @param {string} dir The direction of the deletion to occur, either "left" or "right"
 *
 */
Ace.prototype.remove = function(dir) {};


/**
 * Removes the word directly to the right of the current selection.
 */
Ace.prototype.removeWordRight = function() {};


/**
 * Removes the word directly to the left of the current selection.
 */
Ace.prototype.removeWordLeft = function() {};


/**
 * Removes all the words to the left of the current selection, until the start of the line.
 */
Ace.prototype.removeToLineStart = function() {};


/**
 * Removes all the words to the right of the current selection, until the end of the line.
 */
Ace.prototype.removeToLineEnd = function() {};


/**
 * Splits the line at the current selection (by inserting an `'\n'`).
 */
Ace.prototype.splitLine = function() {};


/**
 * Transposes current line.
 */
Ace.prototype.transposeLetters = function() {};


/**
 * Converts the current selection entirely into lowercase.
 */
Ace.prototype.toLowerCase = function() {};


/**
 * Converts the current selection entirely into uppercase.
 */
Ace.prototype.toUpperCase = function() {};


/**
 * Inserts an indentation into the current cursor position or indents the selected lines.
 *
 */
Ace.prototype.indent = function() {};


/**
 * Indents the current line.
 */
Ace.prototype.blockIndent = function() {};


/**
 * Outdents the current line.
 */
Ace.prototype.blockOutdent = function() {};


/**
 * Given the currently selected range, this function either comments all the lines, or uncomments all of them.
 */
Ace.prototype.toggleCommentLines = function() {};


/**
 * Works like [[EditSession.getTokenAt]], except it returns a number.
 * @return {number}
 */
Ace.prototype.getnumberAt = function(row, column) {};


/**
 * If the character before the cursor is a number, this functions changes its value by `amount`.
 * @param {number} amount The value to change the numeral by (can be negative to decrease value)
 *
 */
Ace.prototype.modifynumber = function(amount) {};


/**
 * Removes all the lines in the current selection
 */
Ace.prototype.removeLines = function() {};


/**
 * Shifts all the selected lines down one row.
 *
 * @return {number} On success, it returns -1.
 */
Ace.prototype.moveLinesDown = function() {};


/**
 * Shifts all the selected lines up one row.
 * @return {number} On success, it returns -1.
 */
Ace.prototype.moveLinesUp = function() {};


/**
 * Moves a range of text from the given range to the given position. `toPosition` is an object that looks like this:
 * ```json
 *    { row: newRowLocation, column: newColumnLocation }
 * ```
 * @param {Range} range The range of text you want moved within the document
 * @param {Object.<*>} toPosition The location (row and column) where you want to move the text to
 *
 * @return {Range} The new range where the text was moved to.
 */
Ace.prototype.moveText = function(range, toPosition, copy) {};


/**
 * Copies all the selected lines up one row.
 * @return {number} On success, returns 0.
 *
 */
Ace.prototype.copyLinesUp = function() {};


/**
 * Copies all the selected lines down one row.
 * @return {number} On success, returns the number of new rows added; in other words, `lastRow - firstRow + 1`.
 *
 */
Ace.prototype.copyLinesDown = function() {};


/**
 * Executes a specific function, which can be anything that manipulates selected lines, such as copying them, duplicating them, or shifting them.
 * @param {Function} mover A method to call on each selected row
 *
 *
 */
Ace.prototype.$moveLines = function(mover) {};


/**
 * Returns an object indicating the currently selected rows. The object looks like this:
 *
 * ```json
 * { first: range.start.row, last: range.end.row }
 * ```
 *
 * @return {Object.<*>}
 */
Ace.prototype.$getSelectedRows = function() {};


/**
 * {:VirtualRenderer.getFirstVisibleRow}
 *
 * @return {number}
 */
Ace.prototype.getFirstVisibleRow = function() {};


/**
 * {:VirtualRenderer.getLastVisibleRow}
 *
 * @return {number}
 */
Ace.prototype.getLastVisibleRow = function() {};


/**
 * Indicates if the row is currently visible on the screen.
 * @param {number} row The row to check
 *
 * @return {boolean}
 */
Ace.prototype.isRowVisible = function(row) {};


/**
 * Indicates if the entire row is currently visible on the screen.
 * @param {number} row The row to check
 *
 *
 * @return {boolean}
 */
Ace.prototype.isRowFullyVisible = function(row) {};


/**
 * Returns the number of currently visibile rows.
 * @return {number}
 */
Ace.prototype.$getVisibleRowCount = function() {};


/**
 * Selects the text from the current position of the document until where a "page down" finishes.
 */
Ace.prototype.selectPageDown = function() {};


/**
 * Selects the text from the current position of the document until where a "page up" finishes.
 */
Ace.prototype.selectPageUp = function() {};


/**
 * Shifts the document to wherever "page down" is, as well as moving the cursor position.
 */
Ace.prototype.gotoPageDown = function() {};


/**
 * Shifts the document to wherever "page up" is, as well as moving the cursor position.
 */
Ace.prototype.gotoPageUp = function() {};


/**
 * Scrolls the document to wherever "page down" is, without changing the cursor position.
 */
Ace.prototype.scrollPageDown = function() {};


/**
 * Scrolls the document to wherever "page up" is, without changing the cursor position.
 */
Ace.prototype.scrollPageUp = function() {};


/**
 * Moves the editor to the specified row.
 */
Ace.prototype.scrollToRow = function(row) {};


/**
 * Scrolls to a line. If `center` is `true`, it puts the line in middle of screen (or attempts to).
 * @param {number} line The line to scroll to
 * @param {boolean} center If `true`
 * @param {boolean} animate If `true` animates scrolling
 * @param {Function} callback Function to be called when the animation has finished
 *
 *
 */
Ace.prototype.scrollToLine = function(line, center, animate, callback) {};


/**
 * Attempts to center the current selection on the screen.
 */
Ace.prototype.centerSelection = function() {};


/**
 * Gets the current position of the cursor.
 * @return {Object.<{row: number, column: number}>} An object that looks something like this:
 *
 * ```json
 * { row: currRow, column: currCol }
 * ```
 *
 */
Ace.prototype.getCursorPosition = function() {};


/**
 * Returns the screen position of the cursor.
 * @return {number}
 */
Ace.prototype.getCursorPositionScreen = function() {};


/**
 * {:Selection.getRange}
 * @return {Range}
 */
Ace.prototype.getSelectionRange = function() {};


/**
 * Selects all the text in editor.
 */
Ace.prototype.selectAll = function() {};


/**
 * {:Selection.clearSelection}
 */
Ace.prototype.clearSelection = function() {};


/**
 * Moves the cursor to the specified row and column. Note that this does not de-select the current selection.
 * @param {number} row The new row number
 * @param {number} column The new column number
 *
 *
 */
Ace.prototype.moveCursorTo = function(row, column) {};


/**
 * Moves the cursor to the position indicated by `pos.row` and `pos.column`.
 * @param {Object.<*>} pos An object with two properties, row and column
 *
 *
 */
Ace.prototype.moveCursorToPosition = function(pos) {};


/**
 * Moves the cursor's row and column to the next matching bracket.
 *
 */
Ace.prototype.jumpToMatching = function(select) {};


/**
 * Moves the cursor to the specified line number, and also into the indiciated column.
 * @param {number} linenumber The line number to go to
 * @param {number} column A column number to go to
 * @param {boolean} animate If `true` animates scolling
 *
 */
Ace.prototype.gotoLine = function(linenumber, column, animate) {};


/**
 * Moves the cursor to the specified row and column. Note that this does de-select the current selection.
 * @param {number} row The new row number
 * @param {number} column The new column number
 *
 *
 */
Ace.prototype.navigateTo = function(row, column) {};


/**
 * Moves the cursor up in the document the specified number of times. Note that this does de-select the current selection.
 * @param {number} times The number of times to change navigation
 *
 *
 */
Ace.prototype.navigateUp = function(times) {};


/**
 * Moves the cursor down in the document the specified number of times. Note that this does de-select the current selection.
 * @param {number} times The number of times to change navigation
 *
 *
 */
Ace.prototype.navigateDown = function(times) {};


/**
 * Moves the cursor left in the document the specified number of times. Note that this does de-select the current selection.
 * @param {number} times The number of times to change navigation
 *
 *
 */
Ace.prototype.navigateLeft = function(times) {};


/**
 * Moves the cursor right in the document the specified number of times. Note that this does de-select the current selection.
 * @param {number} times The number of times to change navigation
 *
 *
 */
Ace.prototype.navigateRight = function(times) {};


/**
 *
 * Moves the cursor to the start of the current line. Note that this does de-select the current selection.
 */
Ace.prototype.navigateLineStart = function() {};


/**
 *
 * Moves the cursor to the end of the current line. Note that this does de-select the current selection.
 */
Ace.prototype.navigateLineEnd = function() {};


/**
 *
 * Moves the cursor to the end of the current file. Note that this does de-select the current selection.
 */
Ace.prototype.navigateFileEnd = function() {};


/**
 *
 * Moves the cursor to the start of the current file. Note that this does de-select the current selection.
 */
Ace.prototype.navigateFileStart = function() {};


/**
 *
 * Moves the cursor to the word immediately to the right of the current position. Note that this does de-select the current selection.
 */
Ace.prototype.navigateWordRight = function() {};


/**
 *
 * Moves the cursor to the word immediately to the left of the current position. Note that this does de-select the current selection.
 */
Ace.prototype.navigateWordLeft = function() {};


/**
 * Replaces the first occurance of `options.needle` with the value in `replacement`.
 * @param {string} replacement The text to replace with
 * @param {Object.<*>} options The [[Search `Search`]] options to use
 *
 *
 */
Ace.prototype.replace = function(replacement, options) {};


/**
 * Replaces all occurances of `options.needle` with the value in `replacement`.
 * @param {string} replacement The text to replace with
 * @param {Object.<*>} options The [[Search `Search`]] options to use
 *
 *
 */
Ace.prototype.replaceAll = function(replacement, options) {};


/**
 * {:Search.getOptions} For more information on `options`, see [[Search `Search`]].
 * @return {Object.<*>}
 */
Ace.prototype.getLastSearchOptions = function() {};


/**
 * Attempts to find `needle` within the document. For more information on `options`, see [[Search `Search`]].
 * @param {string} needle The text to search for (optional)
 * @param {Object.<*>} options An object defining various search properties
 * @param {boolean} animate If `true` animate scrolling
 *
 *
 */
Ace.prototype.find = function(needle, options, animate) {};


/**
 * Performs another search for `needle` in the document. For more information on `options`, see [[Search `Search`]].
 * @param {Object.<*>} options search options
 * @param {boolean} animate If `true` animate scrolling
 *
 *
 */
Ace.prototype.findNext = function(options, animate) {};


/**
 * Performs a search for `needle` backwards. For more information on `options`, see [[Search `Search`]].
 * @param {Object.<*>} options search options
 * @param {boolean} animate If `true` animate scrolling
 *
 *
 */
Ace.prototype.findPrevious = function(options, animate) {};


/**
 * {:UndoManager.undo}
 */
Ace.prototype.undo = function() {};


/**
 * {:UndoManager.redo}
 */
Ace.prototype.redo = function() {};


/**
 *
 * Cleans up the entire editor.
 */
Ace.prototype.destroy = function() {};


/**
 * Enables automatic scrolling of the cursor into view when editor itself is inside scrollable element
 * @param {boolean} enable default true
 */
Ace.prototype.setAutoScrollEditorIntoView = function(enable) {};


/**
 * @param {Object.<*>} opts
 */
Ace.prototype.setOptions = function(opts) {};


/**
 * @type {Object.<*>}
 */
var alertify = {};
/**
 * @param {string} message
 */
alertify.success = function (message) {};
/**
 * @param {*} config
 */
alertify.set = function (config) {};
/**
 * ask for a text
 * @param {string} message
 * @param {function(?boolean, ?string)} cbk
 * @param {?string=} opt_okLabel
 * @param {?string=} opt_cancelLabel
 * @param {?string=} opt_text
 */
alertify.alert = function (message, cbk, opt_okLabel, opt_cancelLabel, opt_text) {};
/**
 * ask for a text
 * @param {string} message
 * @param {function(?boolean, ?string)} cbk
 * @param {?string=} opt_okLabel
 * @param {?string=} opt_cancelLabel
 * @param {?string=} opt_text
 */
alertify.prompt = function (message, cbk, opt_okLabel, opt_cancelLabel, opt_text) {};
/**
 * ask for a text
 * @param {string} message
 * @param {function(?boolean, ?string)} cbk
 * @param {?string=} opt_okLabel
 * @param {?string=} opt_cancelLabel
 * @param {?string=} opt_text
 */
alertify.confirm = function (message, cbk, opt_okLabel, opt_cancelLabel, opt_text) {};
/**
 * @param {string} message
 */
alertify.error = function (message) {};
/**
 * @param {string} message
 */
alertify.log = function (message) {};

