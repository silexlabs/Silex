import { Component, Editor } from "grapesjs"
import { AdvancedSelectorOptions } from "../types"
import { addSelectorsByType, getSelectors, SelectorType } from "../model"
import selectorsString from "./selectors-string"
import { createRef, ref } from "lit/directives/ref"
import { CompletionList, CompletionSelectEvent } from "./completion-list"
import { SelectorsList } from "./selectors-list"
import { html, TemplateResult } from "lit"

const primarySelectorsList = createRef<SelectorsList>()
const completionList = createRef<CompletionList>()

export default function (editor: Editor, options: AdvancedSelectorOptions): TemplateResult {
  const components = editor.getSelectedAll()
  const selector = getSelectors(components)
  return html`
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

function change(components: Component[]) {
  const selectors = primarySelectorsList?.value?.getSelectors()
  console.log('change', { components, selectors })
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
