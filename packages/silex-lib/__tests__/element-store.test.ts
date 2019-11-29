import { initializeElements, getElements, subscribeElements } from '../src/client/api'
import { ElementData } from '../src/client/flux/element-store'
import { SilexType, SilexId } from '../src/Constants'

const ELEMENT1: ElementData = {
  pageNames: [],
  classes: [],
  type: SilexType.TEXT,
  id: 'id1',
  idx: 0,
  parentId: null,
  enableDrag: true,
  enableDrop: true,
  enableResize: true,
}
const ELEMENT2: ElementData = {
  pageNames: [],
  classes: [],
  type: SilexType.TEXT,
  id: 'id2',
  idx: 1,
  parentId: null,
  enableDrag: true,
  enableDrop: true,
  enableResize: true,
}
const ELEMENT3: ElementData = {
  pageNames: [],
  classes: [],
  type: SilexType.TEXT,
  id: 'id3',
  idx: 2,
  parentId: null,
  enableDrag: true,
  enableDrop: true,
  enableResize: true,
}
const ELEMENTS_1 = [ELEMENT1]
const ELEMENTS_2 = ELEMENTS_1.concat([ELEMENT2])
const ELEMENTS_3 = ELEMENTS_2.concat([ELEMENT3])

test('Subscribe to elements', () => {
  const test = {
    cbk: (prev, next) => {},
  }
  jest.spyOn(test, 'cbk')
  subscribeElements(test.cbk)
  initializeElements(ELEMENTS_1)
  expect(test.cbk).toHaveBeenCalled()
})

