import { Editor } from 'grapesjs'
import en from './locale/en'
import { 
  NotificationManager, 
  NotificationManagerOptions,
  NOTIFICATION_CHANGED,
  NOTIFICATION_ADDED,
  NOTIFICATION_REMOVED,
  NOTIFICATION_CLEARED
} from './NotificationManager'
import view from './view'
import { Storage } from './Storage'

// Commands
export const NOTIFICATION_ADD = 'notifications:add'
export const NOTIFICATION_REMOVE = 'notifications:remove' 
export const NOTIFICATION_CLEAR = 'notifications:clear'

// Events (re-exported from NotificationManager)
export {
  NOTIFICATION_CHANGED,
  NOTIFICATION_ADDED,
  NOTIFICATION_REMOVED,
  NOTIFICATION_CLEARED
}

// Types
export type { NotificationManagerOptions } from './NotificationManager'
export type { NotificationOptions } from './Notification'
export { Notification } from './Notification'

/**
 * Create a container if needed, make it sticky and append it to the body
 */
function createDefaultContainer(container?: HTMLElement): HTMLElement {
  if (container) return container
  
  const el = document.createElement('ul')
  el.style.position = 'fixed'
  el.style.bottom = '10px'
  el.style.zIndex = '9999'
  document.body.appendChild(el)
  return el
}

// GrapesJS Plugin
export default (editor: Editor, opts: Partial<NotificationManagerOptions> = {}) => {
  const options = {
    i18n: {},
    container: createDefaultContainer(opts.container),
    storeKey: undefined,
    maxNotifications: 50,
    reverse: false,
    ...opts
  } as NotificationManagerOptions

  // Load i18n files
  editor.I18n && editor.I18n.addMessages({
    en,
    ...options.i18n,
  })

  // Create storage if needed
  const storage = options.storeKey ? new Storage(options.storeKey) : null

  // Create notification manager
  const notificationManager = new NotificationManager(storage?.getAll() || [], editor, options)

  // Add commands
  editor.Commands.add(NOTIFICATION_ADD, {
    run(editor: Editor, sender: any, options: any) {
      notificationManager.add(options)
    }
  })

  editor.Commands.add(NOTIFICATION_REMOVE, {
    run(editor: Editor, sender: any, data: any) {
      const notification = data?.notification || data
      notificationManager.remove(notification)
    }
  })

  editor.Commands.add(NOTIFICATION_CLEAR, {
    run(editor: Editor) {
      notificationManager.reset()
    }
  })


  // Handle notification changes
  editor.on(NOTIFICATION_CHANGED, (notifications) => {
    // Use the passed notifications array or get all as fallback
    const allNotifications = notifications || notificationManager.getAll()
    // Update storage
    storage?.save(allNotifications)
    // Render notifications
    view(editor, options.container, allNotifications, options)
  })

  // Public API accessible via commands and events only
  return {
    getAll: () => notificationManager.getAll(),
    add: (notification: any) => editor.runCommand(NOTIFICATION_ADD, notification),
    remove: (notification: any) => editor.runCommand(NOTIFICATION_REMOVE, notification),
    clear: () => editor.runCommand(NOTIFICATION_CLEAR)
  }
}
