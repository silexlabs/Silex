import commands from './commands'
import en from './locale/en'
import { NOTIFICATION_CHANGED, NotificationEditor, NotificationManager, NotificationManagerOptions } from './NotificationManager'
import view from './view'

export default (editor: NotificationEditor, opts: NotificationManagerOptions = {}) => {
  const options = { ...{
    i18n: {},
    style: {},
    container: document.body,
    timeout: undefined,
    storeKey: undefined,
  },  ...opts }  
  
  // Load i18n files
  editor.I18n && editor.I18n.addMessages({
      en,
      ...options.i18n,
  })

  // Create the storage if needed
  const storage = options.storeKey ? new Storage() : null

  // Register the Notification Manager
  editor.NotificationManager = new NotificationManager(storage?.getAll() || [], editor, options)
  
  // Add commands
  commands(editor, options)
  
  editor.on(NOTIFICATION_CHANGED, () => {
    // Update the storage when the notifications change
    storage?.save(editor.NotificationManager.getAll())
    // Render the notifications
    view(options.container, editor.NotificationManager.getAll())
  })

}