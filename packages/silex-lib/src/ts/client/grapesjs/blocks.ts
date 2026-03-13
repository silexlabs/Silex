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

/**
 * Default styles for blocks, applied via CSS classes instead of inline styles.
 * This prevents GrapesJS from adding auto-generated IDs to published HTML
 * (GrapesJS adds IDs to components with inline styles for #id CSS selectors).
 */
const BLOCK_DEFAULT_STYLES: Record<string, Record<string, string>> = {
  'container': { 'min-height': '100px' },
  'text': { 'padding': '10px' },
}

function defaultClassName(blockType: string): string {
  if (blockType in BLOCK_DEFAULT_STYLES) return `silex-default-${blockType}`
  return ''
}

export const blocksPlugin = (editor, opts) => {
  // Defaults
  const options = {
    ...opts,
  }

  // Container block — use class instead of inline style
  const containerId = 'container'
  editor.BlockManager.add(containerId, {
    label: 'Container',
    category: 'Basics',
    attributes: { class: 'container-png' },
    content: {
      type: containerId,
      classes: [defaultClassName(containerId)],
    },
  })
  editor.DomComponents.addType(containerId, {})

  // Override grapesjs-blocks-basic blocks to use classes instead of inline styles
  const blocksToFix = ['text', 'link', 'image', 'video', 'map']
  blocksToFix.forEach(blockId => {
    const block = editor.BlockManager.get(blockId)
    if (block) {
      const content = block.get('content')
      if (content && typeof content === 'object' && content.style) {
        delete content.style
        const cls = defaultClassName(blockId)
        if (cls) content.classes = [...(content.classes || []), cls]
        block.set('content', { ...content })
      }
    }
  })

  editor.on('canvas:frame:load', () => {
    Object.entries(BLOCK_DEFAULT_STYLES).forEach(([blockType, styles]) => {
      const selector = `.${defaultClassName(blockType)}`
      if (!editor.Css.getRule(selector)) {
        editor.Css.setRule(selector, styles)
      }
    })
  })
}
