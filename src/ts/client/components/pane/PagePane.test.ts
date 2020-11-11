import {
  ELEM_HTML,
  ELEM_SECTION,
  ELEM_SECTION_CONTENT,
  ELEM_TEXT,
  PAGE1
} from '../../../test-utils/data-set'
import { ElementData, LinkType } from '../../element-store/types'
import { LOADING } from '../../ui-store/types'
import { PagePane } from './PagePane'
import { PageState } from '../../page-store/types'
import { fromData } from '../../store/crud-store'
import { getElements, updateElements } from '../../element-store'
import { getPages, subscribePages } from '../../page-store'

jest.mock('../../../../../node_modules/sortablejs/modular/sortable.core.esm.js', () => ({}))

const fakePage = { id: 'fake-id', link: { href: 'fake-link', linkType: LinkType.URL } } as PageState
const [ELEM_TEXT_STATE, ELEM_HTML_SELECTED, ELEM_SECTION_SELECTED, ELEM_SECTION_CONTENT_SELECTED] = fromData([ELEM_TEXT, {
  ...ELEM_HTML,
  selected: true,
}, {
  ...ELEM_SECTION,
  selected: true,
}, {
  ...ELEM_SECTION_CONTENT,
  selected: true,
}])
const ELEM_HTML_1PAGE = {
  ...ELEM_HTML_SELECTED,
  selected: false,
  pageNames: ['fake-id' ],
}
const ELEM_HTML_SELECTED_1PAGE = {
  ...ELEM_HTML_SELECTED,
  pageNames: ['page-page-1' ],
}
const ELEM_HTML_SELECTED_2PAGES = {
  ...ELEM_HTML_SELECTED,
  pageNames: ['page-page-1', 'fake-id'],
}
const [PAGE1_STATE] = fromData([PAGE1]) as PageState[]
jest.mock('../../ui-store/index', () => ({
  getUi: () => ({
    mobileEditor: false,
    loading: LOADING.NONE,
    currentPageId: 'page-page-1',
    clipboard: null,
    dialogs: [{
      id: 'design',
      type: 'properties',
      visible: true,
    }],
  }),
  subscribeUi: jest.fn(),
}))

jest.mock('../../element-store/index', () => ({
  subscribeElements: jest.fn(),
  updateElements: jest.fn(),
  getElements: jest.fn(),
}))

jest.mock('../../page-store/index', () => ({
  subscribePages: jest.fn(),
  getPages: jest.fn(),
}))

let viewOnAllPages: HTMLInputElement
let viewOnAllPagesLabel: HTMLLabelElement

function checkUpdate(elem: ElementData, pages: string[], calls, idx) {
  expect(calls[idx][0][0].id).toBe(elem.id)
  expect(calls[idx][0][0].pageNames).toEqual(pages)
}

