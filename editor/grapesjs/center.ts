import { Editor } from 'grapesjs'

const CENTER_COMMAND = 'silex:center-h'

export default (editor: Editor) => {
  editor.Commands.add(CENTER_COMMAND, () => {
    const cmp = editor.getSelected()
    if (!cmp) return

    const style = cmp.getStyle()
    const isCentered =
        style['margin-left'] === 'auto' &&
        style['margin-right'] === 'auto'

    if (isCentered) {
      const {
        ['margin-left']: _marginLeft,
        ['margin-right']: _marginRight,
        ...newStyle
      } = style

      cmp.setStyle(newStyle)
      return
    }

    cmp.setStyle({
      ...style,
      'margin-left': 'auto',
      'margin-right': 'auto',
    })
  })

  editor.on('component:selected', component => {
    if (component.toolbar.some(item => item.command === CENTER_COMMAND)) {
      return
    }

    component.set('toolbar', [
      ...component.toolbar,
      {
        attributes: {
          class: 'fa-solid fa-align-center',
          title: 'Center horizontally',
          'aria-label': 'Center horizontally',
        },
        command: CENTER_COMMAND,
      },
    ])
  })
}