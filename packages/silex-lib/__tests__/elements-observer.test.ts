import { onUpdateElement } from '../src/client/observers/element-observer';
import { ElementData, ElementType } from '../src/types';
import { initializeElements } from '../src/client/api';
import { getUiElements } from '../src/client/components/UiElements';

const ELEM1: ElementData = {
  id: 'testId1',
  pageNames: [],
  classList: [],
  type: ElementType.CONTAINER,
  parent: null,
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
}
const elem1Html = `
<div data-silex-id="${ELEM1.id}" class="editable-style ${ELEM1.id} container-element" title="${ELEM1.title}">
</div>
`
const ELEM2: ElementData = {
  ...ELEM1,
  id: 'testId2',
  type: ElementType.IMAGE,
}
const elem2Html = `
<div data-silex-id="${ELEM2.id}" class="editable-style ${ELEM2.id} image-element" title="${ELEM2.title}">
  <img src="assets/feed-icon-14x14.png" class="silex-element-content" alt="test alt">
</div>

<div class="silex-element-content normal">
  SOME CONTENT ELEM2
</div>
</div>
`
const ELEM3: ElementData = {
  ...ELEM1,
  id: 'testId3',
  type: ElementType.TEXT,
}
const elem3Html = `
<div data-silex-id="${ELEM3.id}" class="editable-style ${ELEM3.id} text-element" title="${ELEM3.title}">
<div class="silex-element-content normal">
  SOME CONTENT ELEM3
</div>
</div>
`

// const mocked: any = jest.genMockFromModule('../src/client/api')

beforeEach(() => {
  document.body.innerHTML = elem1Html + elem2Html + elem3Html
})
test('update element', () => {
  const elem1: HTMLElement = document.querySelector(`[data-silex-id=${ELEM1.id}]`)
  const elem2: HTMLElement = document.querySelector(`[data-silex-id=${ELEM2.id}]`)
  const elem3: HTMLElement = document.querySelector(`[data-silex-id=${ELEM3.id}]`)

  // console.log('xxx', mocked)
  // mocked.getElements.mockReturnValue = (() => [ELEM1, ELEM2])
  initializeElements([ELEM1, ELEM2, ELEM3])
  // getUiElements().stage = {
  //   contentDocument: document,
  //   contentWindow: window,
  // } as any as HTMLIFrameElement

  // container
  onUpdateElement(ELEM2, {
    ...ELEM2,
    parent: 'testId1',
  }, document)
  onUpdateElement(ELEM3, {
    ...ELEM3,
    parent: 'testId1',
  }, document)
  expect(elem2.parentElement).toBe(elem1)
  expect(elem3.parentElement).toBe(elem1)
  // children order
  expect(elem3.previousElementSibling).toBe(elem2)
  onUpdateElement(ELEM1, {
    ...ELEM1,
    children: ['testId2', 'testId3'],
  }, document)
  expect(elem3.previousElementSibling).toBe(elem2)
  onUpdateElement(ELEM1, {
    ...ELEM1,
    children: ['testId3', 'testId2'],
  }, document)
  expect(elem2.previousElementSibling).toBe(elem3)

  // title and alt
  onUpdateElement(ELEM2, {
    ...ELEM2,
    title: 'title test xyz',
    alt: 'alt test xyz',
  }, document)
  expect(elem2.title).toBe('title test xyz')
  expect(elem2.querySelector('img').alt).toBe('alt test xyz')
})
