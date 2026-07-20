export function registerCapabilities(addCapability: (def: Record<string, unknown>) => void) {
  addCapability({
    id: 'selector:get',
    command: 'selector:get',
    description: 'Get CSS selector of selected element',
    readOnly: true,
    tags: ['selectors'],
  })
  addCapability({
    id: 'selector:set',
    command: 'selector:set',
    description: 'Set CSS selector on selected element',
    inputSchema: {
      type: 'object',
      required: ['selector'],
      properties: {
        selector: { type: 'string', description: 'CSS selector string. Examples: ".my-class", "div.card:hover", ".parent > .child"' },
      },
    },
    tags: ['selectors'],
  })
  addCapability({
    id: 'selector:list-rules',
    command: 'selector:list-rules',
    description: 'List all CSS rules applied to selected element',
    readOnly: true,
    tags: ['selectors'],
  })
  addCapability({
    id: 'styles:get',
    command: 'styles:get',
    description: 'Get CSS styles from the active selector (set via selector:set)',
    readOnly: true,
    tags: ['styles'],
  })
  addCapability({
    id: 'styles:set',
    command: 'styles:set',
    description: 'Set CSS style on the active selector (set via selector:set)',
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
    description: 'Remove a CSS property from the active selector (set via selector:set)',
    destructive: true,
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
    id: 'selector:info',
    command: 'selector:info',
    description: 'List valid pseudo-classes, operators, and selector examples',
    readOnly: true,
    tags: ['selectors'],
  })
}
