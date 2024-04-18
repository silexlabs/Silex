import { NotificationEditor, NotificationManagerOptions } from "./NotificationManager"

export const NOTIFICATION_ADD = 'notifications:add'
export const NOTIFICATION_REMOVE = 'notifications:remove'
export const NOTIFICATION_CLEAR = 'notifications:clear'

export default (editor: NotificationEditor, opts: NotificationManagerOptions = {}) => {
  editor.Commands.add(NOTIFICATION_ADD, (editor: NotificationEditor, sender: any, notification: NotificationOptions) => {
    editor.NotificationManager.add(notification)
  })
  editor.Commands.add(NOTIFICATION_REMOVE, (editor: NotificationEditor, sender: any, notification: Notification) => {
    editor.NotificationManager.remove(notification)
  })
  editor.Commands.add(NOTIFICATION_CLEAR, (editor: NotificationEditor, sender: any) => {
    editor.NotificationManager.reset()
  })
}
