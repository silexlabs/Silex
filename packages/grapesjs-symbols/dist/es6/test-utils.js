import grapesjs from 'grapesjs';
import { createSymbol } from './model/Symbol';
//  let's use the editor in headless mode
//  to create components
var editor = grapesjs.init({
    headless: true,
    storageManager: { autoload: false },
});
export function getTestSymbols() {
    var _a = editor.addComponents([{
            test: 'comp1 S1',
        }, {
            test: 'comp2 S1',
            symbolId: 'S1',
        }, {
            test: 'comp3 S2',
        }]), comp1 = _a[0], comp2 = _a[1], comp3 = _a[2];
    var _b = comp1.append([{
            test: 'child11',
        }, {
            test: 'child12',
        }]), child11 = _b[0], child12 = _b[1];
    var child111 = child11.append([{
            test: 'child111',
        }])[0];
    var _c = comp2.append([{
            test: 'child21',
            symbolChildId: child11.cid,
        }, {
            test: 'child22',
            symbolChildId: child12.cid,
        }]), child21 = _c[0], child22 = _c[1];
    var child211 = child21.append([{
            test: 'child211',
            symbolChildId: child111.cid,
        }])[0];
    var s1Data = {
        icon: 'fa-cog',
        label: 'S1',
        symbolId: 'S1',
    };
    // This is equivalent to
    // const s1 = createSymbol(comp1, s1Data)
    var s1 = createSymbol(comp1, s1Data);
    s1.addInstance(comp2);
    s1.get('model').set('test', 'S1 model');
    var s2 = createSymbol(comp3, {
        icon: 'fa-cog',
        label: 'S2',
    });
    s2.get('instances')
        .set(comp3.cid, comp3);
    return { child11: child11, child12: child12, child21: child21, child22: child22, child111: child111, child211: child211, comp1: comp1, comp2: comp2, s1: s1, s2: s2, s1Data: s1Data, editor: editor };
}
