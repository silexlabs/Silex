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

import { Editor } from 'grapesjs'

/**
 * Core GrapesJS commands for blocks, components, styles and classes.
 * Registered as AI capabilities via grapesjs-ai-capabilities.
 */

function findComponentById(editor: Editor, id: string) {
  const all: any[] = []
  const collect = (c) => { all.push(c); c.components().forEach(collect) }
  collect(editor.getWrapper())
  return all.find(c => c.getId() === id)
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
    if (!blockId) throw new Error('Required: blockId. Use blocks:list to see available blocks.')
    const block = editor.BlockManager.get(blockId)
    if (!block) throw new Error(`Block "${blockId}" not found. Use blocks:list to see available blocks.`)
    const selected = editor.getSelected() || editor.getWrapper()
    return selected.append(block.getContent())?.[0]?.toHTML()
  })

  // Components
  editor.Commands.add('components:list', () => {
    const walk = (comp, depth = 0) => {
      const result: any[] = [{
        id: comp.getId(),
        tagName: comp.get('tagName'),
        type: comp.get('type'),
        name: comp.getName(),
        depth,
      }]
      comp.components().forEach(c => result.push(...walk(c, depth + 1)))
      return result
    }
    return walk(editor.getWrapper())
  })
  editor.Commands.add('components:select', (_ed, _sender, options: any = {}) => {
    const { id } = options
    if (!id) throw new Error('Required: id. Use components:list to see all component ids.')
    const found = findComponentById(editor, id)
    if (!found) throw new Error(`Component "${id}" not found. Use components:list to see all component ids.`)
    editor.select(found)
  })
  editor.Commands.add('components:remove', (_ed, _sender, options: any = {}) => {
    const comp = options.id ? findComponentById(editor, options.id) : editor.getSelected()
    if (!comp) throw new Error(options.id ? `Component "${options.id}" not found. Use components:list to see all component ids.` : 'No component selected. Use components:select first, or pass {id}.')
    if (comp === editor.getWrapper()) throw new Error('Cannot remove the body component.')
    comp.remove()
  })
  editor.Commands.add('components:move', (_ed, _sender, options: any = {}) => {
    const { id, targetId, position } = options
    if (!id) throw new Error('Required: id — the component to move. Use components:list to see all ids.')
    if (!targetId) throw new Error('Required: targetId — the parent to move into. Use components:list to see all ids.')
    const comp = findComponentById(editor, id)
    if (!comp) throw new Error(`Component "${id}" not found. Use components:list to see all component ids.`)
    const target = findComponentById(editor, targetId)
    if (!target) throw new Error(`Target "${targetId}" not found. Use components:list to see all component ids.`)
    const idx = typeof position === 'number' ? position : undefined
    target.append(comp.clone(), { at: idx })
    comp.remove()
  })
  editor.Commands.add('components:update', (_ed, _sender, options: any = {}) => {
    const selected = editor.getSelected()
    if (!selected) throw new Error('No component selected. Use components:select first.')
    const { content, tagName, attributes } = options
    if (content !== undefined) selected.components(content)
    if (tagName) selected.set('tagName', tagName)
    if (attributes && typeof attributes === 'object') {
      Object.entries(attributes).forEach(([k, v]) => selected.addAttributes({ [k]: v }))
    }
    if (content === undefined && !tagName && !attributes) {
      throw new Error('Required: at least one of {content, tagName, attributes}. Example: {content: "<b>Hello</b>"} or {tagName: "section"} or {attributes: {title: "My div"}}')
    }
  })

  // Styles
  editor.Commands.add('styles:get', () => {
    const selected = editor.getSelected()
    if (!selected) throw new Error('No component selected. Use components:select first.')
    return selected.getStyle()
  })
  editor.Commands.add('styles:set', (_ed, _sender, options: any = {}) => {
    const selected = editor.getSelected()
    if (!selected) throw new Error('No component selected. Use components:select first.')
    const { property, value, ...rest } = options
    if (property && value !== undefined) {
      selected.addStyle({ [property]: value })
    } else if (Object.keys(rest).length) {
      selected.addStyle(rest)
    } else {
      throw new Error('Required: {property, value} or CSS key-value pairs. Example: {property: "color", value: "red"} or {"color": "red", "font-size": "16px"}')
    }
  })
  editor.Commands.add('styles:remove', (_ed, _sender, options: any = {}) => {
    const selected = editor.getSelected()
    if (!selected) throw new Error('No component selected. Use components:select first.')
    const { property } = options
    if (!property) throw new Error('Required: property (CSS property name, e.g. "color", "font-size", "margin")')
    selected.removeStyle(property)
  })

  // CSS Classes
  editor.Commands.add('classes:list', () => {
    const selected = editor.getSelected()
    if (!selected) throw new Error('No component selected. Use components:select first.')
    return selected.getClasses()
  })
  editor.Commands.add('classes:add', (_ed, _sender, options: any = {}) => {
    const selected = editor.getSelected()
    if (!selected) throw new Error('No component selected. Use components:select first.')
    const { name } = options
    if (!name) throw new Error('Required: name (CSS class name, e.g. "my-card", "container"). Use classes:list to see existing classes.')
    selected.addClass(name)
  })
  editor.Commands.add('classes:remove', (_ed, _sender, options: any = {}) => {
    const selected = editor.getSelected()
    if (!selected) throw new Error('No component selected. Use components:select first.')
    const { name } = options
    if (!name) throw new Error('Required: name (CSS class name). Use classes:list to see classes on the selected component.')
    selected.removeClass(name)
  })

  // Register AI capabilities
  editor.on('ai-capabilities:ready', (addCapability) => {
    addCapability({
      id: 'blocks:list',
      command: 'blocks:list',
      description: 'List available blocks',
      tags: ['blocks'],
    })
    addCapability({
      id: 'blocks:add',
      command: 'blocks:add',
      description: 'Insert a block into selected component',
      inputSchema: {
        type: 'object',
        required: ['blockId'],
        properties: {
          blockId: { type: 'string' },
        },
      },
      tags: ['blocks'],
    })
    addCapability({
      id: 'components:list',
      command: 'components:list',
      description: 'List all components in the page',
      tags: ['components'],
    })
    addCapability({
      id: 'components:select',
      command: 'components:select',
      description: 'Select a component by id',
      inputSchema: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      tags: ['components'],
    })
    addCapability({
      id: 'components:remove',
      command: 'components:remove',
      description: 'Remove a component',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Component id. Omit to remove selected.' },
        },
      },
      tags: ['components'],
    })
    addCapability({
      id: 'components:move',
      command: 'components:move',
      description: 'Move a component into another parent',
      inputSchema: {
        type: 'object',
        required: ['id', 'targetId'],
        properties: {
          id: { type: 'string' },
          targetId: { type: 'string' },
          position: { type: 'number', description: 'Index in target children' },
        },
      },
      tags: ['components'],
    })
    addCapability({
      id: 'components:update',
      command: 'components:update',
      description: 'Update content, tagName or attributes of selected component',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'HTML content' },
          tagName: { type: 'string' },
          attributes: { type: 'object' },
        },
      },
      tags: ['components'],
    })
    addCapability({
      id: 'styles:get',
      command: 'styles:get',
      description: 'Get styles of selected component',
      tags: ['styles'],
    })
    addCapability({
      id: 'styles:set',
      command: 'styles:set',
      description: 'Set style on selected component',
      inputSchema: {
        type: 'object',
        properties: {
          property: { type: 'string' },
          value: { type: 'string' },
        },
      },
      tags: ['styles'],
    })
    addCapability({
      id: 'styles:remove',
      command: 'styles:remove',
      description: 'Remove a style property from selected component',
      inputSchema: {
        type: 'object',
        required: ['property'],
        properties: {
          property: { type: 'string' },
        },
      },
      tags: ['styles'],
    })
    addCapability({
      id: 'classes:list',
      command: 'classes:list',
      description: 'List CSS classes on selected component',
      tags: ['classes'],
    })
    addCapability({
      id: 'classes:add',
      command: 'classes:add',
      description: 'Add CSS class to selected component',
      inputSchema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
        },
      },
      tags: ['classes'],
    })
    addCapability({
      id: 'classes:remove',
      command: 'classes:remove',
      description: 'Remove CSS class from selected component',
      inputSchema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
        },
      },
      tags: ['classes'],
    })
  })
}
