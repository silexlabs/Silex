import { Editor } from 'grapesjs'
import { ConnectorUser } from '~/common/types'
import { cmdLogout } from './LoginDialog'
import { PROJECT_BAR_PANEL_ID } from './project-bar'

export function createLogoutButton(editor: Editor) {
  const className = 'page-panel-btn fa fa-fw fa-sign-out'
  const button = editor.Panels.addButton(PROJECT_BAR_PANEL_ID, {
    id: 'logout-button',
    className: `${className} gjs-hidden`,
    attributes: { title: 'Sign out' },
    command: cmdLogout,
  })
  if (!button) return button

  const model = editor.getModel()
  const updateVisibility = () => {
    const user = model.get('user') as ConnectorUser | null | undefined
    const hidden = !user?.storage || user.storage.disableLogout
    button.set('className', className + (hidden ? ' gjs-hidden' : ''))
  }

  model.on('change:user', updateVisibility)
  updateVisibility()
  return button
}
