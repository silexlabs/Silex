import { Component, Page } from 'grapesjs'
import { NotificationEditor } from './NotificationManager'
import {LitElement, TemplateResult, html} from 'lit'

export interface NotificationOptions {
  message: string
  timeout?: number
  component?: string | Component
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
  constructor(protected editor: NotificationEditor, protected options: NotificationModel) {
    if(options.attributes.timeout) {
      setTimeout(() => this.remove(), options.attributes.timeout)
    }
    if(options.attributes.component) {
      if(typeof options.attributes.component === 'string') {
        this.component = getAllComponents(editor).find((c: Component) => c.getId() === options.attributes.component) || null
      } else {
        this.component = options.attributes.component
      }
    }
    console.log('Creating notification', options, this.component)
  }
  select() {
    if(this.component) {
      this.editor.select(this.component)
      this.editor.Canvas.scrollTo(this.component)
    }
  }
  remove() {
    console.log('Destroying notification')
    this.editor.NotificationManager.remove(this.options)
  }
  render(): TemplateResult {
    console.log('Rendering notification', this)
    return html`
      <p>${this.options.attributes.message}</p>
      <button @click=${() => this.remove()}>Close</button>
      ${this.component ? html`
      <button @click=${() => this.select()}>Select ${this.component.getName() || 'source'}</button>
      ` : ''}
    `
  }
}
