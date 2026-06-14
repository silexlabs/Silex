import { Editor } from "grapesjs"
import { Notification, NotificationOptions as BaseNotificationOptions } from "./Notification"
import { StyleInfo } from "lit/directives/style-map"

export interface NotificationOptions extends BaseNotificationOptions {
  id?: string
}

// Events
export const NOTIFICATION_CHANGED = 'notifications:changed'
export const NOTIFICATION_ADDED = 'notifications:added'
export const NOTIFICATION_REMOVED = 'notifications:removed'
export const NOTIFICATION_CLEARED = 'notifications:cleared'

export interface NotificationManagerOptions {
  style?: Readonly<StyleInfo>
  container: HTMLElement
  maxNotifications?: number
  reverse?: boolean
  timeout?: number
  storeKey?: string
  i18n?: any
  icons?: {
    info?: string
    warning?: string
    error?: string
    success?: string
  }
}

/**
 * GrapesJs plugin to manage notifications
 */
export class NotificationManager {
  private notifications: Notification[] = []

  constructor(initialNotifications: any[], protected editor: Editor, protected options: NotificationManagerOptions) {
    // Convert initial data to notification objects
    this.notifications = initialNotifications.map(data => {
      if (typeof data === 'object' && data.message) {
        const removeCallback = (notification: Notification) => this.remove(notification)
        return new Notification(this.editor, data, removeCallback)
      }
      return data
    }).filter(Boolean)
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return [...this.notifications]
  }

  /**
   * Add a notification
   */
  add(options: NotificationOptions): void {
    if (options.id) {
      // Remove any existing notification with the same id
      const existing = this.notifications.find(n => n.options.id === options.id)
      if (existing) {
        this.remove(existing)
      }
    }
    const removeCallback = (notification: Notification) => this.remove(notification)
    const notification = new Notification(this.editor, options, removeCallback)
    this.notifications.push(notification)
    this.editor.trigger(NOTIFICATION_ADDED, notification)
    this.editor.trigger(NOTIFICATION_CHANGED, this.getAll())
  }

  /**
   * Remove a notification
   */
  remove(notification: Notification | any): void {
    const index = this.notifications.findIndex(n => n === notification || n.model === notification)
    if (index > -1) {
      const removed = this.notifications.splice(index, 1)[0]
      this.editor.trigger(NOTIFICATION_REMOVED, removed)
      this.editor.trigger(NOTIFICATION_CHANGED, this.getAll())
    }
  }

  /**
   * Clear all notifications
   */
  reset(): void {
    this.notifications = []
    this.editor.trigger(NOTIFICATION_CLEARED)
    this.editor.trigger(NOTIFICATION_CHANGED, this.getAll())
  }
}
