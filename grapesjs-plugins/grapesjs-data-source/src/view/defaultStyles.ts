/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

export const OPTIONS_STYLES = `
  form {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 5px;
    color: var(--ds-tertiary);
    min-width: 300px;
  }
  form label {
    text-align: left;
    margin-top: 5px;
  }
  form .buttons {
    display: flex;
    justify-content: flex-end;
    margin: 5px 0;
    width: 100%;
  }
  form input {
    padding: 4px;
    background-color: transparent;
    border-radius: 2px;
    color: var(--ds-tertiary);
    border: 1px solid var(--ds-tertiary);
  }
  form .buttons input {
    margin-left: 5px;
    cursor: pointer;
    padding: 4px 10px;
    background-color: var(--ds-button-bg);
  }
  form .buttons input[type="reset"] {
    border-color: transparent;
  }
  form .buttons input:hover {
    color: var(--ds-primary);
  }
  form input.ds-expression-input__fixed {
    color: black;
  }
`
export const PROPERTY_STYLES = `
  :root {
    --ds-primary: #8873FE;
    --ds-secondary: #E5E5E5;
    --ds-tertiary: #1D1D1D;
    --ds-highlight: #8873FE;
    --ds-lowlight: #252525;
    --ds-button-color: #E5E5E5;
    --ds-button-bg: #252525;
    --ds-button-border: var(--ds-button-bg);
    --ds-input-bg: #111111;
    --ds-input-border: #262626;

    --expression-input-dirty-background-color: var(--ds-button-bg);
    --expression-input-dirty-border-color: var(--ds-tertiary);
    --expression-input-dirty-color: var(--ds-highlight);
    --expression-input-active-color: var(--ds-tertiary);
    --expression-input-active-background-color: var(--ds-secondary);
    --popin-dialog-background: var(--ds-secondary);
    --popin-dialog-color: var(--ds-tertiary);
    --popin-dialog-header-background: transparent;
    --popin-dialog-body-background: transparent;
    --popin-dialog-footer-background: transparent;
    --expression-input-placeholder-margin: 0 10px;
    --expression-input-item-button-margin: 0;
    --expression-input-item-button-padding: 2px;
    --expression-input-item-button-border-radius: 50%;
    --expression-input-item-button-width: 20px;
    --expression-input-item-button-height: 20px;
    --expression-input-item-button-background-color: transparent;
    --expression-input-item-button-color: var(--ds-button-color);
    --expression-input-separator-color: var(--ds-button-color);
    --expression-input-separator-font-size: 0.7em;
    --expression-input-separator-margin: 0;
    --expression-input-separator-padding: 0 3px 0 1px;
    --expression-input-item-arrow-padding: 5px 5px 0 5px;
    --expression-input-values-li-icon-margin-right: 0;
    /*
    --popin-dialog-header-color: #333;
    --popin-dialog-body-color: #666;
    --popin-dialog-footer-color: #333;
    --popin-dialog-header-border-bottom: none;
    --popin-dialog-footer-border-top: none;
    --popin-dialog-header-padding: 0;
    --popin-dialog-body-padding: 5px;
    --popin-dialog-footer-padding: 0;
    */
  }
  .ds-state-editor__options {
    /* popin sits on a light dialog → full light palette, incl. buttons/chips
       (else dark text lands on dark chips = unreadable) */
    --ds-secondary: #252525;
    --ds-tertiary: #E5E5E5;
    --ds-lowlight: #333;
    --ds-button-color: #252525;
    --ds-button-bg: #D5D5D5;
    --ds-button-border: #C4C4C4;
    --ds-input-bg: #E5E5E5;
    --ds-input-border: rgba(0, 0, 0, 0.15);
    --expression-input-active-color: var(--ds-secondary);
    --expression-input-active-background-color: rgba(0, 0, 0, 0.08);
  }
  .gjs-traits-label {
    font-family: inherit;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 10px;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--ds-lowlight);
  }
  /* each state and each property (a section with content) is a distinct card;
     section wrappers (header-only .ds-section) and nested state-editor
     .ds-section have no <main>, so they stay full-width */
  .ds-states__item,
  .ds-section:has(main) {
    background: var(--ds-tertiary);
    border: 1px solid var(--ds-lowlight);
    border-radius: 6px;
    padding: 8px 10px;
    margin: 10px;
  }
  expression-input {
    padding: 10px;
    display: block;
  }
  expression-input::part(separator__delete) {
    border-right: 1px solid var(--ds-button-border);
    height: 20px;
  }
  expression-input::part(add-button) {
    background-color: var(--ds-tertiary);
    border-radius: 2px;
    padding: 3px;
    margin: 0;
    border: 1px solid var(--ds-tertiary);
    width: 24px;
    height: 24px;
    box-sizing: border-box;
    cursor: pointer;
  }
  expression-input::part(delete-button) {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    color: var(--ds-button);
  }
  expression-input::part(header) {
    border: none;
  }
  expression-input::part(type) {
    padding-bottom: 0;
    padding-top: 4px;
    display: none;
  }
  expression-input::part(name) {
    font-weight: normal;
    padding-bottom: 0;
    padding-top: 0;
    padding-left: 5px;
  }
  label[slot='label'] {
    font-size: 0.8rem;
    font-weight: 600;
  }
  expression-input::part(property-input) {
    padding: 4px;
    border: medium;
    flex: 1 1 auto;
    background-color: transparent;
    color: var(--ds-secondary);
  }
  expression-input::part(property-container) {
    box-sizing: border-box;
    border: 1px solid var(--ds-input-border);
    border-radius: 4px;
    appearance: none;
    padding: var(--gjs-input-padding);
    margin: 2px;
    background: var(--ds-input-bg);
  }
  expression-input::part(property-container):focus-within {
    border-color: var(--ds-highlight);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--ds-highlight) 12%, transparent);
  }
  expression-input::part(scroll-container) {
    overflow: auto;
    box-sizing: border-box;
    /* inner shadow to make it visible when content is overflowing */
    box-shadow: inset 0 0 5px 0 rgba(0,0,0,.3);
  }
  expression-input::part(steps-container) {
    display: flex;
    align-items: center;
    background-color: var(--ds-button-bg);
    border-radius: 2px;
    padding: 3px;
    margin: 0;
    width: max-content;
    min-width: 100%;
    box-sizing: border-box;
  }
  expression-input::part(dirty-icon) {
    cursor: pointer;
    color: var(--ds-highlight);
    vertical-align: bottom;
    display: inline-flex;
    margin: 0;
    margin-left: 20px;
  }
  expression-input::part(expression-input-item) {
    border: 1px solid var(--ds-tertiary);
    background-color: var(--ds-tertiary);
    border-radius: 2px;
    margin-right: 5px;
  }
  .ds-section {
    &:last-child {
      margin-bottom: 100px;
    }
    details {
      margin: 2px;
      padding: 2px;
      background-color: transparent;
      border-radius: 2px;
      color: var(--ds-secondary);
      text-align: left;
    }
    details[open] {
      background-color: var(--ds-tertiary);
    }
    details summary {
      color: var(--ds-secondary);
      cursor: pointer;
      padding: 10px 0;
    }
    .ds-states__help summary {
      list-style: none;
      padding: 0;
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 1px solid var(--ds-button-border);
      font-size: 0.65rem;
      opacity: 0.6;
    }
    .ds-states__help summary::-webkit-details-marker { display: none; }
    .ds-states__help summary:hover { opacity: 1; }
    details a {
      color: var(--ds-link-color);
    }
    details .ds-states__help-link {
      display: block;
    }
    details .ds-states__help--tooltip {
      position: absolute;
      left: 50%;
      background: var(--ds-secondary);
      color: var(--ds-tertiary);
      padding: 10px;
    }
    .gjs-traits-label {
      background-color: var(--ds-lowlight);
      span {
        display: flex;
        align-items: center;
      }
    }
    main {
      display: flex;
      flex-direction: column;
    }
    .ds-slot-fixed {
      width: 100%;
    }
    select {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      width: 150px;
      flex: 0;
      margin: 2px;
      padding: 2px 4px;
      font-size: 0.8rem;
      line-height: 1.4;
      background-color: var(--ds-button-bg);
      border-radius: 2px;
      color: var(--ds-secondary);
      border: 1px solid var(--ds-tertiary);
      cursor: pointer;
    }
    input.ds-expression-input__fixed {
      color: var(--ds-secondary);
      width: 98%;
      box-sizing: border-box;
      border: none;
      outline: none;
      border-radius: 4px;
      appearance: none;
      padding: 5px var(--gjs-input-padding);
      margin: 1px;
      background: var(--ds-input-bg);
    }
    .ds-expression-input__add {
      width: 24px;
      min-width: 24px;
      height: 24px;
      padding: 0;
      text-align: center;
      font-size: 0.8rem;
      -webkit-appearance: none;
      -moz-appearance: none;
    }
    .ds-expression-input__add {
      optgroup option {
        text-align: left;
      }
    }
    .ds-expression-input__options-button {
      background-color: transparent;
      border: none;
      color: var(--ds-secondary);
      cursor: pointer;
      padding: 0;
      margin: 6px;
      margin-left: 0;
    }
    label.ds-label {
      display: flex;
      align-items: center;
      padding: 10px;
      color: var(--ds-secondary);
    }
    label.ds-label--disabled {
      justify-content: space-between;
    }
    label.ds-label--disabled .ds-label__message {
      opacity: .5;
    }
    select.ds-visibility__condition-operator {
      margin: 10px;
    }
  }
  /* States CSS Styles */
  .ds-states {
    display: flex;
    flex-direction: column;
  }
    .ds-states__buttons {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      margin: 0 5px;
    }
    .ds-states__button {
      cursor: pointer;
      border: 1px solid var(--ds-button-border);
      border-radius: 2px;
      background: var(--ds-button-bg);
      color: var(--ds-button-color);
      margin: 2px;
      padding: 0 6px;
    }
    .ds-states__button:not(.ds-states__button--disabled):hover {
      color: var(--ds-highlight);
    }
    .ds-states__add-button {
      width: 24px;
      height: 24px;
      padding: 0;
      margin: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      line-height: 1;
      color: var(--ds-secondary);
      background: var(--ds-input-bg);
      border: 1px solid var(--ds-input-border);
      opacity: 0.75;
      &:hover {
        opacity: 1;
      }
    }
    .ds-states__button--disabled {
      opacity: 0.5;
      cursor: default;
    }
    .ds-states__remove-button {
      margin-left: 1em;
    }
  /* real data */
  .ds-real-data {
    code {
      overflow: hidden;
      text-wrap: nowrap;
      display: block;
      padding: 0 10px;
      text-overflow: ellipsis;
      margin-top: -5px;
      margin-bottom: 10px;
      text-align: right;
    }
  }
`
