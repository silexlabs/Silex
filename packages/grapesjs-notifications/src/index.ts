import commands from './commands'
import en from './locale/en'
import { NOTIFICATION_CHANGED, NotificationEditor, NotificationManager, NotificationManagerOptions } from './NotificationManager'
import view from './view'

/**
 * Create a container if needed, make it sticky and append it to the body
 * If container exists do nothing
 */
function defaultContainer(container: HTMLElement | undefined): HTMLElement | null {
  if(container) return null
  const el = document.createElement('ul')
  el.style.position = 'fixed'
  el.style.bottom = '10px'
  el.style.zIndex = '9999'
  document.body.appendChild(el)
  return el
}

export default (editor: NotificationEditor, opts: Partial<NotificationManagerOptions> = {}) => {
  const options = { ...{
    i18n: {},
    style: {
      top: '10px',
      right: '10px',
      zIndex: 9999,
      listStyle: 'none',
      padding: '10px',
      margin: '10px',
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      borderRadius: '3px',
      boxShadow: '0 0 5px rgba(0,0,0,.3)',
      transition: 'all .3s',
    },
    container: defaultContainer(opts.container)!,
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
  commands(editor)
  
  editor.on(NOTIFICATION_CHANGED, () => {
    // Update the storage when the notifications change
    storage?.save(editor.NotificationManager.getAll())
    // Render the notifications
    view(options.container, editor.NotificationManager.getAll(), options)
  })

}