import grapesjs, { Selector } from 'grapesjs';

import { 
  setSelectorsByType, 
  addSelectorsByType, 
  removeSelectorsByType, 
  editSelectors, 
  deleteSelectors, 
  SelectorType,
  Combinator,
  getSelectorString,
  PSEUDO_SELECTORS,
  getSelectorsByType,
  createSelectors,
  setCombinator,
  getCombinator
} from './model';

describe('GrapesJS Advanced Selector Manager Plugin Functions', () => {
  let editor;
  let components;
  let selector1;
  let selector2;
  let contextSelectors;
  let selectorsString;
  let combinator;
  let pseudoSelector;
  let pseudoSelectorParam;
  let pseudoSelectorContext;
  let pseudoSelectorContextParam;
  let complexSelector

  beforeEach(() => {
    // Initialize editor with minimal configuration
    editor = grapesjs.init({
      container: document.createElement('div'), // Mock container
    });

    // Add components
    components = editor.addComponents('<div></div><div></div>');

    // Mock Selectors for testing
    selector1 = editor.SelectorManager.add({
      name: '.selector1',
      label: '.selector1',
      active: true,
      type: 1,
    });
    selector2 = editor.SelectorManager.add({
      name: 'DIV',
      label: 'DIV',
      active: true,
      type: 3,
    })
    contextSelectors = editor.SelectorManager.add({
      name: '.contextSelector',
      label: '.contextSelector',
      active: true,
      type: 1,
    });
    pseudoSelectorContext = PSEUDO_SELECTORS.Advanced.not;
    pseudoSelectorContextParam = editor.SelectorManager.add({
      name: 'div',
      label: 'div',
      active: true,
      type: 3,
    });
    combinator = Combinator.ADJACENT_SIBLING;
    pseudoSelector = { name: 'hover' };
    pseudoSelectorParam = '2n+1';
    selectorsString = `.contextSelector:not(div) + DIV.selector1:hover(2n+1)`;
    complexSelector = {
      selectors: [selector1, selector2],
      contextSelectors: [contextSelectors],
      combinator,
      pseudoSelector,
      pseudoSelectorParam,
      pseudoSelectorContext,
      pseudoSelectorContextParam,
    };
  });

  test('setSelectors should assign selectors to components', () => {
    setSelectorsByType(components, SelectorType.PRIMARY, [selector1]);
    components.forEach(component => {
      expect(component.classes.models).toContain(selector1);
    });

    setSelectorsByType(components, SelectorType.CONTEXT, [contextSelectors]);
    components.forEach(component => {
      expect(component.get('contextClasses')).toContain(contextSelectors);
    });
  });

  test('addSelectors should add selectors to components', () => {
    addSelectorsByType(components, SelectorType.PRIMARY, [selector2]);
    components.forEach(component => {
      expect(component.classes.models).toContain(selector2);
    });

    addSelectorsByType(components, SelectorType.CONTEXT, [contextSelectors]);
    components.forEach(component => {
      expect(component.get('contextClasses')).toContain(contextSelectors);
    });
  });

  test('removeSelectors should remove selectors from components', () => {
    components.forEach(component => component.classes.add([selector1, selector2]));
    removeSelectorsByType(components, SelectorType.PRIMARY, [selector1]);
    components.forEach(component => {
      expect(component.classes.models).not.toContain(selector1);
      expect(component.classes.models).toContain(selector2);
    });
  });

  test('getSelectors should return common selectors across components', () => {
    components.forEach(component => component.classes.add([selector1, selector2]));
    const commonSelectors = getSelectorsByType(components, SelectorType.PRIMARY);
    expect(commonSelectors).toEqual(expect.arrayContaining([selector1, selector2]));
  });

  test('getSelectorsString should return a string representation of selectors', () => {
    expect(getSelectorString({
      selectors: [selector1],
      contextSelectors: [contextSelectors],
      combinator,
      pseudoSelector: { name: 'hover' },
      pseudoSelectorParam: '2n+1',
      pseudoSelectorContext,
      pseudoSelectorContextParam,
    })).toEqual('.contextSelector:not(div) + .selector1:hover(2n+1)');

    expect(getSelectorString({
      selectors: [selector1],
      contextSelectors: [contextSelectors],
      combinator: Combinator.ADJACENT_SIBLING,
      pseudoSelector: null,
      pseudoSelectorParam: null,
      pseudoSelectorContext: null,
      pseudoSelectorContextParam: null,
    })).toEqual('.contextSelector + .selector1');

    expect(getSelectorString({
      selectors: [selector1],
      contextSelectors: [contextSelectors],
      combinator: Combinator.DESCENDANT,
      pseudoSelector: null,
      pseudoSelectorParam: null,
      pseudoSelectorContext: null,
      pseudoSelectorContextParam: null,
    })).toEqual('.contextSelector .selector1');

    expect(getSelectorString({
      selectors: [selector1],
      contextSelectors: [contextSelectors],
      combinator: Combinator.CHILD,
      pseudoSelector: PSEUDO_SELECTORS.Structural.firstChild,
      pseudoSelectorParam: null,
      pseudoSelectorContext: null,
      pseudoSelectorContextParam: null,
    })).toEqual('.contextSelector > .selector1:first-child');

    expect(getSelectorString({
      selectors: [selector1],
      contextSelectors: [contextSelectors],
      combinator: Combinator.GENERAL_SIBLING,
      pseudoSelector: PSEUDO_SELECTORS.Positional.nthChild,
      pseudoSelectorParam: '2n+1',
      pseudoSelectorContext: null,
      pseudoSelectorContextParam: null
    })).toEqual('.contextSelector ~ .selector1:nth-child(2n+1)');
  })

  test('editSelectors should apply selector rule and activate style manager', () => {
    editSelectors(editor, complexSelector);
    editor.StyleManager.getSelected().set('property', 'value');
    //console.log(editor.StyleManager.getSelected().attributes.selectorsAdd);
    expect(editor.CssComposer.getRule(selectorsString)).not.toBeNull();
  });

  test('deleteSelectors should remove selectors from the CssComposer', () => {
    editor.CssComposer.addRules('.selector1');
    //deleteSelectors(editor, [selectors1]);
    expect(editor.CssComposer.getRule('.selector1')).toBeNull();
  });

  test('createSelectors should create or retrieve selectors from CssComposer', () => {
    const selectors = createSelectors(editor, selector1.getFullName());
    expect(selectors).toEqual(expect.arrayContaining([selector1]));
  });

  test('setCombinator should set combinator for selectors', () => {
    setCombinator(components[0], combinator);
    expect(components[0].get('combinator')).toEqual(combinator);
    expect(components[1].get('combinator')).toBeUndefined();

    setCombinator(components, combinator);
    components.forEach(component => {
      expect(component.get('combinator')).toEqual(combinator);
    });
  })

  test('getCombinator should return combinator for selectors', () => {
    expect(getCombinator(components)).toBeNull();
    components[0].set('combinator', combinator);
    expect(getCombinator(components)).toBeNull();
    components[1].set('combinator', combinator);
    expect(getCombinator(components)).toEqual(combinator);
  })
});
