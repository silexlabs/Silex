import {
  ELEM_HTML,
  ELEM_TEXT,
  PAGE1,
  mockUiElements
} from '../../test-utils/data-set'
import { LinkType } from '../element-store/types'

const { siteIFrame } = mockUiElements()
jest.doMock('../components/SiteFrame', () => ({
  getSiteDocument: () => siteIFrame.contentDocument,
}))

const writeDataToDom = jest.fn()
jest.doMock('../store/dom', () => ({
  writeDataToDom,
}))

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

async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

beforeEach(() => {
  jest.resetAllMocks()
})

test('page rename, no elements to update', async () => {
  onUpdatePages([], [], dispatch)
  await timeout(100)
  expect(dispatch).toHaveBeenCalledTimes(0)
  expect(writeDataToDom).toHaveBeenCalledTimes(1)

  onUpdatePages([{
    from: PAGE1_STATE,
    to: PAGE1_STATE,
  }], [ELEM_TEXT_STATE], dispatch)
  await timeout(100)
  expect(dispatch).toHaveBeenCalledTimes(0)
})

test('page rename, update elements visibility', async () => {
  onUpdatePages([{
    from: PAGE1_STATE,
    to: {
      ...PAGE1_STATE,
      link: {
        ...PAGE1_STATE.link,
        value: '#!new-page-id',
      }
    },
  }], [ELEM_TEXT_STATE], dispatch)
  await timeout(100)
  expect(dispatch).toHaveBeenCalledTimes(1)
})

test('page rename, update elements links', async () => {
  onUpdatePages([{
    from: PAGE1_STATE,
    to: {
      ...PAGE1_STATE,
      link: {
        ...PAGE1_STATE.link,
        value: '#!new-page-id',
      }
    },
  }], [ELEM_HTML_STATE], dispatch)
  await timeout(100)
  expect(dispatch).toHaveBeenCalledTimes(1)
})

test('page rename, update dom', async () => {
  const innerHtml = `
    <a href="not-important">Page 3</a>
    <a href="${ PAGE1_STATE.link.value }">Page 3</a>
    <a href="${ PAGE1_STATE.link.value }#anchor">Page 3</a>
  `
  const textHtml = `
    <div data-silex-id="${ELEM_TEXT_STATE.id}" class="editable-style ${ELEM_TEXT_STATE.id} text-element" title="${ELEM_TEXT_STATE.title}">
    <div class="silex-element-content normal">${ innerHtml }</div>
    </div>
  `
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
        value: '#!new-page-id',
      }
    },
  }], [ELEM_STATE], dispatch)
  await timeout(100)
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
