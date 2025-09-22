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

import { Component, Editor } from 'grapesjs'

// Browse all elements of all pages
export function onAll(editor: Editor, cbk: (c: Component) => void) {
  editor.Pages.getAll()
    .forEach(page => {
      page.getMainComponent()
        .onAll(c => cbk(c))
    })
}

/**
 * SHA256 hash a string
 */
export async function hashString(str: string): Promise<string> {
  if (crypto.subtle != undefined) {
    // Convert the string to an ArrayBuffer
    const encoder = new TextEncoder()
    const data = encoder.encode(str)

    // Hash the data with SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)

    // Convert the ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return hashHex
  }
  else {return 'local'}
}

/**
 * Select the <body> element in the editor.
 * @param editor The GrapesJS editor.
 */
export function selectBody(editor: Editor): void {
  editor.select(editor.DomComponents.getWrapper())
}

/**
 * Checks if an element is a text or input field.
 * @param element The element to check.
 */
export function isTextOrInputField(element: HTMLElement): boolean {
  if(element.getAttribute('type') === 'submit') return false
  const isInput: boolean = element.tagName === 'INPUT'
  const isOtherFormElement: boolean = ['TEXTAREA', 'OPTION', 'OPTGROUP', 'SELECT', 'BUTTON'].includes(element.tagName)

  return isInput || isOtherFormElement
}

/**
 * Makes every word in a string start with an uppercase letter.
 * @param str The string to title-case.
 * @param sep The separator between words.
 */
export function titleCase(str: string, sep: string = ' '): string {
  const split = str.split(sep)
  return split.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(sep)
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait = 100): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function(this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}
