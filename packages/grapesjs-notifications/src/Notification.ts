import { Component, Page } from 'grapesjs'
import { NotificationEditor } from './NotificationManager'

export interface NotificationOptions {
  message: string
  group?: string
  timeout?: number
  component?: string | Component
  type: 'info' | 'warning' | 'error' | 'success'
  icons: {
    info: string
    warning: string
    error: string
    success: string
  }
}

export function getDefaultOptions(opts: Partial<NotificationOptions>): NotificationOptions {
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

function getAllComponents(editor: NotificationEditor): Component[] {
  return editor.Pages.getAll().map(getAllComponentInPage).flat()
}

function getAllComponentInPage(page: Page): Component[] {
  const body = page.getMainComponent() as Component
  return [body].concat(getAllChildrenComponent(body))
}

function getAllChildrenComponent(component: Component): Component[] {
  const children = Array.from(component.components().models)
  return children.concat(children.map(getAllChildrenComponent).flat())
}

export interface NotificationModel extends Backbone.Model<NotificationOptions> {}

export class Notification {
  component: Component | null = null
  group: string | null = null
  timeoutRef
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  protected options: NotificationOptions
  constructor(protected editor: NotificationEditor, protected model: NotificationModel) {
    this.options = getDefaultOptions(model.attributes)
    if(this.options.timeout) {
      this.timeoutRef = setTimeout(() => this.remove(), this.options.timeout)
    }
    if(this.options.component) {
      if(typeof this.options.component === 'string') {
        this.component = getAllComponents(editor).find((c: Component) => c.getId() === this.options.component) || null
      } else {
        this.component = this.options.component
      }
    }
    this.message = this.options.message!
    this.type = this.options.type!
    this.group = model.attributes.group || null
  }
  //get(key: keyof NotificationOptions): unknown {
  //  return this.options.attributes[key]
  //}
  select() {
    if(this.component) {
      this.editor.select(this.component)
      this.editor.Canvas.scrollTo(this.component)
    }
  }
  remove() {
    this.editor.NotificationManager.remove(this.model)
    this.timeoutRef && clearTimeout(this.timeoutRef)
  }

  getSvgIcon(type: string): string {
    return this.options.icons?.[type as keyof NotificationOptions['icons']]!
  }
}
