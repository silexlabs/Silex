import {
  ELEM_CONTAINER,
  ELEM_IMAGE,
  ELEM_SECTION,
  ELEM_SECTION_CONTENT,
  ELEM_TEXT,
  mockUiElements
} from '../../test-utils/data-set'

const { siteIFrame } = mockUiElements()

import { onAddElements, onDeleteElements } from './observer'

import { onUpdateElements } from './observer'
import { ElementState } from './types'

// in this file we do not use the store, so crudId is not needed, ElementData and ElementState can be used
const ELEM_CONTAINER_STATE = ELEM_CONTAINER as ElementState
const ELEM_IMAGE_STATE = ELEM_IMAGE as ElementState
const ELEM_SECTION_STATE = ELEM_SECTION as ElementState
const ELEM_SECTION_CONTENT_STATE = ELEM_SECTION_CONTENT as ElementState
const ELEM_TEXT_STATE = ELEM_TEXT as ElementState

const elem1Html = `
<div data-silex-id="${ELEM_CONTAINER_STATE.id}" class="editable-style ${ELEM_CONTAINER_STATE.id} container-element" title="${ELEM_CONTAINER_STATE.title}">
</div>
`
const elem2Html = `
<div data-silex-id="${ELEM_IMAGE_STATE.id}" class="editable-style ${ELEM_IMAGE_STATE.id} image-element" title="${ELEM_IMAGE_STATE.title}">
  <img src="assets/feed-icon-14x14.png" class="" alt="test alt">
</div>
`
const elem3Html = `
<div data-silex-id="${ELEM_TEXT_STATE.id}" class="editable-style ${ELEM_TEXT_STATE.id} text-element" title="${ELEM_TEXT_STATE.title}">
<div class="silex-element-content normal">${ ELEM_TEXT_STATE.innerHtml }</div>
</div>
`

const elem4Html = `
<div data-silex-id="${ELEM_SECTION_STATE.id}" class="editable-style ${ELEM_SECTION_STATE.id} container-element section-element" title="${ELEM_SECTION_STATE.title}">
  <div data-silex-id="${ELEM_SECTION_CONTENT_STATE.id}" class="silex-element-content container-element editable-style ${ELEM_SECTION_CONTENT_STATE.id}"></div>
</div>
`

// const mocked: any = jest.genMockFromModule('../src/client/api')
beforeEach(() => {
  siteIFrame.contentDocument.body.innerHTML = elem1Html + elem2Html + elem3Html + elem4Html
})

test('update an element children with an element not in the store - this is an impossible case, remove this test?', () => {
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_IMAGE_STATE,
      to: {
       ...ELEM_IMAGE_STATE,
       children: ['fake id not exist'],
      },
    },
  ])
})

