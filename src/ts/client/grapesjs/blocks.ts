import * as grapesjs from 'grapesjs/dist/grapes.min.js'

const pluginName = 'blocks'
const clsContainer = 'silex-container'
const clsSection = 'silex-section'
const clsSectionBackground = 'silex-section-background'

export const blocksPlugin = grapesjs.plugins.add(pluginName, (editor, opts) => {
  // Make row and column classes private
  const privateCls = [clsSection, clsSectionBackground, clsContainer]
    .map(cls => '.' + cls)
  editor.on(
    'selector:add',
    selector => privateCls.indexOf(selector.getFullName()) >= 0 && selector.set('private', 1)
  )
  ;[
    // {
    //   id: 'section',
    //   def: {
    //     label: 'Section',
    //     category: 'Containers',
    //     attributes: { class: 'fa fa-list-alt' },
    //     draggable: 'body',
    //     content: {
    //       tagName: 'section',
    //       attributes: { class: clsSectionBackground },
    //       styles: `
    //       .${clsSectionBackground} {
    //         display: flex;
    //         justify-content: center;
    //       }
    //       `,
    //       components: [
    //         {
    //           tagName: 'div',
    //           name: 'Section container',
    //           attributes: { class: [clsSection, 'website-width'] },
    //           draggable: false,
    //           removable: false,
    //           resizable: true,
    //           styles: `
    //           .${clsSection} {
    //             min-height: 100px;
    //             width: 1200px;
    //           }
    //           `,
    //         },
    //       ],
    //     },
    //   },
    // },
    {
      id: 'container',
      def: {
        label: 'Container',
        category: 'Containers',
        attributes: { class: 'container-png' },
        content: {
          type: 'container',
          attributes: { class: clsContainer },
          styles: `
          .${clsContainer} {
            min-height: 100px;
            width: 100px;
          }
          `,
        },
      },
    },
    // {
    //   id: 'link-block',
    //   def: {
    //     category: 'Containers',
    //     label: 'Link Block',
    //     attributes: { class: 'fa fa-link' },
    //     content: {
    //       type: 'link',
    //       editable: false,
    //       droppable: true,
    //       resizable: true,
    //       style:{
    //         display: 'inline-block',
    //         padding: '5px',
    //         'min-height': '100px',
    //         'width': '100px'
    //       }
    //     },
    //   },
    // },
  ]
  .forEach(block => editor.BlockManager.add(block.id, block.def))
})

