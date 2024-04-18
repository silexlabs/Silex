import Backbone from "backbone"
import { Editor } from "grapesjs"
import { Notification, NotificationModel } from "./Notification"
import { StyleInfo } from "lit/directives/style-map"

export interface NotificationEditor extends Editor {
  NotificationManager: NotificationManager
}

export const NOTIFICATION_CHANGED = 'notifications:changed'
export const NOTIFICATION_ADD = 'notifications:added'
export const NOTIFICATION_REMOVE = 'notifications:removed'
export const NOTIFICATION_CLEAR = 'notifications:cleared'

export interface NotificationManagerOptions {
  style: Readonly<StyleInfo>
  container: HTMLElement
  timeout?: number
  storeKey?: string
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
export class NotificationManager extends Backbone.Collection<NotificationModel> {
  constructor(models: Notification[], protected editor: NotificationEditor,  protected options: NotificationManagerOptions) {
    super(models, options)

    // Make sure the symbol CRUD operations are undoable
    this.editor.UndoManager.add(this)

    // Relay events from model to the editor
    this.on('all', () => this.modelChanged())
    this.on('reset', () => this.editor.trigger(NOTIFICATION_CLEAR))
    this.on('add', (model: Notification) => this.editor.trigger(NOTIFICATION_ADD, model))
    this.on('remove', (model: Notification) => this.editor.trigger(NOTIFICATION_REMOVE, model))

    // Init with the current models
    this.modelInit()
  }

  /**
   * Get all models
   */
  getAll(): Notification[] {
    return this.models.map((model: NotificationModel) => new Notification(this.editor, model))
  }

  /**
   * Listen to model changes
   */
  modelChanged(e?: CustomEvent) {
    this.editor.trigger(NOTIFICATION_CHANGED, e?.detail)
  }

  /**
   * Listen to model individual changes
   */
  modelInit() {
    // Remove all listeners
    this.models.forEach((model: NotificationModel) => {
      console.warn('TODO: Remove listeners')
    })
    // Add listeners on all models
    this.models.forEach((model: NotificationModel) => {
      console.warn('TODO: Add listeners')
    })
  }
}
