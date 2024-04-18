import { html, render, TemplateResult } from 'lit'
import {styleMap} from 'lit/directives/style-map.js'
import { Notification } from './Notification'
import { NotificationManagerOptions } from './NotificationManager'

export default function(container: HTMLElement, notifications: Notification[], options: NotificationManagerOptions): void {
  render(notifications.map(notification => html`
      <li style=${notifications.length ? styleMap(options.style) : 'display: none;'}>${renderNotification(notification)}</li>
  `), container)
}

function renderNotification(notification: Notification): TemplateResult {
  console.log('notification', notification)
  return html`
    <span>${ notification.getSvgIcon(notification.type) }</span>
    <p>${notification.message}</p>
    <button @click=${() => notification.remove()}>Close</button>
  ${notification.component ? html`
    <button @click=${() => notification.select()}>Select ${notification.component.getName() || 'source'}</button>
  ` : ''}
  `
}
