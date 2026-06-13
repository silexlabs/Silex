import grapesjs, { Editor } from 'grapesjs'

//  let's use the editor in headless mode
//  to create components
const editor = grapesjs.init({
  headless: true,
  storageManager: { autoload: false },
}) as Editor

export function getTestSymbols() {
  const [comp1, comp2, comp3]: any[] = editor.addComponents([{
    test: 'comp1 S1',
  }, {
    test: 'comp2 S1',
    symbolId: 'S1',
  }, {
    test: 'comp3 S2',
  }])

  const [child11, child12] = comp1.append([{
    test: 'child11',
  }, {
    test: 'child12',
  }] as any)

  const [child111] = child11.append([{
    test: 'child111',
  }])

  const [child21, child22] = comp2.append([{
    test: 'child21',
    symbolChildId: child11.cid,
  }, {
    test: 'child22',
    symbolChildId: child12.cid,
  }] as any)

  const [child211] = child21.append([{
    test: 'child211',
    symbolChildId: child111.cid,
  }])

  // This is equivalent to
  // const s1 = createSymbol(comp1, s1Data)
  const s1 = editor.Components.addSymbol(comp1)!
  const s2 = editor.Components.addSymbol(comp3)!
  const s1Data = editor.Components.getSymbolInfo(s1)

  return {child11, child12, child21, child22, child111, child211, comp1, comp2, s1, s2, s1Data, editor}
}

