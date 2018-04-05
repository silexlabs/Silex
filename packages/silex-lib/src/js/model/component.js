/**
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
 * @fileoverview
 *   This class is used to manage Prodotype components
 *   Components are based on Silex elements, but Prodotype renders a template in it
 */

goog.provide('silex.model.Component');


/**
 * @constructor
 * @param  {silex.types.Model} model  model class which holds the other models
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.model.Component = function(model, view) {
  // store the model and the view
  /**
   * @type {silex.types.Model}
   */
  this.model = model;
  /**
   * @type {silex.types.View}
   */
  this.view = view;
  /**
   * @type {Prodotype}
   */
  this.prodotype = null;

  /**
   * @type {Array.<function(?Object)>}
   */
  this.readyCbkArr = [];
};

silex.model.Component.COMPONENT_CLASS_NAME = 'silex-component';

/**
 * load the Prodotype library
 */
silex.model.Component.prototype.initComponents = function(ui) {
  this.prodotype = new window['Prodotype'](ui, './libs/prodotype/components');
  this.prodotype.ready(err => {
    this.readyCbkArr.forEach(cbk => cbk(err));
    this.readyCbkArr = [];
  });
};


/**
 * notify when Prodotype library is ready
 * @param {function(?Object)} cbk callback to be called when prodotype is ready
 */
silex.model.Component.prototype.ready = function(cbk) {
  if(this.prodotype) this.prodotype.ready(err => cbk(err));
  // if(this.prodotype) cbk();
  else this.readyCbkArr.push(cbk);
};


/**
 * not needed? we sometimes use !!this.model.property.getComponentData(element)
 * @param {Element} el
 * @return {boolean} true if el is a component (not only an element)
 */
silex.model.Component.prototype.isComponent = function(el) {
  return el.classList.contains(silex.model.Component.COMPONENT_CLASS_NAME);
};


/**
 * get Prodotype descriptor of the components
 * @return {ProdotypeCompDef} component descriptors
 */
silex.model.Component.prototype.getComponentsDef = function() {
  return this.prodotype ? this.prodotype.componentsDef : /** @type {ProdotypeCompDef} */ ({});
};


/**
 * @param {Element} element component just added
 * @param {string} templateName type of component
 */
silex.model.Component.prototype.initComponent = function(element, templateName) {
  const name = this.prodotype.createName(templateName, this.getAllComponents().map(el => {
    return {
      'name': this.model.property.getComponentData(el)['name'],
    };
  }));
  // for selection (select all components)
  element.classList.add(silex.model.Component.COMPONENT_CLASS_NAME);
  // for styles (select buttons and apply a style)
  this.model.property.setComponentData(element, {
    'name': name,
    'templateName': templateName,
  });
  // first rendering of the component
  this.render(element, () => {
    // update the dependencies once the component is added
    this.updateDepenedencies()
  });
  // css styles
  const componentsDef = this.getComponentsDef();
  const comp = componentsDef[templateName];
  if(comp) {
    // apply the style found in component definition
    if(comp.initialCss) {
      this.applyStyleTo(element, comp.initialCss);
    }
    // same for the container inside the element (content node)
    if(comp.initialCssContentContainer) {
      this.applyStyleTo(this.model.element.getContentNode(element), comp.initialCssContentContainer);
    }
    // same for CSS classes to apply
    // apply the style found in component definition
    // this includes the css class of the component (component-templateName)
    const cssClasses = this.getCssClasses(templateName)
    if(cssClasses) {
      const oldClassName = this.model.element.getClassName(element);
      this.model.element.setClassName(element, oldClassName + ' ' + cssClasses.join(' '));
    }
  }

};


/**
 * render the component
 * this is made using prodotype
 * the template is expanded with the data we have for this component
 * used when the component is created, or duplicated (paste)
 * @param {Element} element component to render
 * @param {?function()=} opt_cbk
 */
silex.model.Component.prototype.render = function (element, opt_cbk) {
  const data = this.model.property.getComponentData(element);
  const templateName = data['templateName'];
  this.prodotype.decorate(templateName, data)
  .then(html => {
    this.model.element.setInnerHtml(element, html);
    // notify the owner
    if(opt_cbk) opt_cbk();
    // execute the scripts
    // FIXME: should exec scripts only after dependencies are loaded
    this.executeScripts(element);
  });
};

/**
 * get all CSS classes set on this component when it is created
 * this includes the css class of the component (component-templateName)
 * @param  {string} templateName the component's template name
 * @return {Array.<string>} an array of CSS classes
 */
silex.model.Component.prototype.getCssClasses = function (templateName) {
  const componentsDef = this.getComponentsDef();
  const comp = componentsDef[templateName];
  let cssClasses = [silex.model.Component.COMPONENT_CLASS_NAME + '-'  + templateName];
  if(comp) {
    // class name is either an array
    // or a string or null
    switch(typeof comp.initialCssClass) {
      case 'undefined':
      break;
      case 'string': cssClasses = cssClasses.concat(comp.initialCssClass.split(' '));
      break;
      default: cssClasses = cssClasses.concat(comp.initialCssClass);
    }
  } else {
    console.error(`Error: component's definition not found in prodotype templates, with template name "${ templateName }".`);
  }
  return cssClasses;
};


