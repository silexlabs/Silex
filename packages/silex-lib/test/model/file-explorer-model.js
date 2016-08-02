var logging = require('../logging');
var actions = require('../actions');


var FileExplorerModel = function () {

  var file_menu = '.menu-item-file';
  var file_open = '.menu-item-file-open';
  var file_explorer = '#silex-file-explorer';

  this.openFile = function(client, cbk) {

    actions.switchFrame(client, null, function () {
      console.log('client');
      client
        // open the file menu and click open
        .click(file_menu)
        .click(file_open)
        .call(function(){console.log('-- openFile(', logging.argsToString(arguments));})
        .call(cbk)
    });
  }

  this.isFileExplorerVisible = function(client, cbk) {

    client.isVisible(file_explorer, function(err, isVisible) {
        cbk(isVisible);
    })
  }

}
module.exports = new FileExplorerModel();
