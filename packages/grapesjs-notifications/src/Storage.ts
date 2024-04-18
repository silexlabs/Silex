import { Notification } from './Notification'
import { NotificationEditor, NotificationManagerOptions } from './NotificationManager'

/**
 * @fileoverview Storage class
 * Stores the notifications in the local storage
 */

export class Storage {
  constructor(protected editor: NotificationEditor, protected options: NotificationManagerOptions) {}
  getAll(): Notification[] {
    if(!this.options.storeKey) return []
    return JSON.parse(localStorage.getItem(this.options.storeKey) || '[]')
      .map((data: any) => new Notification(this.editor, data))
  }
  save(data: Notification[]) {
    if(!this.options.storeKey) return
    localStorage.setItem(this.options.storeKey, JSON.stringify(data))
  }
}
