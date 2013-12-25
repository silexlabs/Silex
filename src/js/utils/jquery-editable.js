


silex.utils.JQueryEditable.EDITABLE_CLASS_NAME = 'editable-style';

/**
 * find the first parent wich has the 'editable-style' cdss class
 */
silex.utils.JQueryEditable.getContainer = function() {
  return getElementByClass('editable-style');
};


/**
 * find the first parent wich has the 'editable-style' cdss class
 */
silex.utils.JQueryEditable.getFirstEditableParent = function(element) {
  var child = element;
  // go through all parents untill it is editable
  while (child && child.getAttribute && !$(child).hasClass('editable-style')) {
    child = child.parentNode;
  }
  // return the first editable element
  if (child && child.getAttribute && $(child).hasClass('editable-style')) {
    return child;
  }
  else {
    // The component has no editable parent
    // This is the case of the stage
    console.log('this element has no editable parent', element);
  }
  return element;
};


/**
 * init, activate and remove the "editable" jquery plugin
 * only dropable, not fully editable
 */
silex.utils.JQueryEditable.setDropableOnly = function(element, isDroppable) {
    if (isDroppable){
        // allow drops
        $(this.bodyElement).editable({
          isContainer: true,
          isResizable: false,
          isDroppable: true,
          isDraggable: false
        });
    }
    else{
        silex.utils.JQueryEditable.setEditable(element, false);
    }
}
/**
 * init, activate and remove the "editable" jquery plugin
 */
silex.utils.JQueryEditable.setEditable = function(element, isEditable) {
  // activate editable plugin
  if (isEditable) {
    // containers
    $('.editable-style[data-silex-type="container"]', element).editable({
      isContainer: true
    });
    // elements
    $('.editable-style[data-silex-type="element"]', element).editable();
    // handle the root element itself
    $(element).editable();
  }
  // activate editable plugin
  else {
    // deactivate editable plugin
    $('.editable-style', element).editable('destroy');
    // handle the element itself
    $(element).editable('destroy');

    // cleanup the dom
    $(element).find('.silex-selected').removeClass('silex-selected');
    $(element).find('.ui-resizable').removeClass('ui-resizable');
    $(element).find('.ui-draggable').removeClass('ui-draggable');
    $(element).find('.ui-droppable').removeClass('ui-droppable');
    $(element).find('[aria-disabled]').removeAttr('aria-disabled');
    $(element).find('.ui-resizable-handle').remove();
  }
};

/**
 * set the html content of an editable  element, i.e. wich has been setEditable(true)
 * @param   {element} element    the editable element, i.e. wich has been setEditable(true)
 * @param   {string} htmlString  the html content to set
 * @param   {boolean} opt_hasChildContainer   if true, set the html into the first child
 */
silex.utils.JQueryEditable.setEditableHtml = function(element, htmlString, opt_hasChildContainer) {
  // unregister jquery plugin
  silex.utils.JQueryEditable.setEditable(element, false);

  // set the html content
  if (opt_hasChildContainer) {
    // html boxes have a container for the html
    var htmlContainer = goog.dom.getFirstElementChild(element);
    if (htmlContainer) {
      htmlContainer.innerHTML = htmlString;
    }
  }
  else {
    // others have their content right inside the element
    element.innerHTML = htmlString;
  }
  // restore editing
  silex.utils.JQueryEditable.setEditable(element, true);
};

/**
 * get raw html content from an editable element, i.e. wich has been setEditable(true)
 * @param   {element} element    the editable element, i.e. wich has been setEditable(true)
 * @param   {boolean} opt_hasChildContainer   if true, set the html into the first child
 * @return   {string} the html content without traces of the editable component
 */
silex.model.Component.prototype.getEditableHtml = function(element, opt_hasChildContainer) {
  // unregister jquery plugin
  silex.utils.JQueryEditable.setEditable(element, false);

  // remove all markup linked to the "editable" jquery plugin
  var cleanContainer = element.cloneNode(true);

  // restore editing
  silex.utils.JQueryEditable.setEditable(element, true);

  // get the result as a string
  var htmlString = '';
  if (opt_hasChildContainer) {
    // html boxes have a container for the html
    var htmlContainer = goog.dom.getFirstElementChild(cleanContainer);
    if (htmlContainer) {
      htmlString = htmlContainer.innerHTML;
    }
  }
  else {
    // others have their content right inside the element
    htmlString = cleanContainer.innerHTML;
  }

  // return the html content
  return htmlString;
};
