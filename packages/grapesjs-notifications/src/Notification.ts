import { Component } from 'grapesjs'
import { NotificationEditor } from './NotificationManager'
import {LitElement, TemplateResult, html} from 'lit'

export interface NotificationOptions {
  message: string
  timeout?: number
  componentId?: string
}

export interface NotificationModel extends Backbone.Model, NotificationOptions {}

export class Notification {
  component: Component | null = null
  constructor(protected editor: NotificationEditor, protected options: NotificationModel) {
    if(options.timeout) {
      setTimeout(() => this.remove(), options.timeout)
    }
    if(options.componentId) {
      let component: Component | undefined = editor.DomComponents.getWrapper() as Component
      while(component) {
        if(component.getId() === options.componentId) {
          this.component = component
          break
        }
        component = component.parent()
      }
      if (component) this.component = component
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
      <button @click=${() => this.editor.select(this.component!)}>Select ${this.component.getName() || 'source'}</button>
      ` : ''}
    `
  }
}
