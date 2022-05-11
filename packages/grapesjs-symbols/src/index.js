import { initSymbols } from './symbol';
import list from './list'

export default (editor, opts = {}) => {
  const options = { ...{
    // default options
    appendTo: '.gjs-pn-views-container',
  },  ...opts };

  editor.on('load', () => {
    editor.addComponents([{
      tagName: 'nav',
      content: 'Content text', // Text inside component
      style: { color: 'red'},
      title: 'symbol3',
      symbolId: true,
    },
{
      tagName: 'nav',
      content: 'Content text', // Text inside component
      style: { color: 'red'},
      title: 'symbol1',
      symbolId: true,
    },
{
      tagName: 'nav',
      content: 'Content text', // Text inside component
      style: { color: 'red'},
      title: 'symbol2',
      symbolId: true,
    },
      `<div style="margin:100px; padding:25px;">
            Content loaded from the plugin
        </div>`,
    ],
    )

    // keep track of symbols and changes
    initSymbols(editor, options)

    // display the list of symbols
    list(editor, options)
  })
};
