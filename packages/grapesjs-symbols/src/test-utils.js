import grapesjs from 'grapesjs'
import Symbol, { createSymbol, initModel } from './model/Symbol.js'

// Since I can not import the types from grapes
//  let's use the editor in headless mode
//  to create components
const editor = grapesjs.init({
  headless: true,
  storageManager: { autoload: 0 },
})

export function getTestSymbols() {
  const [comp1, comp2, comp3] = editor.addComponents([{
    test: 'comp1 S1',
  }, {
    test: 'comp2 S1',
  }, {
    test: 'comp3 S2',
  }])

  const [child11, child12] = comp1.append([{
    test: 'child11',
  }, {
    test: 'child12',
  }])

  const [child21, child22] = comp2.append([{
    test: 'child21',
  }, {
    test: 'child22',
  }])

  const s1Data = {
    icon: 'fa-cog',
    label: 'S1',
  }

  // This is equivalent to
  // const s1 = createSymbol(comp1, s1Data)
  const s1 = createSymbol(comp1, s1Data)
  s1.addInstance(comp2)
  initModel(comp2, { symbolId: s1Data.symbolId })
  s1.get('model').set('test', 'S1 model')

  const s2 = createSymbol(comp3)
  s2.get('instances')
    .set(comp3.cid, comp3)

  return {child11, child12, child21, child22, comp1, comp2, s1, s2, s1Data, editor}
}

