import { Constants } from '../../constants'
import { ELEM_HTML, ELEM_TEXT, SITE1 } from '../../test-utils/data-set'
import { ElementState } from '../element-store/types'
import { SiteState } from './types'
import { initializeSite, getSite } from './index'
import { removeStyle, initStyle, componentStyleChanged } from './dispatchers'


beforeEach(() => {
  initializeSite(SITE1)
})

test('create a style', () => {
  const FAKE_CLASS_NAME =  'fake-class-name'
  expect(Object.keys(getSite().styles)).toHaveLength(1)
  initStyle('Fake display name', FAKE_CLASS_NAME)
  expect(getSite().styles[FAKE_CLASS_NAME]).not.toBeUndefined()
  expect(getSite().styles[FAKE_CLASS_NAME].styles).not.toBeUndefined()
  expect(getSite().styles[FAKE_CLASS_NAME].styles.desktop).not.toBeUndefined()
})

test('create a style with initial styles', () => {
  const FAKE_CLASS_NAME =  'fake-class-name'
  const initialStyle = {
    className: FAKE_CLASS_NAME,
    displayName: 'Fake display name',
    templateName: 'fake-class-name',
    styles: {desktop: {hover: {
      'height': '10px',
    }}},
  }
  expect(Object.keys(getSite().styles)).toHaveLength(1)
  initStyle('Fake display name', FAKE_CLASS_NAME, initialStyle)
  const created = getSite().styles[FAKE_CLASS_NAME]
  expect(created).not.toBeUndefined()
  expect(created.styles).not.toBeUndefined()
  expect(created.styles.desktop).not.toBeUndefined()
  expect(created.styles.desktop.hover).not.toBeUndefined()
  expect(created.styles.desktop.hover.height).toBe('10px')
  expect(created).not.toBe(initialStyle)
})

test('update a style', () => {
  componentStyleChanged(Constants.BODY_STYLE_CSS_CLASS, 'hover', 'desktop', {
    'height': '10px',
  })
  expect(getSite().styles[Constants.BODY_STYLE_CSS_CLASS]).not.toBeUndefined()
  expect(getSite().styles[Constants.BODY_STYLE_CSS_CLASS].styles).not.toBeUndefined()
  expect(getSite().styles[Constants.BODY_STYLE_CSS_CLASS].styles.desktop).not.toBeUndefined()
  expect(getSite().styles[Constants.BODY_STYLE_CSS_CLASS].styles.desktop.hover).not.toBeUndefined()
  expect(getSite().styles[Constants.BODY_STYLE_CSS_CLASS].styles.desktop.hover.height).toBe('10px')
})

test('delete a style', () => {
  // reference elements
  const ELEM_TEXT_STATE = {
    ...ELEM_TEXT,
  } as ElementState
  const styles = {
    'a-style': {},
  }
  // mock to be called to change the model
  const dispatch = jest.fn()
  // call with reference elements + a style to remove
  removeStyle('test-style', {
    styles: {
      ...styles,
      'test-style': {},
    },
  } as any as SiteState, [{
    ...ELEM_TEXT_STATE,
    classList: ELEM_TEXT_STATE.classList.concat('test-style'),
  }, ELEM_HTML as ElementState], dispatch)
  // check that the style was removed from elements and site
  expect(dispatch).toHaveBeenCalledTimes(2)
  expect(dispatch).toHaveBeenNthCalledWith(1, {type: 'ELEMENT_UPDATE', items: [ELEM_TEXT_STATE]})
  expect(dispatch).toHaveBeenNthCalledWith(2, {type: 'SITE_UPDATE', data: { styles }})
})
