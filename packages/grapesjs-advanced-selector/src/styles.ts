import { css } from 'lit'

export const INVISIBLE_SELECT = css`
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
`

export const INVISIBLE_INPUT = css`
  border: none;
  border-bottom: 1px dashed;
  background: none;
  text-align: center;
  font-family: inherit;
`
