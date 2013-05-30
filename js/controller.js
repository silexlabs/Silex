var silex = silex || {}; 

goog.provide('silex.SilexController');

silex.SilexController = function(){
    
}
/**
 * the Silex controller class
 */
silex.SilexController = function(){
}
/**
 * singleton pattern
 */
silex.SilexController._instance = null;
/**
 * singleton pattern
 */
silex.SilexController.getInstance = function(){
    if (silex.SilexController._instance === null){
        silex.SilexController._instance = new silex.SilexController();
    }
    return silex.SilexController._instance;
}
/**
 * reference to the attached element
 */
silex.SilexController.prototype.element;
/**
 * attach events
 */
silex.SilexController.prototype.attachTo = function(element){
    this.element = element;
    var menu = silex.SilexMenu.getInstance().menu;
    console.dir(menu);

    goog.events.listen(menu, goog.ui.Component.EventType.ACTION, function(e) {
        console.log('menu event');
        console.dir(e);
        if (e.target.getId() == 'addNewItem') {
            var n = prompt('Enter a new item...');
            if (n) {
                menu.addItemAt(new goog.ui.MenuItem(n), menu.getItemCount() - 4);
            }
        } else if (e.target.getId() == 'enableNewItems') {
            menu.getItemAt(menu.getItemCount() - 1).setEnabled(
            e.target.isChecked());
        } else {
            alert(e.target.getCaption());
        }
    });
}
