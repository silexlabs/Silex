import * as grapesjs from 'grapesjs/dist/grapes.min.js'

const pluginName = 'richText'

export const richTextPlugin = grapesjs.plugins.add(pluginName, (editor, opts) => {
  editor.RichTextEditor.add('orderedList', {
    icon: '1.',
    attributes: {title: 'Ordered List'},
    result: rte => rte.exec('insertOrderedList'),
  })
  editor.RichTextEditor.add('unorderedList', {
    icon: '<i class="fa fa-list-ul"></i>',
    attributes: {title: 'Unordered List'},
    result: rte => rte.exec('insertUnorderedList'),
  })
})
