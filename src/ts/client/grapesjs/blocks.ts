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
    {
      id: 'section',
      def: {
        label: 'Section',
        category: 'Containers',
        attributes: { class: 'fa fa-list-alt' },
        draggable: 'body',
        content: {
          tagName: 'section',
          attributes: { class: clsSectionBackground },
          styles: `
          .${clsSectionBackground} {
            display: flex;
            justify-content: center;
          }
          `,
          components: [
            {
              tagName: 'div',
              name: 'Section container',
              attributes: { class: [clsSection, 'website-width'] },
              draggable: false,
              removable: false,
              resizable: true,
              styles: `
              .${clsSection} {
                min-height: 100px;
                width: 1200px;
              }
              `,
            },
          ],
        },
      },
    },
    createContainerDef(editor),
    {
      id: 'link-block',
      def: {
        category: 'Containers',
        label: 'Link Block',
        attributes: { class: 'fa fa-link' },
        content: {
          type: 'link',
          editable: false,
          droppable: true,
          style:{
            display: 'inline-block',
            padding: '5px',
            'min-height': '100px',
            'width': '100px'
          }
        },
      },
    },
  ]
  .forEach(block => editor.BlockManager.add(block.id, block.def))
})


function createContainerDef(editor) {
  // inspired by https://github.com/olivmonnier/grapesjs-plugin-header/blob/master/src/components.js
  const domc = editor.DomComponents
  const type = domc.getType('default')

  const tags = [
    'DIV',
    'SECTION',
    'ADDRESS',
    'ARTICLE',
    'ASIDE',
    'FOOTER',
    'HEADER',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'HGROUP',
    'MAIN',
    'NAV',
    'BLOCKQUOTE',
    'DD',
    'DL',
    'DT',
    'FIGCAPTION',
    'FIGURE',
    'MAIN',
    'P',
    'PRE',
  ]
  domc.addType('container', {
    model: type.model.extend(
      {
        defaults: Object.assign({}, type.model.prototype.defaults, {
          tagName: 'div', // by default
          resizable: true,
          attributes: {
            'data-silex-container': '',
          },
          traits: [
            {
              type: 'select',
              options: tags.map(tag => ({value: tag, name: tag })),
              label: 'Tag name',
              name: 'tagName',
              changeProp: 1,
            },
          ],
        }),
      },
      {
        isComponent(el) {
          if (
            el &&
            el.hasAttribute &&
            el.hasAttribute('data-silex-container')
          ) {
            return { type: 'container' }
          }
        },
      },
    ),
    view: type.view,
  })
  return {
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
  }
}