beforeEach(() => {
  document.body.innerHTML = `
<span class="page-editor editor-container"><div class="expandable"><legend><span class="fa fa-fw fa-inverse fa-caret-right"></span><span>Visible on</span></legend><div class="body"><div class="view-on-mobile"><input class="checkbox" id="mobile" tabindex="21" type="radio" name="visibility" value="mobile"><label class="xsmall-font" for="mobile">mobile</label><input class="checkbox" id="desktop" tabindex="22" type="radio" name="visibility" value="desktop"><label class="xsmall-font" for="desktop">desktop</label><input class="checkbox" id="both" tabindex="23" type="radio" name="visibility" value="both"><label class="xsmall-font" for="both">both</label><hr></div><div class="view-on-allpages"><input class="view-on-allpages-check checkbox" id="allpages" tabindex="24" type="checkbox"><label class="view-on-allpages-label xsmall-font" for="allpages">all pages</label></div><div class="pages-container"><div class="page-container">
    <input class="page-check checkbox" type="checkbox" id="page-check-id-page-to-delete">
    <label class="page-label xsmall-font" for="page-check-id-page-to-delete">to delete</label>
  </div>
	<div class="page-container">
    <input class="page-check checkbox" type="checkbox" id="page-check-id-page-contact">
    <label class="page-label xsmall-font" for="page-check-id-page-contact">Contact</label>
  </div>
	<div class="page-container">
    <input class="page-check checkbox" type="checkbox" id="page-check-id-page-home">
    <label class="page-label xsmall-font" for="page-check-id-page-home">Home</label>
  </div>
	<div class="page-container">
    <input class="page-check checkbox" type="checkbox" id="page-check-id-page-post">
    <label class="page-label xsmall-font" for="page-check-id-page-post">Post</label>
  </div>
	<div class="page-container">
    <input class="page-check checkbox" type="checkbox" id="page-check-id-page-page">
    <label class="page-label xsmall-font" for="page-check-id-page-page">Page</label>
  </div>
	<div class="page-container">
    <input class="page-check checkbox" type="checkbox" id="page-check-id-page-archive">
    <label class="page-label xsmall-font" for="page-check-id-page-archive">Archive</label>
  </div>
	<div class="page-container">
    <input class="page-check checkbox" type="checkbox" id="page-check-id-page-default">
    <label class="page-label xsmall-font" for="page-check-id-page-default">Default</label>
  </div>
	</div></div></div><div class="expandable expanded"><legend><span class="fa fa-fw fa-inverse fa-caret-down"></span><span>Link</span></legend><div class="body link-pane"><input class="link-state" placeholder="-" type="text" readonly=""><input class="link-button" tabindex="25" type="button" value="Edit"></div></div></span>
  `
  jest.clearAllMocks()

  viewOnAllPages = document.body.querySelector('.view-on-allpages-check')
  viewOnAllPagesLabel = document.body.querySelector('.view-on-allpages-label')

})

test('init page pane', () => {
  const _ = new PagePane(document.body)
  expect(subscribePages).toHaveBeenCalledTimes(1)
})

test('view on all pages', () => {
  const pane = new PagePane(document.body)

	;(getElements as any).mockReturnValue([ELEM_TEXT_STATE, ELEM_HTML_SELECTED])
  document.body.querySelector('.view-on-allpages-label').dispatchEvent(new MouseEvent('click'))
  expect(updateElements).toHaveBeenCalledTimes(1)
  expect(updateElements).toHaveBeenCalledWith([ELEM_HTML_SELECTED])

  jest.resetAllMocks()
  ;(getPages as any).mockReturnValue([PAGE1_STATE])
	;(getElements as any).mockReturnValue([ELEM_TEXT_STATE, {
		...ELEM_HTML_SELECTED,
		pageNames: [PAGE1_STATE.id],
	}])

	pane.setPages([PAGE1_STATE])
	pane.redraw([{
		...ELEM_HTML_SELECTED,
		pageNames: [PAGE1.id],
	}])

  // unchecked because it is visible only on page1
  expect(viewOnAllPages.checked).toBe(false)

  // make it visible on all pages
  viewOnAllPages.dispatchEvent(new MouseEvent('click'))
  expect(updateElements).toHaveBeenCalledTimes(1)
  expect(updateElements).toHaveBeenCalledWith([ELEM_HTML_SELECTED])

  // keep it visible on all pages when it is already the case
	pane.setPages([PAGE1_STATE])
	pane.redraw([ELEM_HTML_SELECTED])
  viewOnAllPagesLabel.dispatchEvent(new MouseEvent('click'))
  expect(updateElements).toHaveBeenCalledTimes(2)
  expect(updateElements).toHaveBeenCalledWith([ELEM_HTML_SELECTED])
})

