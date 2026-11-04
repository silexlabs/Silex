import type { AddCapability, DescribeTool } from '@silexlabs/grapesjs-ai-capabilities'

export function registerCapabilities(addCapability: AddCapability, describeTool: DescribeTool) {
  const elementId = { type: 'string', description: 'Element id, like "ab12". Default: the selected element' }
  const selector = { type: 'string', description: 'CSS selector that matches the element, one relation and one state at most, like ".card", ".card:hover" or ".list > .card"' }
  describeTool('style', 'CSS rules, written for the selected breakpoint.')
  addCapability({
    tool: 'style',
    action: 'list',
    command: 'selector:list-rules',
    description: 'the selectors with styles for an element, and their breakpoint.',
    readOnly: true,
    inputSchema: { type: 'object', properties: { element_id: elementId } },
  })
  addCapability({
    tool: 'style',
    action: 'get',
    command: 'styles:get',
    description: 'the CSS of a selector.',
    readOnly: true,
    inputSchema: { type: 'object', properties: { element_id: elementId, selector } },
  })
  addCapability({
    tool: 'style',
    action: 'set',
    command: 'styles:set',
    description: 'add or change CSS properties, the others stay. Set them all in one call.',
    inputSchema: {
      type: 'object',
      required: ['css'],
      properties: {
        element_id: elementId,
        selector,
        css: { type: 'string', description: 'CSS declarations, like "display: flex; gap: 16px; color: #222"' },
      },
    },
  })
  addCapability({
    tool: 'style',
    action: 'remove',
    command: 'styles:remove',
    description: 'remove a CSS property.',
    destructive: true,
    inputSchema: {
      type: 'object',
      required: ['property'],
      properties: {
        element_id: elementId,
        selector,
        property: { type: 'string', description: 'CSS property name, like "color"' },
      },
    },
  })
}
