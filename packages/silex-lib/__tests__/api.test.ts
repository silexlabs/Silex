import { getData, getElements, getPages, getParent, getSite, initializeElements, getChildren, getChildrenRecursive } from '../src/client/api';
import { ElementData, ElementType } from '../src/types';

const ELEM1: ElementData = {
  id: 'testId1',
  pageNames: [],
  classList: [],
  type: ElementType.TEXT,
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
  innerHtml: 'SOME CONTENT ELEM3',
}

const ELEM2: ElementData = {
  ...ELEM1,
  id: 'testId2',
  type: ElementType.IMAGE,
  innerHtml: '',
}

const ELEM3: ElementData = {
  ...ELEM1,
  id: 'testId3',
  type: ElementType.CONTAINER,
  innerHtml: '',
  children: [ELEM1.id, ELEM2.id],
}

const ELEM4: ElementData = {
  ...ELEM1,
  id: 'testId4',
  type: ElementType.CONTAINER,
  innerHtml: '',
  children: [ELEM3.id],
}

beforeEach(() => {
  initializeElements([ELEM1, ELEM2, ELEM3])
})

test('get data', () => {
  expect(getData().elements[0]).toBe(ELEM1)
  expect(getElements()[0]).toBe(ELEM1)
  expect(getPages()).toHaveLength(0)
  expect(getSite().fonts).not.toBeNull()
})

test('find parent', () => {
  expect(getParent(ELEM1)).toBe(ELEM3)
  expect(getParent(ELEM2)).toBe(ELEM3)
})

test('find children', () => {
  const elem3Children = getChildren(ELEM3)
  expect(elem3Children).toHaveLength(2)
  expect(elem3Children[0]).toBe(ELEM1)
  expect(elem3Children[1]).toBe(ELEM2)

  const elem3ChildrenRecursive = getChildrenRecursive(ELEM3)
  expect(elem3ChildrenRecursive).toHaveLength(2)
  expect(elem3ChildrenRecursive[0]).toBe(ELEM1)
  expect(elem3ChildrenRecursive[1]).toBe(ELEM2)

  const elem4ChildrenRecursive = getChildrenRecursive(ELEM4)
  expect(elem4ChildrenRecursive).toHaveLength(3)
  expect(elem4ChildrenRecursive[0]).toBe(ELEM3)
  expect(elem4ChildrenRecursive[1]).toBe(ELEM1)
  expect(elem4ChildrenRecursive[2]).toBe(ELEM2)
})
