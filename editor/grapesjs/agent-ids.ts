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

import { Component, Editor, Page } from 'grapesjs'

/**
 * Short ids the agents use to name elements, valid until the website is reopened.
 * Kept out of the model on purpose: nothing goes in the website file, and a clone
 * or a paste gets a new id instead of a copy of this one.
 */

const cmdAgentId = 'agent-ids:get'
const cmdCreated = 'agent-ids:created'

const GENERATION_KEY = 'silex-agent-ids-generation'
// Two letters at most: a..z, then aa..zz
const GENERATIONS = 26 + 26 * 26

interface Registry {
  generation: string
  count: number
  ids: WeakMap<Component, string>
  components: Map<string, Component>
}
const registries = new WeakMap<Editor, Registry>()

function letters(n: number): string {
  let s = ''
  for (let rest = n; rest > 0; rest = Math.floor((rest - 1) / 26)) {
    s = String.fromCharCode(97 + (rest - 1) % 26) + s
  }
  return s
}

const randomGeneration = () => 1 + Math.floor(Math.random() * GENERATIONS)

// Each opening takes the next prefix, kept across restarts, so that an id from an
// older opening is refused instead of naming another element. Random when there is
// no count: Desktop on another port has an empty storage
function nextGeneration(): string {
  let n: number
  try {
    const last = Number(localStorage.getItem(GENERATION_KEY))
    n = last ? last % GENERATIONS + 1 : randomGeneration()
    localStorage.setItem(GENERATION_KEY, String(n))
  } catch {
    n = randomGeneration()
  }
  return letters(n)
}

function registry(editor: Editor): Registry {
  let reg = registries.get(editor)
  if (!reg) {
    reg = { generation: nextGeneration(), count: 0, ids: new WeakMap(), components: new Map() }
    registries.set(editor, reg)
  }
  return reg
}

export function agentId(editor: Editor, component: Component): string {
  const reg = registry(editor)
  let id = reg.ids.get(component)
  if (!id) {
    id = `${reg.generation}${++reg.count}`
    reg.ids.set(component, id)
    reg.components.set(id, component)
  }
  return id
}

function pageOf(editor: Editor, component: Component): Page | undefined {
  const root = component.parents().pop() ?? component
  return editor.Pages.getAll().find(page => page.getMainComponent() === root)
}

/**
 * The element in the selected page, undefined for an id never given
 */
export function findByAgentId(editor: Editor, id: string): Component | undefined {
  const reg = registry(editor)
  const generation = /^([a-z]{1,2})\d+$/.exec(id)?.[1]
  if (generation && generation !== reg.generation) {
    throw new Error(`No element "${id}": element ids change each time the website is opened. Call components_list to get the current ids.`)
  }
  const component = reg.components.get(id)
  if (!component) return undefined
  const page = pageOf(editor, component)
  if (!page) throw new Error(`Element "${id}" was removed. Call components_list to get the current ids.`)
  if (page !== editor.Pages.getSelected()) {
    throw new Error(`Element "${id}" is on another page. Call pages_select with id "${page.id}" first.`)
  }
  return component
}

function describeCreated(editor: Editor, component: Component) {
  const classes = component.getClasses().join(' ')
  return {
    id: agentId(editor, component),
    tag: component.get('tagName'),
    ...(classes ? { class: classes } : {}),
  }
}

/**
 * What a creation answers. One element created becomes the selection, so the next
 * call acts on it; several leave the selection where it was
 */
export function created(editor: Editor, components: Component[], parent: Component, { select = true } = {}) {
  const elements = components.filter(component => component.get('type') !== 'textnode')
  if (select && elements.length === 1) editor.select(elements[0])
  return {
    created: elements.map(component => describeCreated(editor, component)),
    parent_id: agentId(editor, parent),
  }
}

export default (editor: Editor) => {
  // For the plugins published on their own, and the desktop selection echo
  editor.Commands.add(cmdAgentId, (_ed, _sender, { component }: { component: Component }) => agentId(editor, component))
  editor.Commands.add(cmdCreated, (_ed, _sender, { components }: { components: Component[] }) => {
    const parent = components[0]?.parent()
    if (!parent) throw new Error(`${cmdCreated} needs created components that are in the page`)
    return created(editor, components, parent)
  })
}
