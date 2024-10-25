import grapesjs from 'grapesjs';

import { 
  setClasses, 
  addClasses, 
  removeClasses, 
  getClasses, 
  editSelectors, 
  deleteSelectors, 
  createSelectors, 
  SelectorType,
  Combinator,
  getSelectorString
} from './model';

describe('GrapesJS Advanced Selector Manager Plugin Functions', () => {
  let editor;
  let components;
  let selector1;
  let selector2;
  let nestedSelector;
  let selectorsString;
  let combinator;
  let pseudoSelector;
  let pseudoParam;

  beforeEach(() => {
    // Initialize editor with minimal configuration
    editor = grapesjs.init({
      container: document.createElement('div'), // Mock container
    });

    // Add components
    components = editor.addComponents('<div></div><div></div>');

    // Mock Selectors for testing
    const rule1 = editor.CssComposer.setRule('.selector1');
    const rule2 = editor.CssComposer.setRule('.selector2');
    const nestedRule = editor.CssComposer.setRule('.nestedSelector');
    selector1 = rule1.get('selectors').at(0);
    selector2 = rule2.get('selectors').at(0);
    nestedSelector = nestedRule.get('selectors').at(0);
    combinator = Combinator.ADJACENT_SIBLING;
    pseudoSelector = { name: 'hover' };
    pseudoParam = '2n+1';
    selectorsString = `.selector1 + .nestedSelector:hover(2n+1)`;
  });

  test('setClasses should assign selectors to components', () => {
    setClasses(components, SelectorType.SELECTOR, [selector1]);
    components.forEach(component => {
      expect(component.classes.models).toContain(selector1);
    });

    setClasses(components, SelectorType.NESTED_SELECTOR, [nestedSelector]);
    components.forEach(component => {
      expect(component.get('nestedClasses')).toContain(nestedSelector);
    });
  });

  test('addClasses should add selectors to components', () => {
    addClasses(components, SelectorType.SELECTOR, [selector2]);
    components.forEach(component => {
      expect(component.classes.models).toContain(selector2);
    });

    addClasses(components, SelectorType.NESTED_SELECTOR, [nestedSelector]);
    components.forEach(component => {
      expect(component.get('nestedClasses')).toContain(nestedSelector);
    });
  });

  test('removeClasses should remove selectors from components', () => {
    components.forEach(component => component.classes.add([selector1, selector2]));
    removeClasses(components, SelectorType.SELECTOR, [selector1]);
    components.forEach(component => {
      expect(component.classes.models).not.toContain(selector1);
      expect(component.classes.models).toContain(selector2);
    });
  });

  test('getClasses should return common selectors across components', () => {
    components.forEach(component => component.classes.add([selector1, selector2]));
    const commonSelectors = getClasses(components, SelectorType.SELECTOR);
    expect(commonSelectors).toEqual(expect.arrayContaining([selector1, selector2]));
  });

  test('getSelectorsString should return a string representation of selectors', () => {
    const editableSelector = {
      selectors: [selector1],
      nestedSelectors: [nestedSelector],
      combinator,
      pseudoSelector: { name: 'hover' },
      pseudoParam: '2n+1'
    };
    const selectorsStringResult = getSelectorString(editableSelector);
    expect(selectorsStringResult).toEqual(selectorsString);
  })

  test('editSelectors should apply selector rule and activate style manager', () => {
    const editableSelector = {
      selectors: [selector1],
      nestedSelectors: [nestedSelector],
      combinator,
      pseudoSelector: { name: 'hover' },
      pseudoParam: '2n+1'
    };

    editSelectors(editor, editableSelector);
    editor.StyleManager.getSelected().set('property', 'value');
    //console.log(editor.StyleManager.getSelected().attributes.selectorsAdd);
    expect(editor.CssComposer.getRule(selectorsString)).not.toBeNull();
  });

  test('deleteSelectors should remove selectors from the CssComposer', () => {
    editor.CssComposer.addRules(selector1.getFullName());
    deleteSelectors(editor, [selector1]);
    expect(editor.CssComposer.getRule(selector1.getFullName())).toBeNull();
  });

  test('createSelectors should create or retrieve selectors from CssComposer', () => {
    const selectors = createSelectors(editor, selector1.getFullName());
    expect(selectors).toEqual(expect.arrayContaining([selector1]));
  });
});
