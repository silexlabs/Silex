import { initializeElements } from '../src/client/api';
import { crudIdKey } from '../src/client/flux/crud-store';
import { onUpdateElements } from '../src/client/observers/element-observer';
import { ElementData, ElementType } from '../src/types';

const ELEM_CONTAINER: ElementData = {
  [crudIdKey]: Symbol(),
  id: 'testId1',
  pageNames: [],
  classList: [],
  type: ElementType.CONTAINER,
  isSectionContent: false,
  children: [],
  alt: null,
  title: 'test title',
  link: null,
  enableDrag: true,
  enableDrop: false,
  enableResize: {
    top: true,
    bottom: true,
    left: true,
    right: true,
  },
  selected: false,
  useMinHeight: true,
  visibility: {
    desktop: true,
    mobile: true,
  },
  style: {
    desktop: {},
    mobile: {},
  },
  data: {
    component: null,
  },
  innerHtml: '',
}
const elem1Html = `
<div data-silex-id="${ELEM_CONTAINER.id}" class="editable-style ${ELEM_CONTAINER.id} container-element" title="${ELEM_CONTAINER.title}">
</div>
`
const ELEM_IMAGE: ElementData = {
  ...ELEM_CONTAINER,
  [crudIdKey]: Symbol(),
  id: 'testId2',
  type: ElementType.IMAGE,
  useMinHeight: false,
}
const elem2Html = `
<div data-silex-id="${ELEM_IMAGE.id}" class="editable-style ${ELEM_IMAGE.id} image-element" title="${ELEM_IMAGE.title}">
  <img src="assets/feed-icon-14x14.png" class="silex-element-content" alt="test alt">
</div>
`
const ELEM_TEXT: ElementData = {
  ...ELEM_CONTAINER,
  [crudIdKey]: Symbol(),
  id: 'testId3',
  type: ElementType.TEXT,
  innerHtml: 'SOME CONTENT ELEM3',
}
const elem3Html = `
<div data-silex-id="${ELEM_TEXT.id}" class="editable-style ${ELEM_TEXT.id} text-element" title="${ELEM_TEXT.title}">
<div class="silex-element-content normal">SOME CONTENT ELEM3</div>
</div>
`

// const mocked: any = jest.genMockFromModule('../src/client/api')

beforeEach(() => {
  document.body.innerHTML = elem1Html + elem2Html + elem3Html
})
test('update element', () => {
  const elemContainer: HTMLElement = document.querySelector(`[data-silex-id=${ELEM_CONTAINER.id}]`)
  const elemImage: HTMLElement = document.querySelector(`[data-silex-id=${ELEM_IMAGE.id}]`)
  const elemText: HTMLElement = document.querySelector(`[data-silex-id=${ELEM_TEXT.id}]`)

  // mocked.getElements.mockReturnValue = (() => [ELEM1, ELEM2])
  initializeElements([ELEM_CONTAINER, ELEM_IMAGE, ELEM_TEXT])
  // getUiElements().stage = {
  //   contentDocument: document,
  //   contentWindow: window,
  // } as any as HTMLIFrameElement

  // style
  expect(window.getComputedStyle(elemImage).left).toBe('')
  onUpdateElements(window)([
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
  expect(window.getComputedStyle(elemImage).left).toBe('1px')

  // height vs min height
  onUpdateElements(window)([
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
  ])
  expect(window.getComputedStyle(elemImage).height).toBe('10px')
  expect(window.getComputedStyle(elemImage)['min-height']).toBe('')
  expect(window.getComputedStyle(elemContainer).height).toBe('')
  expect(window.getComputedStyle(elemContainer)['min-height']).toBe('100px')

  // container
  onUpdateElements(window)([
    {
      from: ELEM_CONTAINER,
      to: {
        ...ELEM_CONTAINER,
        children: ELEM_CONTAINER.children.concat(['testId2', 'testId3']),
      },
    },
  ])
  expect(elemImage.parentElement).toBe(elemContainer)
  expect(elemText.parentElement).toBe(elemContainer)
  // children order
  expect(elemText.previousElementSibling).toBe(elemImage)
  onUpdateElements(window)([
    {
      from: ELEM_CONTAINER,
      to: {
        ...ELEM_CONTAINER,
        children: ['testId3', 'testId2'],
      },
    },
  ])
  expect(elemImage.previousElementSibling).toBe(elemText)
  expect(elemText.previousElementSibling).toBeNull()
  // title and alt
  onUpdateElements(window)([
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
