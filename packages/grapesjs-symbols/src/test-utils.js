import grapesjs from 'grapesjs'
import Symbol, { createSymbol } from './model/Symbol.js'

// Since I can not import the types from grapes
//  let's use the editor in headless mode
//  to create components
const editor = grapesjs.init({
  headless: true,
  storageManager: { autoload: 0 },
})

export function getTestSymbols() {
  const [comp1, comp2, comp3] = editor.addComponents([{
    content: 'comp1 S1',
    test: 'test attr comp1',
  }, {
    content: 'comp2 S1',
    test: 'test attr comp2',
  }, {
    content: 'comp3 S2',
    test: 'test attr comp3',
  }])

  const [child11, child12] = comp1.append([{
    content: 'child1 comp1 S1',
    test: 'test attr child11',
  }, {
    content: 'child2 comp1 S1',
    test: 'test attr child12',
  }])

  const [child21, child22] = comp2.append([{
    content: 'child1 comp2 S1',
    test: 'test attr child21',
  }, {
    content: 'child2 comp2 S1',
    test: 'test attr child22',
  }])

  const s1Data = {
    symbolId: 'S1',
    icon: 'fa-cog',
    label: 'S1',
  }

  // This is equivalent to
  // const s1 = createSymbol(comp1, s1Data)
  const s1 = new Symbol({
    ...s1Data,
    model: comp1.clone(),
  })
  s1.initSymbolInstance(comp1)
  s1.initSymbolInstance(comp2)
  s1.get('instances')
    .set(comp1.cid, comp1)
    .set(comp2.cid, comp2)

  const s2 = createSymbol(comp3)
  s2.get('instances')
    .set(comp3.cid, comp3)

  return {child11, child12, child21, child22, comp1, comp2, s1, s2, s1Data, editor}
}

