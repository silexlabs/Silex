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
import { agentId, created, findByAgentId } from './agent-ids'

/**
 * Core GrapesJS commands for blocks, components, styles and classes.
 * Registered as AI capabilities via grapesjs-ai-capabilities.
 */

const POSITIONS = ['inside', 'before', 'after']
const POSITION_SCHEMA = { type: 'string', enum: POSITIONS, description: 'Default: inside, as last child' }

function describe(editor: Editor, component: Component): string {
  const classes = component.getClasses().join(' ')
  return `"${agentId(editor, component)}" <${component.get('tagName')}${classes ? ` class="${classes}"` : ''}>`
}

// Where an element goes, relative to the target: in it as its last child, or next to it
function place(editor: Editor, target: Component, position = 'inside'): { parent: Component, at?: number } {
  if (!POSITIONS.includes(position)) throw new Error(`position must be one of: ${POSITIONS.join(', ')}. Nothing was changed.`)
  if (position === 'inside') return { parent: target }
  const parent = target.parent()
  if (!parent) throw new Error('The body has no parent: use position "inside". Nothing was changed.')
  return { parent, at: target.index() + (position === 'after' ? 1 : 0) }
}

export default (editor: Editor) => {
  // Blocks
  editor.Commands.add('blocks:list', () => {
    return editor.BlockManager.getAll().map(b => ({
      id: b.getId(),
      label: b.getLabel(),
      category: b.getCategoryLabel(),
    }))
  })
  editor.Commands.add('blocks:add', (_ed, _sender, options: any = {}) => {
    const { blockId } = options
    if (!blockId) throw new Error('Required: blockId. Use element(action:\'list_blocks\') to see available blocks.')
    const block = editor.BlockManager.get(blockId)
    if (!block) throw new Error(`Block "${blockId}" not found. Use element(action:'list_blocks') to see available blocks.`)
    const { parent, at } = place(editor, editor.getSelected() || editor.getWrapper()!, options.position)
    const content = block.getContent()
    if (!editor.Components.canMove(parent, content as any, at).result) {
      throw new Error(`The element ${describe(editor, parent)} can not contain block "${blockId}". Nothing was changed. Select another element with element(action:'select'), or change position.`)
    }
    return created(editor, parent.append(content as any, { at }), parent)
  })

  // Components
  editor.Commands.add('components:list', () => {
    const walk = (comp, depth = 0) => {
      const result: any[] = [{
        id: agentId(editor, comp),
        tagName: comp.get('tagName'),
        type: comp.get('type'),
        name: comp.getName(),
        depth,
      }]
      comp.components()
        .filter((c: Component) => c.get('type') !== 'textnode')
        .forEach((c: Component) => result.push(...walk(c, depth + 1)))
      return result
    }
    return walk(editor.getWrapper())
  })
  editor.Commands.add('components:select', (_ed, _sender, options: any = {}) => {
    const { id } = options
    if (!id) throw new Error('Required: id. Use element(action:\'list\') to see all component ids.')
    const found = findByAgentId(editor, id)
    if (!found) throw new Error(`Component "${id}" not found. Use element(action:'list') to see all component ids.`)
    editor.select(found)
  })
  editor.Commands.add('components:remove', (_ed, _sender, options: any = {}) => {
    const comp = options.id ? findByAgentId(editor, options.id) : editor.getSelected()
    if (!comp) throw new Error(options.id ? `Component "${options.id}" not found. Use element(action:'list') to see all component ids.` : 'No component selected. Use element(action:\'select\') first, or pass {id}.')
    if (comp === editor.getWrapper()) throw new Error('Cannot remove the body component.')
    comp.remove()
  })
  editor.Commands.add('components:move', (_ed, _sender, options: any = {}) => {
    const { id, targetId, position } = options
    if (!id) throw new Error('Required: id — the component to move. Use element(action:\'list\') to see all ids.')
    if (!targetId) throw new Error('Required: targetId — the parent to move into. Use element(action:\'list\') to see all ids.')
    const comp = findByAgentId(editor, id)
    if (!comp) throw new Error(`Component "${id}" not found. Use element(action:'list') to see all component ids.`)
    const target = findByAgentId(editor, targetId)
    if (!target) throw new Error(`Target "${targetId}" not found. Use element(action:'list') to see all component ids.`)
    const { parent, at } = place(editor, target, position)
    if ([parent, ...parent.parents()].includes(comp)) {
      throw new Error(`Can not move ${describe(editor, comp)} into itself or one of its children. Nothing was changed. Choose a targetId outside of it.`)
    }
    if (!editor.Components.canMove(parent, comp, at).result) {
      throw new Error(`${describe(editor, comp)} can not go into ${describe(editor, parent)}. Nothing was changed. Choose another targetId or position.`)
    }
    comp.move(parent, { at })
  })
  editor.Commands.add('components:update', (_ed, _sender, options: any = {}) => {
    const selected = editor.getSelected()
    if (!selected) throw new Error('No component selected. Use element(action:\'select\') first.')
    const { content, tagName, attributes } = options
    let children: Component[] | undefined
    if (content !== undefined) {
      selected.empty()
      children = content ? selected.append(content) : []
    }
    if (tagName) selected.set('tagName', tagName)
    if (attributes && typeof attributes === 'object') {
      Object.entries(attributes).forEach(([k, v]) => selected.addAttributes({ [k]: v }))
    }
    if (content === undefined && !tagName && !attributes) {
      throw new Error('Required: at least one of {content, tagName, attributes}. Example: {content: "<b>Hello</b>"} or {tagName: "section"} or {attributes: {title: "My div"}}')
    }
    if (children) return created(editor, children, selected, { select: false })
  })

  // CSS Classes
  editor.Commands.add('classes:list', () => {
    const selected = editor.getSelected()
    if (!selected) throw new Error('No component selected. Use element(action:\'select\') first.')
    return selected.getClasses()
  })
  editor.Commands.add('classes:add', (_ed, _sender, options: any = {}) => {
    const selected = editor.getSelected()
    if (!selected) throw new Error('No component selected. Use element(action:\'select\') first.')
    const { name } = options
    if (!name) throw new Error('Required: name (CSS class name, e.g. "my-card", "container"). Use element(action:\'list_classes\') to see existing classes.')
    selected.addClass(name)
  })
  editor.Commands.add('classes:remove', (_ed, _sender, options: { name?: string } = {}) => {
    const selected = editor.getSelected()
    if (!selected) throw new Error('No component selected. Use element(action:\'select\') first.')
    const { name } = options
    if (!name) throw new Error('Required: name (CSS class name). Use element(action:\'list_classes\') to see classes on the selected component.')
    const classes: string[] = selected.getClasses()
    if (!classes.includes(name)) {
      throw new Error(classes.length
        ? `Class "${name}" is not on the selected element. Its classes are: ${classes.join(', ')}.`
        : `Class "${name}" is not on the selected element. It has no classes.`)
    }
    selected.removeClass(name)
  })

  // Devices
  editor.Commands.add('device:list', () => {
    return editor.Devices.getDevices()
      .map(device => `${device.getName()}: ${device.get('widthMedia') ? `up to ${device.get('widthMedia')}` : 'every screen size'}`)
      .join('\n')
  })
  editor.Commands.add('device:select', (_ed, _sender, options: { name?: string } = {}) => {
    const devices = editor.Devices.getDevices()
    const device = devices.find(d => d.getName() === options.name)
    if (!device) throw new Error(`Set name to one of: ${devices.map(d => d.getName()).join(', ')}.`)
    editor.Devices.select(device)
  })

  // Register AI capabilities
  editor.on('ai-capabilities:ready', (addCapability, describeTool) => {
    addCapability({
      tool: 'element',
      action: 'list_blocks',
      command: 'blocks:list',
      description: 'List available blocks',
      readOnly: true,
    })
    addCapability({
      tool: 'element',
      action: 'insert_block',
      command: 'blocks:add',
      description: 'Insert a block relative to the selected element (the body if none) and select it',
      inputSchema: {
        type: 'object',
        required: ['blockId'],
        properties: {
          blockId: { type: 'string' },
          position: POSITION_SCHEMA,
        },
      },
    })
    addCapability({
      tool: 'element',
      action: 'list',
      command: 'components:list',
      description: 'List all elements in the page',
      readOnly: true,
    })
    addCapability({
      tool: 'element',
      action: 'select',
      command: 'components:select',
      description: 'Select an element by id',
      inputSchema: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    })
    addCapability({
      tool: 'element',
      action: 'remove',
      command: 'components:remove',
      description: 'Remove an element',
      destructive: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Element id. Omit to remove selected.' },
        },
      },
    })
    addCapability({
      tool: 'element',
      action: 'move',
      command: 'components:move',
      description: 'Move an element relative to a target element',
      inputSchema: {
        type: 'object',
        required: ['id', 'targetId'],
        properties: {
          id: { type: 'string', description: 'Element to move' },
          targetId: { type: 'string', description: 'Element it goes inside, before or after' },
          position: POSITION_SCHEMA,
        },
      },
    })
    addCapability({
      tool: 'element',
      action: 'update',
      command: 'components:update',
      description: 'Update content, tagName or attributes of selected element',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'HTML that replaces the children' },
          tagName: { type: 'string' },
          attributes: { type: 'object' },
        },
      },
    })
    addCapability({
      tool: 'element',
      action: 'list_classes',
      command: 'classes:list',
      description: 'List CSS classes on selected element',
      readOnly: true,
    })
    addCapability({
      tool: 'element',
      action: 'add_class',
      command: 'classes:add',
      description: 'Add CSS class to selected element',
      inputSchema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
        },
      },
    })
    addCapability({
      tool: 'element',
      action: 'remove_class',
      command: 'classes:remove',
      description: 'Remove CSS class from selected element',
      destructive: true,
      inputSchema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
        },
      },
    })
    const devices = editor.Devices.getDevices()
    const base = devices.find(device => !device.get('widthMedia'))?.getName() ?? 'Desktop'
    describeTool('device', `Screen sizes. Styles written for ${base} apply to every size. A smaller size only overrides them below its width: select it only for responsive changes, then select ${base} again.`)
    addCapability({
      tool: 'device',
      action: 'list',
      command: 'device:list',
      description: 'the screen sizes and where their styles apply.',
      readOnly: true,
    })
    addCapability({
      tool: 'device',
      action: 'select',
      command: 'device:select',
      description: 'choose the screen size that styles are written for.',
      inputSchema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', enum: devices.map(d => d.getName()) },
        },
      },
    })
  })
}
