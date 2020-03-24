const iframe: HTMLIFrameElement = document.createElement('iframe')
document.body.appendChild(iframe)

import { initializeSite_, initializeSite } from './store'
import { SITE1 } from '../../../__tests__/data-set';
import { onChangeSite } from './observer'
import { createStore } from 'redux'
import { State } from '../flux/store'
import { Store } from 'redux'

jest.mock('../ui/UiElements', () => ({
  getSiteDocument: () => iframe.contentDocument,
  getSiteWindow: () => iframe.contentWindow,
  getUiElements: () => ({
    stage: iframe,
    fileExplorer: iframe.contentDocument.body,
    contextMenu: iframe.contentDocument.body,
    menu: iframe.contentDocument.body,
    breadCrumbs: iframe.contentDocument.body,
    pageTool: iframe.contentDocument.body,
    htmlEditor: iframe.contentDocument.body,
    cssEditor: iframe.contentDocument.body,
    jsEditor: iframe.contentDocument.body,
    settingsDialog: iframe.contentDocument.body,
    dashboard: iframe.contentDocument.body,
    propertyTool: iframe.contentDocument.body,
    textFormatBar: iframe.contentDocument.body,
    workspace: iframe.contentDocument.body,
    verticalSplitter: iframe.contentDocument.body,
  }),
}))

const store: Store<State> = createStore((oldState, newState) => {
  // console.log('store', oldState, newState)
})

const dependenciesString = `
  <script data-dependency="" src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
  <link data-dependency="" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/unslider/2.0.3/css/unslider.css">
`
const styleString = `
  <style class="silex-prodotype-style" type="text/css" data-style-id="all-style">.text-element > .silex-element-content {font-family: 'Roboto', sans-serif;}</style>
`

beforeEach(() => {
  iframe.contentDocument.write('')
  initializeSite_(store, SITE1)
})

// //////////////////////////
// dependencies

test('add prodotype dependencies', () => {
  expect(iframe.contentDocument.head.querySelectorAll('[data-dependency]')).toHaveLength(0)
  onChangeSite(null, SITE1)
  expect(iframe.contentDocument.head.querySelectorAll('[data-dependency]')).toHaveLength(2)
})

test('add 0 prodotype dependencies', () => {
  // has 0 dependency and update with 0
  onChangeSite(null, {
    ...SITE1,
    prodotypeDependencies: {},
  })
  expect(iframe.contentDocument.head.querySelectorAll('[data-dependency]')).toHaveLength(0)

  // already has all dependencies
  iframe.contentDocument.head.innerHTML = dependenciesString
  expect(iframe.contentDocument.head.querySelectorAll('[data-dependency]')).toHaveLength(2)
  onChangeSite(null, SITE1)
  expect(iframe.contentDocument.head.querySelectorAll('[data-dependency]')).toHaveLength(2)
})

test('remove 2 prodotype dependencies', () => {
  iframe.contentDocument.head.innerHTML = dependenciesString
  expect(iframe.contentDocument.head.querySelectorAll('[data-dependency]')).toHaveLength(2)
  onChangeSite(null, {
    ...SITE1,
    prodotypeDependencies: {},
  })
  expect(iframe.contentDocument.head.querySelectorAll('[data-dependency]')).toHaveLength(0)
})

// //////////////////////////
// styles

test('add a style', () => {
  expect(iframe.contentDocument.head.querySelectorAll('[data-style-id]')).toHaveLength(0)
  onChangeSite(null, SITE1)
  expect(iframe.contentDocument.head.querySelectorAll('[data-style-id]')).toHaveLength(1)
})

test('add 0 styles', () => {
  // there was no styles and there will be no styles
  onChangeSite(null, {
    ...SITE1,
    style: {},
  })
  expect(iframe.contentDocument.head.querySelectorAll('[data-style-id]')).toHaveLength(0)
  // already has the styles
  iframe.contentDocument.head.innerHTML = styleString
  expect(iframe.contentDocument.head.querySelectorAll('[data-style-id]')).toHaveLength(1)
  onChangeSite(null, SITE1)
  expect(iframe.contentDocument.head.querySelectorAll('[data-style-id]')).toHaveLength(1)
})


test('remove style', () => {
  iframe.contentDocument.head.innerHTML = dependenciesString
  expect(iframe.contentDocument.head.querySelectorAll('[data-style-id]')).toHaveLength(1)
  onChangeSite(null, {
    ...SITE1,
    style: {},
  })
  expect(iframe.contentDocument.head.querySelectorAll('[data-style-id]')).toHaveLength(0)
})
