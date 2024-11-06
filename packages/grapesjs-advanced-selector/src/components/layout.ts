import { Editor } from "grapesjs"
import { AdvancedSelectorOptions } from "../types"
import { addSelectorsByType, getSelectors, SelectorType, setSelectors } from "../model"
import selectorsString from "./selectors-string"
import { createRef, ref } from "lit/directives/ref"
import { CompletionSelectEvent } from "./completion-list"

const primarySelectorsList = createRef()
const completionList = createRef()

export default function (editor: Editor, options: AdvancedSelectorOptions) {
  const components = editor.getSelectedAll()
  const selector = getSelectors(components)
  return `
    <selectors-list
      ${ ref(primarySelectorsList) }
      .editor=${editor}
      .selected=${ selector.selectors }
      .components=${ components }
      .options=${options.classSelector}
      @change=${ () => change(components) }
    ></selectors-list>
    <completion-list
      ${ ref(completionList) }
      .editor=${editor}
      .selected=${ selector.selectors }
      .components=${ components }
      .combinator=${ null }
      @change=${ (event: CompletionSelectEvent) => addSelectorsByType(components, SelectorType.PRIMARY, event.detail.selector) }
    ></completion-list>
    ${ selectorsString(selector) }
    <p>
      Missing here:
      <ul>
        <li>Pseudo selector</li>
        <li>Pseudo selector argument</li>
        <li>Combinator</li>
        <li>Context selector</li>
        <li>Context pseudo selector</li>
        <li>Context pseudo selector argument</li>
      </ul>
    </p>
  `
}

function change(components) {
  const selectors = primarySelectorsList?.value.getSelectors()
  if(!selectors) return
  // const pseudoSelectors = pseudoSelectorsList.value.selected
  // const combinator = combinatorList.value.selected
  // const contextSelectors = contextSelectorsList.value.selected
  // const contextPseudoSelectors = contextPseudoSelectorsList.value.selected
  // const contextPseudoSelectorsArguments = contextPseudoSelectorsArgumentsList.value.selected
  //setSelectors(components, {
  //  selectors,
  //  pseudoSelectors,
  //  combinator,
  //  contextSelectors,
  //  contextPseudoSelectors,
  //  contextPseudoSelectorsArguments,
  //})
}
