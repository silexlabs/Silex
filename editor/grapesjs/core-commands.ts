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

import { Asset, Component, Device, Editor } from 'grapesjs'
import { agentId, created, describe, elementOf } from '@silexlabs/grapesjs-ai-capabilities'
import type { AddCapability, DescribeTool } from '@silexlabs/grapesjs-ai-capabilities'

const POSITIONS = ['inside', 'before', 'after']
const POSITION_SCHEMA = { type: 'string', enum: POSITIONS, description: 'Default: inside, as last child' }

function place(target: Component, position = 'inside'): { parent: Component, at?: number } {
  if (!POSITIONS.includes(position)) throw new Error(`position must be one of: ${POSITIONS.join(', ')}. Nothing was changed.`)
  if (position === 'inside') return { parent: target }
  const parent = target.parent()
  if (!parent) throw new Error('The body has no parent: use position "inside". Nothing was changed.')
  return { parent, at: target.index() + (position === 'after' ? 1 : 0) }
}

interface ElementOptions {
  element_id?: string
  target_id?: string
  position?: string
  html?: string
  tag?: string
  attributes?: Record<string, unknown>
  add_class?: string
  remove_class?: string
}

const classNames = (value: string) => value.split(/\s+/).filter(Boolean)

// Long values (a data URI, a long style) would fill the answer
const MAX_VALUE = 60

function attributeValue(value: unknown): string {
  const text = String(value)
  const shown = text.startsWith('data:') ? `${text.slice(0, text.indexOf(',') + 1)}…` : text.length > MAX_VALUE ? `${text.slice(0, MAX_VALUE)}…` : text
  return shown.replace(/"/g, '&quot;')
}

const ID_REFERENCES = ['for', 'form', 'list', 'headers', 'popovertarget', 'aria-labelledby', 'aria-describedby', 'aria-controls',
  'aria-owns', 'aria-activedescendant', 'aria-details', 'aria-errormessage', 'aria-flowto']

function referencedIds(root: Component): Set<string> {
  const ids = new Set<string>()
  const visit = (component: Component) => {
    for (const [name, value] of Object.entries(component.get('attributes') ?? {})) {
      if (typeof value !== 'string') continue
      if (ID_REFERENCES.includes(name)) value.split(/\s+/).forEach(id => ids.add(id))
      if ((name === 'href' || name === 'usemap') && value.includes('#')) ids.add(value.slice(value.indexOf('#') + 1))
    }
    component.components().forEach(visit)
  }
  visit(root)
  return ids
}

/**
 * Tag, classes and attributes, enough to find an element by its structure. GrapesJS
 * stores ids of its own on symbols and styled elements: only those used are shown,
 * they would be taken for element ids
 */
function outline(component: Component, referenced: Set<string>): string {
  const classes = component.getClasses().join(' ')
  const src = component.get('src')
  const attributes = Object.entries({ ...component.get('attributes'), ...(src ? { src } : {}) })
    .filter(([name, value]) => name !== 'class' && (name !== 'id' || referenced.has(String(value))))
    .map(([name, value]) => value === '' || value === true ? ` ${name}` : ` ${name}="${attributeValue(value)}"`)
    .join('')
  return `${component.get('tagName') || 'div'}${classes ? ` class="${attributeValue(classes)}"` : ''}${attributes}`
}

// Only text components are typed into by hand
function textStart(component: Component): string {
  if (!component.isInstanceOf('text')) return ''
  const textOf = (c: Component): string => c.get('type') === 'textnode'
    ? c.get('content') ?? ''
    : c.get('tagName') === 'br' ? ' ' : (c.get('content') ?? '') + c.components().map(textOf).join('')
  const text = textOf(component).replace(/\s+/g, ' ').trim()
  return text ? ` "${attributeValue(text)}"` : ''
}

// Breakpoints are the devices of the site: names, widths and base all come from them.
// They are read once, when the tools load: Silex has no way to change them afterwards
function reach(device: Device): string {
  const width = device.get('widthMedia')
  return width ? `up to ${width}` : 'all sizes'
}

function registerBreakpoints(editor: Editor, addCapability: AddCapability, describeTool: DescribeTool) {
  const devices = editor.Devices.getDevices()
  const base = devices.find(device => !device.get('widthMedia'))?.getName()
  const list = devices.map(device => `${device.getName()} (${reach(device)})`).join(', ')
  describeTool('breakpoint', [
    `Breakpoints for responsive design, desktop-first: ${list}.`,
    base ? `Styles written for ${base} apply everywhere; another breakpoint only overrides them below its width. Select it only for responsive changes, then select ${base} again.` : '',
  ].filter(Boolean).join(' '))
  addCapability({
    tool: 'breakpoint',
    action: 'list',
    command: 'breakpoint:list',
    description: 'the breakpoints and where their styles apply.',
    readOnly: true,
  })
  addCapability({
    tool: 'breakpoint',
    action: 'select',
    command: 'breakpoint:select',
    description: 'choose the breakpoint that styles are written for.',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', enum: devices.map(d => d.getName()) },
      },
    },
  })
}

