import { SITE1 } from '../../test-utils/data-set'
import { initializeSite, getSite } from './index'
import { Constants } from '../../constants'
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
  expect(Object.keys(getSite().styles)).toHaveLength(1)
  initStyle('Fake display name', FAKE_CLASS_NAME, {
    className: FAKE_CLASS_NAME,
    displayName: 'Fake display name',
    templateName: 'fake-class-name',
    styles: {desktop: {hover: {
      'height': '10px',
    }}},
  })
  expect(getSite().styles[FAKE_CLASS_NAME]).not.toBeUndefined()
  expect(getSite().styles[FAKE_CLASS_NAME].styles).not.toBeUndefined()
  expect(getSite().styles[FAKE_CLASS_NAME].styles.desktop).not.toBeUndefined()
  expect(getSite().styles[FAKE_CLASS_NAME].styles.desktop.hover).not.toBeUndefined()
  expect(getSite().styles[FAKE_CLASS_NAME].styles.desktop.hover.height).toBe('10px')
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
  expect(getSite().styles[Constants.BODY_STYLE_CSS_CLASS]).not.toBeUndefined()
  removeStyle(Constants.BODY_STYLE_CSS_CLASS)
  expect(getSite().styles[Constants.BODY_STYLE_CSS_CLASS]).toBeUndefined()
})
