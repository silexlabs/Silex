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
  //el.classList.add('gjs-sm', 'gjs-one-bg', 'gjs-two-color')
  document.body.appendChild(el)
  return el
}

export default (editor: NotificationEditor, opts: Partial<NotificationManagerOptions> = {}) => {
  const options = { ...{
    i18n: {},
    style: {
      top: '10px',
      right: '10px',
      maxWidth: '300px',
      zIndex: 9999,
      listStyle: 'none',
      padding: '10px',
      margin: '10px',
      fontFamily: 'var(--gjs-main-font)',
      fontSize: 'var(--gjs-font-size)',
    },
    container: defaultContainer(opts.container)!,
    storeKey: undefined,
    maxNotifications: 5,
    reverse: false,
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
    view(editor, options.container, editor.NotificationManager.getAll(), options)
  })

}