test('update element', () => {
  const elemContainer: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_CONTAINER_STATE.id}]`)
  const elemImage: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_IMAGE_STATE.id}]`)
  const elemSection: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_SECTION_STATE.id}]`)
  const elemSectionContent: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_SECTION_CONTENT_STATE.id}]`)
  const elemText: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_TEXT_STATE.id}]`)

  // mocked.getElements.mockReturnValue = (() => [ELEM1, ELEM2])
  // initializeElements([ELEM_CONTAINER_STATE, ELEM_IMAGE_STATE, ELEM_TEXT_STATE, ELEM_SECTION_STATE, ELEM_SECTION_CONTENT_STATE])
  // getUiElements().stage = {
  //   contentDocument: document,
  //   contentWindow: window,
  // } as any as HTMLIFrameElement

  // style
  expect(siteIFrame.contentWindow.getComputedStyle(elemImage).left).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemSection).left).toBe('')
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_IMAGE_STATE,
      to: {
        ...ELEM_IMAGE_STATE,
        style: {
          ...ELEM_IMAGE_STATE.style,
          desktop: {
            left: '1px',
          },
        },
      },
    },
  ], [ELEM_IMAGE_STATE])
  expect(siteIFrame.contentWindow.getComputedStyle(elemImage).left).toBe('1px')

  // height vs min height
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_IMAGE_STATE,
      to: {
        ...ELEM_IMAGE_STATE,
        style: {
          ...ELEM_IMAGE_STATE.style,
          desktop: {
            height: '10px',
          },
        },
      },
    },
    {
      from: ELEM_CONTAINER_STATE,
      to: {
        ...ELEM_CONTAINER_STATE,
        style: {
          ...ELEM_CONTAINER_STATE.style,
          desktop: {
            height: '100px',
          },
        },
      },
    },
    {
      from: ELEM_SECTION_CONTENT_STATE,
      to: {
        ...ELEM_SECTION_CONTENT_STATE,
        style: {
          ...ELEM_SECTION_CONTENT_STATE.style,
          desktop: {
            height: '1000px',
          },
        },
      },
    },
  ], [ELEM_CONTAINER_STATE, ELEM_IMAGE_STATE, ELEM_SECTION_CONTENT_STATE])
  expect(siteIFrame.contentWindow.getComputedStyle(elemSectionContent).height).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemSectionContent)['min-height']).toBe('1000px')
  expect(siteIFrame.contentWindow.getComputedStyle(elemImage)['min-height']).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemImage).height).toBe('10px')
  expect(siteIFrame.contentWindow.getComputedStyle(elemContainer).height).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemContainer)['min-height']).toBe('100px')

  // container
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_CONTAINER_STATE,
      to: {
        ...ELEM_CONTAINER_STATE,
        children: ELEM_CONTAINER_STATE.children.concat([ELEM_IMAGE_STATE.id, ELEM_TEXT_STATE.id]),
      },
    },
  ], [ELEM_CONTAINER_STATE, ELEM_IMAGE_STATE, ELEM_TEXT_STATE])
  expect(elemImage.parentElement).toBe(elemContainer)
  expect(elemText.parentElement).toBe(elemContainer)
  // children order
  expect(elemText.previousElementSibling).toBe(elemImage)
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_CONTAINER_STATE,
      to: {
        ...ELEM_CONTAINER_STATE,
        children: [ELEM_TEXT_STATE.id, ELEM_IMAGE_STATE.id],
      },
    },
  ], [ELEM_CONTAINER_STATE, ELEM_IMAGE_STATE, ELEM_TEXT_STATE])
  expect(elemImage.previousElementSibling).toBe(elemText)
  expect(elemText.previousElementSibling).toBeNull()
  // title and alt
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_IMAGE_STATE,
      to: {
        ...ELEM_IMAGE_STATE,
        title: 'title test xyz',
        alt: 'alt test xyz',
      },
    },
  ], [ELEM_IMAGE_STATE])
  expect(elemImage.title).toBe('title test xyz')
  expect(elemImage.querySelector('img').alt).toBe('alt test xyz')
})

test('onAddElements', () => {
  siteIFrame.contentDocument.body.innerHTML = elem1Html
  onAddElements(siteIFrame.contentWindow)([
    ELEM_IMAGE_STATE,
  ])
  const elemImage: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_IMAGE_STATE.id}]`)
  expect(elemImage).not.toBeNull()
  const computedStyle = siteIFrame.contentWindow.getComputedStyle(elemImage)
  expect(computedStyle.left).toBe(ELEM_IMAGE_STATE.style.desktop.left) // 0px is the value in ELEM_IMAGE_STATE

  onAddElements(siteIFrame.contentWindow)(
    [ELEM_SECTION_STATE, ELEM_SECTION_CONTENT_STATE,],
    [ELEM_SECTION_STATE, ELEM_SECTION_CONTENT_STATE],
  )
  const elemSection: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_SECTION_STATE.id}]`)
  const elemSectionContent: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_SECTION_CONTENT_STATE.id}]`)
  expect(elemSection).not.toBeNull()
  expect(elemSectionContent).not.toBeNull()
  expect(siteIFrame.contentWindow.getComputedStyle(elemSection).left).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemSectionContent).left).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemSection).height).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemSection)['min-height']).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemSectionContent).height).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemSectionContent)['min-height']).toBe('500px')
})

test('onDelete element', () => {
  const initialImageEl = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_IMAGE_STATE.id}]`)
  expect(initialImageEl).not.toBeNull()
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_IMAGE_STATE,
      to: {
        ...ELEM_IMAGE_STATE,
        style: {
          ...ELEM_IMAGE_STATE.style,
          desktop: {
            left: '1px',
          },
        },
      },
    },
  ], [ELEM_IMAGE_STATE])
  expect(siteIFrame.contentWindow.getComputedStyle(initialImageEl).left).toBe('1px')
  onDeleteElements(siteIFrame.contentWindow)([
    ELEM_IMAGE_STATE,
  ])
  expect(siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_IMAGE_STATE.id}]`)).toBeNull()

  siteIFrame.contentDocument.body.innerHTML = elem2Html
  const elemImage: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_IMAGE_STATE.id}]`)
  expect(elemImage).not.toBeNull()
  expect(siteIFrame.contentWindow.getComputedStyle(elemImage).left).toBe('')
})
