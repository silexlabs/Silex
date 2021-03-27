import {
  ELEM_HTML,
  ELEM_TEXT,
  PAGE1,
  mockUiElements
} from '../../test-utils/data-set'

const { siteIFrame } = mockUiElements()
jest.doMock('../components/SiteFrame', () => ({
  getSiteDocument: () => siteIFrame.contentDocument,
}))

const writeDataToDom = jest.fn()
jest.doMock('../store/dom', () => ({
  writeDataToDom,
}))

import { onDeletePages } from './observer'

const dispatch = jest.fn()

import { ElementState } from '../element-store/types'
import { PageState } from './types'
import { onUpdatePages } from './observer'

const PAGE1_STATE = PAGE1 as any as PageState
const ELEM_TEXT_STATE = {
  ...ELEM_TEXT,
  pageNames: [PAGE1_STATE.id],
} as any as ElementState
const ELEM_HTML_STATE = {
  ...ELEM_HTML,
  link: PAGE1_STATE.link,
} as any as ElementState

const innerHtml = `
  <a href="not-important">Page 3</a>
  <a href="${ PAGE1_STATE.link.href }">Page 3</a>
  <a href="${ PAGE1_STATE.link.href }#anchor">Page 3</a>
`

const textHtml = `
  <div data-silex-id="${ELEM_TEXT_STATE.id}" class="editable-style ${ELEM_TEXT_STATE.id} text-element" title="${ELEM_TEXT_STATE.title}">
  <div class="silex-element-content normal">${ innerHtml }</div>
  </div>
`

async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

beforeEach(() => {
  jest.resetAllMocks()
})

test('page rename, no elements to update', async () => {
  onUpdatePages([], [], dispatch)
  await timeout(10)
  expect(dispatch).toHaveBeenCalledTimes(0)
  expect(writeDataToDom).toHaveBeenCalledTimes(1)

  onUpdatePages([{
    from: PAGE1_STATE,
    to: PAGE1_STATE,
  }], [ELEM_TEXT_STATE], dispatch)
  await timeout(10)
  expect(dispatch).toHaveBeenCalledTimes(0)
})

test('page rename, update elements visibility', async () => {
  onUpdatePages([{
    from: PAGE1_STATE,
    to: {
      ...PAGE1_STATE,
      link: {
        ...PAGE1_STATE.link,
        href: '#!new-page-id',
      }
    },
  }], [ELEM_TEXT_STATE], dispatch)
  await timeout(10)
  expect(dispatch).toHaveBeenCalledTimes(1)
})

test('page rename, update elements links', async () => {
  onUpdatePages([{
    from: PAGE1_STATE,
    to: {
      ...PAGE1_STATE,
      link: {
        ...PAGE1_STATE.link,
        href: '#!new-page-id',
      }
    },
  }], [ELEM_HTML_STATE], dispatch)
  await timeout(10)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
    items: [expect.objectContaining({
      id: ELEM_HTML_STATE.id,
    })]
  }))
})

test('page delete, update elements visibility', async () => {
  siteIFrame.contentDocument.body.innerHTML = textHtml
  onDeletePages([PAGE1_STATE], true, [{
    ...ELEM_TEXT_STATE,
    pageNames: ELEM_TEXT_STATE.pageNames.concat('fake-page'),
  }], dispatch)
  await timeout(10)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
    items: [expect.objectContaining({
      id: ELEM_TEXT_STATE.id,
    })]
  }))
})

test('page rename, update dom', async () => {
  const ELEM_STATE = {
    ...ELEM_TEXT,
    pageNames: [],
    link: null,
    innerHtml,
  } as any as ElementState
  siteIFrame.contentDocument.body.innerHTML = textHtml
  onUpdatePages([{
    from: PAGE1_STATE,
    to: {
      ...PAGE1_STATE,
      link: {
        ...PAGE1_STATE.link,
        href: '#!new-page-id',
      }
    },
  }], [ELEM_STATE], dispatch)
  await timeout(10)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith({
    type: 'ELEMENT_UPDATE',
    items: [{
      ...ELEM_STATE,
      innerHtml: `
  <a href="not-important">Page 3</a>
  <a href="#!new-page-id">Page 3</a>
  <a href="#!new-page-id#anchor">Page 3</a>
`,
    }]
  })
})
