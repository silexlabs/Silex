import { Editor } from "grapesjs";
import { html, TemplateResult } from "lit";

import { getSelectors } from '../model'

export default function (editor: Editor): TemplateResult {
  const selectors = getSelectors(editor, editor.getSelectedAll())
  console.log({selectors})
  return html`<div>
    Selected:
    <ul>
      ${ selectors.map(selector => html`
        <li>${ selector }</li>
      `) }
    </ul>
  </div>`
}