test('view on 1 page', () => {
  const updateElementsMock = updateElements as any
  const pane = new PagePane(document.body)

	;(getPages as any).mockReturnValue([PAGE1_STATE])
	;(getElements as any).mockReturnValue([ELEM_TEXT_STATE, ELEM_HTML_SELECTED])

	pane.setPages([PAGE1_STATE])
	pane.redraw([ELEM_HTML_SELECTED])

  const checkbox = document.querySelector('#page-check-id-page-page-1')
  const label = document.querySelector('#page-check-id-page-page-1 + label')

  // checked because pageNames is set to []
  expect(viewOnAllPages.checked).toBe(true)

  // make it visible on page1
  label.dispatchEvent(new MouseEvent('click'))

  expect(updateElements).toHaveBeenCalledTimes(2)
  checkUpdate(ELEM_HTML, ['page-page-1'], updateElementsMock.mock.calls, updateElementsMock.mock.calls.length - 2)

  // remove it
	pane.redraw([{
    ...ELEM_HTML_SELECTED,
    pageNames: ['page-page-1'],
  }])
  checkbox.dispatchEvent(new MouseEvent('click'))
  expect(updateElements).toHaveBeenCalledTimes(4)
  checkUpdate(ELEM_HTML, [], updateElementsMock.mock.calls, updateElementsMock.mock.calls.length - 2)

  // hide from page which is not the current one => keep element selected
	;(getPages as any).mockReturnValue([PAGE1_STATE, fakePage])
	;(getElements as any).mockReturnValue([ELEM_TEXT_STATE, ELEM_HTML_SELECTED_2PAGES])
	pane.setPages([PAGE1_STATE, fakePage ])
	pane.redraw([ELEM_HTML_SELECTED_2PAGES])
  const checkbox2 = document.querySelector('#page-check-id-fake-id')
  checkbox2.dispatchEvent(new MouseEvent('click'))
  expect(updateElements).toHaveBeenCalledTimes(6)
  checkUpdate(ELEM_HTML, ['page-page-1'], updateElementsMock.mock.calls, updateElementsMock.mock.calls.length - 2)

  // hide from current page => deselect
	pane.setPages([PAGE1_STATE, fakePage ])
	pane.redraw([ELEM_HTML_SELECTED_2PAGES])
  document.querySelector('#page-check-id-page-page-1').dispatchEvent(new MouseEvent('click'))
  expect(updateElements).toHaveBeenCalledTimes(8)
  checkUpdate(ELEM_HTML, ['fake-id'], updateElementsMock.mock.calls, updateElementsMock.mock.calls.length - 2)

  // from all pages to 1 page which is not the current one
	;(getPages as any).mockReturnValue([PAGE1_STATE, fakePage])
	;(getElements as any).mockReturnValue([ELEM_TEXT_STATE, ELEM_HTML_SELECTED])
	pane.setPages([PAGE1_STATE, fakePage ])
	pane.redraw([ELEM_HTML_SELECTED])
  expect(viewOnAllPages.checked).toBe(true)
  document.querySelector('#page-check-id-fake-id').dispatchEvent(new MouseEvent('click'))
  expect(updateElements).toHaveBeenCalledTimes(10)
  checkUpdate(ELEM_HTML, ['fake-id'], updateElementsMock.mock.calls, updateElementsMock.mock.calls.length - 2)
})

