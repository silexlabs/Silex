/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { expect, describe, it, beforeAll } from '@jest/globals'
import grapesjs, { Editor } from 'grapesjs'
import cssPropsPlugin from './css-props'

let editor: Editor
let ruleCount = 0

// Grapesjs never fires `load` in headless mode, and the whole plugin lives in that
// handler. Fire it by hand, once: the properties added without a matching
// removeProperty would be duplicated by a second call.
beforeAll(() => {
  /* @ts-ignore */
  editor = grapesjs.init({
    headless: true,
    storageManager: { autoload: false },
    plugins: [cssPropsPlugin],
  })
  editor.trigger('load')
})

function propertyNames(sectorId: string): string[] {
  return editor.StyleManager.getSector(sectorId)!
    .getProperties()
    .map(prop => prop.getName())
}

function getProperty(sectorId: string, id: string): any {
  const prop = editor.StyleManager.getProperty(sectorId, id)
  expect(prop).toBeTruthy()
  return prop
}

// Select a fresh rule so that each test starts from an empty style
function selectNewRule(style: Record<string, string> = {}) {
  const rule = editor.Css.setRule(`.test-${ruleCount++}`, style)
  editor.StyleManager.select(rule)
  return rule
}

describe('text-underline-offset', () => {
  it('is its own property, right after text decoration', () => {
    const names = propertyNames('typography')
    expect(names).toContain('text-underline-offset')
    expect(names.indexOf('text-underline-offset')).toBe(names.indexOf('text-decoration') + 1)
  })

  // It is not part of the text-decoration shorthand: as a sub property it would be
  // joined into `text-decoration: underline solid red 2px 4px`, which is invalid, so
  // browsers drop the whole declaration and the underline disappears
  it('is not a sub property of the text decoration shorthand', () => {
    const subProps = getProperty('typography', 'text-decoration')
      .getProperties()
      .map((prop: any) => prop.getName())
    expect(subProps).toEqual([
      'text-decoration-line',
      'text-decoration-style',
      'text-decoration-color',
      'text-decoration-thickness',
    ])
  })

  it('takes lengths and percentages as well as the fixed values', () => {
    const prop = getProperty('typography', 'text-underline-offset')
    expect(prop.getUnits()).toEqual(['px', 'em', 'rem', '%'])
    expect(prop.get('fixedValues')).toEqual(['auto', 'inherit', 'initial', 'revert', 'unset'])
  })

  it('writes and reads back a value without touching text decoration', () => {
    const rule = selectNewRule({ 'text-decoration': 'underline wavy red 3px' })
    getProperty('typography', 'text-underline-offset').upValue('10px')
    expect(rule.getStyle()).toEqual({
      'text-decoration': 'underline wavy red 3px',
      'text-underline-offset': '10px',
    })
    // Reload: the values are still in the panel
    selectNewRule(rule.getStyle() as Record<string, string>)
    expect(getProperty('typography', 'text-underline-offset').__getFullValue()).toBe('10px')
    expect(getProperty('typography', 'text-decoration').__getFullValue()).toBe('underline wavy red 3px')
  })
})

