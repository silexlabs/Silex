import { ELEM_CONTAINER, ELEM_TEXT } from '../../../test-utils/data-set'
import { ElementState } from '../../element-store/types'
import { StyleDataObject } from '../../site-store/types'
import { initStyle, removeStyle } from '../../site-store/dispatchers'

jest.mock('../../element-store/component', () => ({
  getComponentsDef: jest.fn(),
  openStyleEditor: jest.fn(),
}))
import { getComponentsDef } from '../../element-store/component'
import { StyleEditorPane } from './StyleEditorPane'

// import { getSite } from '../../site-store/index'
// jest.mock('../../site-store/index', () => ({
//   getSite: jest.fn(),
// }))

// import { getElements } from '../../element-store/index'
// jest.mock('../../element-store/index', () => ({
//   subscribeElements: jest.fn(),
//   updateElements: jest.fn(),
//   getElements: jest.fn(),
// }))

jest.mock('../../site-store/dispatchers', () => ({
  removeStyle: jest.fn(),
  initStyle: jest.fn(),
}))

jest.spyOn(HTMLElement.prototype, 'querySelector').mockImplementation(function() {
  const el = document.createElement('div')
  this.appendChild(el)
  return el
})

const STYLES = {
  'test-style': {
    className: 'test-style',
    displayName: 'Test Style',
    templateName: 'text',
    styles: {},
  }
} as StyleDataObject

const STYLES2 = {
  ...STYLES,
  'new-test-style': {
    className: 'new-test-style',
    displayName: 'New Test Style',
    templateName: 'text',
    styles: {},
  }
} as StyleDataObject

const ELEM_TEXT_STATE = {
  ...ELEM_TEXT,
  selected: true,
} as ElementState
const BODY_STATE = ELEM_CONTAINER as ElementState

