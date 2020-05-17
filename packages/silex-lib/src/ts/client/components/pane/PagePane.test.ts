import { ELEM_HTML, ELEM_TEXT, PAGE1 } from '../../../test-utils/data-set';
import { LOADING } from '../../ui-store/types';
import { PagePane } from './PagePane';
import { PageState } from '../../page-store/types';
import { fromData } from '../../store/crud-store';
import { getElements, updateElements } from '../../element-store';
import { getPages, subscribePages } from '../../page-store';
import { getUi } from '../../ui-store/index';

const [ELEM_TEXT_STATE, ELEM_HTML_SELECTED] = fromData([ELEM_TEXT, {
  ...ELEM_HTML,
  selected: true,
}])
const ELEM_HTML_1PAGE = {
  ...ELEM_HTML_SELECTED,
  selected: false,
  pageNames: ['fake-id' ],
}
const ELEM_HTML_SELECTED_1PAGE = {
  ...ELEM_HTML_SELECTED,
  pageNames: ['page-1' ],
}
const ELEM_HTML_SELECTED_2PAGES = {
  ...ELEM_HTML_SELECTED,
  pageNames: ['page-1', 'fake-id'],
}
const [PAGE1_STATE] = fromData([PAGE1]) as PageState[]
jest.mock('../../ui-store/index', () => ({
  getUi: jest.fn(),
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

beforeEach(() => {
  document.body.innerHTML = `
<span class="page-editor editor-container"><div class="expandable"><legend><span class="fa fa-fw fa-inverse fa-caret-right"></span><span>Visible on</span></legend>
<div class="body">
    <div class="view-on-mobile"><input class="checkbox" id="mobile" type="radio" name="visibility" value="mobile"><label class="xsmall-font" for="mobile">mobile</label><input class="checkbox" id="desktop" type="radio" name="visibility" value="desktop"><label class="xsmall-font" for="desktop">desktop</label><input class="checkbox" id="both" type="radio" name="visibility" value="both"><label class="xsmall-font" for="both">both</label>
        <hr>
    </div>
    <div class="view-on-allpages"><input class="view-on-allpages-check checkbox" id="allpages" type="checkbox"><label class="view-on-allpages-label xsmall-font" for="allpages">all pages</label></div>
    <div class="pages-container"></div>
</div>
</div>
<div class="expandable">
    <legend><span class="fa fa-fw fa-inverse fa-caret-right"></span><span>Link</span></legend>
    <div class="body"><select class="link-combo-box combobox"></select><input class="link-input-text" placeholder="-" type="text"></div>
</div>
</span>
  `
  jest.clearAllMocks()

  viewOnAllPages = document.body.querySelector('.view-on-allpages-check')
  viewOnAllPagesLabel = document.body.querySelector('.view-on-allpages-label')

})

test('init page pane', () => {
  const pane = new PagePane(document.body)
  expect(subscribePages).toHaveBeenCalledTimes(1)
})

test('view on all pages', () => {
  const pane = new PagePane(document.body);

	;(getElements as any).mockReturnValue([ELEM_TEXT_STATE, ELEM_HTML_SELECTED])
  document.body.querySelector('.view-on-allpages-label').dispatchEvent(new MouseEvent('click'))
  expect(updateElements).toHaveBeenCalledTimes(1)
  expect(updateElements).toHaveBeenCalledWith([ELEM_HTML_SELECTED])

  jest.resetAllMocks()
	;(getUi as any).mockReturnValue({
    mobileEditor: false,
    loading: LOADING.NONE,
    currentPageId: 'page-1',
    clipboard: null,
  })
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
  const pane = new PagePane(document.body);

	;(getUi as any).mockReturnValue({
    mobileEditor: false,
    loading: LOADING.NONE,
    currentPageId: 'page-1',
    clipboard: null,
  })
	;(getPages as any).mockReturnValue([PAGE1_STATE])
	;(getElements as any).mockReturnValue([ELEM_TEXT_STATE, ELEM_HTML_SELECTED])

	pane.setPages([PAGE1_STATE])
	pane.redraw([ELEM_HTML_SELECTED])

  const checkbox = document.querySelector('#page-check-id-page-1')
  const label = document.querySelector('#page-check-id-page-1 + label')

  // checked because it is visible only on page1
  expect(viewOnAllPages.checked).toBe(true)

  // make it visible on page1
  label.dispatchEvent(new MouseEvent('click'))

  expect(updateElements).toHaveBeenCalledTimes(1)
  expect(updateElementsMock.mock.calls[updateElementsMock.mock.calls.length - 1]).toContainEqual([{
    ...ELEM_HTML_SELECTED,
    pageNames: ['page-1'],
  }])

  // remove it
	pane.redraw([{
    ...ELEM_HTML_SELECTED,
    pageNames: ['page-1'],
  }])
  checkbox.dispatchEvent(new MouseEvent('click'))
  expect(updateElements).toHaveBeenCalledTimes(2)
  expect(updateElementsMock.mock.calls[updateElementsMock.mock.calls.length - 1]).toContainEqual([ELEM_HTML_SELECTED])

  // hide from page which is not the current one => keep element selected
  const fakePage = { id: 'fake-id', link: { value: 'fake-link' } } as PageState
	;(getPages as any).mockReturnValue([PAGE1_STATE, fakePage])
	;(getElements as any).mockReturnValue([ELEM_TEXT_STATE, ELEM_HTML_SELECTED_2PAGES])
	pane.setPages([PAGE1_STATE, fakePage ])
	pane.redraw([ELEM_HTML_SELECTED_2PAGES])
  const checkbox2 = document.querySelector('#page-check-id-fake-id')
  checkbox2.dispatchEvent(new MouseEvent('click'))
  expect(updateElements).toHaveBeenCalledTimes(3)
  expect(updateElementsMock.mock.calls[updateElementsMock.mock.calls.length - 1]).toContainEqual([ELEM_HTML_SELECTED_1PAGE])

  // hide from current page => deselect
	pane.setPages([PAGE1_STATE, fakePage ])
	pane.redraw([ELEM_HTML_SELECTED_2PAGES])
  document.querySelector('#page-check-id-page-1').dispatchEvent(new MouseEvent('click'))
  expect(updateElements).toHaveBeenCalledTimes(4)
  expect(updateElementsMock.mock.calls[updateElementsMock.mock.calls.length - 1]).toContainEqual([ELEM_HTML_1PAGE])
})



