import { html } from "lit"
import { PseudoSelector, PSEUDO_SELECTORS, PseudoSelectorDescriptor } from "../model"

export default function (selected: PseudoSelector, onchange: (value: PseudoSelector) => void) {
  return html`
    <select
      @change=${(event: Event) => {
    }}
    >
      <option value="">-</option>
      ${Object.keys(PSEUDO_SELECTORS)
        .map((category: string) => html`
          <optgroup label=${category}>
            ${Object.values(PSEUDO_SELECTORS[category])
            .map((descriptor: PseudoSelectorDescriptor) => html`
              <option
                value=${descriptor.name}
                ?selected=${selected.name === descriptor.name}
              >
                ${descriptor.name}
              </option>
            `)}
          </optgroup>
        `)}
    </select>
  `
}