const componentsDef = {
  'text': {
    'props': [
      {
        'name': 'TextStyle',
        'type': 'template',
        'extends': 'ElementStyle',
        'props': [
          {
            'name': 'font-family',
            'default': '',
            'type': 'component'
          },
        ]
      },
      {
        'name': 'All',
        'displayName': 'Editing style for all texts (P, A, UL, H1, H2...)',
        'type': 'TextStyle',
        'className': 'style-editor-text'
      },
      {
        'name': 'Paragraph',
        'displayName': 'Editing style of paragraphs (P)',
        'type': 'TextStyle',
        'className': 'style-editor-text'
      },
      {
        'name': 'Link',
        'displayName': 'Editing style of links (A)',
        'type': 'TextStyle',
        'className': 'style-editor-text'
      },
      {
        'name': 'Active',
        'displayName': 'Editing style of actives (A:active)',
        'type': 'TextStyle',
        'className': 'style-editor-text'
      },
      {
        'name': 'UnorderedList',
        'displayName': 'Editing style of unordered lists (UL)',
        'type': 'ListStyle',
        'className': 'style-editor-text'
      },
      {
        'name': 'OrderedList',
        'displayName': 'Editing style of ordered lists (OL)',
        'type': 'ListStyle',
        'className': 'style-editor-text'
      },
      {
        'name': 'Heading1',
        'displayName': 'Editing style of heading 1 (H1)',
        'type': 'TextStyle',
        'className': 'style-editor-text'
      },
      {
        'name': 'Heading2',
        'displayName': 'Editing style of heading 2 (H2)',
        'type': 'TextStyle',
        'className': 'style-editor-text'
      },
      {
        'name': 'Heading3',
        'displayName': 'Editing style of heading 3 (H3)',
        'type': 'TextStyle',
        'className': 'style-editor-text'
      },
      {
        'name': 'Bold',
        'displayName': 'Editing style of bolds (B)',
        'type': 'TextStyle',
        'className': 'style-editor-text'
      },
      {
        'name': 'Underline',
        'displayName': 'Editing style of underlines (U)',
        'type': 'TextStyle',
        'className': 'style-editor-text'
      },
      {
        'name': 'Italic',
        'displayName': 'Editing style of italics (I)',
        'type': 'TextStyle',
        'className': 'style-editor-text'
      },
      {
        'name': 'Element',
        'displayName': 'Editing style for selected elements',
        'type': 'ElementStyle',
        'className': 'style-editor-tag-notext'
      },
      {
        'name': 'className',
        'type': 'string',
        'readonly': true
      },
      {
        'name': 'pseudoClass',
        'type': [
          'normal',
          ':hover',
          ':active',
          ':first-child',
          ':last-child',
          ':nth-child(even)',
          ':nth-child(odd)',
          '::first-letter',
          '::first-line'
        ],
        'readonly': true,
        'default': 'normal'
      }
    ],
    'rootPath': './prodotype/styles'
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('create style', () => {
  (getComponentsDef as any).mockReturnValue(componentsDef)
  const dispatch = jest.fn()
  const pane = new StyleEditorPane(document.body)
  pane.doCreateStyle({
    name: 'Test Style',
  }, STYLES, [ELEM_TEXT_STATE, BODY_STATE], dispatch)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith({
    items: [{
      ...ELEM_TEXT_STATE,
      classList: ['style-test-style'],
    }],
    type: 'ELEMENT_UPDATE',
  })
  expect(initStyle).toHaveBeenCalledTimes(1)
  expect(initStyle).toHaveBeenCalledWith('Test Style', 'style-test-style', undefined)
  // expect(pane.styleCombo.innerHTML).toContain('test-style')
})

test('delete style', () => {
  const pane = new StyleEditorPane(document.body)
  pane.deleteStyle('test-style', false)
  expect(removeStyle).toHaveBeenCalledTimes(1)
})

test('rename style', () => {
  const dispatch = jest.fn()
  const pane = new StyleEditorPane(document.body)
  pane.doRenameStyle('test-style', 'new-test-style', STYLES, [{
    ...ELEM_TEXT_STATE,
    classList: ['test-style'],
  }, BODY_STATE], dispatch)
  expect(initStyle).toHaveBeenCalledTimes(0) // initStyle is called in renameStyle before the call to doRenameStyle
  expect(removeStyle).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith({
    type: 'ELEMENT_UPDATE',
    items: [{
      ...ELEM_TEXT_STATE,
      classList: ['style-new-test-style'],
    }],
  })
})

test('rename style with 2 elements with this style', () => {
  const dispatch = jest.fn()
  const pane = new StyleEditorPane(document.body)
  pane.doRenameStyle('test-style', 'new-test-style', STYLES, [{
    ...ELEM_TEXT_STATE,
    classList: ['test-style'],
  }, {
    ...BODY_STATE,
    classList: ['test-style'],
  }], dispatch)
  expect(initStyle).toHaveBeenCalledTimes(0) // initStyle is called in renameStyle before the call to doRenameStyle
  expect(removeStyle).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith({
    type: 'ELEMENT_UPDATE',
    items: [{
      ...ELEM_TEXT_STATE,
      classList: ['style-new-test-style'],
    }, {
      ...BODY_STATE,
      classList: ['style-new-test-style'],
    }],
  })
})

test('apply style to element', () => {
  const dispatch = jest.fn()
  const pane = new StyleEditorPane(document.body)
  pane.doApplyStyle([ELEM_TEXT_STATE], 'test-style', STYLES, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith({
    type: 'ELEMENT_UPDATE',
    items: [{
      ...ELEM_TEXT_STATE,
      classList: ['test-style'],
    }],
  })
})

test('apply style to element which already has this style', () => {
  const dispatch = jest.fn()
  const pane = new StyleEditorPane(document.body)
  pane.doApplyStyle([{
    ...ELEM_TEXT_STATE,
    classList: ['test-style'],
  }], 'test-style', STYLES, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith({
    type: 'ELEMENT_UPDATE',
    items: [{
      ...ELEM_TEXT_STATE,
      classList: ['test-style'],
    }],
  })
})

test('apply style to element with a style', () => {
  const dispatch = jest.fn()
  const pane = new StyleEditorPane(document.body)
  pane.doApplyStyle([{
    ...ELEM_TEXT_STATE,
    classList: ['test-style'],
  }], 'new-test-style', STYLES2, dispatch)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith({
    type: 'ELEMENT_UPDATE',
    items: [{
      ...ELEM_TEXT_STATE,
      classList: ['new-test-style'],
    }],
  })
})
