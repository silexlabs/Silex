export function registerCapabilities(addCapability: (def: Record<string, unknown>) => void) {
  addCapability({
    id: 'selector:get',
    command: 'selector:get',
    description: 'Get the selector that styles_set writes to, for the selected element',
    readOnly: true,
    tags: ['selectors'],
  })
  addCapability({
    id: 'selector:set',
    command: 'selector:set',
    description: 'Choose the selector that styles_set writes to. It must match the selected element (for a new class, call classes_add first). One relation and one state at most, like ".card:hover" or ".list > .card". For a screen size, call device_set',
    inputSchema: {
      type: 'object',
      required: ['selector'],
      properties: {
        selector: { type: 'string', description: 'CSS selector that matches the selected element' },
      },
    },
    tags: ['selectors'],
  })
  addCapability({
    id: 'selector:list-rules',
    command: 'selector:list-rules',
    description: 'List the selectors with styles that apply to the selected element',
    readOnly: true,
    tags: ['selectors'],
  })
  addCapability({
    id: 'styles:get',
    command: 'styles:get',
    description: 'Get the CSS of the selector chosen with selector_set',
    readOnly: true,
    tags: ['styles'],
  })
  addCapability({
    id: 'styles:set',
    command: 'styles:set',
    description: 'Add or change CSS properties on the selector chosen with selector_set, for the current screen size (device_set). Other properties stay. Set all the properties in one call',
    inputSchema: {
      type: 'object',
      required: ['css'],
      properties: {
        css: { type: 'string', description: 'CSS declarations, like "display: flex; gap: 16px; color: #222"' },
      },
    },
    tags: ['styles'],
  })
  addCapability({
    id: 'styles:remove',
    command: 'styles:remove',
    description: 'Remove a CSS property from the selector chosen with selector_set',
    destructive: true,
    inputSchema: {
      type: 'object',
      required: ['property'],
      properties: {
        property: { type: 'string', description: 'CSS property name, like "color"' },
      },
    },
    tags: ['styles'],
  })
  addCapability({
    id: 'selector:info',
    command: 'selector:info',
    description: 'List the states you can use in selector_set, with examples',
    readOnly: true,
    tags: ['selectors'],
  })
}
