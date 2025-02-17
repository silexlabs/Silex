/*
 * @jest-environment jsdom
 */
import { convertRulesToModel } from './model'
import { SimpleSelectorType } from '../model/SimpleSelector'
import grapesjs, { Editor } from 'grapesjs'

/**
 * Converts a raw JSON ruleset into an array of GrapesJS CssRule objects.
 */
export function convertJsonToCssRules(rawRules: any[], editor: Editor) {
  const cssComposer = editor.CssComposer
  const selectorManager = editor.SelectorManager

  return rawRules.map(rule => {
    const { selectors, style } = rule

    if (!selectors || !style) return // Skip invalid entries

    // Convert selector names into actual Selector models
    const sel = selectors
      .map((name: string) => selectorManager.add(name))

    if(rule.atRuleType) {
      console.log(rule, '=>', JSON.stringify(sel, null, 2))
    } else {
      console.log(rule, '=>', JSON.stringify(sel, null, 2))
    }
    return sel
    // const { selectors, style, state, mediaText, atRuleType } = rule;
    //const selectorModels = sel
    //  .filter((selector: Selector) => selector && typeof selector.getFullName === "function");
    //console.log({ selectorModels, sel });
    //if (selectorModels.length === 0) return; // Skip if no valid selectors

    //// Create the rule with selectors and styles
    //const cssRule = cssComposer.add({
    //  selectors: selectorModels,  // Array of valid Selector models
    //  style,      // CSS properties
    //  state: state || "", // Pseudo-class (hover, active, etc.)
    //});

    //// If this rule has a media query, wrap it inside an @media rule
    //if (mediaText && atRuleType === "media") {
    //  cssRule.set({
    //    mediaText,
    //    atRuleType,
    //  });
    //}
  })

  return cssComposer.getAll().models // Returns all rules
}


const editor = grapesjs.init({ headless: true })
//const editor = grapesjs.init({
//  // Disable the UI components to run in headless mode
//  headless: true,
//  storageManager: false, // Disable persistent storage
//
//  // Only load core modules
//  plugins: [],
//  fromElement: false, // Don't load from DOM
//  autorender: false, // Prevent UI rendering
//});

