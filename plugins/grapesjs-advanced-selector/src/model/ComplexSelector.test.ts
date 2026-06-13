import { activateSelectors, ComplexSelector, fromString, toString, getSelector } from './ComplexSelector'
import { OPERATORS, OperatorType } from './Operator'
import { PseudoClassType } from './PseudoClass'
import { ClassSelector, IdSelector, SimpleSelectorType, TagSelector } from './SimpleSelector'
import { Component } from 'grapesjs'

const id = 'TEST_ID'

describe('toString', () => {
  test('builds correct selector string', () => {
    expect(toString({
      mainSelector: {
        selectors: [
          {
            type: 'id',
            value: id,
            active: true,
          } as IdSelector
        ]
      }
    } as ComplexSelector)).toBe(`#${id}`)
  })
  test('builds correct selector string with no active related selectors', () => {
    expect(toString({
      mainSelector: {
        selectors: [
          {
            type: SimpleSelectorType.ID,
            value: id,
            active: true,
          } as IdSelector
        ]
      },
      operator: { type: OperatorType.DESCENDANT, hasParam: false, isCombinator: true, sentencePre: '', helpLink: '', stringRepresentation: '' },
      relatedSelector: {
        selectors: [
          {
            type: SimpleSelectorType.CLASS,
            value: 'test',
            active: false,
          } as ClassSelector
        ]
      }
    } as ComplexSelector)).toBe(`#${id}`)
  })
  test('builds correct selector string with active related selectors', () => {
    expect(toString({
      mainSelector: {
        selectors: [
          {
            type: 'id',
            value: id,
            active: true,
          } as IdSelector
        ]
      },
      operator: OPERATORS.find((op) => op.type === OperatorType.DESCENDANT),
      relatedSelector: {
        selectors: [
          {
            type: 'class',
            value: 'test',
            active: true,
          } as ClassSelector
        ]
      }
    } as ComplexSelector)).toBe(`.test #${id}`)
  })
  test('builds correct selector string with active related selectors but no operator', () => {
    expect(toString({
      mainSelector: {
        selectors: [
          {
            type: 'id',
            value: id,
            active: true,
          } as IdSelector
        ]
      },
      relatedSelector: {
        selectors: [
          {
            type: 'class',
            value: 'test',
            active: true,
          } as ClassSelector
        ]
      }
    } as ComplexSelector)).toBe(`#${id}`)
  })
})
describe('activateSelectors', () => {
  test('activates selectors when they exist in other and are active', () => {
    const cs: ComplexSelector = {
      mainSelector: {
        selectors: [
          { type: SimpleSelectorType.TAG, value: 'div', active: false } as TagSelector,
          { type: SimpleSelectorType.CLASS, value: 'test', active: false } as ClassSelector,
        ]
      }
    }

    const other: ComplexSelector = {
      mainSelector: {
        selectors: [
          { type: SimpleSelectorType.TAG, value: 'div', active: true } as TagSelector,
        ]
      }
    }

    const result = activateSelectors(cs, other)

    expect(result.mainSelector.selectors).toEqual([
      { type: SimpleSelectorType.TAG, value: 'div', active: true },  // ✅ Activated
      { type: SimpleSelectorType.CLASS, value: 'test', active: false } // ❌ Unchanged
    ])
  })

  test('deactivates selectors when they exist in other and are inactive', () => {
    const cs: ComplexSelector = {
      mainSelector: {
        selectors: [
          { type: SimpleSelectorType.CLASS, value: 'btn', active: true } as ClassSelector,
        ]
      }
    }

    const other: ComplexSelector = {
      mainSelector: {
        selectors: [
          { type: SimpleSelectorType.CLASS, value: 'btn', active: false } as ClassSelector,
        ]
      }
    }

    const result = activateSelectors(cs, other)

    expect(result.mainSelector.selectors).toEqual([
      { type: SimpleSelectorType.CLASS, value: 'btn', active: false } // ✅ Deactivated
    ])
  })

  test('handles relatedSelector correctly', () => {
    const cs: ComplexSelector = {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'main', active: false } as ClassSelector],
      },
      relatedSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'related', active: false } as ClassSelector],
      }
    }

    const other: ComplexSelector = {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'main', active: true } as ClassSelector],
      },
      relatedSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'related', active: true } as ClassSelector],
      }
    }

    const result = activateSelectors(cs, other)

    expect(result.mainSelector.selectors).toEqual([
      { type: SimpleSelectorType.CLASS, value: 'main', active: true } // ✅ Activated
    ])

    expect(result.relatedSelector?.selectors).toEqual([
      { type: SimpleSelectorType.CLASS, value: 'related', active: true } // ✅ Activated
    ])
  })

  test('preserves pseudo-classes', () => {
    const cs: ComplexSelector = {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'test', active: false } as ClassSelector],
        pseudoClass: { type: PseudoClassType.HOVER, hasParam: false, sentencePre: '', }
      }
    }

    const other: ComplexSelector = {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'test', active: true } as ClassSelector],
        pseudoClass: { type: PseudoClassType.HOVER, hasParam: false, sentencePre: '', }
      }
    }

    const result = activateSelectors(cs, other)

    expect(result.mainSelector.pseudoClass).toEqual({ type: 'hover', hasParam: false, sentencePre: '' }) // ✅ Preserved
  })

  test('does not modify the operator', () => {
    const cs: ComplexSelector = {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'btn', active: false } as ClassSelector],
      },
      operator: { type: OperatorType.CHILD, hasParam: false, isCombinator: true, sentencePre: '', helpLink: '', stringRepresentation: '' }
    }

    const other: ComplexSelector = {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'btn', active: true } as ClassSelector],
      }
    }

    const result = activateSelectors(cs, other)

    expect(result.operator).toEqual(cs.operator) // ✅ Operator remains unchanged
  })

  test('deactivate related classes when no related classes are present in other', () => {
    const cs: ComplexSelector = {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'main', active: true } as ClassSelector],
      },
      relatedSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'related', active: true } as ClassSelector],
      }
    }

    const other: ComplexSelector = {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'main', active: true } as ClassSelector],
      },
      relatedSelector: {
        selectors: [],
      }
    }

    const result = activateSelectors(cs, other)

    expect(result.relatedSelector?.selectors).toEqual([
      { type: SimpleSelectorType.CLASS, value: 'related', active: false } // ✅ Deactivated
    ])
  })

  test('deactivate related classes when other has no related selector', () => {
    const cs: ComplexSelector = {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'main', active: true } as ClassSelector],
      },
      relatedSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'related', active: true } as ClassSelector],
      }
    }

    const other: ComplexSelector = {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'main', active: true } as ClassSelector],
      },
    }

    const result = activateSelectors(cs, other)

    expect(result.relatedSelector?.selectors).toEqual([
      { type: SimpleSelectorType.CLASS, value: 'related', active: false } // ✅ Deactivated
    ])
  })

  test('deactivate main classes when other has no selector', () => {
    const cs: ComplexSelector = {
      mainSelector: {
        selectors: [{ type: SimpleSelectorType.CLASS, value: 'main', active: true } as ClassSelector],
      },
    }

    const other: ComplexSelector = {
      mainSelector: {
        selectors: [],
      },
    }

    const result = activateSelectors(cs, other)

    expect(result.mainSelector.selectors).toEqual([
      { type: SimpleSelectorType.CLASS, value: 'main', active: false } // ✅ Deactivated
    ])
  })
})

