(function (){
    goog.require('goog.dom');
    goog.require('goog.array');
    goog.require('goog.events');
    goog.require('goog.object');
    goog.require('goog.ui.Menu');
    goog.require('goog.ui.MenuItem');
    
    var EVENTS = goog.object.getValues(goog.ui.Component.EventType);
    console.log('Listening for: ' + EVENTS.join(', ') + '.');


    var el2 = goog.dom.getElement('menu2');
    var menu2 = new goog.ui.Menu();
    menu2.decorate(el2);

    goog.events.listen(menu2, 'action', function(e) {
      if (e.target.getId() == 'addNewItem') {
        var n = prompt('Enter a new item...');
        if (n) {
          menu2.addItemAt(new goog.ui.MenuItem(n), menu2.getItemCount() - 4);
        }
      } else if (e.target.getId() == 'enableNewItems') {
        menu2.getItemAt(menu2.getItemCount() - 1).setEnabled(
            e.target.isChecked());
      } else {
        alert(e.target.getCaption());
      }
    });
})();