// Mock GrapesJS rule object
describe('convertRulesToModel', () => {
  test('converts a simple class selector', () => {
  })

  test('converts a tag selector', () => {
  })

  test('converts an ID selector', () => {
  })

  test('converts an attribute selector', () => {
  })

  test('converts a universal selector', () => {
  })

  test('handles pseudo-class selectors', () => {
  })

  test('handles pseudo-class with parameters', () => {
  })

  test('handles descendant combinator', () => {
  })

  test('handles direct child combinator', () => {
  })

  test('handles adjacent sibling combinator', () => {
  })

  test('handles general sibling combinator', () => {
  })

  test('handles multiple complex selectors', () => {
  })
  test('convert a real world example', () => {
    //const rules = [{"selectors":["logo"],"style":{"background-color":"#fff","border-radius":"5px","width":"130px","padding":"10px","min-height":"30px","text-align":"center","line-height":"30px","color":"#4d114f","font-size":"23px"}}] as CssRule[];
    const rules = convertJsonToCssRules([{ 'selectors':['clearfix'],'style':{ 'clear':'both' } },{ 'selectors':['header-banner'],'style':{ 'padding-top':'35px','padding-bottom':'100px','color':'#ffffff','font-family':'Helvetica, serif','font-weight':'100','background-image':'url("https://grapesjs.com/img/bg-gr-v.png"), url("https://grapesjs.com/img/work-desk.jpg")','background-attachment':'scroll, scroll','background-position':'left top, center center','background-repeat':'repeat-y, no-repeat','background-size':'contain, cover' } },{ 'selectors':['container-width'],'style':{ 'width':'90%','max-width':'1150px','margin':'0 auto' } },{ 'selectors':['logo-container'],'style':{ 'float':'left','width':'50%' } },{ 'selectors':['logo'],'style':{ 'background-color':'#fff','border-radius':'5px','width':'130px','padding':'10px','min-height':'30px','text-align':'center','line-height':'30px','color':'#4d114f','font-size':'23px' } },{ 'selectors':['menu'],'style':{ 'float':'right','width':'50%' } },{ 'selectors':['menu-item'],'style':{ 'float':'right','font-size':'15px','color':'#eee','width':'130px','padding':'10px','min-height':'50px','text-align':'center','line-height':'30px','font-weight':'400' } },{ 'selectors':['lead-title'],'style':{ 'margin':'150px 0 30px 0','font-size':'40px' } },{ 'selectors':['sub-lead-title'],'style':{ 'max-width':'650px','line-height':'30px','margin-bottom':'30px','color':'#c6c6c6' } },{ 'selectors':['lead-btn'],'style':{ 'margin-top':'15px','padding':'10px','width':'190px','min-height':'30px','font-size':'20px','text-align':'center','letter-spacing':'3px','line-height':'30px','background-color':'#d983a6','border-radius':'5px','transition':'all 0.5s ease','cursor':'pointer' } },{ 'selectors':['lead-btn'],'style':{ 'background-color':'#ffffff','color':'#4c114e' },'state':'hover' },{ 'selectors':['lead-btn'],'style':{ 'background-color':'#4d114f','color':'#fff' },'state':'active' },{ 'selectors':['flex-sect'],'style':{ 'background-color':'#fafafa','padding':'100px 0','font-family':'Helvetica, serif' } },{ 'selectors':['flex-title'],'style':{ 'margin-bottom':'15px','font-size':'2em','text-align':'center','font-weight':'700','color':'#555','padding':'5px' } },{ 'selectors':['flex-desc'],'style':{ 'margin-bottom':'55px','font-size':'1em','color':'rgba(0, 0, 0, 0.5)','text-align':'center','padding':'5px' } },{ 'selectors':['cards'],'style':{ 'padding':'20px 0','display':'flex','justify-content':'space-around','flex-flow':'wrap' } },{ 'selectors':['card'],'style':{ 'background-color':'white','height':'300px','width':'300px','margin-bottom':'30px','box-shadow':'0 1px 2px 0 rgba(0, 0, 0, 0.2)','border-radius':'2px','transition':'all 0.5s ease','font-weight':'100','overflow':'hidden' } },{ 'selectors':['card'],'style':{ 'margin-top':'-5px','box-shadow':'0 20px 30px 0 rgba(0, 0, 0, 0.2)' },'state':'hover' },{ 'selectors':['card-header'],'style':{ 'height':'155px','background-image':'url("https://via.placeholder.com/350x250/78c5d6/fff")','background-size':'cover','background-position':'center center' } },{ 'selectors':['card-header','ch2'],'style':{ 'background-image':'url("https://via.placeholder.com/350x250/459ba8/fff")' } },{ 'selectors':['card-header','ch3'],'style':{ 'background-image':'url("https://via.placeholder.com/350x250/79c267/fff")' } },{ 'selectors':['card-header','ch4'],'style':{ 'background-image':'url("https://via.placeholder.com/350x250/c5d647/fff")' } },{ 'selectors':['card-header','ch5'],'style':{ 'background-image':'url("https://via.placeholder.com/350x250/f28c33/fff")' } },{ 'selectors':['card-header','ch6'],'style':{ 'background-image':'url("https://via.placeholder.com/350x250/e868a2/fff")' } },{ 'selectors':['card-body'],'style':{ 'padding':'15px 15px 5px 15px','color':'#555' } },{ 'selectors':['card-title'],'style':{ 'font-size':'1.4em','margin-bottom':'5px' } },{ 'selectors':['card-sub-title'],'style':{ 'color':'#b3b3b3','font-size':'1em','margin-bottom':'15px' } },{ 'selectors':['card-desc'],'style':{ 'font-size':'0.85rem','line-height':'17px' } },{ 'selectors':['am-sect'],'style':{ 'padding-top':'100px','padding-bottom':'100px','font-family':'Helvetica, serif' } },{ 'selectors':['img-phone'],'style':{ 'float':'left' } },{ 'selectors':['am-container'],'style':{ 'display':'flex','flex-wrap':'wrap','align-items':'center','justify-content':'space-around' } },{ 'selectors':['am-content'],'style':{ 'float':'left','padding':'7px','width':'490px','color':'#444','font-weight':'100','margin-top':'50px' } },{ 'selectors':['am-pre'],'style':{ 'padding':'7px','color':'#b1b1b1','font-size':'15px' } },{ 'selectors':['am-title'],'style':{ 'padding':'7px','font-size':'25px','font-weight':'400' } },{ 'selectors':['am-desc'],'style':{ 'padding':'7px','font-size':'17px','line-height':'25px' } },{ 'selectors':['am-post'],'style':{ 'padding':'7px','line-height':'25px','font-size':'13px' } },{ 'selectors':['blk-sect'],'style':{ 'padding-top':'100px','padding-bottom':'100px','background-color':'#222222','font-family':'Helvetica, serif' } },{ 'selectors':['blk-title'],'style':{ 'color':'#fff','font-size':'25px','text-align':'center','margin-bottom':'15px' } },{ 'selectors':['blk-desc'],'style':{ 'color':'#b1b1b1','font-size':'15px','text-align':'center','max-width':'700px','margin':'0 auto','font-weight':'100' } },{ 'selectors':['price-cards'],'style':{ 'margin-top':'70px','display':'flex','flex-wrap':'wrap','align-items':'center','justify-content':'space-around' } },{ 'selectors':['price-card-cont'],'style':{ 'width':'300px','padding':'7px','float':'left' } },{ 'selectors':['price-card'],'style':{ 'margin':'0 auto','min-height':'350px','background-color':'#d983a6','border-radius':'5px','font-weight':'100','color':'#fff','width':'90%' } },{ 'selectors':['pc-title'],'style':{ 'font-weight':'100','letter-spacing':'3px','text-align':'center','font-size':'25px','background-color':'rgba(0, 0, 0, 0.1)','padding':'20px' } },{ 'selectors':['pc-desc'],'style':{ 'padding':'75px 0','text-align':'center' } },{ 'selectors':['pc-feature'],'style':{ 'color':'rgba(255,255,255,0.5)','background-color':'rgba(0, 0, 0, 0.1)','letter-spacing':'2px','font-size':'15px','padding':'10px 20px' } },{ 'selectors':['pc-feature'],'style':{ 'background-color':'transparent' },'state':'nth-of-type(2n)' },{ 'selectors':['pc-amount'],'style':{ 'background-color':'rgba(0, 0, 0, 0.1)','font-size':'35px','text-align':'center','padding':'35px 0' } },{ 'selectors':['pc-regular'],'style':{ 'background-color':'#da78a0' } },{ 'selectors':['pc-enterprise'],'style':{ 'background-color':'#d66a96' } },{ 'selectors':['footer-under'],'style':{ 'background-color':'#312833','padding-bottom':'100px','padding-top':'100px','min-height':'500px','color':'#eee','position':'relative','font-weight':'100','font-family':'Helvetica,serif' } },{ 'selectors':['led'],'style':{ 'border-radius':'100%','width':'10px','height':'10px','background-color':'rgba(0, 0, 0, 0.15)','float':'left','margin':'2px','transition':'all 5s ease' } },{ 'selectors':['led'],'style':{ 'background-color':'#c29fca','undefined':'undefined','box-shadow':'0 0 5px #9d7aa5, 0 0 10px #e6c3ee','transition':'all 0s ease' },'state':'hover' },{ 'selectors':['copyright'],'style':{ 'background-color':'rgba(0, 0, 0, 0.15)','color':'rgba(238, 238, 238, 0.5)','bottom':'0','padding':'1em 0','position':'absolute','width':'100%','font-size':'0.75em' } },{ 'selectors':['made-with'],'style':{ 'float':'left','width':'50%','padding':'5px 0' } },{ 'selectors':['foot-social-btns'],'style':{ 'display':'none','float':'right','width':'50%','text-align':'right','padding':'5px 0' } },{ 'selectors':['footer-container'],'style':{ 'display':'flex','flex-wrap':'wrap','align-items':'stretch','justify-content':'space-around' } },{ 'selectors':['foot-list'],'style':{ 'float':'left','width':'200px' } },{ 'selectors':['foot-list-title'],'style':{ 'font-weight':'400','margin-bottom':'10px','padding':'0.5em 0' } },{ 'selectors':['foot-list-item'],'style':{ 'color':'rgba(238, 238, 238, 0.8)','font-size':'0.8em','padding':'0.5em 0' } },{ 'selectors':['foot-list-item'],'style':{ 'color':'rgba(238, 238, 238, 1)' },'state':'hover' },{ 'selectors':['foot-form-cont'],'style':{ 'width':'300px','float':'right' } },{ 'selectors':['foot-form-title'],'style':{ 'color':'rgba(255,255,255,0.75)','font-weight':'400','margin-bottom':'10px','padding':'0.5em 0','text-align':'right','font-size':'2em' } },{ 'selectors':['foot-form-desc'],'style':{ 'font-size':'0.8em','color':'rgba(255,255,255,0.55)','line-height':'20px','text-align':'right','margin-bottom':'15px' } },{ 'selectors':['form'],'style':{ 'border-radius':'3px','padding':'10px 15px','background-color':'rgba(0,0,0,0.2)' } },{ 'selectors':['input'],'style':{ 'width':'100%','margin-bottom':'15px','padding':'7px 10px','border-radius':'2px','color':'#fff','background-color':'#554c57','border':'none' } },{ 'selectors':['textarea'],'style':{ 'width':'100%','margin-bottom':'15px','padding':'7px 10px','border-radius':'2px','color':'#fff','background-color':'#554c57','border':'none' } },{ 'selectors':['select'],'style':{ 'width':'100%','margin-bottom':'15px','padding':'7px 10px','border-radius':'2px','color':'#fff','background-color':'#554c57','border':'none','height':'30px' } },{ 'selectors':['sub-input'],'style':{ 'width':'100%','margin-bottom':'15px','padding':'7px 10px','border-radius':'2px','color':'#fff','background-color':'#554c57','border':'none' } },{ 'selectors':['label'],'style':{ 'width':'100%','display':'block' } },{ 'selectors':['button'],'style':{ 'width':'100%','margin':'15px 0','background-color':'#785580','border':'none','color':'#fff','border-radius':'2px','padding':'7px 10px','font-size':'1em','cursor':'pointer' } },{ 'selectors':['sub-btn'],'style':{ 'width':'100%','margin':'15px 0','background-color':'#785580','border':'none','color':'#fff','border-radius':'2px','padding':'7px 10px','font-size':'1em','cursor':'pointer' } },{ 'selectors':['sub-btn'],'style':{ 'background-color':'#91699a' },'state':'hover' },{ 'selectors':['sub-btn'],'style':{ 'background-color':'#573f5c' },'state':'active' },{ 'selectors':['blk-row'],'style':{ 'content':'""','clear':'both','display':'block' },'state':':after' },{ 'selectors':['blk-row'],'style':{ 'padding':'10px' } },{ 'selectors':['blk1'],'style':{ 'width':'100%','padding':'10px','min-height':'75px' } },{ 'selectors':['blk2'],'style':{ 'float':'left','width':'50%','padding':'10px','min-height':'75px' } },{ 'selectors':['blk3'],'style':{ 'float':'left','width':'33.3333%','padding':'10px','min-height':'75px' } },{ 'selectors':['blk37l'],'style':{ 'float':'left','width':'30%','padding':'10px','min-height':'75px' } },{ 'selectors':['blk37r'],'style':{ 'float':'left','width':'70%','padding':'10px','min-height':'75px' } },{ 'selectors':['heading'],'style':{ 'padding':'10px' } },{ 'selectors':['paragraph'],'style':{ 'padding':'10px' } },{ 'selectors':['bdg-sect'],'style':{ 'padding-top':'100px','padding-bottom':'100px','font-family':'Helvetica, serif','background-color':'#fafafa' } },{ 'selectors':['bdg-title'],'style':{ 'text-align':'center','font-size':'2em','margin-bottom':'55px','color':'#555555' } },{ 'selectors':['badges'],'style':{ 'padding':'20px','display':'flex','justify-content':'space-around','align-items':'flex-start','flex-wrap':'wrap' } },{ 'selectors':['badge'],'style':{ 'width':'290px','font-family':'Helvetica, serif','background-color':'white','margin-bottom':'30px','box-shadow':'0 2px 2px 0 rgba(0, 0, 0, 0.2)','border-radius':'3px','font-weight':'100','overflow':'hidden','text-align':'center' } },{ 'selectors':['badge-header'],'style':{ 'height':'115px','background-image':'url("https://grapesjs.com/img/bg-gr-v.png"), url("https://grapesjs.com/img/work-desk.jpg")','background-position':'left top, center center','background-attachment':'scroll, fixed','overflow':'hidden' } },{ 'selectors':['blurer'],'style':{ 'filter':'blur(5px)' } },{ 'selectors':['badge-name'],'style':{ 'font-size':'1.4em','margin-bottom':'5px' } },{ 'selectors':['badge-role'],'style':{ 'color':'#777','font-size':'1em','margin-bottom':'25px' } },{ 'selectors':['badge-desc'],'style':{ 'font-size':'0.85rem','line-height':'20px' } },{ 'selectors':['badge-avatar'],'style':{ 'width':'100px','height':'100px','border-radius':'100%','border':'5px solid #fff','box-shadow':'0 1px 1px 0 rgba(0, 0, 0, 0.2)','margin-top':'-75px','position':'relative' } },{ 'selectors':['badge-body'],'style':{ 'margin':'35px 10px' } },{ 'selectors':['badge-foot'],'style':{ 'color':'#fff','background-color':'#a290a5','padding-top':'13px','padding-bottom':'13px','display':'flex','justify-content':'center' } },{ 'selectors':['badge-link'],'style':{ 'height':'35px','width':'35px','line-height':'35px','font-weight':'700','background-color':'#fff','color':'#a290a5','display':'block','border-radius':'100%','margin':'0 10px' } },{ 'selectors':['quote'],'style':{ 'color':'#777','font-weight':'300','padding':'10px','box-shadow':'-5px 0 0 0 #ccc','font-style':'italic','margin':'20px 30px' } },{ 'selectors':['foot-form-cont'],'style':{ 'width':'400px' },'mediaText':'(max-width: 768px)','atRuleType':'media' },{ 'selectors':['foot-form-title'],'style':{ 'width':'autopx' },'mediaText':'(max-width: 768px)','atRuleType':'media' },{ 'selectors':['foot-lists'],'style':{ 'display':'none' },'mediaText':'(max-width: 480px)','atRuleType':'media' }], editor)

    console.log({ rules })
    expect(rules).toHaveLength(99)

    return 
    const result = convertRulesToModel(rules)

    expect(result).toHaveLength(1)
    expect(result[0].mainSelector.selectors).toEqual([
      { type: SimpleSelectorType.CLASS, value: 'my-class', active: true },
    ])
  })
})
