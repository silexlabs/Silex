//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
// 
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
// 
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

goog.provide('silex.Logger');

//////////////////////////////////////////////////////////////////
// Log class, used as an abstraction of console 
// This class is useful because one can enable/disable all logs or only some classes logs
// Todo: one should be able to choose between goog.log and console.*
// But it is much slower than the native console.*
//////////////////////////////////////////////////////////////////
/**
 * @constructor
 */
silex.Logger = function(id, opt_isEnabled){
	this.id = id;
	if (opt_isEnabled!=null) this.isEnabled = opt_isEnabled;
	else this.isEnabled = true;
}
/**
 * log level
 * this is a static property
 */
silex.Logger.globalLevel = Number.MAX_VALUE;
/**
 * log level
 * this is a constant
 */
silex.Logger.ALL = 0;
/**
 * log level
 * this is a constant
 */
silex.Logger.OFF = Number.MAX_VALUE;
/**
 * log level
 * this is a constant
 */
silex.Logger.FINE = 500;
/**
 * log level
 * this is a constant
 */
silex.Logger.INFO = 800;
/**
 * log level
 * this is a constant
 */
silex.Logger.WARNING = 900;
/**
 * log level
 * this is a constant
 */
silex.Logger.SEVERE = 1000;
/**
 * log level
 * this is a constant
 */
silex.Logger.SHOUT = 1200;
/**
 * id of this logger
 */
silex.Logger.prototype.id;
/**
 * is enabled or muted
 */
silex.Logger.prototype.isEnabled;
/**
 * set/get global log level
 */
silex.Logger.prototype.setLevel = function(level){
	silex.Logger.globalLevel = level;
}
/**
 * set/get global log level for all loggers
 */
silex.Logger.prototype.getLevel = function(level){
	return silex.Logger.globalLevel;
}
/**
 * set/get enabled
 */
silex.Logger.prototype.setEnabled = function(isEnabled){
	this.isEnabled = isEnabled;
}
/**
 * set/get enabled
 */
silex.Logger.prototype.getEnabled = function(){
	return this.isEnabled;
}
/**
 * log a message
 * function which gets the trace stack and builds a message out of it
 */
silex.Logger.prototype.trace = function(logFunction, level, args, style){
	if (this.isEnabled && silex.Logger.globalLevel <= level){
		var log = new Error();
		var stackArray = log.stack.split('\n');
		var callerLine;
		if (stackArray[0] == 'Error') callerLine = stackArray[3]; // chrome
		else callerLine = stackArray[2]; // firefox
		Array.prototype.unshift.call(args, '%c[' + callerLine.substring(callerLine.lastIndexOf('/')+1, callerLine.length - 1) + ']', style);
		logFunction.apply(console, args);
	}
}
/**
 * log a message
 */
silex.Logger.prototype.fine = function(){
	this.trace(console.log, silex.Logger.FINE, arguments, 'color: grey;');
}
/**
 * log a message
 */
silex.Logger.prototype.info = function(){
	this.trace(console.log, silex.Logger.INFO, arguments, 'color: grey;');
}
/**
 * log a message
 */
silex.Logger.prototype.warn = function(){
	this.trace(console.warn, silex.Logger.WARNING, arguments, 'color: orange;');
}
/**
 * log a message
 */
silex.Logger.prototype.error = function(){
	this.trace(console.error, silex.Logger.SEVERE, arguments, 'color: red;');
}
/**
 * log a message
 */
silex.Logger.prototype.shout = function(){
	this.trace(console.error, silex.Logger.SHOUT, arguments, 'color: red;');
}
