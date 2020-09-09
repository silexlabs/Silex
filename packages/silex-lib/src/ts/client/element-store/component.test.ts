import { ELEM_TEXT, SITE1 } from '../../test-utils/data-set'
import { ElementState, ProdotypeDependency } from './types'
import { Prodotype } from '../externs'
import { getSite, initializeSite } from '../site-store/index'
import { isSameTag, updateComponentsDependencies } from './component'

const ELEM_TEXT_STATE = ELEM_TEXT as ElementState
const FAKE_DEPENDENCIES: ProdotypeDependency = {
  'script': [{
    'src': 'https://fake.script.com'
  }],
  'link': [{
    'rel': 'stylesheet',
    'href': 'https://fake.style.com'
  }]
}

beforeEach(() => {
  initializeSite(SITE1)
})

test('update dependencies, no change', () => {
  const dispatch = jest.fn()
  const elements = [ELEM_TEXT_STATE]

  // no change
  const prodotypeChanged = {
    getDependencies: (components: ElementState[]) => SITE1.prodotypeDependencies
  } as any as Prodotype

  updateComponentsDependencies(prodotypeChanged, elements, dispatch)

  expect(dispatch).toHaveBeenCalledTimes(0)
})

test('update dependencies, from 0 to 1 dependency', () => {
  const dispatch = jest.fn()
  const elements = [ELEM_TEXT_STATE]

  initializeSite({
    ...SITE1,
    prodotypeDependencies: {},
  })
  const prodotypeAdded = {
    getDependencies: (components: ElementState[]) => SITE1.prodotypeDependencies,
  } as any as Prodotype

  updateComponentsDependencies(prodotypeAdded, elements, dispatch)

  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenLastCalledWith({
    type: 'SITE_UPDATE',
    data: {
      ...getSite(),
      prodotypeDependencies: SITE1.prodotypeDependencies,
    },
  })
})

test('update dependencies, from 1 to 0 dependency', () => {
  const dispatch = jest.fn()
  const elements = [ELEM_TEXT_STATE]

  const prodotypeAdded = {
    getDependencies: (components: ElementState[]) => ({}),
  } as any as Prodotype

  updateComponentsDependencies(prodotypeAdded, elements, dispatch)

  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenLastCalledWith({
    type: 'SITE_UPDATE',
    data: {
      ...getSite(),
      prodotypeDependencies: {},
    },
  })
})

test('update dependencies, some dependencies added', () => {
  const dispatch = jest.fn()
  const elements = [ELEM_TEXT_STATE]
  const newDependencies = {
    script: SITE1.prodotypeDependencies.script
      .concat(FAKE_DEPENDENCIES.script),
    link: SITE1.prodotypeDependencies.link
      .concat(FAKE_DEPENDENCIES.link),
  }

  const prodotypeAdded = {
    getDependencies: (components: ElementState[]) => newDependencies,
  } as any as Prodotype

  updateComponentsDependencies(prodotypeAdded, elements, dispatch)

  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenLastCalledWith({
    type: 'SITE_UPDATE',
    data: {
      ...getSite(),
      prodotypeDependencies: newDependencies,
    },
  })
})

test('update dependencies, some dependencies added and removed', () => {
  const dispatch = jest.fn()
  const elements = [ELEM_TEXT_STATE]

  const prodotypeChanged = {
    getDependencies: (components: ElementState[]) => FAKE_DEPENDENCIES
  } as any as Prodotype

  updateComponentsDependencies(prodotypeChanged, elements, dispatch)

  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenLastCalledWith({
    type: 'SITE_UPDATE',
    data: {
      ...getSite(),
      prodotypeDependencies: FAKE_DEPENDENCIES,
    },
  })
})

test('update dependencies, add same dependencies', () => {
  const dispatch = jest.fn()
  const elements = [ELEM_TEXT_STATE]
  const newDependencies = {
    script: SITE1.prodotypeDependencies.script
      .concat(SITE1.prodotypeDependencies.script),
    link: SITE1.prodotypeDependencies.link
      .concat(SITE1.prodotypeDependencies.link),
  }

  const prodotypeChanged = {
    getDependencies: (components: ElementState[]) => newDependencies
  } as any as Prodotype

  updateComponentsDependencies(prodotypeChanged, elements, dispatch)

  expect(dispatch).toHaveBeenCalledTimes(0)
})

test('isSameTag', () => {
  expect(isSameTag({}, {
    a: 'a',
  })).toBe(false)
  expect(isSameTag({
    a: 'a',
    b: 'b',
  }, {
    a: 'a',
    b: 'b',
  })).toBe(true)

  expect(isSameTag({
    a: 'a',
    b: 'b',
  }, {
    b: 'b',
    a: 'a',
  })).toBe(true)

  expect(isSameTag({
    a: 'a',
  }, {
    a: 'a',
    b: 'b',
  })).toBe(false)

  expect(isSameTag({
    a: 'a',
    b: 'b',
  }, {
    a: 'a',
    c: 'b',
  })).toBe(false)
})

// test('update dependencies, check exec time', () => {
//   const dispatch = jest.fn()
//   const elements = [ELEM_TEXT_STATE]
//   const newDependencies = Array.from({length: 10000}, () => Math.floor(Math.random() * 5))
//     .reduce((aggr, rand) => ({
//       ...aggr,
//       script: aggr.script.concat({src: 'http://fake.com/script?' + rand}),
//       style: aggr.style.concat({href: 'http://fake.com/style?' + rand}),
//     }), {test: [{attr: 'val'}, {attr: 'val'}], script:[], style: []})
//
//   const prodotypeChanged = {
//     getDependencies: (components: ElementState[]) => newDependencies
//   } as any as Prodotype
//
//   const start = performance.now()
//   updateComponentsDependencies(prodotypeChanged, elements, dispatch)
//   const stop = performance.now()
//   const elapsed = stop - start
//   // console.log({start, stop, elapsed})
//
//   expect(dispatch).toHaveBeenCalledTimes(1)
//   // not the original since there is at least 1 double entry ({attr: 'val'})
//   expect(dispatch).not.toHaveBeenLastCalledWith({
//     type: 'SITE_UPDATE',
//     data: {
//       ...getSite(),
//       prodotypeDependencies: newDependencies,
//     },
//   })
//   expect(elapsed).toBeLessThan(100)
// })

