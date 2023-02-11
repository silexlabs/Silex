"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setStyleToDom = exports.addMediaQueryIfMobileOnly = exports.saveEditableChildren = exports.openStyleEditor = exports.openComponentEditor = exports.resetComponentEditor = exports.isSameTag = exports.updateComponentsDependencies = exports.getCssClasses = exports.getComponentClassName = exports.initComponent = exports.getComponents = exports.isComponent = exports.getComponentsDef = exports.loadComponents = exports.updateComponents = exports.initProdotype = void 0;
const constants_1 = require("../../constants");
const dom_1 = require("../element-store/dom");
const ClientConfig_1 = require("../ClientConfig");
const index_1 = require("../element-store/index");
const utils_1 = require("../site-store/utils");
const index_2 = require("../site-store/index");
const index_3 = require("../ui-store/index");
const UiElements_1 = require("../ui-store/UiElements");
const index_4 = require("../store/index");
const index_5 = require("./index");
/**
 * @fileoverview
 *   This class is used to manage Prodotype components
 *   Components are based on Silex elements, use Prodotype to render a templates
 */
let prodotypeComponent;
let prodotypeStyle;
let styleEditorElement;
let componentEditorElement;
let prodotypeLoaded = false;
// wait for the Prodotype library to be loaded
// FIXME: this is useless, it can be done directly on module import
function initProdotype() {
    // init style editor
    styleEditorElement = UiElements_1.getUiElements().propertyTool.querySelector('.prodotype-style-editor .prodotype-container');
    // tslint:disable:no-string-literal
    prodotypeStyle = new window['Prodotype'](styleEditorElement, './prodotype/styles');
    // tslint:enable:no-string-literal
    // init component editor
    loadComponents(ClientConfig_1.config.componentFolders);
}
exports.initProdotype = initProdotype;
function getProdotypeComponent() {
    if (!prodotypeComponent)
        initProdotype();
    return prodotypeComponent;
}
function getProdotypeStyle() {
    if (!prodotypeStyle)
        initProdotype();
    return prodotypeStyle;
}
async function updateComponents(components = getComponents()) {
    const renderedComponents = await Promise.all(components
        .map((el) => dom_1.renderWithProdotype(getProdotypeComponent(), {
        templateName: el.data.component.templateName,
        data: el.data.component.data,
        dataSources: index_2.getSite().dataSources,
    })
        .then((innerHtml) => ([
        el,
        innerHtml,
    ]))
        .catch((err) => {
        console.error('could not update component:', err);
        return null;
    })));
    const renderedWithoutError = renderedComponents
        .filter((el) => !!el);
    // still the same, no component update
    // just render the dom element
    // renderedWithoutError
    //   .filter(([el, innerHtml]) => el.innerHtml === innerHtml)
    //   .forEach(([el, innerHtml]) => console.log('same', el))
    // components may have changed
    // sometimes the render includes an ID which changes every time
    // this is like an update of all components
    index_5.updateElements(renderedWithoutError
        .filter(([el, innerHtml]) => el.innerHtml !== innerHtml)
        .map(([el, innerHtml]) => ({
        ...el,
        innerHtml,
    })));
}
exports.updateComponents = updateComponents;
function loadComponents(paths) {
    // store the element in which to render
    componentEditorElement = UiElements_1.getUiElements().propertyTool.querySelector('.prodotype-component-editor');
    // tslint:disable:no-string-literal
    const compEd = new window['Prodotype'](componentEditorElement, paths);
    // tslint:enable:no-string-literal
    // first load
    if (!prodotypeComponent)
        prodotypeComponent = compEd;
    // wait for prodotype to load the components.json files
    compEd.ready((err) => {
        if (err) {
            console.error(err);
        }
        else {
            prodotypeComponent = compEd;
            prodotypeLoaded = true;
            index_3.updateUi({
                ...index_3.getUi(),
                components: getComponentsDef(constants_1.Constants.COMPONENT_TYPE),
            });
        }
    });
}
exports.loadComponents = loadComponents;
/**
 * get Prodotype descriptor of the components
 * @return component descriptors
 */