describe('fromString', () => {
  test('parses a simple ID selector', () => {
    expect(fromString(`#${id}`, '')).toEqual({
      mainSelector: {
        selectors: [
          { type: SimpleSelectorType.ID, value: id, active: true } as IdSelector
        ]
      }
    })
  })

  test('parses a simple ID selector with a related class', () => {
    expect(fromString(`.test #${id}`, '')).toEqual({
      mainSelector: {
        selectors: [
          { type: SimpleSelectorType.ID, value: id, active: true } as IdSelector
        ]
      },
      operator: OPERATORS.find((op) => op.type === OperatorType.DESCENDANT),
      relatedSelector: {
        selectors: [
          { type: SimpleSelectorType.CLASS, value: 'test', active: true } as ClassSelector
        ]
      }
    })
  })

  test('parses a simple ID selector with a related class and a "has" operator', () => {
    expect(fromString(`#${id}:has(.child)`, '')).toEqual({
      mainSelector: {
        selectors: [
          { type: SimpleSelectorType.ID, value: id, active: true } as IdSelector
        ]
      },
      operator: OPERATORS.find((op) => op.type === OperatorType.HAS),
      relatedSelector: {
        selectors: [
          { type: SimpleSelectorType.CLASS, value: 'child', active: true } as ClassSelector
        ]
      },
    })
  })

  test('parses a simple ID selector with a related class and a child operator', () => {
    expect(fromString(`#${id}.test > .child`, '').operator?.stringRepresentation).toEqual(' > ')
    expect(fromString(`#${id}.test > .child`, '')).toEqual({
      mainSelector: {
        selectors: [
          { type: SimpleSelectorType.CLASS, value: 'child', active: true } as ClassSelector
        ]
      },
      operator: OPERATORS.find((op) => op.type === OperatorType.CHILD),
      relatedSelector: {
        selectors: [
          { type: SimpleSelectorType.ID, value: id, active: true } as IdSelector,
          { type: SimpleSelectorType.CLASS, value: 'test', active: true } as ClassSelector
        ]
      },
    })
  })
})

describe('getSelector function', () => {
  test('should update ID in the selector when the component ID has changed', () => {
    // Mock a component that has changed its ID
    const mockComponent = {
      getId: jest.fn(() => 'newId'), // Component now has new ID
      tagName: 'div',
      getClasses: jest.fn(() => ['test-class']),
      get: jest.fn(() => ({
        // This represents the old selector stored in the component
        mainSelector: {
          selectors: [
            { type: SimpleSelectorType.ID, value: 'oldId', active: true },
            { type: SimpleSelectorType.CLASS, value: 'test-class', active: true }
          ]
        }
      }))
    } as unknown as Component

    // Call the getSelector function
    const result = getSelector([mockComponent])

    // The result should have the component's current ID, not the stored old ID
    expect(result).not.toBeNull()
    if (result) {
      const idSelectors = result.mainSelector.selectors.filter(
        (s: any) => s.type === SimpleSelectorType.ID
      ) as IdSelector[]

      // Should have exactly one ID selector
      expect(idSelectors).toHaveLength(1)

      // Should use component's current ID, not the stored old ID
      expect(idSelectors[0].value).toBe('newId')
      expect(idSelectors[0].value).not.toBe('oldId')
    }
  })
})
