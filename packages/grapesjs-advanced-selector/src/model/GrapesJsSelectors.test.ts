import { CssRule, Editor, Selector } from 'grapesjs'
import { Component } from 'grapesjs'
import { getSuggestionsMain, getSuggestionsRelated } from './GrapesJsSelectors'
import { ClassSelector, IdSelector, SimpleSelectorType, TAGS, TagSelector } from './SimpleSelector'
import { Operator, OperatorType } from './Operator'

describe('getSuggestionsMain', () => {
  test('Élément avec ID et classe', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]), // Mock empty CSS rules to avoid errors
      },
    } as unknown as Editor

    // Mock Component
    const mockComponent = {
      getAttributes: () => ({ 'data-role': 'button' }),
      getId: () => 'uniqueId',
      getClasses: () => ['container'],
      get tagName() {
        return 'div'
      },
    } as unknown as Component

    const selectedComponents = [mockComponent]

    const suggestions = getSuggestionsMain(mockEditor, selectedComponents, {
      mainSelector: {
        selectors: [
          { type: SimpleSelectorType.ID, value: 'uniqueId', active: true } as IdSelector,
          { type: SimpleSelectorType.CLASS, value: 'container', active: true } as ClassSelector
        ],
      },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'div', active: true },
      { type: SimpleSelectorType.ATTRIBUTE, value: 'data-role', operator: '=', attributeValue: 'button', active: true },
    ])
  })

  test('Élément sans classe ni ID', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Component without class or ID
    const mockComponent = {
      getAttributes: () => ({ 'data-custom': 'value' }),
      getId: () => '',
      getClasses: () => [],
      get tagName() {
        return 'span'
      },
    } as unknown as Component

    const selectedComponents = [mockComponent]

    const suggestions = getSuggestionsMain(mockEditor, selectedComponents, {
      mainSelector: { selectors: [] },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'span', active: true },
      { type: SimpleSelectorType.ATTRIBUTE, value: 'data-custom', operator: '=', attributeValue: 'value', active: true },
    ])
  })

  test('Element with multiple classes', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Component with multiple classes
    const mockComponent = {
      getAttributes: () => ({}), // No attributes
      getId: () => '',
      getClasses: () => ['box', 'shadow', 'rounded'],
      get tagName() {
        return 'div'
      },
    } as unknown as Component

    const selectedComponents = [mockComponent]

    const suggestions = getSuggestionsMain(mockEditor, selectedComponents, {
      mainSelector: {
        selectors: [
          { type: SimpleSelectorType.CLASS, value: 'box', active: true } as ClassSelector,
          { type: SimpleSelectorType.CLASS, value: 'shadow', active: true } as ClassSelector,
          { type: SimpleSelectorType.CLASS, value: 'rounded', active: true } as ClassSelector,
        ],
      },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'div', active: true },
    ])
  })

  test('Element with class and attributes', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Component with a class and attributes
    const mockComponent = {
      getAttributes: () => ({
        type: 'submit',
        'aria-disabled': 'true',
      }),
      getId: () => '',
      getClasses: () => ['btn'],
      get tagName() {
        return 'button'
      },
    } as unknown as Component

    const selectedComponents = [mockComponent]

    const suggestions = getSuggestionsMain(mockEditor, selectedComponents, {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'btn', active: true } as ClassSelector],
      },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'button', active: true },
      { type: SimpleSelectorType.ATTRIBUTE, value: 'type', operator: '=', attributeValue: 'submit', active: true },
      { type: SimpleSelectorType.ATTRIBUTE, value: 'aria-disabled', operator: '=', attributeValue: 'true', active: true },
    ])
  })

  test('Element with ID only', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Component with an ID and an attribute
    const mockComponent = {
      getAttributes: () => ({
        'data-visible': 'true',
      }),
      getId: () => 'main-section',
      getClasses: () => [],
      get tagName() {
        return 'section'
      },
    } as unknown as Component

    const selectedComponents = [mockComponent]

    const suggestions = getSuggestionsMain(mockEditor, selectedComponents, {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.ID, value: 'main-section', active: true } as IdSelector],
      },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'section', active: true },
      { type: SimpleSelectorType.ATTRIBUTE, value: 'data-visible', operator: '=', attributeValue: 'true', active: true },
    ])
  })

  test('Element with a custom tag', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Component with a custom tag and an attribute
    const mockComponent = {
      getAttributes: () => ({
        'data-theme': 'dark',
      }),
      getId: () => '',
      getClasses: () => [],
      get tagName() {
        return 'my-component'
      },
    } as unknown as Component

    const selectedComponents = [mockComponent]

    const suggestions = getSuggestionsMain(mockEditor, selectedComponents, {
      mainSelector: {
        selectors: [],
      },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'my-component', active: true },
      { type: SimpleSelectorType.ATTRIBUTE, value: 'data-theme', operator: '=', attributeValue: 'dark', active: true },
    ])
  })

  test('Element with a custom tag and empty mainSelector', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Component with a custom tag and an attribute
    const mockComponent = {
      getAttributes: () => ({
        'data-theme': 'dark',
      }),
      getId: () => '',
      getClasses: () => [],
      get tagName() {
        return 'my-component'
      },
    } as unknown as Component

    const selectedComponents = [mockComponent]

    const suggestions = getSuggestionsMain(mockEditor, selectedComponents, {
      mainSelector: {
        selectors: [], // Empty mainSelector
      },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'my-component', active: true },
      { type: SimpleSelectorType.ATTRIBUTE, value: 'data-theme', operator: '=', attributeValue: 'dark', active: true },
    ])
  })
})