function getComponentsDef(type) {
    const obj = type === constants_1.Constants.COMPONENT_TYPE ? getProdotypeComponent() : getProdotypeStyle();
    return obj ? obj.componentsDef : {};
}
exports.getComponentsDef = getComponentsDef;
function isComponent(element) {
    return !!element.data.component && !!element.data.component.templateName;
}
exports.isComponent = isComponent;
function getComponents(elements = index_1.getElements()) {
    return elements.filter((el) => isComponent(el));
}
exports.getComponents = getComponents;
/**
 * @param element component just added
 * @param templateName type of component
 */
function initComponent(element, templateName) {
    const componentsDef = getComponentsDef(constants_1.Constants.COMPONENT_TYPE);
    const comp = componentsDef[templateName];
    if (comp) {
        const name = getProdotypeComponent()
            .createName(templateName, index_1.getElements()
            .filter((el) => isComponent(el))
            .map((el) => el.data.component));
        // for selection (select all components)
        // element.classList.add(Constants.COMPONENT_CLASS_NAME)
        // apply the style found in component definition
        // this includes the css class of the component (component-templateName)
        const cssClasses = getCssClasses(templateName) || [];
        // use min heigh or height depending on the component and the base element
        // if set by component it overrides the default of the element
        const useMinHeight = typeof comp.useMinHeight === 'undefined' ? element.useMinHeight : comp.useMinHeight;
        // apply the style found in component definition
        const initialCss = comp.initialCss || {};
        // same for the container inside the element (content node)
        if (comp.initialCssContentContainer) {
            // applyStyleTo(
            //     model.element.getContentNode(element),
            //     comp.initialCssContentContainer)
            console.error('not implemented', comp.initialCssContentContainer);
        }
        // first rendering of the component
        return dom_1.renderWithProdotype(getProdotypeComponent(), {
            templateName,
            data: {},
            dataSources: index_2.getSite().dataSources,
        })
            .then((html) => {
            return {
                ...element,
                classList: element.classList.concat(cssClasses),
                data: {
                    ...element.data,
                    component: {
                        name,
                        templateName,
                        data: {},
                    },
                },
                innerHtml: html,
                useMinHeight,
                style: {
                    ...element.style,
                    desktop: {
                        ...element.style.desktop,
                        ...initialCss,
                    },
                },
            };
        });
    }
    else {
        console.error('Component definition not found in prodotype data');
    }
}
exports.initComponent = initComponent;
/**
 * get the class names specified in the definition of the prodotype component
 * this is in the className attribute of the component .md file
 */
function getComponentClassName(element) {
    if (isComponent(element)) {
        const templateName = element.data.component.templateName;
        return getCssClasses(templateName);
    }
    return [];
}
exports.getComponentClassName = getComponentClassName;
/**
 * get all CSS classes set on this component when it is created
 * this includes the css class of the component (component-templateName)
 * @param templateName the component's template name
 * @return an array of CSS classes
 */
function getCssClasses(templateName) {
    const componentsDef = getComponentsDef(constants_1.Constants.COMPONENT_TYPE);
    const comp = componentsDef[templateName];
    let cssClasses = [constants_1.Constants.COMPONENT_CLASS_NAME + '-' + templateName];
    if (comp) {
        // class name is either an array
        // or a string or null
        switch (typeof comp.initialCssClass) {
            case 'undefined':
                break;
            case 'string':
                cssClasses = cssClasses.concat(comp.initialCssClass.split(' '));
                break;
            default:
                cssClasses = cssClasses.concat(comp.initialCssClass);
        }
    }
    else {
        console.error(`Error: component's definition not found in prodotype templates, with template name "${templateName}".`);
    }
    return cssClasses;
}
exports.getCssClasses = getCssClasses;
/**
 * update the dependencies of Prodotype components
 * FIXME: should have a callback to know if/when scripts are loaded
 * @param type, Constants.COMPONENT_TYPE or Constants.STYLE_TYPE
 */
