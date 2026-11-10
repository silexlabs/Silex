/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Short ids the agents use to name elements, valid until the website is reopened.
 * Kept out of the model on purpose: nothing goes in the website file, and a clone
 * or a paste gets a new id instead of a copy of this one.
 */

const cmdAgentId = 'agent-ids:get'
const cmdCreated = 'agent-ids:created'
const cmdElements = 'agent-ids:elements'
const cmdDescribe = 'agent-ids:describe'

const GENERATION_KEY = 'silex-agent-ids-generation'
// Two letters at most: a..z, then aa..zz
const GENERATIONS = 26 + 26 * 26

const registries = new WeakMap()

function letters(n) {
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
function nextGeneration() {
  let n
  try {
    const last = Number(localStorage.getItem(GENERATION_KEY))
    n = last ? last % GENERATIONS + 1 : randomGeneration()
    localStorage.setItem(GENERATION_KEY, String(n))
  } catch {
    n = randomGeneration()
  }
  return letters(n)
}

function registry(editor) {
  let reg = registries.get(editor)
  if (!reg) {
    reg = { generation: nextGeneration(), count: 0, ids: new WeakMap(), components: new Map() }
    registries.set(editor, reg)
  }
  return reg
}

export function agentId(editor, component) {
  const reg = registry(editor)
  let id = reg.ids.get(component)
  if (!id) {
    id = `${reg.generation}${++reg.count}`
    reg.ids.set(component, id)
    reg.components.set(id, component)
  }
  return id
}

export function describe(editor, component) {
  const classes = component.getClasses().join(' ')
  return `"${agentId(editor, component)}" <${component.get('tagName')}${classes ? ` class="${classes}"` : ''}>`
}

function pageOf(editor, component) {
  const root = component.parents().pop() ?? component
  return editor.Pages.getAll().find(page => page.getMainComponent() === root)
}

/**
 * The element in the selected page, undefined for an id never given
 */
function findByAgentId(editor, id) {
  const reg = registry(editor)
  const generation = /^([a-z]{1,2})\d+$/.exec(id)?.[1]
  if (generation && generation !== reg.generation) {
    throw new Error(`No element "${id}": element ids change each time the website is opened. Call element(action:'list') to get the current ids.`)
  }
  const component = reg.components.get(id)
  if (!component) return undefined
  const page = pageOf(editor, component)
  if (!page) throw new Error(`Element "${id}" was removed. Call element(action:'list') to get the current ids.`)
  if (page !== editor.Pages.getSelected()) {
    throw new Error(`Element "${id}" is on another page. Call page(action:'select', page_id:"${page.id}") first.`)
  }
  return component
}

function describeCreated(editor, component) {
  const classes = component.getClasses().join(' ')
  return {
    id: agentId(editor, component),
    tag: component.get('tagName'),
    ...(classes ? { class: classes } : {}),
  }
}

function elementsOf(editor, id, { several = false } = {}) {
  if (id) {
    const found = findByAgentId(editor, id)
    if (!found) throw new Error(`No element "${id}" on this page. Use element(action:'list') to see the ids.`)
    return [found]
  }
  const selected = editor.getSelectedAll()
  if (!selected.length) throw new Error('No element selected: set element_id, or select one with element(action:\'select\').')
  if (selected.length > 1 && !several) throw new Error('Several elements are selected: set element_id. Nothing was changed.')
  return selected
}

export function elementOf(editor, id) {
  return elementsOf(editor, id)[0]
}

/**
 * What a creation answers. One element created becomes the selection, so the next
 * call acts on it; several leave the selection where it was
 */
export function created(editor, components, parent, { select = true } = {}) {
  const elements = components.filter(component => component.get('type') !== 'textnode')
  if (select && elements.length === 1) editor.select(elements[0])
  return {
    created: elements.map(component => describeCreated(editor, component)),
    parent_id: agentId(editor, parent),
  }
}

export default (editor) => {
  // For the plugins published on their own, and the desktop selection echo
  editor.Commands.add(cmdAgentId, (_ed, _sender, { component }) => agentId(editor, component))
  editor.Commands.add(cmdDescribe, (_ed, _sender, { component }) => describe(editor, component))
  editor.Commands.add(cmdElements, (_ed, _sender, { element_id, several }) => elementsOf(editor, element_id, { several }))
  editor.Commands.add(cmdCreated, (_ed, _sender, { components }) => {
    const parent = components[0]?.parent()
    if (!parent) throw new Error(`${cmdCreated} needs created components that are in the page`)
    return created(editor, components, parent)
  })
}