/**
 * eval the scripts found in an element
 * this is useful when we render a template, since the scripts are executed only when the page loads
 * @param  {Element} element
 */
silex.model.Component.prototype.executeScripts = function (element) {
  // execute the scripts
  const scripts = element.querySelectorAll('script');
  for(let idx=0; idx<scripts.length; idx++) {
    this.model.file.getContentWindow().eval(scripts[idx].innerText);
  }
};


/**
 * apply a style to an element
 * @param  {Element} element
 * @param  {!Object} styleObj
 */
silex.model.Component.prototype.applyStyleTo = function (element, styleObj) {
  const style = this.model.property.getStyle(element, false) || {};
  for(let name in styleObj) {
    style[name] = styleObj[name];
  }
  this.model.property.setStyle(element, style, false);
};


/**
 * @return {Array.<Element>}
 */
silex.model.Component.prototype.getAllComponents = function() {
  // get all elements which are components
  const components = this.model.body.getBodyElement().querySelectorAll('.' + silex.model.Component.COMPONENT_CLASS_NAME);
  // make an array out of it
  var arr = [];
  for (let idx=0; idx < components.length; idx++) arr.push(components[idx]);
  return arr;
};


/**
 * update the dependencies of Prodotype components
 * FIXME: should have a callback to know if/when scripts are loaded
 */
silex.model.Component.prototype.updateDepenedencies = function() {
  const head = this.model.head.getHeadElement();
  const components = this.getAllComponents().map(el => {
    return {
      'templateName': this.model.property.getComponentData(el)['templateName'],
    };
  });
  // remove unused dependencies (scripts and style sheets)
  const nodeList = this.model.head.getHeadElement().querySelectorAll('[data-dependency]');
  const elements = [];
  for(let idx=0; idx<nodeList.length; idx++) elements.push(nodeList[idx]);
  const unused = this.prodotype.getUnusedDependencies(
    elements,
    components
  );
  for(let idx=0; idx < unused.length; idx++) {
    const el = unused[idx];
    head.removeChild(el);
  };
  // add missing dependencies (scripts and style sheets)
  let missing = this.prodotype.getMissingDependencies(head, components);
  for(let idx=0; idx < missing.length; idx++) {
    const el = missing[idx];
    el.setAttribute('data-dependency', '');
    head.appendChild(el);
  };
};


/**
 *
 */
silex.model.Component.prototype.resetSelection = function() {
  if(this.prodotype) {
    this.prodotype.edit();
  }
};


/**
 * remove the editable elements from an HTML element and store them in an HTML fragment
 * @param {Element} parentElement, the element whose children we want to save
 * @return {DocumentFragment} an HTML fragment with the editable children in it
 */
silex.model.Component.prototype.saveEditableChildren = function(parentElement) {
  const fragment = document.createDocumentFragment();
  for(var i = 0, el; el = parentElement.children[i]; i++) {
    if(el.classList.contains('editable-style')) {
      fragment.appendChild(el.cloneNode(true));
    }
  }
  return fragment;
}


/**
 * @param {Element} element, the component to edit
 */
silex.model.Component.prototype.edit = function(element) {
  const componentData = this.model.property.getComponentData(element);
  if(element && this.prodotype && componentData) {
    this.prodotype.edit(
      componentData,
      this.getAllComponents().map(el => {
        const name = this.model.property.getComponentData(el)['name'];
        const templateName = this.model.property.getComponentData(el)['templateName'];
        return {
          'name': name,
          'templateName': templateName,
          'displayName': `${name} (${templateName})`,
        };
      }),
      componentData['templateName'],
      {
        'onChange': (newData, html) => {
          // undo checkpoint
          this.view.settingsDialog.controller.settingsDialogController.undoCheckPoint();
          // remove the editable elements temporarily
          const tempElements = this.saveEditableChildren(element);
          // store the component's data for later edition
          this.model.property.setComponentData(element, newData);
          // update the element with the new template
          this.model.element.setInnerHtml(element, html);
          // execute the scripts
          this.executeScripts(element);
          // put back the editable elements
          element.appendChild(tempElements);
        },
        'onBrowse': (e, cbk) => {
          e.preventDefault();
          // browse with CE
          const promise = this.view.fileExplorer.openFile();
          // add tracking and undo/redo checkpoint
          this.view.settingsDialog.controller.settingsDialogController.track(promise, 'prodotype.browse');
          this.view.settingsDialog.controller.settingsDialogController.undoredo(promise);
          // handle the result
          promise.then(fileInfo => {
            if(fileInfo) {
              cbk([{
                'url': fileInfo.absPath,
                'lastModified': fileInfo.lastModified,
                'lastModifiedDate': new Date(fileInfo.lastModified),
                'name': fileInfo.name,
                'size': fileInfo.size,
                'type': fileInfo.type,
              }]);
            }
          })
          .catch(error => {
            silex.utils.Notification.notifyError(
              'Error: I could not select the file. <br /><br />' +
              (error.message || ''));
          });
        }
      });
  }
};