function updateComponentsDependencies(prodotype = prodotypeComponent, elements = index_1.getElements(), dispatch = index_4.store.dispatch) {
    const components = elements
        .filter((el) => isComponent(el))
        .map((el) => el.data.component);
    const prodotypeDependencies = prodotype.getDependencies(components);
    // remove doubles dependencies
    const filteredDependencies = Object.keys(prodotypeDependencies)
        .reduce((aggr, tagName) => {
        const unique = prodotypeDependencies[tagName]
            .filter((tag, idx) => !prodotypeDependencies[tagName].find((existingTag, existingIdx) => idx > existingIdx && isSameTag(tag, existingTag)));
        aggr[tagName] = aggr[tagName] || [];
        aggr[tagName] = aggr[tagName].concat(unique);
        return aggr;
    }, {});
    const oldDependencies = index_2.getSite().prodotypeDependencies;
    const oldKeys = Object.keys(oldDependencies);
    const newKeys = Object.keys(filteredDependencies);
    const isSame = oldKeys.length === newKeys.length && oldKeys
        .every((tagName) => {
        const oldTags = oldDependencies[tagName];
        const newTags = filteredDependencies[tagName];
        // use length in order to avoid looping through both arrays
        return !!newTags && newTags.length === oldTags.length && oldTags
            .every((oldTag) => newTags.find((newTag) => isSameTag(oldTag, newTag)));
    });
    if (!isSame) {
        index_2.updateSite({
            ...index_2.getSite(),
            prodotypeDependencies: filteredDependencies,
        }, dispatch);
    }
}
exports.updateComponentsDependencies = updateComponentsDependencies;
function isSameTag(tag1, tag2) {
    return Object.keys(tag1).every((attrName) => tag1[attrName] === tag2[attrName])
        && Object.keys(tag2).every((attrName) => tag1[attrName] === tag2[attrName]);
}
exports.isSameTag = isSameTag;
/**
 * hide component editors
 * FIXME: this should be in the component
 */
function resetComponentEditor() {
    if (prodotypeLoaded) {
        componentEditorElement.classList.add('hide-panel');
        getProdotypeComponent().edit();
    }
}
exports.resetComponentEditor = resetComponentEditor;
/**
 * show component editors and edit the selection
 * FIXME: this should be in the component
 */
function openComponentEditor(options) {
    if (prodotypeLoaded) {
        getProdotypeComponent().edit(options.data, options.dataSources, options.templateName, options.events);
        componentEditorElement.classList.remove('hide-panel');
    }
}
exports.openComponentEditor = openComponentEditor;
/**
 * edit a style in the style editor
 */
function openStyleEditor(options) {
    if (prodotypeLoaded) {
        getProdotypeStyle().edit(options.data, options.dataSources, options.templateName, options.events);
    }
}
exports.openStyleEditor = openStyleEditor;
/**
 * remove the editable elements from an HTML element and store them in an HTML
 * fragment
 * @param parentElement, the element whose children we want to save
 * @return an HTML fragment with the editable children in it
 */
function saveEditableChildren(parentElement) {
    const fragment = document.createDocumentFragment();
    Array.from(parentElement.children)
        .forEach((el) => {
        if (el.classList.contains('editable-style')) {
            fragment.appendChild(el.cloneNode(true));
        }
    });
    return fragment;
}
exports.saveEditableChildren = saveEditableChildren;
/**
 * add a media query around the style string
 * when needed for mobile-only
 */
