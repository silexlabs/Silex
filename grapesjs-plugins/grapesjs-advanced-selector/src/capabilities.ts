export function registerCapabilities(addCapability: (def: Record<string, unknown>) => void, describeTool?: (name: string, description: string) => void) {
  const elementId = { type: 'string', description: 'Element id, like "ab12". Default: the selected element' }
  const selector = { type: 'string', description: 'CSS selector that matches the element, one relation and one state at most, like ".card", ".card:hover" or ".list > .card"' }
  describeTool?.('style', 'CSS rules, written for the selected breakpoint. Styling never changes the classes of an element: for a new class, element(action:\'update\', add_class) first. element_id and selector are optional: by default, the selected element and the selector chosen with select. Giving them does not change the selection.')
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
    action: 'select',
    command: 'selector:set',
    description: 'choose the selector of the selected element that the other actions use by default.',
    inputSchema: {
      type: 'object',
      required: ['selector'],
      properties: { selector },
    },
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
