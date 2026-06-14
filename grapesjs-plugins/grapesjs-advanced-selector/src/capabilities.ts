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
    id: 'selector:edit-style',
    command: 'selector:edit-style',
    description: 'Activate a selector for styling (use before styles:set)',
    inputSchema: {
      type: 'object',
      required: ['selector'],
      properties: {
        selector: { type: 'string', description: 'CSS selector to activate for style editing' },
      },
    },
    tags: ['selectors'],
  })
  addCapability({
    id: 'selector:info',
    command: 'selector:info',
    description: 'List valid pseudo-classes, operators, and selector examples',
    readOnly: true,
    tags: ['selectors'],
  })
}
