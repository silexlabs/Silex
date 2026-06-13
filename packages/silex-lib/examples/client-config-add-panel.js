import { addButton } from '@silexlabs/silex/src/ts/client/grapesjs/project-bar'

export default function (config, options) {
  const editor = config.getEditor()
  config.on('silex:startup:end', () => {
    addButton(editor, {
      id: 'database',
      className: 'font-manager-btn fa-solid fa-database',
      attributes: { title: 'Database' },
      command: () => {
        console.log('Run command to open a dialog or panel')
      },
    })
  })
}
