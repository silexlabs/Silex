import { Component, Page, Editor } from 'grapesjs'

export interface NotificationOptions {
  id?: string
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

export class Notification {
  id: string | null = null
  componentId: string | null = null
  group: string | null = null
  timeoutRef
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  options: NotificationOptions
  public model: any // For compatibility
  private removeCallback?: (notification: Notification) => void

  constructor(protected editor: Editor, options: NotificationOptions | any, removeCallback?: (notification: Notification) => void) {
    this.options = this.getDefaultOptions(options)
    this.removeCallback = removeCallback
    if (this.options.timeout) {
      this.timeoutRef = setTimeout(() => this.remove(), this.options.timeout)
    }
    this.id = options.id || null
    this.message = this.options.message!
    this.type = this.options.type!
    this.componentId = options.componentId || null
    this.group = options.group || null
    this.model = { attributes: options } // For compatibility with existing code
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
        this.editor.runCommand('notifications:add', {
          message: `Component with ID ${this.options.componentId} not found`,
          type: 'error',
        })
      }
    }
  }

  remove() {
    if (this.removeCallback) {
      this.removeCallback(this)
    } else {
      // Fallback to command if no callback provided
      this.editor.runCommand('notifications:remove', {
        notification: this
      })
    }
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
  private getAllComponents(editor: Editor) {
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
