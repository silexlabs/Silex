import { html, render, TemplateResult } from 'lit'
import {styleMap} from 'lit/directives/style-map.js'
import { Notification } from './Notification'
import { NotificationEditor, NotificationManagerOptions } from './NotificationManager'

export default function(editor: NotificationEditor, container: HTMLElement, notifications: Notification[], options: NotificationManagerOptions): void {
  render(notifications.map(notification => html`
      <li
        style=${notifications.length ? styleMap(options.style) : 'display: none;'}
        class="gjs-sm gjs-one-bg gjs-two-color"
      >${renderNotification(editor, notification)}</li>
  `), container)
}

function renderNotification(editor: NotificationEditor, notification: Notification): TemplateResult {
  console.log('notification', notification)
  return html`
    <header class="gjs-sm-header gjs-label">
      <span>${ notification.getSvgIcon(notification.type) }</span>
      <span class="gjs-sm-header">${notification.message}</span>
    </header>
    <footer class="gjs-sm-footer">
      <button @click=${() => notification.remove()} class="gjs-btn-prim">${ editor.I18n.t('@silexlabs/grapesjs-notifications.Close') }</button>
    ${notification.component ? html`
      <button @click=${() => notification.select()} class="gjs-btn-prim">${ editor.I18n.t('@silexlabs/grapesjs-notifications.Select', { params: { componentName: notification.component.getName() }}) }</button>
    </footer>
  ` : ''}
  `
}