function addMediaQueryIfMobileOnly(html, visibility) {
    if (visibility === constants_1.Constants.STYLE_VISIBILITY[0]) {
        return html;
    }
    return dom_1.addMediaQuery(html);
}
exports.addMediaQueryIfMobileOnly = addMediaQueryIfMobileOnly;
/**
 * create or update a style
 * if data is not provided, create the style with defaults
 */
function setStyleToDom(doc, className, pseudoClass, visibility, data, displayName) {
    // expose the class name and pseudo class to the prodotype template
    const newData = data || {};
    newData.className = className;
    newData.pseudoClass = pseudoClass;
    // store the component's data for later edition
    const styleData = (index_2.getSite().styles[className] || {
        className,
        templateName: 'text',
        displayName,
        styles: {},
    });
    if (!styleData.styles[visibility]) {
        styleData.styles[visibility] = {};
    }
    styleData.styles[visibility][pseudoClass] = newData;
    const head = doc.head;
    // update the head style with the new template
    let elStyle = head.querySelector(`[data-style-id="${className}"]`);
    if (!elStyle) {
        elStyle = doc.createElement('style');
        elStyle.className = constants_1.Constants.STYLE_CLASS_NAME;
        elStyle.setAttribute('data-style-id', className);
        head.appendChild(elStyle);
    }
    // render all pseudo classes in all visibility object
    const pseudoClassData = utils_1.getPseudoClassData(styleData);
    if (pseudoClassData.length > 0) {
        Promise.all(pseudoClassData.map((obj) => {
            return dom_1.renderWithProdotype(getProdotypeStyle(), {
                templateName: 'text',
                data: obj.data,
                dataSources: index_2.getSite().dataSources,
            })
                .then((html) => addMediaQueryIfMobileOnly(html, obj.visibility));
        }))
            .then((htmlStrings) => {
            elStyle.innerHTML = htmlStrings.join('');
        });
    }
}
exports.setStyleToDom = setStyleToDom;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL2NsaWVudC9lbGVtZW50LXN0b3JlL2NvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLQSwrQ0FBMkM7QUFJM0MsOENBQXlFO0FBQ3pFLGtEQUF3QztBQUN4QyxrREFBb0Q7QUFDcEQsK0NBQXdEO0FBQ3hELCtDQUF5RDtBQUN6RCw2Q0FBbUQ7QUFDbkQsdURBQXNEO0FBQ3RELDBDQUFzQztBQUN0QyxtQ0FBd0M7QUFFeEM7Ozs7R0FJRztBQUVILElBQUksa0JBQTZCLENBQUE7QUFDakMsSUFBSSxjQUF5QixDQUFBO0FBQzdCLElBQUksa0JBQStCLENBQUE7QUFDbkMsSUFBSSxzQkFBbUMsQ0FBQTtBQUN2QyxJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUE7QUFFM0IsOENBQThDO0FBQzlDLG1FQUFtRTtBQUNuRSxTQUFnQixhQUFhO0lBQzNCLG9CQUFvQjtJQUNwQixrQkFBa0IsR0FBRywwQkFBYSxFQUFFLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFBO0lBRS9HLG1DQUFtQztJQUNuQyxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsa0JBQWtCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQTtJQUNsRixrQ0FBa0M7SUFFbEMsd0JBQXdCO0lBQ3hCLGNBQWMsQ0FBQyxxQkFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUE7QUFDekMsQ0FBQztBQVZELHNDQVVDO0FBRUQsU0FBUyxxQkFBcUI7SUFDNUIsSUFBRyxDQUFDLGtCQUFrQjtRQUFFLGFBQWEsRUFBRSxDQUFBO0lBQ3ZDLE9BQU8sa0JBQWtCLENBQUE7QUFDM0IsQ0FBQztBQUVELFNBQVMsaUJBQWlCO0lBQ3hCLElBQUcsQ0FBQyxjQUFjO1FBQUUsYUFBYSxFQUFFLENBQUE7SUFDbkMsT0FBTyxjQUFjLENBQUE7QUFDdkIsQ0FBQztB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