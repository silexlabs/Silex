// name: logger.js
// version: 0.0.1
// http://github.com/quirkey/node-logger
/*

Copyright (c) 2010 Aaron Quint

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

var path = require('path'),
    sys  = require('sys'),
    fs   = require('fs');

var makeArray = function(nonarray) { 
  return Array.prototype.slice.call(nonarray); 
};

// Create a new instance of Logger, logging to the file at `log_file_path`
// if `log_file_path` is null, log to STDOUT.
var Logger = function(log_file_path) {
  // default write is STDOUT
  this.write     = sys.print;
  this.log_level_index = 3;
  
  // if a path is given, try to write to it
  if (log_file_path) {
    // Write to a file
    log_file_path = path.normalize(log_file_path);
    this.stream = fs.createWriteStream(log_file_path, {flags: 'a', encoding: 'utf8', mode: 0666});
    this.stream.write("\n");
    this.write = function(text) { this.stream.write(text); };
  }
};

Logger.levels = ['fatal', 'error', 'warn', 'info', 'debug'];

// The default log formatting function. The default format looks something like:
//
//    error [Sat Jun 12 2010 01:12:05 GMT-0400 (EDT)] message
// 
Logger.prototype.format = function(level, date, message) {
  return [level, ' [', date, '] ', message].join('');
};

// Set the maximum log level. The default level is "info".
Logger.prototype.setLevel = function(new_level) {
  var index = Logger.levels.indexOf(new_level);
  return (index != -1) ? this.log_level_index = index : false;
};

// The base logging method. If the first argument is one of the levels, it logs
// to that level, otherwise, logs to the default level. Can take `n` arguments
// and joins them by ' '. If the argument is not a string, it runs `sys.inspect()`
// to print a string representation of the object.
Logger.prototype.log = function() {
  var args = makeArray(arguments),
      log_index = Logger.levels.indexOf(args[0]),
      message = '';

  // if you're just default logging
  if (log_index === -1) { 
    log_index = this.log_level_index; 
  } else {
    // the first arguement actually was the log level
    args.shift();
  }
  if (log_index <= this.log_level_index) {
    // join the arguments into a loggable string
    args.forEach(function(arg) {
      if (typeof arg === 'string') {
        message += ' ' + arg;
      } else {
        message += ' ' + sys.inspect(arg, false, null);
      }
    });
    message = this.format(Logger.levels[log_index], new Date(), message);
    this.write(message + "\n");
    return message;
  }
  return false;
};

Logger.levels.forEach(function(level) {
  Logger.prototype[level] = function() {
    var args = makeArray(arguments);
    args.unshift(level);
    return this.log.apply(this, args);
  };
});

exports.Logger = Logger;
exports.createLogger = function(log_file_path) {
  return new Logger(log_file_path);
};