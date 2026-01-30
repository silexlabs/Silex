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

import { Editor } from 'grapesjs'
import { registerSector } from './sectors'

/**
 * @fileoverview Adds various css properties
 */

export default (editor: Editor, opts) => {
  editor.on('load', () => {
  /***************/
  /* General     */
  /***************/
    editor.StyleManager.removeProperty('general', 'display')
    editor.StyleManager.addProperty('general', {
      name: 'Display',
      property: 'display',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'block', value: 'block', name: 'block' },
        { id: 'inline', value: 'inline', name: 'inline' },
        { id: 'inline-block', value: 'inline-block', name: 'inline-block' },
        { id: 'flex', value: 'flex', name: 'flex' },
        { id: 'grid', value: 'grid', name: 'grid' },
        { id: 'inline-flex', value: 'inline-flex', name: 'inline-flex' },
        { id: 'none', value: 'none', name: 'none' },
        { id: 'inherit', value: 'inherit', name: 'inherit' },
        { id: 'initial', value: 'initial', name: 'initial' },
        { id: 'unset', value: 'unset', name: 'unset' },
      ],
      info: '',
    })
    editor.StyleManager.addProperty('general', {
      name: 'Visibility',
      property: 'visibility',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'visible', value: 'visible', name: 'visible' },
        { id: 'hidden', value: 'hidden', name: 'hidden' },
        { id: 'collapse', value: 'collapse', name: 'collapse' },
        { id: 'inherit', value: 'inherit', name: 'inherit' },
        { id: 'initial', value: 'initial', name: 'initial' },
        { id: 'unset', value: 'unset', name: 'unset' },
      ],
      info: 'Controls element visibility without changing layout.',
    })
    editor.StyleManager.removeProperty('general', 'float')
    editor.StyleManager.removeProperty('general', 'position')
    editor.StyleManager.addProperty('general', {
      name: 'Position',
      property: 'position',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'inherit', value: 'inherit', name: 'inherit' },
        { id: 'initial', value: 'initial', name: 'initial' },
        { id: 'static', value: 'static', name: 'static' },
        { id: 'relative', value: 'relative', name: 'relative' },
        { id: 'absolute', value: 'absolute', name: 'absolute' },
        { id: 'fixed', value: 'fixed', name: 'fixed' },
        { id: 'sticky', value: 'sticky', name: 'sticky' },
        { id: 'unset', value: 'unset', name: 'unset' },
      ],
      info: '',
    })
    editor.StyleManager.addProperty('general', {
      name: 'Container Type',
      property: 'container-type',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'normal', value: 'normal', name: 'normal' },
        { id: 'size', value: 'size', name: 'size' },
        { id: 'inline-size', value: 'inline-size', name: 'inline-size' },
      ],
      info: 'Defines the element as a query container, enabling container queries for its descendants.',
    })
    editor.StyleManager.removeProperty('general', 'top')
    editor.StyleManager.addProperty('general', {
      name: 'Top',
      property: 'top',
      type: 'number',
      defaults: '',
      units: [ 'px', '%', 'em', 'rem', 'vh', 'dvh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      info: '',
    })
    editor.StyleManager.removeProperty('general', 'bottom')
    editor.StyleManager.addProperty('general', {
      name: 'Bottom',
      property: 'bottom',
      type: 'number',
      defaults: '',
      units: [ 'px', '%', 'em', 'rem', 'vh', 'dvh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      info: '',
    })
    editor.StyleManager.removeProperty('general', 'right')
    editor.StyleManager.addProperty('general', {
      name: 'Right',
      property: 'right',
      type: 'number',
      defaults: '',
      units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'dvw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      info: '',
    })
    editor.StyleManager.removeProperty('general', 'left')
    editor.StyleManager.addProperty('general', {
      name: 'Left',
      property: 'left',
      type: 'number',
      defaults: '',
      units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'dvw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      info: '',
    })
    registerSector(editor, {
      id: 'content',
      name: 'Content',
      props: [{
        name: 'Content',
        property: 'content',
        type: 'text',
        defaults: '"Content in double quotes"',
        info: 'Generates content for an element.',
        full: true,
        visible: false,
      }],
      shouldShow: async () => {
        return new Promise<boolean>((resolve, reject) => {

          requestAnimationFrame(() => {
            try {
              const state = editor.StyleManager
                .getSelected()
                ?.get('state')
              if (state && ['before', 'after'].includes(state)) {
                return resolve(true)
              }
              return resolve(false)
            } catch(e) {
              reject(e)
            }
          })
        })
      },
    }, 0)
    /***************/
    /* Dimension   */
    /***************/
    editor.StyleManager.removeProperty('dimension', 'width')
    editor.StyleManager.addProperty('dimension', {
      name: 'Width',
      property: 'width',
      type: 'integer',
      units: ['px', '%', 'em', 'rem', 'vh', 'vw', 'dvw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax'],
      default: '',
      fixedValues: ['inherit', 'initial', 'unset', 'none', 'max-content', 'min-content', 'fit-content', 'auto'],
    }, { at: 0 })
    editor.StyleManager.removeProperty('dimension', 'height')
    editor.StyleManager.addProperty('dimension', {
      name: 'Height',
      property: 'height',
      type: 'integer',
      units: [ 'px', '%', 'em', 'rem', 'vh', 'dvh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      default: '',
      fixedValues: ['inherit', 'initial', 'unset', 'none', 'max-content', 'min-content', 'fit-content', 'auto'],
    }, { at: 1 })
    editor.StyleManager.addProperty('dimension', {
      name: 'Min width',
      property: 'min-width',
      type: 'integer',
      units: ['px', '%', 'em', 'rem', 'vh', 'vw', 'dvw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax'],
      default: '',
      fixedValues: ['inherit', 'initial', 'unset', 'none', 'max-content', 'min-content', 'fit-content', 'auto'],
    }, { at: 2 })
    editor.StyleManager.removeProperty('dimension', 'max-width')
    editor.StyleManager.addProperty('dimension', {
      name: 'Max width',
      property: 'max-width',
      type: 'integer',
      units: ['px', '%', 'em', 'rem', 'vh', 'vw', 'dvw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax'],
      default: '',
      fixedValues: ['inherit', 'initial', 'unset', 'none', 'max-content', 'min-content', 'fit-content', 'auto'],
    }, { at: 3 })
    editor.StyleManager.removeProperty('dimension', 'min-height')
    editor.StyleManager.addProperty('dimension', {
      name: 'Min height',
      property: 'min-height',
      type: 'integer',
      units: ['px', '%', 'em', 'rem', 'vh', 'dvh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax'],
      default: '',
      fixedValues: ['inherit', 'initial', 'unset', 'none', 'max-content', 'min-content', 'fit-content', 'auto'],
    }, { at: 4 })
    editor.StyleManager.addProperty('dimension', {
      name: 'Max height',
      property: 'max-height',
      type: 'integer',
      units: ['px', '%', 'em', 'rem', 'vh', 'dvh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax'],
      default: '',
      fixedValues: ['inherit', 'initial', 'unset', 'none', 'max-content', 'min-content', 'fit-content', 'auto'],
    }, { at: 5 })
    editor.StyleManager.addProperty('dimension', {
      name: 'Overflow',
      property: 'overflow',
      type: 'composite',
      properties: [{
        name: 'Overflow X',
        type: 'select',
        defaults: '',
        options: [
          { id: '', value: '', name: '' },
          { id: 'auto', value: 'auto', name: 'auto' },
          { id: 'hidden', value: 'hidden', name: 'hidden' },
          { id: 'visible', value: 'visible', name: 'visible' },
          { id: 'scroll', value: 'scroll', name: 'scroll' },
          { id: 'inherit', value: 'inherit', name: 'inherit' },
          { id: 'initial', value: 'initial', name: 'initial' },
          { id: 'unset', value: 'unset', name: 'unset' },
        ],
      }, {
        name: 'Overflow Y',
        type: 'select',
        defaults: '',
        options: [
          { id: '', value: '', name: '' },
          { id: 'auto', value: 'auto', name: 'auto' },
          { id: 'hidden', value: 'hidden', name: 'hidden' },
          { id: 'visible', value: 'visible', name: 'visible' },
          { id: 'scroll', value: 'scroll', name: 'scroll' },
          { id: 'inherit', value: 'inherit', name: 'inherit' },
          { id: 'initial', value: 'initial', name: 'initial' },
          { id: 'unset', value: 'unset', name: 'unset' },
        ],
      }],
      info: 'Controls content overflow in a block.',
    }, { at: 6 })

    editor.StyleManager.removeProperty('dimension', 'margin')
    editor.StyleManager.addProperty('dimension', {
      name: 'Margin',
      property: 'margin',
      type: 'composite',
      defaults: '',
      fixedValues: [ 'initial', 'inherit', 'auto' ],
      full: true,
      properties: [{
        property: 'margin-top',
        name: 'Margin top',
        type: 'number',
        default: '',
        fixedValues: [ 'initial', 'inherit', 'auto' ],
        units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      }, {
        property: 'margin-right',
        name: 'Margin right',
        type: 'number',
        default: '',
        fixedValues: [ 'initial', 'inherit', 'auto' ],
        units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      }, {
        property: 'margin-bottom',
        name: 'Margin bottom',
        type: 'number',
        default: '',
        fixedValues: [ 'initial', 'inherit', 'auto' ],
        units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      }, {
        property: 'margin-left',
        name: 'Margin left',
        type: 'number',
        default: '',
        fixedValues: [ 'initial', 'inherit', 'auto' ],
        units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      }],
    }, { at: 8 })
    editor.StyleManager.removeProperty('dimension', 'padding')
    editor.StyleManager.addProperty('dimension', {
      name: 'Padding',
      property: 'padding',
      type: 'composite',
      fixedValues: [ 'initial', 'inherit', 'auto' ],
      full: true,
      properties: [{
        property: 'padding-top',
        name: 'Padding top',
        type: 'number',
        default: '',
        value: '10',
        fixedValues: [ 'initial', 'inherit', 'auto' ],
        units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      }, {
        property: 'padding-right',
        name: 'Padding right',
        type: 'number',
        default: '',
        value: '10',
        fixedValues: [ 'initial', 'inherit', 'auto' ],
        units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      }, {
        property: 'padding-bottom',
        name: 'Padding bottom',
        type: 'number',
        default: '',
        value: '10',
        fixedValues: [ 'initial', 'inherit', 'auto' ],
        units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      }, {
        property: 'padding-left',
        name: 'Padding left',
        type: 'number',
        default: '',
        value: '10',
        fixedValues: [ 'initial', 'inherit', 'auto' ],
        units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      }],
    }, { at: 9 })

    /***************/
    /* Typography  */
    /***************/
    editor.StyleManager.removeProperty('typography', 'font-size')
    editor.StyleManager.addProperty('typography', {
      name: 'Font size',
      property: 'font-size',
      type: 'number',
      default: '',
      fixedValues: [ 'medium', 'xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large', 'smaller', 'larger', 'length', 'initial', 'inherit' ],
      units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
    }, { at: 1 })
    editor.StyleManager.removeProperty('typography', 'font-weight')
    editor.StyleManager.addProperty('typography', {
      name: 'Font weight',
      property: 'font-weight',
      type: 'select',
      default: '',
      fixedValues: ['inherit', 'initial', 'unset', 'auto'],
      options: [
        { id: '', label: '' },
        { id: '100', label: 'Thin' },
        { id: '200', label: 'Extra-Light' },
        { id: '300', label: 'Light' },
        { id: '400', label: 'Normal' },
        { id: '500', label: 'Medium' },
        { id: '600', label: 'Semi-Bold' },
        { id: '700', label: 'Bold' },
        { id: '800', label: 'Extra-Bold' },
        { id: '900', label: 'Ultra-Bold' }
      ]
    }, { at: 2 })
    editor.StyleManager.removeProperty('typography', 'letter-spacing')
    editor.StyleManager.addProperty('typography', {
      name: 'Letter spacing',
      property: 'letter-spacing',
      type: 'number',
      default: '',
      fixedValues: [ 'normal', 'initial', 'inherit', 'unset' ],
      units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
    }, { at: 3 })
    editor.StyleManager.removeProperty('typography', 'color')
    editor.StyleManager.addProperty('typography', {
      name: 'Color',
      property: 'color',
      type: 'color',
      default: '',
      full: true,
    }, { at: 4 })
    editor.StyleManager.removeProperty('typography', 'line-height')
    editor.StyleManager.addProperty('typography', {
      name: 'Line height',
      property: 'line-height',
      type: 'number',
      default: '',
      fixedValues: [ 'normal', 'initial', 'inherit', 'unset' ],
      units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
    }, { at: 5 })
    editor.StyleManager.removeProperty('typography', 'text-align')
    editor.StyleManager.addProperty('typography', {
      name: 'Text align',
      property: 'text-align',
      type: 'select',
      defaults: '',
      options: [
        { id: '', label: '' },
        { id: 'left', label: 'left' },
        { id: 'center', label: 'center' },
        { id: 'right', label: 'right' },
        { id: 'justified', label: 'justified' },
        { id: 'inherit', label: 'inherit' },
        { id: 'initial', label: 'initial' },
        { id: 'unset', label: 'unset' },
      ],
    }, { at: 6 })
    editor.StyleManager.addProperty('typography', {
      name: 'Word break',
      property: 'word-break',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'normal', value: 'normal', name: 'normal' },
        { id: 'break-all', value: 'break-all', name: 'break-all' },
        { id: 'keep-all', value: 'keep-all', name: 'keep-all' },
        { id: 'break-word', value: 'break-word', name: 'break-word' },
      ],
      info: 'The word-break CSS property sets whether line breaks appear wherever the text would otherwise overflow its content box.',
    }, { at: 7 })
    editor.StyleManager.addProperty('typography', {
      name: 'Word wrap',
      property: 'word-wrap',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'normal', value: 'normal', name: 'normal' },
        { id: 'break-word', value: 'break-word', name: 'break-word' },
      ],
      info: 'The word-wrap CSS property sets whether the line may be broken within a word in order to prevent overflow when an otherwise unbreakable string is too long to fit in its containing box.',
    }, { at: 8 })
    editor.StyleManager.addProperty('typography', {
      name: 'White space',
      property: 'white-space',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'normal', value: 'normal', name: 'normal' },
        { id: 'nowrap', value: 'nowrap', name: 'nowrap' },
        { id: 'pre', value: 'pre', name: 'pre' },
        { id: 'pre-wrap', value: 'pre-wrap', name: 'pre-wrap' },
        { id: 'pre-line', value: 'pre-line', name: 'pre-line' },
        { id: 'break-spaces', value: 'break-spaces', name: 'break-spaces' },
      ],
      info: 'The white-space CSS property sets how white space inside an element is handled.',
    }, { at: 9 })
    editor.StyleManager.addProperty('typography', {
      name: 'Text decoration',
      property: 'text-decoration',
      type: 'composite',
      properties: [{
        name: 'Text decoration line',
        property: 'text-decoration-line',
        type: 'select',
        defaults: '',
        fixedValues: ['auto', 'inherit', 'initial', 'revert', 'unset'],
        options: [
          { id: '', value: '', name: '' },
          { id: 'none', value: 'none', name: 'none' },
          { id: 'underline', value: 'underline', name: 'underline' },
          { id: 'overline', value: 'overline', name: 'overline' },
          { id: 'line-through', value: 'line-through', name: 'line-through' },
          { id: 'blink', value: 'blink', name: 'blink' },
        ],
        info: 'The text-decoration CSS property sets the appearance of decorative lines on text.',
      }, {
        name: 'Text decoration style',
        property: 'text-decoration-style',
        type: 'select',
        defaults: '',
        options: [
          { id: '', value: '', name: '' },
          { id: 'solid', value: 'solid', name: 'solid' },
          { id: 'double', value: 'double', name: 'double' },
          { id: 'dotted', value: 'dotted', name: 'dotted' },
          { id: 'dashed', value: 'dashed', name: 'dashed' },
          { id: 'wavy', value: 'wavy', name: 'wavy' },
        ],
        info: 'The text-decoration-style CSS property sets the style of the lines specified by text-decoration-line. The style applies to all lines, there is no way to define different styles for each of the lines.',
      }, {
        name: 'Text decoration color',
        property: 'text-decoration-color',
        type: 'color',
        defaults: '',
        fixedValues: ['inherit', 'initial', 'revert', 'unset'],
        info: 'The text-decoration-color CSS property sets the color of decorations added to text by text-decoration-line.',
      }, {
        name: 'Text decoration thickness',
        property: 'text-decoration-thickness',
        type: 'integer',
        units: ['px', '%', 'em'],
        info: 'The text-decoration-thickness CSS property sets the stroke thickness of the decoration line that is used on text in an element, such as a line-through, underline, or overline.',
        default: '',
        fixedValues: ['auto', 'inherit', 'initial', 'revert', 'unset'],
      }],
    }, { at: 10 })
    editor.StyleManager.addProperty('typography', {
      name: 'Text transform',
      property: 'text-transform',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'none', value: 'none', name: 'none' },
        { id: 'capitalize', value: 'capitalize', name: 'capitalize' },
        { id: 'uppercase', value: 'uppercase', name: 'uppercase' },
        { id: 'lowercase', value: 'lowercase', name: 'lowercase' },
      ],
      info: 'The text-transform CSS property sets how to capitalize an element\'s text. It can be used to make text appear in all-uppercase or all-lowercase, or with each word capitalized.',
    }, { at: 11 })
    editor.StyleManager.addProperty('typography', {
      name: 'Text overflow',
      property: 'text-overflow',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'clip', value: 'clip', name: 'clip' },
        { id: 'ellipsis', value: 'ellipsis', name: 'ellipsis' },
        { id: 'inherit', value: 'inherit', name: 'inherit' },
        { id: 'initial', value: 'initial', name: 'initial' },
        { id: 'unset', value: 'unset', name: 'unset' },
      ],
      info: 'The text-overflow CSS property sets how hidden overflow content is signaled to users. It can be clipped, display an ellipsis (\'…\', U+2026 HORIZONTAL ELLIPSIS) or a Web author-defined string. It covers the two long-hand properties text-overflow-clip and text-overflow-string.',
    }, { at: 12 })
    /***************/
    /* Decorations */
    /***************/
    editor.StyleManager.removeProperty('decorations', 'background-color')
    editor.StyleManager.addProperty('decorations', {
      name: 'Background color',
      property: 'background-color',
      type: 'color',
      default: '',
      full: true,
    }, { at: 0 })
    editor.StyleManager.removeProperty('decorations', 'border-radius')
    editor.StyleManager.addProperty('decorations', {
      name: 'Border radius',
      property: 'border-radius',
      type: 'composite',
      defaults: '',
      fixedValues: [ 'initial', 'inherit', 'auto' ],
      full: true,
      properties: [{
        property: 'border-top-left-radius',
        name: 'Top left',
        type: 'number',
        default: '',
        fixedValues: [ 'initial', 'inherit', 'auto' ],
        units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      }, {
        property: 'border-top-right-radius',
        name: 'Top right',
        type: 'number',
        default: '',
        fixedValues: [ 'initial', 'inherit', 'auto' ],
        units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      }, {
        property: 'border-bottom-right-radius',
        name: 'Bottom right',
        type: 'number',
        default: '',
        fixedValues: [ 'initial', 'inherit', 'auto' ],
        units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      }, {
        property: 'border-bottom-left-radius',
        name: 'Bottom left',
        type: 'number',
        default: '',
        fixedValues: [ 'initial', 'inherit', 'auto' ],
        units: [ 'px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax' ],
      }],
    }, { at: 2 })

    editor.StyleManager.addProperty('decorations', {
      name: 'Outline',
      property: 'outline',
      type: 'composite',
      properties: [{
        name: 'Outline width',
        property: 'outline-width',
        type: 'integer',
        units: ['px', '%', 'em'],
        info: 'The outline-width CSS property sets the thickness of an element\'s outline. An outline is a line that is drawn around an element, outside the border.',
        default: '',
        fixedValues: ['medium', 'thin', 'thick', 'inherit', 'initial', 'revert', 'unset'],
      }, {
        name: 'Outline style',
        property: 'outline-style',
        type: 'select',
        defaults: '',
        options: [
          { id: '', value: '', name: '' },
          { id: 'none', value: 'none', name: 'none' },
          { id: 'hidden', value: 'hidden', name: 'hidden' },
          { id: 'dotted', value: 'dotted', name: 'dotted' },
          { id: 'dashed', value: 'dashed', name: 'dashed' },
          { id: 'solid', value: 'solid', name: 'solid' },
          { id: 'double', value: 'double', name: 'double' },
          { id: 'groove', value: 'groove', name: 'groove' },
          { id: 'ridge', value: 'ridge', name: 'ridge' },
          { id: 'inset', value: 'inset', name: 'inset' },
          { id: 'outset', value: 'outset', name: 'outset' },
        ],
        info: 'The outline-style CSS property sets the style of an element\'s outline. An outline is a line that is drawn around an element, outside the border.',
      }, {
        name: 'Outline color',
        property: 'outline-color',
        type: 'color',
        defaults: '',
        info: 'The outline-color CSS property sets the color of an element\'s outline.',
      }],
    }, { at: 8 })
    /***************/
    /* Extra       */
    /***************/
    editor.StyleManager.addProperty('extra', {
      name: 'Z index',
      property: 'z-index',
      type: 'slider',
      step: 1,
      min: -10000,
      max: 10000,
      units: [],
      info: 'Stacking order of the element',
      default: '',
      fixedValues: ['auto', 'unset', 'initial', 'inherit', 'revert'],
    }, { at: 1 })
    editor.StyleManager.addProperty('extra', {
      name: 'Pointer events',
      property: 'pointer-events',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'auto', value: 'auto', name: 'auto' },
        { id: 'none', value: 'none', name: 'none' },
        { id: 'visiblePainted', value: 'visiblePainted', name: 'visiblePainted' },
        { id: 'visibleFill', value: 'visibleFill', name: 'visibleFill' },
        { id: 'visibleStroke', value: 'visibleStroke', name: 'visibleStroke' },
        { id: 'visible', value: 'visible', name: 'visible' },
        { id: 'painted', value: 'painted', name: 'painted' },
        { id: 'fill', value: 'fill', name: 'fill' },
        { id: 'stroke', value: 'stroke', name: 'stroke' },
        { id: 'all', value: 'all', name: 'all' },
        { id: 'inherit', value: 'inherit', name: 'inherit' },
        { id: 'initial', value: 'initial', name: 'initial' },
        { id: 'unset', value: 'unset', name: 'unset' },
      ],
      info: 'The pointer-events CSS property sets under what circumstances (if any) a particular graphic element can become the target of pointer events.',
    }, { at: 2 })
    editor.StyleManager.addProperty('extra', {
      name: 'Cursor',
      property: 'cursor',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'auto', value: 'auto', name: 'auto' },
        { id: 'default', value: 'default', name: 'default' },
        { id: 'none', value: 'none', name: 'none' },
        { id: 'context-menu', value: 'context-menu', name: 'context-menu' },
        { id: 'help', value: 'help', name: 'help' },
        { id: 'pointer', value: 'pointer', name: 'pointer' },
        { id: 'progress', value: 'progress', name: 'progress' },
        { id: 'wait', value: 'wait', name: 'wait' },
        { id: 'cell', value: 'cell', name: 'cell' },
        { id: 'crosshair', value: 'crosshair', name: 'crosshair' },
        { id: 'text', value: 'text', name: 'text' },
        { id: 'vertical-text', value: 'vertical-text', name: 'vertical-text' },
        { id: 'alias', value: 'alias', name: 'alias' },
        { id: 'copy', value: 'copy', name: 'copy' },
        { id: 'move', value: 'move', name: 'move' },
        { id: 'no-drop', value: 'no-drop', name: 'no-drop' },
        { id: 'not-allowed', value: 'not-allowed', name: 'not-allowed' },
        { id: 'grab', value: 'grab', name: 'grab' },
        { id: 'grabbing', value: 'grabbing', name: 'grabbing' },
        { id: 'all-scroll', value: 'all-scroll', name: 'all-scroll' },
        { id: 'col-resize', value: 'col-resize', name: 'col-resize' },
        { id: 'row-resize', value: 'row-resize', name: 'row-resize' },
        { id: 'n-resize', value: 'n-resize', name: 'n-resize' },
        { id: 'e-resize', value: 'e-resize', name: 'e-resize' },
        { id: 's-resize', value: 's-resize', name: 's-resize' },
        { id: 'w-resize', value: 'w-resize', name: 'w-resize' },
        { id: 'ne-resize', value: 'ne-resize', name: 'ne-resize' },
        { id: 'nw-resize', value: 'nw-resize', name: 'nw-resize' },
        { id: 'se-resize', value: 'se-resize', name: 'se-resize' },
        { id: 'sw-resize', value: 'sw-resize', name: 'sw-resize' },
        { id: 'ew-resize', value: 'ew-resize', name: 'ew-resize' },
        { id: 'ns-resize', value: 'ns-resize', name: 'ns-resize' },
        { id: 'nesw-resize', value: 'nesw-resize', name: 'nesw-resize' },
        { id: 'nwse-resize', value: 'nwse-resize', name: 'nwse-resize' },
        { id: 'zoom-in', value: 'zoom-in', name: 'zoom-in' },
        { id: 'zoom-out', value: 'zoom-out', name: 'zoom-out' },
      ],
      info: 'The cursor CSS property sets the type of mouse cursor, if any, to show when the mouse pointer is over an element.',
    }, { at: 3 })
    editor.StyleManager.addProperty('extra', {
      name: 'Column count',
      property: 'column-count',
      type: 'integer',
      units: [],
      info: 'The column-count CSS property breaks an element\'s content into the specified number of columns.',
      default: '',
      fixedValues: ['auto', 'inherit', 'initial', 'revert', 'unset'],
      min: 1,
    }, { at: 4 })
    editor.StyleManager.addProperty('extra', {
      name: 'Column width',
      property: 'column-width',
      type: 'integer',
      units: ['px', '%', 'em'],
      info: 'The column-width CSS property suggests an optimal column width. This is not an absolute value but a mere hint. Browser will adjust the width of the element automatically.',
      default: '',
      fixedValues: ['auto', 'inherit', 'initial', 'revert', 'unset'],
    }, { at: 5 })
    editor.StyleManager.addProperty('extra', {
      name: 'Column gap',
      property: 'column-gap',
      type: 'integer',
      units: ['px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax'],
      info: 'The column-gap CSS property sets the size of the gap (gutter) between an element\'s columns.',
      default: '',
      fixedValues: ['normal', 'inherit', 'initial', 'revert', 'unset'],
    }, { at: 6 })
    editor.StyleManager.addProperty('extra', {
      name: 'Row Gap',
      property: 'row-gap',
      type: 'integer',
      units: ['px', '%', 'em', 'rem', 'vh', 'vw', 'cqi', 'cqb', 'cqw', 'cqh', 'cqmin', 'cqmax'],
      info: 'The row-gap CSS property sets the size of the gap (gutter) between an element\'s rows.',
      default: '',
      fixedValues: ['normal', 'inherit', 'initial', 'revert', 'unset'],
    }, { at: 7 })
    editor.StyleManager.addProperty('extra', {
      name: 'Column rule',
      property: 'column-rule',
      type: 'composite',
      properties: [{
        name: 'Column rule width',
        property: 'column-rule-width',
        type: 'integer',
        units: ['px', '%', 'em'],
        info: 'The column-rule-width CSS property sets the width of the line drawn between columns in a multi-column layout.',
        default: '',
        fixedValues: ['medium', 'thin', 'thick', 'inherit', 'initial', 'revert', 'unset'],
      }, {
        name: 'Column rule style',
        property: 'column-rule-style',
        type: 'select',
        defaults: '',
        options: [
          { id: '', value: '', name: '' },
          { id: 'none', value: 'none', name: 'none' },
          { id: 'hidden', value: 'hidden', name: 'hidden' },
          { id: 'dotted', value: 'dotted', name: 'dotted' },
          { id: 'dashed', value: 'dashed', name: 'dashed' },
          { id: 'solid', value: 'solid', name: 'solid' },
          { id: 'double', value: 'double', name: 'double' },
          { id: 'groove', value: 'groove', name: 'groove' },
          { id: 'ridge', value: 'ridge', name: 'ridge' },
          { id: 'inset', value: 'inset', name: 'inset' },
          { id: 'outset', value: 'outset', name: 'outset' },
          { id: 'inherit', value: 'inherit', name: 'inherit' },
        ],
        info: 'The column-rule-style CSS property sets the style of the line drawn between columns in a multi-column layout.',
      }, {
        name: 'Column rule color',
        property: 'column-rule-color',
        type: 'color',
        defaults: '',
        info: 'The column-rule-color CSS property sets the color of the line drawn between columns in a multi-column layout.',
      }],
    }, { at: 8 })
    editor.StyleManager.addProperty('extra', {
      name: 'Column span',
      property: 'column-span',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'none', value: 'none', name: 'none' },
        { id: 'all', value: 'all', name: 'all' },
      ],
      info: 'The column-span CSS property makes it possible for an element to span across all columns when its value is set to all.',
    }, { at: 9 })
    editor.StyleManager.addProperty('extra', {
      name: 'Scroll Behavior',
      property: 'scroll-behavior',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'auto', value: 'auto', name: 'auto' },
        { id: 'smooth', value: 'smooth', name: 'smooth' }
      ],
      info: 'Sets smooth or auto scroll behavior.',
    }, { at: 10 })
    editor.StyleManager.addProperty('extra', {
      name: 'Scroll Snap Type',
      property: 'scroll-snap-type',
      type: 'composite',
      properties: [{
        name: 'Direction',
        property: 'scroll-snap-type-direction',
        type: 'select',
        defaults: '',
        options: [
          { id: '', value: '', name: '' },
          { id: 'none', value: 'none', name: 'none' },
          { id: 'x', value: 'x', name: 'x' },
          { id: 'y', value: 'y', name: 'y' },
          { id: 'block', value: 'block', name: 'block' },
          { id: 'inline', value: 'inline', name: 'inline' },
          { id: 'both', value: 'both', name: 'both' },
        ],
      }, {
        name: 'Mode',
        property: 'scroll-snap-type-mode',
        type: 'select',
        defaults: '',
        options: [
          { id: '', value: '', name: '' },
          { id: 'proximity', value: 'proximity', name: 'proximity' },
          { id: 'mandatory', value: 'mandatory', name: 'mandatory' },
        ],
      }],
      info: 'The scroll-snap-type CSS property sets the direction and mode of enforced snap points on the scroll container.',
    }, { at: 11 })
    editor.StyleManager.addProperty('extra', {
      name: 'Scroll Padding',
      property: 'scroll-padding',
      type: 'integer',
      defaults: '',
      units: ['px', 'em', 'rem', '%'],
      info: 'Defines offsets for scroll snapping.',
    }, { at: 12 })
    editor.StyleManager.addProperty('extra', {
      name: 'Scroll Snap Align',
      property: 'scroll-snap-align',
      type: 'select',
      defaults: '',
      options: [
        { id: '', value: '', name: '' },
        { id: 'none', value: 'none', name: 'none' },
        { id: 'start', value: 'start', name: 'start' },
        { id: 'end', value: 'end', name: 'end' },
        { id: 'center', value: 'center', name: 'center' },
      ],
      info: 'Aligns elements to scroll snaps.',
    }, { at: 13 })

    editor.SelectorManager.states.add({name: 'before', label: 'Before'})
    editor.SelectorManager.states.add({name: 'after', label: 'After'})
    editor.SelectorManager.states.add({name: 'active', label: 'Active'})
    editor.SelectorManager.states.add({name: 'first-child', label: 'First child'})
    editor.SelectorManager.states.add({name: 'last-child', label: 'Last child'})
    editor.SelectorManager.states.add({name: 'focus', label: 'Focus'})
    editor.SelectorManager.states.add({name: 'visited', label: 'Visited'})
    editor.SelectorManager.states.add({name: 'link', label: 'Link'})
    editor.SelectorManager.states.add({name: 'first-letter', label: 'First letter'})
    editor.SelectorManager.states.add({name: 'first-line', label: 'First line'})
    editor.SelectorManager.states.add({name: 'selection', label: 'Selection'})
    editor.SelectorManager.states.add({name: 'empty', label: 'Empty'})
    editor.SelectorManager.states.add({name: 'enabled', label: 'Enabled'})
    editor.SelectorManager.states.add({name: 'disabled', label: 'Disabled'})
    editor.SelectorManager.states.add({name: 'checked', label: 'Checked'})
    editor.SelectorManager.states.add({name: 'indeterminate', label: 'Indeterminate'})
    editor.SelectorManager.states.add({name: 'placeholder-shown', label: 'Placeholder shown'})
    editor.SelectorManager.states.add({name: 'placeholder', label: 'Placeholder'})
    editor.SelectorManager.states.add({name: 'default', label: 'Default'})
    editor.SelectorManager.states.add({name: 'valid', label: 'Valid'})
    editor.SelectorManager.states.add({name: 'invalid', label: 'Invalid'})
    editor.SelectorManager.states.add({name: 'in-range', label: 'In range'})
    editor.SelectorManager.states.add({name: 'out-of-range', label: 'Out of range'})
    editor.SelectorManager.states.add({name: 'required', label: 'Required'})
    editor.SelectorManager.states.add({name: 'optional', label: 'Optional'})
    editor.SelectorManager.states.add({name: 'read-only', label: 'Read only'})
    editor.SelectorManager.states.add({name: 'read-write', label: 'Read write'})
  })
}
