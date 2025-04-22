import { css, unsafeCSS } from 'lit'

export function customizeSelect(sel: string) {
  return css`
    ${ unsafeCSS(sel) } {
      border: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      font-family: inherit;
      cursor: pointer;
      /* chrome */
      background: var(--gjs-main-color, #444);
      /* in chrome, make the dropdown text align to the left, with padding */
      text-align-last: center;
      padding: 0 0.5rem;
      text-align: left;
      padding: 0 0.5rem;
    }
  `
}

export function customizeInput(sel: string) {
  return css`
    ${ unsafeCSS(sel) } {
      border: none;
      border-bottom: 1px dashed;
      background: none;
      text-align: center;
      font-family: inherit;
    }
  `
}

// For accesibility and keyboard navigation
export const FOCUS_VISIBLE = css`
  :focus-visible {
    outline: 2px solid var(--gjs-secondary-color, #ddd);
  }
`