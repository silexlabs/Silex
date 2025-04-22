import { Component, Page } from 'grapesjs'
import { NotificationEditor } from './NotificationManager'
import { NOTIFICATION_ADD } from './commands'
import Backbone from 'backbone'

export interface NotificationOptions {
  message: string
  group?: string
  timeout?: number
  componentId?: string
  type: 'info' | 'warning' | 'error' | 'success'
  icons: {
    info: string
    warning: string
    error: string
    success: string
  }
}

export class NotificationModel extends Backbone.Model<any, Backbone.ModelSetOptions, any> {}

export class Notification {
  componentId: string | null = null
  group: string | null = null
  timeoutRef
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  protected options: NotificationOptions

  constructor(protected editor: NotificationEditor, protected model: NotificationModel) {
    this.options = this.getDefaultOptions(model.attributes)
    if (this.options.timeout) {
      this.timeoutRef = setTimeout(() => this.remove(), this.options.timeout)
    }
    this.message = this.options.message!
    this.type = this.options.type!
    this.componentId = model.attributes.componentId || null
    this.group = model.attributes.group || null
  }

  select() {
    if (this.options.componentId) {
      // This operation is heavy
      const found = this.getAllComponents(this.editor)
        .find(({component, page}) => component.getId() === this.options.componentId) || null
      if (found) {
        const {component, page} = found
        this.editor.Pages.select(page)
        this.editor.select(component)
        this.editor.Canvas.scrollTo(component)
      } else {
        console.error(`Component with ID ${this.options.componentId} not found`)
        this.editor.runCommand(NOTIFICATION_ADD, {
          message: `Component with ID ${this.options.componentId} not found`,
          type: 'error',
        })
      }
    }
  }

  remove() {
    this.editor.NotificationManager.remove(this.model)
    this.timeoutRef && clearTimeout(this.timeoutRef)
  }

  getSvgIcon(type: string): string {
    return this.options.icons?.[type as keyof NotificationOptions['icons']]!
  }

  private getDefaultOptions(opts: Partial<NotificationOptions>): NotificationOptions {
    return {
      ...{
        icons: {
          info: '\u{1F6A7}',
          warning: '\u{26A0}',
          error: '\u{1F6AB}',
          success: '\u{2705}',
          group: '\u{1F4CC}',
          ...opts.icons,
        },
      }, ...opts
    } as NotificationOptions
  }

  /**
   * Get all components in the editor
   * This is a heavy operation
   */
  private getAllComponents(editor: NotificationEditor) {
    return editor.Pages.getAll().map(page => this.getAllComponentInPage(page)).flat()
  }

  private getAllComponentInPage(page: Page): {component: Component, page: Page}[] {
    const body = page.getMainComponent() as Component
    return [{
      component: body,
      page,
    }].concat(
      this.getAllChildrenComponent(body)
      .map(component => ({component, page}))
    )
  }

  private getAllChildrenComponent(component: Component): Component[] {
    const children = Array.from(component.components().models)
    return children.concat(children.map(child => this.getAllChildrenComponent(child)).flat())
  }
}
