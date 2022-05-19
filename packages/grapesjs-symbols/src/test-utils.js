import grapesjs from 'grapesjs'
import Symbol from './model/Symbol.js'

// Since I can not import the types from grapes
//  let's use the editor in headless mode
//  to create components
const editor = grapesjs.init({
  headless: true,
  storageManager: { autoload: 0 },
})

export function getTestSymbols() {
  const [comp1, comp2] = editor.addComponents([{
    content: 'comp1 S1',
    symbolId: 'S1',
    test: 'test attr comp',
  }, {
    content: 'comp2 S1',
    symbolId: 'S1',
    test: 'test attr comp',
  }])

  const [child11, child12] = comp1.append({
    content: 'child1 comp1 S1',
    symbolChildId: 'SC1',
    test: 'test attr child',
  }, {
    content: 'child2 comp1 S1',
    symbolChildId: 'SC2',
    test: 'test attr child',
  })

  const [child21, child22] = comp2.append({
    content: 'child1 comp2 S1',
    symbolChildId: 'SC1',
    test: 'test attr child',
  }, {
    content: 'child2 comp2 S1',
    symbolChildId: 'SC2',
    test: 'test attr child',
  })

  const s1Data = {
    id: 'S1',
    icon: 'fa-cog',
    label: 'S1',
  }

  const s1 = new Symbol(s1Data)
  s1.get('components')
    .set(comp1.cid, comp1)
    .set(comp2.cid, comp2)

  const s2 = new Symbol()

  return {child11, child12, child21, child22, comp1, comp2, s1, s2, s1Data, editor}
}
