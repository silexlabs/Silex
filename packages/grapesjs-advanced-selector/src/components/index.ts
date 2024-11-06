import { render } from 'lit'
import './selectors-list'
import './completion-list'
import { Editor } from 'grapesjs'
import { AdvancedSelectorOptions, CustomSelectorEventProps } from '../types'
import layout from './layout'

export default (editor: Editor, options: AdvancedSelectorOptions, container: HTMLElement) => {
  editor.on('selector:custom', props => updateUi(editor, options, container, props))
}

function updateUi(editor: Editor, options: AdvancedSelectorOptions, container: HTMLElement, props: CustomSelectorEventProps) {
  render(layout(editor, options), container)
}

//// Function to edit or add style based on the selector
//function editStyle(editor: Editor, selector: string) {
//  
//  // Get the selected component
//  const selectedComponent = editor.getSelected()
//
//  if (!selectedComponent) {
//    console.warn('No component is selected')
//    return
//  }
//
//  // Add the class (or use tag selector if it's a tag like `.title`)
//  //const _class = selectedComponent.setClass(selector)
//  //console.log({_class})
//
//  // Get or create the CSS rule for the given selector
//  const rule = editor.CssComposer.setRule(selector)
//  console.log({rule})
//
//  editor.StyleManager.select(rule)
//
//  //// Apply some default styles (optional)
//  //rule.setStyle({
//  //  'color': 'blue',
//  //  'font-size': '18px',
//  //});
//
//  // Ensure the component is still selected for the Style Manager to work
//  //editor.select(selectedComponent);
//}
