import { Editor } from 'grapesjs'
import { ConnectorUser } from '~/common/types'
import { PROJECT_BAR_PANEL_ID } from './project-bar'

export function bindLogoutButtonVisibility(editor: Editor): void {
  const button = editor.Panels.getButton(PROJECT_BAR_PANEL_ID, 'logout-button')
  if (!button) return

  const model = editor.getModel()
  const updateVisibility = () => {
    const user = model.get('user') as ConnectorUser | null | undefined
    const className: string = button.get('className') || ''
    const classes = className.split(/\s+/).filter(name => name !== 'gjs-hidden')
    if (!user?.storage || user.storage.disableLogout) classes.push('gjs-hidden')
    button.set('className', classes.join(' '))
  }

  model.on('change:user', updateVisibility)
  updateVisibility()
}
