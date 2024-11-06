import { html, TemplateResult } from "lit"
import { getSelectorString, ComplexSelector } from "../model"

export default function (complexSelector: ComplexSelector): TemplateResult {
  return html`<div>
    Selected: ${ getSelectorString(complexSelector) }
  </div>`
}
