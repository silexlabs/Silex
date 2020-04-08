import {
  ELEM_CONTAINER,
  ELEM_IMAGE,
  ELEM_SECTION,
  ELEM_SECTION_CONTENT,
  ELEM_TEXT,
  mockUiElements
} from '../../../__tests__/data-set';
import { onAddElements, onDeleteElements } from './observer';

const { siteIFrame } = mockUiElements()

import { initializeElements } from './store';
import { crudIdKey } from '../flux/crud-store';
import { onUpdateElements } from './observer';
import { ElementData, ElementType } from './types';

const elem1Html = `
<div data-silex-id="${ELEM_CONTAINER.id}" class="editable-style ${ELEM_CONTAINER.id} container-element" title="${ELEM_CONTAINER.title}">
</div>
`
const elem2Html = `
<div data-silex-id="${ELEM_IMAGE.id}" class="editable-style ${ELEM_IMAGE.id} image-element" title="${ELEM_IMAGE.title}">
  <img src="assets/feed-icon-14x14.png" class="silex-element-content" alt="test alt">
</div>
`
const elem3Html = `
<div data-silex-id="${ELEM_TEXT.id}" class="editable-style ${ELEM_TEXT.id} text-element" title="${ELEM_TEXT.title}">
<div class="silex-element-content normal">${ ELEM_TEXT.innerHtml }</div>
</div>
`

const elem4Html = `
<div data-silex-id="${ELEM_SECTION.id}" class="editable-style ${ELEM_SECTION.id} container-element section-element" title="${ELEM_SECTION.title}">
  <div data-silex-id="${ELEM_SECTION_CONTENT.id}" class="silex-element-content container-element editable-style ${ELEM_SECTION_CONTENT.id}"></div>
</div>
`

// const mocked: any = jest.genMockFromModule('../src/client/api')
beforeEach(() => {
  siteIFrame.contentDocument.body.innerHTML = elem1Html + elem2Html + elem3Html + elem4Html
})
test('update an element children with an element not in the store - this is an impossible case, FIXME: remove this test?', () => {
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_IMAGE,
      to: {
       ...ELEM_IMAGE,
       children: ['fake id not exist'],
      },
    },
  ])
})

test('update element', () => {
  const elemContainer: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_CONTAINER.id}]`)
  const elemImage: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_IMAGE.id}]`)
  const elemSection: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_SECTION.id}]`)
  const elemSectionContent: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_SECTION_CONTENT.id}]`)
  const elemText: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_TEXT.id}]`)

  // mocked.getElements.mockReturnValue = (() => [ELEM1, ELEM2])
  initializeElements([ELEM_CONTAINER, ELEM_IMAGE, ELEM_TEXT, ELEM_SECTION, ELEM_SECTION_CONTENT])
  // getUiElements().stage = {
  //   contentDocument: document,
  //   contentWindow: window,
  // } as any as HTMLIFrameElement

  // style
  expect(siteIFrame.contentWindow.getComputedStyle(elemImage).left).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemSection).left).toBe('')
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_IMAGE,
      to: {
        ...ELEM_IMAGE,
        style: {
          ...ELEM_IMAGE.style,
          desktop: {
            left: '1px',
          },
        },
      },
    },
  ])
  expect(siteIFrame.contentWindow.getComputedStyle(elemImage).left).toBe('1px')

  // height vs min height
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_IMAGE,
      to: {
        ...ELEM_IMAGE,
        style: {
          ...ELEM_IMAGE.style,
          desktop: {
            height: '10px',
          },
        },
      },
    },
    {
      from: ELEM_CONTAINER,
      to: {
        ...ELEM_CONTAINER,
        style: {
          ...ELEM_CONTAINER.style,
          desktop: {
            height: '100px',
          },
        },
      },
    },
    {
      from: ELEM_SECTION_CONTENT,
      to: {
        ...ELEM_SECTION_CONTENT,
        style: {
          ...ELEM_SECTION_CONTENT.style,
          desktop: {
            height: '1000px',
          },
        },
      },
    },
  ])
  expect(siteIFrame.contentWindow.getComputedStyle(elemSectionContent).height).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemSectionContent)['min-height']).toBe('1000px')
  expect(siteIFrame.contentWindow.getComputedStyle(elemImage)['min-height']).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemImage).height).toBe('10px')
  expect(siteIFrame.contentWindow.getComputedStyle(elemContainer).height).toBe('')
  expect(siteIFrame.contentWindow.getComputedStyle(elemContainer)['min-height']).toBe('100px')

  // container
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_CONTAINER,
      to: {
        ...ELEM_CONTAINER,
        children: ELEM_CONTAINER.children.concat([ELEM_IMAGE.id, ELEM_TEXT.id]),
      },
    },
  ])
  expect(elemImage.parentElement).toBe(elemContainer)
  expect(elemText.parentElement).toBe(elemContainer)
  // children order
  expect(elemText.previousElementSibling).toBe(elemImage)
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_CONTAINER,
      to: {
        ...ELEM_CONTAINER,
        children: [ELEM_TEXT.id, ELEM_IMAGE.id],
      },
    },
  ])
  expect(elemImage.previousElementSibling).toBe(elemText)
  expect(elemText.previousElementSibling).toBeNull()
  // title and alt
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_IMAGE,
      to: {
        ...ELEM_IMAGE,
        title: 'title test xyz',
        alt: 'alt test xyz',
      },
    },
  ])
  expect(elemImage.title).toBe('title test xyz')
  expect(elemImage.querySelector('img').alt).toBe('alt test xyz')
})

test('onAddElements', () => {
  siteIFrame.contentDocument.body.innerHTML = elem1Html
  onAddElements(siteIFrame.contentWindow)([
    ELEM_IMAGE,
  ])
  const elemImage: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_IMAGE.id}]`)
  expect(elemImage).not.toBeNull()
  expect(siteIFrame.contentWindow.getComputedStyle(elemImage).left).toBe('0px') // 0px is the value in ELEM_IMAGE

  onAddElements(siteIFrame.contentWindow)([
    ELEM_SECTION,
    ELEM_SECTION_CONTENT,
  ])
  const elemSection: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_SECTION.id}]`)
  const elemSectionContent: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_SECTION_CONTENT.id}]`)
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
  const initialImageEl = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_IMAGE.id}]`)
  expect(initialImageEl).not.toBeNull()
  onUpdateElements(siteIFrame.contentWindow)([
    {
      from: ELEM_IMAGE,
      to: {
        ...ELEM_IMAGE,
        style: {
          ...ELEM_IMAGE.style,
          desktop: {
            left: '1px',
          },
        },
      },
    },
  ])
  expect(siteIFrame.contentWindow.getComputedStyle(initialImageEl).left).toBe('1px')
  onDeleteElements(siteIFrame.contentWindow)([
    ELEM_IMAGE,
  ])
  expect(siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_IMAGE.id}]`)).toBeNull()

  siteIFrame.contentDocument.body.innerHTML = elem2Html
  const elemImage: HTMLElement = siteIFrame.contentDocument.querySelector(`[data-silex-id=${ELEM_IMAGE.id}]`)
  expect(elemImage).not.toBeNull()
  expect(siteIFrame.contentWindow.getComputedStyle(elemImage).left).toBe('')
})
