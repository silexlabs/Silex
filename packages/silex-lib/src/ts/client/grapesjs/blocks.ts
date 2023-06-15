export const blocksPlugin = (editor, opts) => {
  // Defaults
  const options = {
    ...opts,
  }
  // Container block
  const containerId = 'container'
  editor.BlockManager.add(containerId, {
    label: 'Container',
    category: 'Basics',
    attributes: { class: 'container-png' },
    content: {
      type: containerId, // display as "Container"
      style: {
        'min-height': '100px',
      },
    },
  })
  editor.DomComponents.addType(containerId, {})
}