test('sections and section content', () => {
  const updateElementsMock = updateElements as any
  const pane = new PagePane(document.body)

  ;(getPages as any).mockReturnValue([PAGE1_STATE, fakePage])
	;(getElements as any).mockReturnValue([ELEM_SECTION, ELEM_SECTION_CONTENT_SELECTED])

	pane.setPages([PAGE1_STATE, fakePage])
	pane.redraw([ELEM_SECTION_CONTENT_SELECTED])

  let checkbox = document.querySelector('#page-check-id-page-page-1') as HTMLInputElement
  const label = document.querySelector('#page-check-id-page-page-1 + label')

  // checked because pageNames is set to []
  expect(viewOnAllPages.checked).toBe(true)

  // make it visible on page1
  label.dispatchEvent(new MouseEvent('click'))

  expect(updateElements).toHaveBeenCalledTimes(2)
  checkUpdate(ELEM_SECTION, ['page-page-1'], updateElementsMock.mock.calls, updateElementsMock.mock.calls.length - 2)

  // element is visible on page1
	;(getElements as any).mockReturnValue([ELEM_SECTION, {
    ...ELEM_SECTION_CONTENT_SELECTED,
    pageNames: [PAGE1.id],
  }])
	pane.redraw([{
    ...ELEM_SECTION_CONTENT_SELECTED,
    pageNames: ['page-page-1'],
  }])

  // remove it from page1
  checkbox.dispatchEvent(new MouseEvent('click'))
  expect(updateElements).toHaveBeenCalledTimes(4)

  // it is still visible
  checkUpdate(ELEM_SECTION, ['page-page-1'], updateElementsMock.mock.calls, updateElementsMock.mock.calls.length - 2)

  // element is a section content
  // element is visible on page1 and fakePage
  // the section (parent) is on both pages
	;(getElements as any).mockReturnValue([ELEM_SECTION_CONTENT_SELECTED, {
    ...ELEM_SECTION,
    pageNames: [PAGE1.id, fakePage.id],
  }])
	pane.setPages([PAGE1_STATE, fakePage ])
	pane.redraw([{
    ...ELEM_SECTION_CONTENT_SELECTED,
    pageNames: [], // the parent has pages
  }])
  checkbox = document.querySelector('#page-check-id-page-page-1') as HTMLInputElement
  expect(checkbox.checked).toBe(true)

  // remove it from page1
  checkbox.dispatchEvent(new MouseEvent('click'))

  // it should be visible only on fakePage
  expect(updateElements).toHaveBeenCalledTimes(6)
  checkUpdate(ELEM_SECTION, [fakePage.id], updateElementsMock.mock.calls, updateElementsMock.mock.calls.length - 2)
})

test('update selection', () => {
  const updateElementsMock = updateElements as any
  const pane = new PagePane(document.body)

  // element is visible on all pages
  // element is selected
	;(getElements as any).mockReturnValue([ELEM_TEXT_STATE, {
    ...ELEM_HTML_SELECTED,
    pageNames: [],
  }])
  pane.updateSelection()

  // it should still be selected
  expect(updateElements).toHaveBeenCalledTimes(1)
  expect(updateElementsMock.mock.calls[updateElementsMock.mock.calls.length - 1][0][0].selected).toBe(true)

  // make it visible on the current page
	;(getElements as any).mockReturnValue([ELEM_TEXT_STATE, {
    ...ELEM_HTML_SELECTED,
    pageNames: [PAGE1_STATE.id],
  }])
  pane.updateSelection()

  // it should still be selected
  expect(updateElements).toHaveBeenCalledTimes(2)
  expect(updateElementsMock.mock.calls[updateElementsMock.mock.calls.length - 1][0][0].selected).toBe(true)

  // make it visible on the other page
	;(getElements as any).mockReturnValue([ELEM_TEXT_STATE, {
    ...ELEM_HTML_SELECTED,
    pageNames: [fakePage.id],
  }])
  pane.updateSelection()

  // it is not selected anymore
  expect(updateElements).toHaveBeenCalledTimes(3)
  expect(updateElementsMock.mock.calls[updateElementsMock.mock.calls.length - 1][0][0].selected).toBe(false)
})

test('selection with sections', () => {
  const updateElementsMock = updateElements as any
  const pane = new PagePane(document.body)

  // element is a section
  // it is selected
  // it is visible on the other page
	;(getElements as any).mockReturnValue([{
    ...ELEM_SECTION_SELECTED,
    pageNames: [fakePage.id],
  }])
  pane.updateSelection()

  // it is not selected anymore
  expect(updateElements).toHaveBeenCalledTimes(1)
  expect(updateElementsMock.mock.calls[updateElementsMock.mock.calls.length - 1][0][0].selected).toBe(false)

  // element is a section container
  // it is selected
  // it is visible on the other page
	;(getElements as any).mockReturnValue([ELEM_SECTION, {
    ...ELEM_SECTION_CONTENT_SELECTED,
    pageNames: [fakePage.id],
  }])
  pane.updateSelection()

  // it is not selected anymore
  expect(updateElements).toHaveBeenCalledTimes(2)
  expect(updateElementsMock.mock.calls[updateElementsMock.mock.calls.length - 1][0][0].selected).toBe(false)
})