describe('transform-origin', () => {
  it('sits right after transform in the effects sector', () => {
    const names = propertyNames('extra')
    expect(names).toContain('transform-origin')
    expect(names.indexOf('transform-origin')).toBe(names.indexOf('transform') + 1)
  })

  // Detached would write the sub property names, which are not real css properties,
  // as declarations of their own: `transform-origin-x: left`
  it('is a composite of two sub properties and is not detached', () => {
    const prop = getProperty('extra', 'transform-origin')
    expect(prop.getType()).toBe('composite')
    expect(prop.isDetached()).toBe(false)
    expect(prop.getProperties().map((sub: any) => sub.getName()))
      .toEqual(['transform-origin-x', 'transform-origin-y', 'transform-origin-z'])
  })

  // Z only takes a length: no keyword is valid there, and a percentage would void the
  // whole declaration
  it('takes a length only on Z', () => {
    const prop = getProperty('extra', 'transform-origin')
    expect(prop.getProperty('transform-origin-z').get('fixedValues')).toEqual([])
    expect(prop.getProperty('transform-origin-z').getUnits()).toEqual(['px', 'em', 'rem'])
    expect(prop.getProperty('transform-origin-x').getUnits()).toContain('%')
  })

  // A css wide keyword is the value of the whole property. Written next to an axis it
  // would give `transform-origin: inherit center`, which browsers drop entirely
  it.each(['inherit', 'initial', 'revert', 'unset'])('writes `%s` on its own', (keyword) => {
    const rule = selectNewRule()
    const prop = getProperty('extra', 'transform-origin')
    prop.getProperty('transform-origin-x').upValue(keyword)
    expect(rule.getStyle()).toEqual({ 'transform-origin': keyword })
    // the keyword wins over the axes, it can never end up as one token among others
    prop.getProperty('transform-origin-y').upValue('top')
    prop.getProperty('transform-origin-z').upValue('30px')
    expect(rule.getStyle()).toEqual({ 'transform-origin': keyword })
  })

  // Css written outside of Silex can hold one. It has to show in the panel: otherwise the
  // property looks unset, the clear button is not rendered and the next edit destroys it
  it.each(['inherit', 'initial', 'revert', 'unset'])('reads `%s` back, so it can be seen and cleared', (keyword) => {
    const rule = selectNewRule({ 'transform-origin': keyword })
    const prop = getProperty('extra', 'transform-origin')
    expect(prop.getValues()).toEqual({
      'transform-origin-x': keyword,
      'transform-origin-y': '',
      'transform-origin-z': '',
    })
    expect(prop.hasValue({ noParent: true })).toBe(true)
    expect(prop.canClear()).toBe(true)
    expect(rule.getStyle()).toEqual({ 'transform-origin': keyword })
  })

  // They are not offered on Y, where they could only ever be a second token
  it('does not let a css wide keyword through on Y', () => {
    const prop = getProperty('extra', 'transform-origin')
    expect(prop.getProperty('transform-origin-y').get('fixedValues')).toEqual(['top', 'center', 'bottom'])
    const rule = selectNewRule()
    prop.getProperty('transform-origin-y').upValue('inherit')
    expect(rule.getStyle()).toEqual({})
  })

  it.each([
    ['left top', 'left', 'top', ''],
    ['top left', 'left', 'top', ''],
    ['50% 20px', '50%', '20px', ''],
    ['left', 'left', '', ''],
    ['top', '', 'top', ''],
    ['bottom center', 'center', 'bottom', ''],
    ['left top 30px', 'left', 'top', '30px'],
    ['top left 30px', 'left', 'top', '30px'],
    ['50% 20px 30px', '50%', '20px', '30px'],
  ])('reads `transform-origin: %s` as x=%s y=%s z=%s', (value, x, y, z) => {
    selectNewRule({ 'transform-origin': value })
    expect(getProperty('extra', 'transform-origin').getValues()).toEqual({
      'transform-origin-x': x,
      'transform-origin-y': y,
      'transform-origin-z': z,
    })
  })

  it('writes both axes so that a value set alone keeps its axis on reload', () => {
    const rule = selectNewRule()
    getProperty('extra', 'transform-origin').getProperty('transform-origin-y').upValue('top')
    expect(rule.getStyle()).toEqual({ 'transform-origin': 'center top' })
    // Reload: `top` is still the vertical part, it did not move to the horizontal one
    selectNewRule(rule.getStyle() as Record<string, string>)
    expect(getProperty('extra', 'transform-origin').getValues()).toEqual({
      'transform-origin-x': 'center',
      'transform-origin-y': 'top',
      'transform-origin-z': '',
    })
  })

  // Css only accepts a Z after an X and a Y, so both are written even when only Z is set
  it('writes the three axes when only Z is set, and reads them back on reload', () => {
    const rule = selectNewRule()
    getProperty('extra', 'transform-origin').getProperty('transform-origin-z').upValue('30px')
    expect(rule.getStyle()).toEqual({ 'transform-origin': 'center center 30px' })
    selectNewRule(rule.getStyle() as Record<string, string>)
    expect(getProperty('extra', 'transform-origin').getValues()).toEqual({
      'transform-origin-x': 'center',
      'transform-origin-y': 'center',
      'transform-origin-z': '30px',
    })
  })

  it('writes nothing when both axes are empty', () => {
    const rule = selectNewRule({ color: 'red' })
    expect(rule.getStyle()).toEqual({ color: 'red' })
  })

  it('never writes the sub property names to the css', () => {
    const rule = selectNewRule()
    const prop = getProperty('extra', 'transform-origin')
    prop.getProperty('transform-origin-x').upValue('left')
    prop.getProperty('transform-origin-y').upValue('top')
    expect(rule.getStyle()).toEqual({ 'transform-origin': 'left top' })
    expect(editor.getCss({ keepUnusedStyles: true })).toContain('transform-origin:left top;')
  })
})

