export function registerCapabilities(addCapability: (def: Record<string, unknown>) => void) {
  addCapability({
    tool: 'style',
    action: 'get_selector',
    command: 'selector:get',
    description: 'Get the selector that style(action:\'set\') writes to, for the selected element',
    readOnly: true,
  })
  addCapability({
    tool: 'style',
    action: 'select',
    command: 'selector:set',
    description: 'Choose the selector that style(action:\'set\') writes to. It must match the selected element (for a new class, call element(action:\'add_class\') first). One relation and one state at most, like ".card:hover" or ".list > .card". For a screen size, call device(action:\'select\')',
    inputSchema: {
      type: 'object',
      required: ['selector'],
      properties: {
        selector: { type: 'string', description: 'CSS selector that matches the selected element' },
      },
    },
  })
  addCapability({
    tool: 'style',
    action: 'list',
    command: 'selector:list-rules',
    description: 'List the selectors with styles that apply to the selected element',
    readOnly: true,
  })
  addCapability({
    tool: 'style',
    action: 'get',
    command: 'styles:get',
    description: 'Get the CSS of the selector chosen with style(action:\'select\')',
    readOnly: true,
  })
  addCapability({
    tool: 'style',
    action: 'set',
    command: 'styles:set',
    description: 'Add or change CSS properties on the selector chosen with style(action:\'select\'), for the current screen size (device(action:\'select\')). Other properties stay. Set all the properties in one call',
    inputSchema: {
      type: 'object',
      required: ['css'],
      properties: {
        css: { type: 'string', description: 'CSS declarations, like "display: flex; gap: 16px; color: #222"' },
      },
    },
  })
  addCapability({
    tool: 'style',
    action: 'remove',
    command: 'styles:remove',
    description: 'Remove a CSS property from the selector chosen with style(action:\'select\')',
    destructive: true,
    inputSchema: {
      type: 'object',
      required: ['property'],
      properties: {
        property: { type: 'string', description: 'CSS property name, like "color"' },
      },
    },
  })
  addCapability({
    tool: 'style',
    action: 'states',
    command: 'selector:info',
    description: 'List the states you can use in style(action:\'select\'), with examples',
    readOnly: true,
  })
}