describe('getSuggestionsRelated', () => {
  test('Direct child selector (`>` operator)', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Parent Component (div)
    const mockParentComponent = {
      getId: () => '',
      getClasses: () => [],
      get tagName() {
        return 'div'
      },
      components: () => [],
    } as unknown as Component

    // Mock Child Component (p)
    const mockChildComponent = {
      getId: () => '',
      getClasses: () => ['text'],
      get tagName() {
        return 'p'
      },
      parent: () => mockParentComponent,
    } as unknown as Component

    const selectedComponents = [mockChildComponent]

    const suggestions = getSuggestionsRelated(mockEditor, selectedComponents, {
      mainSelector: { selectors: [{ type: SimpleSelectorType.CLASS, value: 'text', active: true } as ClassSelector] },
      operator: { type: OperatorType.CHILD, isCombinator: true } as Operator,
      relatedSelector: { selectors: [] },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'div', active: true },
    ])
  })

  test('Descendant selector (` ` operator)', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Grandparent Component (section)
    const mockGrandparentComponent = {
      getId: () => '',
      getClasses: () => [],
      get tagName() {
        return 'section'
      },
      parent: () => null,
    } as unknown as Component

    // Mock Parent Component (div)
    const mockParentComponent = {
      getId: () => '',
      getClasses: () => [],
      get tagName() {
        return 'div'
      },
      parent: () => mockGrandparentComponent,
    } as unknown as Component

    // Mock Child Component (span)
    const mockChildComponent = {
      getId: () => '',
      getClasses: () => ['highlight'],
      get tagName() {
        return 'span'
      },
      parent: () => mockParentComponent,
    } as unknown as Component

    const selectedComponents = [mockChildComponent]

    const suggestions = getSuggestionsRelated(mockEditor, selectedComponents, {
      mainSelector: { selectors: [{ type: SimpleSelectorType.CLASS, value: 'highlight', active: true } as ClassSelector] },
      operator: { type: OperatorType.DESCENDANT, isCombinator: true } as Operator,
      relatedSelector: { selectors: [] },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'div', active: true },
      { type: SimpleSelectorType.TAG, value: 'section', active: true },
    ])
  })

  test('Adjacent sibling selector (`+` operator)', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Parent Component (div)
    const mockParentComponent = {
      getId: () => '',
      getClasses: () => [],
      get tagName() {
        return 'div'
      },
      components: () => [mockPreviousSibling, mockSelectedComponent, mockNextSibling],
    } as unknown as Component

    // Mock Previous Sibling Component (h2)
    const mockPreviousSibling = {
      getId: () => '',
      getClasses: () => ['prev'],
      get tagName() {
        return 'h2'
      },
      parent: () => mockParentComponent,
    } as unknown as Component

    // Mock Selected Component (p)
    const mockSelectedComponent = {
      getId: () => '',
      getClasses: () => ['selected'],
      get tagName() {
        return 'p'
      },
      parent: () => mockParentComponent,
      prev: () => mockPreviousSibling,
    } as unknown as Component

    const mockNextSibling = {
      ...mockSelectedComponent,
      getClasses: () => ['other'],
    }

    const selectedComponents = [mockSelectedComponent]

    const suggestions = getSuggestionsRelated(mockEditor, selectedComponents, {
      mainSelector: { selectors: [{ type: SimpleSelectorType.CLASS, value: 'description', active: true } as ClassSelector] },
      operator: { type: OperatorType.ADJACENT, isCombinator: true } as Operator,
      relatedSelector: { selectors: [] },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'h2', active: true },
      { type: SimpleSelectorType.CLASS, value: 'prev', active: true },
    ])
  })

  test('General sibling selector (`~` operator)', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Previous Sibling Components (h2 and div)
    const mockPreviousSiblingComponent1 = {
      getId: () => '',
      getClasses: () => [],
      get tagName() {
        return 'h2'
      },
    } as unknown as Component

    const mockPreviousSiblingComponent2 = {
      getId: () => '',
      getClasses: () => [],
      get tagName() {
        return 'div'
      },
    } as unknown as Component

    // Mock Target Component (p)
    const mockTargetComponent = {
      getId: () => '',
      getClasses: () => ['text'],
      get tagName() {
        return 'p'
      },
      parent: () => ({
        components: () => [mockPreviousSiblingComponent1, mockPreviousSiblingComponent2, mockTargetComponent], // Mock siblings
      }),
    } as unknown as Component

    const selectedComponents = [mockTargetComponent]

    const suggestions = getSuggestionsRelated(mockEditor, selectedComponents, {
      mainSelector: { selectors: [{ type: SimpleSelectorType.CLASS, value: 'text', active: true } as ClassSelector] },
      operator: { type: OperatorType.GENERAL_SIBLING, isCombinator: true } as Operator,
      relatedSelector: { selectors: [] },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'h2', active: true },
      { type: SimpleSelectorType.TAG, value: 'div', active: true },
    ])
  })

  test('`:has()` pseudo-class selector', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Child Components (button and span)
    const mockChildComponent1 = {
      getId: () => '',
      getClasses: () => [],
      get tagName() {
        return 'button'
      },
      components: () => [],
    } as unknown as Component

    const mockChildComponent2 = {
      getId: () => '',
      getClasses: () => [],
      get tagName() {
        return 'span'
      },
      components: () => [],
    } as unknown as Component

    // Mock Parent Component (div)
    const mockParentComponent = {
      getId: () => '',
      getClasses: () => ['container'],
      get tagName() {
        return 'div'
      },
      components: () => [mockChildComponent1, mockChildComponent2], // Mock children
    } as unknown as Component

    const selectedComponents = [mockParentComponent]

    const suggestions = getSuggestionsRelated(mockEditor, selectedComponents, {
      mainSelector: { selectors: [{ type: SimpleSelectorType.CLASS, value: 'container', active: true } as ClassSelector] },
      operator: { type: OperatorType.HAS, isCombinator: false } as Operator,
      relatedSelector: { selectors: [] },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'button', active: true },
      { type: SimpleSelectorType.TAG, value: 'span', active: true },
    ])
  })

  test('`:not()` pseudo-class selector', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([{
          at: jest.fn().mockReturnValue({ remove: jest.fn() }), // Mock existing CSS rule
          getSelectors: jest.fn().mockReturnValue([{
            get: jest.fn((attr) => {
              switch (attr) {
              case 'selectors':
                return [{ type: SimpleSelectorType.CLASS, value: 'text', active: true }]
              case 'private':
                return false
              case 'type':
                return 1
              case 'name':
                return 'sibling1'
              default:
                throw new Error(`Unknown attribute: ${attr}`)
              }
            }),
          } as Partial<Selector>]), // Mock existing CSS rule
        } as Partial<CssRule>]), // Mock existing CSS rule
      },
    } as unknown as Editor

    // Mock Sibling Components (h2 and div)
    const mockSiblingComponent1 = {
      getId: () => '',
      getClasses: () => [],
      get tagName() {
        return 'h2'
      },
    } as unknown as Component

    const mockSiblingComponent2 = {
      getId: () => '',
      getClasses: () => ['sibling1'], // useless here but feels more real
      get tagName() {
        return 'div'
      },
    } as unknown as Component

    // Mock Selected Component (p)
    const mockSelectedComponent = {
      getId: () => '',
      getClasses: () => ['text'],
      get tagName() {
        return 'p'
      },
      parent: () => ({
        components: () => [mockSiblingComponent1, mockSelectedComponent, mockSiblingComponent2], // Mock siblings
      }),
    } as unknown as Component

    const selectedComponents = [mockSelectedComponent]

    const suggestions = getSuggestionsRelated(mockEditor, selectedComponents, {
      mainSelector: { selectors: [{ type: SimpleSelectorType.CLASS, value: 'text', active: true } as ClassSelector] },
      operator: { type: OperatorType.NOT, isCombinator: false } as Operator,
      relatedSelector: { selectors: [] },
    })

    expect(suggestions).toEqual([
      ...TAGS.map(tag => ({ type: SimpleSelectorType.TAG, value: tag, active: true })),
      { type: SimpleSelectorType.CLASS, value: 'sibling1', active: true },
    ])
  })

  test('No operator (direct selection)', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Selected Component (button)
    const mockSelectedComponent = {
      getId: () => '',
      getClasses: () => ['a-class'],
      get tagName() {
        return 'body'
      },
    } as unknown as Component

    const selectedComponents = [mockSelectedComponent]

    const suggestions = getSuggestionsRelated(mockEditor, selectedComponents, {
      mainSelector: { selectors: [{ type: SimpleSelectorType.CLASS, value: 'a-class', active: true } as ClassSelector] },
      operator: undefined, // No operator
      relatedSelector: { selectors: [] },
    })

    expect(suggestions).toEqual([]) // No suggestions should be returned
  })

  test('`:is()` pseudo-class selector', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    const mockTargetComponent = {
      getId: () => 'main',
      getClasses: () => ['target'],
      get tagName() {
        return 'p'
      },
      parent: () => [],
    } as unknown as Component

    const selectedComponents = [mockTargetComponent]

    // Without the target class in related, it should be suggested
    expect(getSuggestionsRelated(mockEditor, selectedComponents, {
      mainSelector: { selectors: [{ type: SimpleSelectorType.CLASS, value: 'target', active: false } as ClassSelector] },
      operator: { type: OperatorType.IS, isCombinator: false } as Operator,
      relatedSelector: { selectors: [] },
    })).toEqual([
      { type: SimpleSelectorType.TAG, value: 'p', active: true },
      { type: SimpleSelectorType.CLASS, value: 'target', active: true },
    ])

    // With the class on related, it should not be suggested
    expect(getSuggestionsRelated(mockEditor, selectedComponents, {
      mainSelector: { selectors: [{ type: SimpleSelectorType.ID, value: 'main', active: true } as IdSelector] },
      operator: { type: OperatorType.IS, isCombinator: false } as Operator,
      relatedSelector: { selectors: [{ type: SimpleSelectorType.CLASS, value: 'target', active: true } as ClassSelector] },
    })).toEqual([
      { type: SimpleSelectorType.TAG, value: 'p', active: true },
    ])
  })

  test('`:where()` pseudo-class selector', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Parent Component (nav)
    const mockParentComponent = {
      getId: () => '',
      getClasses: () => ['navbar'],
      get tagName() {
        return 'nav'
      },
      parent: () => null,
    } as unknown as Component

    // Mock Target Component (ul)
    const mockTargetComponent = {
      getId: () => '',
      getClasses: () => ['menu'],
      get tagName() {
        return 'ul'
      },
      parent: () => mockParentComponent,
    } as unknown as Component

    const selectedComponents = [mockTargetComponent]

    const suggestions = getSuggestionsRelated(mockEditor, selectedComponents, {
      mainSelector: { selectors: [{ type: SimpleSelectorType.CLASS, value: 'menu', active: true } as ClassSelector] },
      operator: { type: OperatorType.WHERE, isCombinator: false } as Operator,
      relatedSelector: { selectors: [] },
    })

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'ul', active: true },
      { type: SimpleSelectorType.CLASS, value: 'menu', active: true },
    ])
  })

  test('Complex nested structure with multiple relations', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([]),
      },
    } as unknown as Editor

    // Mock Grandparent Component (section)
    const mockGrandparentComponent = {
      getId: () => '',
      getClasses: () => ['grandparent'],
      get tagName() {
        return 'section'
      },
      parent: () => undefined,
    } as Component

    // Mock Parent Component (article)
    const mockParentComponent = {
      getId: () => '',
      getClasses: () => ['parent'],
      get tagName() {
        return 'article'
      },
      parent: () => mockGrandparentComponent,
    } as Component

    // Mock Previous Sibling (div)
    const mockSiblingComponent = {
      getId: () => '',
      getClasses: () => ['sibling1'],
      get tagName() {
        return 'div'
      },
    } as Component

    // Mock Target Component (p)
    const mockTargetComponent = {
      getId: () => '',
      getClasses: () => ['target'],
      get tagName() {
        return 'p'
      },
      parent: () => mockParentComponent,
    } as Component

    // The parent component has both the target and a sibling
    // @ts-expect-error GrapesJs type is too complex
    mockParentComponent.components = () => [mockSiblingComponent as Component, mockTargetComponent as Component] as Component[]

    const selectedComponents = [mockTargetComponent]

    const suggestions = getSuggestionsRelated(mockEditor, selectedComponents, {
      mainSelector: { selectors: [{ type: SimpleSelectorType.CLASS, value: 'target', active: true } as ClassSelector] },
      operator: { type: OperatorType.DESCENDANT, isCombinator: true } as Operator,
      relatedSelector: { selectors: [] },
    }) 

    expect(suggestions).toEqual([
      { type: SimpleSelectorType.TAG, value: 'article', active: true },
      { type: SimpleSelectorType.TAG, value: 'section', active: true },
      { type: SimpleSelectorType.CLASS, value: 'parent', active: true },
      { type: SimpleSelectorType.CLASS, value: 'grandparent', active: true },
    ])
  })
  test('`:is()` pseudo-class on the body', () => {
    // Mock GrapesJS Editor
    const mockEditor = {
      CssComposer: {
        getAll: jest.fn().mockReturnValue([
          {
            at: jest.fn().mockReturnValue({ remove: jest.fn() }), // Mock existing CSS rule
            getSelectors: jest.fn().mockReturnValue([
              {
                get: jest.fn((attr) => {
                  switch (attr) {
                  case 'selectors':
                    return [{ type: SimpleSelectorType.TAG, value: 'body', active: true }]
                  case 'private':
                    return false
                  case 'type':
                    return 1
                  case 'name':
                    return 'sibling1'
                  default:
                    throw new Error(`Unknown attribute: ${attr}`)
                  }
                }),
              } as Partial<Selector>,
            ]), // Mock existing CSS rule
          } as Partial<CssRule>,
        ]),
      },
    } as unknown as Editor

    // Mock Selected Component (button)
    const mockSelectedComponent = {
      getId: () => '',
      getClasses: () => ['a-class'],
      get tagName() {
        return 'body'
      },
    } as unknown as Component

    const selectedComponents = [mockSelectedComponent]

    expect(getSuggestionsRelated(mockEditor, selectedComponents, {
      mainSelector: { selectors: [{ type: SimpleSelectorType.TAG, value: 'body', active: true } as TagSelector] },
      operator: { type: OperatorType.IS, isCombinator: false } as Operator,
      relatedSelector: { selectors: [] },
    }))
      .toEqual([{
        type: SimpleSelectorType.TAG,
        value: 'body',
        active: true,
      }, {
        type: SimpleSelectorType.CLASS,
        value: 'a-class',
        active: true,
      }])
  })

})