describe('transition', () => {
  it('keeps the three sub properties of the grapesjs stack', () => {
    const prop = getProperty('extra', 'transition')
    expect(prop.getType()).toBe('stack')
    expect(prop.getProperties().map((sub: any) => sub.getId())).toEqual([
      'transition-property-sub',
      'transition-duration-sub',
      'transition-timing-function-sub',
    ])
  })

  it('offers filter and the other added properties, and keeps the grapesjs ones', () => {
    const options = getProperty('extra', 'transition')
      .getProperty('transition-property-sub')
      .getOptions()
      .map((option: any) => option.id)
    // Silex adds the filter property itself, so it has to be animatable
    expect(options).toContain('filter')
    expect(options).toEqual(expect.arrayContaining(['color', 'border-color', 'backdrop-filter', 'visibility']))
    // Leftover from #1678 after #1838: box-model and position properties
    expect(options).toEqual(expect.arrayContaining([
      'padding', 'margin', 'top', 'bottom', 'left', 'right',
    ]))
    // The grapesjs list is kept
    expect(options).toEqual(expect.arrayContaining([
      'all', 'width', 'height', 'background-color', 'transform', 'box-shadow', 'opacity',
    ]))
  })

  it('offers cubic-bezier timing-function presets with concrete values', () => {
    const options = getProperty('extra', 'transition')
      .getProperty('transition-timing-function-sub')
      .getOptions()
      .map((option: any) => option.id)
    expect(options).toEqual(expect.arrayContaining([
      'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out',
    ]))
    const beziers = options.filter((id: string) => id.startsWith('cubic-bezier('))
    expect(beziers.length).toBeGreaterThanOrEqual(1)
    expect(beziers).toEqual(expect.arrayContaining([
      'cubic-bezier(0.4, 0, 0.2, 1)',
      'cubic-bezier(0.34, 1.56, 0.64, 1)',
      'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    ]))
    // Select options must be applyable CSS, not a placeholder like cubic-bezier(n,n,n,n)
    for (const value of beziers) {
      expect(value).toMatch(/^cubic-bezier\(-?\d+(\.\d+)?, -?\d+(\.\d+)?, -?\d+(\.\d+)?, -?\d+(\.\d+)?\)$/)
    }
  })

  it('writes and reads back a transition on filter', () => {
    const rule = selectNewRule()
    getProperty('extra', 'transition').addLayer({
      'transition-property-sub': 'filter',
      'transition-duration-sub': '2s',
      'transition-timing-function-sub': 'ease-in-out',
    }, { at: 0 })
    expect(rule.getStyle()).toEqual({ transition: 'filter 2s ease-in-out' })
    // Reload: the layer is still in the panel
    selectNewRule(rule.getStyle() as Record<string, string>)
    expect(getProperty('extra', 'transition').getLayers().map((layer: any) => layer.getValues())).toEqual([{
      'transition-property-sub': 'filter',
      'transition-duration-sub': '2s',
      'transition-timing-function-sub': 'ease-in-out',
    }])
  })

  it('writes and reads back padding with a cubic-bezier timing function', () => {
    const bezier = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    const rule = selectNewRule()
    getProperty('extra', 'transition').addLayer({
      'transition-property-sub': 'padding',
      'transition-duration-sub': '300ms',
      'transition-timing-function-sub': bezier,
    }, { at: 0 })
    expect(rule.getStyle()).toEqual({ transition: `padding 300ms ${bezier}` })
    expect(editor.getCss({ keepUnusedStyles: true })).toContain(`transition:padding 300ms ${bezier}`)
    selectNewRule(rule.getStyle() as Record<string, string>)
    expect(getProperty('extra', 'transition').getLayers().map((layer: any) => layer.getValues())).toEqual([{
      'transition-property-sub': 'padding',
      'transition-duration-sub': '300ms',
      'transition-timing-function-sub': bezier,
    }])
  })

  it.each(['margin', 'top', 'bottom', 'left', 'right'] as const)(
    'writes and reads back a transition on %s',
    (property) => {
      const rule = selectNewRule()
      getProperty('extra', 'transition').addLayer({
        'transition-property-sub': property,
        'transition-duration-sub': '2s',
        'transition-timing-function-sub': 'cubic-bezier(0.4, 0, 0.2, 1)',
      }, { at: 0 })
      expect(rule.getStyle()).toEqual({
        transition: `${property} 2s cubic-bezier(0.4, 0, 0.2, 1)`,
      })
      selectNewRule(rule.getStyle() as Record<string, string>)
      expect(getProperty('extra', 'transition').getLayers().map((layer: any) => layer.getValues())).toEqual([{
        'transition-property-sub': property,
        'transition-duration-sub': '2s',
        'transition-timing-function-sub': 'cubic-bezier(0.4, 0, 0.2, 1)',
      }])
    },
  )
})