export default (editor: Editor) => {
  editor.Commands.add('element:list', (_ed, _sender, options: ElementOptions = {}) => {
    const lines: string[] = []
    const referenced = referencedIds(editor.getWrapper()!)
    const walk = (comp: Component, depth: number) => {
      lines.push(`${'  '.repeat(depth)}${agentId(editor, comp)} <${outline(comp, referenced)}>${textStart(comp)}`)
      comp.components()
        .filter((c: Component) => c.get('type') !== 'textnode')
        .forEach((c: Component) => walk(c, depth + 1))
    }
    walk(options.element_id ? elementOf(editor, options.element_id) : editor.getWrapper()!, 0)
    return lines.join('\n')
  })
  editor.Commands.add('asset:list', () => {
    const sources = editor.AssetManager.getAll().map((asset: Asset) => asset.getSrc())
    return sources.length ? sources.join('\n') : 'No image yet: asset(action:\'add\') copies one from the disk.'
  })
  // Silex Desktop gives the file at a one-time address instead of its path
  editor.Commands.add('asset:add', async (_ed, _sender, { path }: { path?: string } = {}) => {
    if (!path) throw new Error('Required: path, the absolute path of the file.')
    const name = decodeURIComponent(path.split('/').pop()!)
    const response = await fetch(path).catch(() => null)
    if (!response?.ok) throw new Error(`Can not read ${name}. Nothing was imported. Retry asset(action:'add').`)
    const file = new File([await response.blob()], name)
    let src = ''
    let failure = 'no answer from the server'
    const onError = (error: unknown) => { failure = String(error) }
    editor.on('asset:upload:error', onError)
    const drop = new DataTransfer()
    drop.items.add(file)
    try {
      await editor.AssetManager.FileUploader().uploadFile({ dataTransfer: drop } as DragEvent, (res: { data?: (string | { src: string })[] }) => {
        const first = res?.data?.[0]
        src = typeof first === 'string' ? first : first?.src ?? ''
      })
    } finally {
      editor.off('asset:upload:error', onError)
    }
    if (!src) throw new Error(`Could not import ${file.name}: ${failure}. Nothing was imported.`)
    return src
  })
  editor.Commands.add('element:get', (_ed, _sender, options: ElementOptions = {}) => {
    return elementOf(editor, options.element_id).getInnerHTML()
  })
  editor.Commands.add('element:clone', (_ed, _sender, options: ElementOptions = {}) => {
    const element = elementOf(editor, options.element_id)
    const copyOut = 'Copy its parent, or rebuild it with element(action:\'insert\') from the HTML of element(action:\'get\').'
    if (element === editor.getWrapper()) throw new Error('The body can not be copied. Nothing was changed. Rebuild its content with element(action:\'insert\') from the HTML of element(action:\'get\').')
    if (!element.get('copyable')) throw new Error(`${describe(editor, element)} is set to not be copied. Nothing was changed. ${copyOut}`)
    const clones: Component[] = []
    const onPaste = (component: Component) => clones.push(component)
    editor.on('component:paste', onPaste)
    try {
      editor.select(element)
      editor.runCommand('tlb-clone')
    } finally {
      editor.off('component:paste', onPaste)
    }
    if (!clones.length) throw new Error(`${describe(editor, element)} can not be copied. ${copyOut}`)
    return created(editor, clones, clones[0].parent()!)
  })
  editor.Commands.add('element:select', (_ed, _sender, options: ElementOptions = {}) => {
    if (!options.element_id) throw new Error('Required: element_id. Use element(action:\'list\') to see the ids.')
    editor.select(elementOf(editor, options.element_id))
  })
  editor.Commands.add('element:insert', (_ed, _sender, options: ElementOptions = {}) => {
    if (!options.html) throw new Error('Required: html, the HTML to add.')
    const target = options.target_id ? elementOf(editor, options.target_id) : editor.getSelected() ?? editor.getWrapper()!
    const { parent, at } = place(target, options.position)
    if (!editor.Components.canMove(parent, options.html, at).result) {
      throw new Error(`${describe(editor, parent)} can not contain this HTML. Nothing was changed. Choose another target_id or position.`)
    }
    return created(editor, parent.append(options.html, { at }), parent)
  })
  editor.Commands.add('element:update', (_ed, _sender, options: ElementOptions = {}) => {
    const { html, tag, attributes, add_class, remove_class } = options
    if (html === undefined && !tag && !attributes && !add_class && !remove_class) {
      throw new Error('Set at least one of: html, tag, attributes, add_class, remove_class.')
    }
    const element = elementOf(editor, options.element_id)
    if (remove_class) {
      const missing = classNames(remove_class).filter(name => !element.getClasses().includes(name))
      if (missing.length) {
        throw new Error(`Class ${missing.join(', ')} is not on ${describe(editor, element)}. Nothing was changed.`)
      }
    }
    if (attributes !== undefined && (typeof attributes !== 'object' || Array.isArray(attributes) || attributes === null)) {
      throw new Error('attributes must be an object, like {"href": "./contact"}. Nothing was changed.')
    }
    const reserved = Object.keys(attributes ?? {}).filter(name => ['class', 'style', 'id'].includes(name.toLowerCase()))
    if (reserved.length) {
      throw new Error(`attributes can not set ${reserved.join(', ')}: use add_class and remove_class for classes, and style(action:'set') for styles. Nothing was changed.`)
    }
    if (tag) element.set('tagName', tag)
    if (attributes) {
      const removed = Object.keys(attributes).filter(name => attributes[name] === null)
      const added = Object.fromEntries(Object.entries(attributes).filter(([, value]) => value !== null))
      element.removeAttributes(removed)
      element.addAttributes(added)
      // An image shows its src property, not the attribute
      if (element.get('src') !== undefined && 'src' in attributes) element.set('src', added.src ?? '')
    }
    if (remove_class) element.removeClass(remove_class)
    if (add_class) element.addClass(add_class)
    if (html !== undefined) {
      return created(editor, element.components(html), element, { select: false })
    }
  })
  editor.Commands.add('element:move', (_ed, _sender, options: ElementOptions = {}) => {
    if (!options.target_id) throw new Error('Required: target_id, the element it goes inside, before or after.')
    const element = elementOf(editor, options.element_id)
    const { parent, at } = place(elementOf(editor, options.target_id), options.position)
    if (!editor.Components.canMove(parent, element, at).result) {
      throw new Error(`${describe(editor, element)} can not go into ${describe(editor, parent)}. Nothing was changed. Choose another target_id or position.`)
    }
    element.move(parent, { at })
  })
  editor.Commands.add('element:remove', (_ed, _sender, options: ElementOptions = {}) => {
    const element = elementOf(editor, options.element_id)
    if (element === editor.getWrapper()) throw new Error('The body can not be removed.')
    element.remove()
  })

  editor.Commands.add('breakpoint:list', () => {
    return editor.Devices.getDevices().map(device => `${device.getName()}: ${reach(device)}`).join('\n')
  })
  editor.Commands.add('breakpoint:select', (_ed, _sender, options: { name?: string } = {}) => {
    const devices = editor.Devices.getDevices()
    const device = devices.find(d => d.getName() === options.name)
    if (!device) throw new Error(`Set name to one of: ${devices.map(d => d.getName()).join(', ')}.`)
    editor.Devices.select(device)
  })

  // Register AI capabilities
  editor.on('ai-capabilities:ready', (addCapability, describeTool) => {
    const elementId = { type: 'string', description: 'Element id, like "ab12". Default: the selected element' }
    const targetId = { type: 'string', description: 'The element it goes inside, before or after' }
    describeTool('element', 'Elements of the selected page.')
    addCapability({
      tool: 'element',
      action: 'list',
      command: 'element:list',
      description: 'the tree of the page, or of the branch of element_id: one line per element, its id then its tag, classes and attributes, and the start of its text for a text element, indented by depth.',
      readOnly: true,
      inputSchema: { type: 'object', properties: { element_id: { type: 'string', description: 'Element id, like "ab12"' } } },
    })
    addCapability({
      tool: 'element',
      action: 'get',
      command: 'element:get',
      description: 'the HTML inside an element, with its text. Its id attributes keep styles, they are not element ids.',
      readOnly: true,
      inputSchema: { type: 'object', properties: { element_id: elementId } },
    })
    addCapability({
      tool: 'element',
      action: 'clone',
      command: 'element:clone',
      description: 'copy an element just after it, like Ctrl+D: CMS bindings and symbol links are kept. The copy becomes the selected element.',
      inputSchema: { type: 'object', properties: { element_id: elementId } },
    })
    addCapability({
      tool: 'element',
      action: 'select',
      command: 'element:select',
      description: 'choose the default element of the other actions, of the symbol tool and of the style tool.',
      inputSchema: { type: 'object', required: ['element_id'], properties: { element_id: { type: 'string', description: 'Element id, like "ab12"' } } },
    })
    addCapability({
      tool: 'element',
      action: 'insert',
      command: 'element:insert',
      description: 'add HTML inside, before or after target_id (default: the selected element, else the body). One created element becomes the selected one.',
      inputSchema: {
        type: 'object',
        required: ['html'],
        properties: {
          html: { type: 'string', description: 'HTML to add' },
          target_id: { type: 'string', description: 'The element it goes inside, before or after. Default: the selected element' },
          position: POSITION_SCHEMA,
        },
      },
    })
    addCapability({
      tool: 'element',
      action: 'update',
      command: 'element:update',
      description: 'change an element: html replaces its children; or set tag, attributes, add_class, remove_class.',
      inputSchema: {
        type: 'object',
        properties: {
          element_id: elementId,
          html: { type: 'string', description: 'HTML that replaces the children' },
          tag: { type: 'string', description: 'new tag name' },
          attributes: { type: 'object', description: 'attributes to set, like {"href": "./contact"}; null removes one' },
          add_class: { type: 'string', description: 'CSS classes to add, separated by spaces' },
          remove_class: { type: 'string', description: 'CSS classes to remove, separated by spaces' },
        },
      },
    })
    addCapability({
      tool: 'element',
      action: 'move',
      command: 'element:move',
      description: 'move an element inside, before or after target_id.',
      inputSchema: {
        type: 'object',
        required: ['target_id'],
        properties: { element_id: elementId, target_id: targetId, position: POSITION_SCHEMA },
      },
    })
    addCapability({
      tool: 'element',
      action: 'remove',
      command: 'element:remove',
      description: 'remove an element.',
      destructive: true,
      inputSchema: { type: 'object', properties: { element_id: elementId } },
    })
    describeTool('asset', 'Images of the open website.')
    addCapability({
      tool: 'asset',
      action: 'list',
      command: 'asset:list',
      description: 'the images of the website, as URLs for src or CSS url().',
      readOnly: true,
    })
    addCapability({
      tool: 'asset',
      action: 'add',
      command: 'asset:add',
      description: 'copy a file, usually an image, into the website, and get the URL to use in src or CSS url().',
      inputSchema: {
        type: 'object',
        required: ['path'],
        properties: { path: { type: 'string', format: 'file-path', description: 'absolute path of the file, like /home/me/logo.svg' } },
      },
    })
    registerBreakpoints(editor, addCapability, describeTool)
  })
}
