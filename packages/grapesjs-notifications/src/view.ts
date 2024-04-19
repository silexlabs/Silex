import { html, render as litRender, TemplateResult } from 'lit'
import { classMap } from 'lit-html/directives/class-map.js'
import { Notification } from './Notification'
import { NotificationEditor, NotificationManagerOptions } from './NotificationManager'

export default function(editor: NotificationEditor, container: HTMLElement, notifs: Notification[], options: NotificationManagerOptions): void {
  const notifications = [...notifs]

  // Reverse if options.reverse is true
  if (options.reverse) {
    notifications.reverse()
  }
  
  const organizedNotifications = organizeNotifications(notifications)
    .slice(0, options.maxNotifications)

  litRender(html`
    <style>
    .gjs-notification {
      top: 10px;
      right: 10px;
      max-width: 300px;
      z-index: 9999;
      list-style: none;
      padding: 10px;
      margin: 10px;
      font-family: var(--gjs-main-font);
      font-size: var(--gjs-font-size);
      max-height: 80vh;
      overflow-y: auto;
    }
    .gjs-notification details summary {
      list-style: none;
    }
    .gjs-notification li {
      border-radius: 5px;
      margin: 10px 0;
      padding: 10px;
      list-style: none;
    }
    </style>
    <ul class="gjs-notification">
      ${
        organizedNotifications
        .map(item => typeof item === 'string' ? renderGroup(editor, item, notifications.filter(n => n.group === item)) : renderNotification(editor, item))
      }
    </ul>
  `, container)
}

function organizeNotifications(notifications: Notification[]): (Notification | string)[] {
  const groups: {[key: string]: boolean} = {}
  const organized: (Notification | string)[] = []

  notifications.forEach(notification => {
    if (notification.group && !groups[notification.group]) {
      groups[notification.group] = true
      organized.push(notification.group)
    } else if (!notification.group) {
      organized.push(notification)
    }
  })

  return organized
}

function renderGroup(editor: NotificationEditor, groupName: string, groupedNotifications: Notification[]): TemplateResult {
  return html`
    <li class="gjs-sm gjs-one-bg gjs-two-color gjs-notification-group">
    <details class="gjs-sm gjs-one-bg gjs-two-color">
      <summary class="gjs-sm-header gjs-label">
        <div>\u{1F4CC} ${groupName}</div>
        <button @click=${() => groupedNotifications.forEach(notification => notification.remove())} class="gjs-btn-prim">${editor.I18n.t('@silexlabs/grapesjs-notifications.CloseAll')}</button>
        <button
          @click=${(e: any) => e.currentTarget.closest('details').toggleAttribute('open')}
          class="gjs-btn-prim"
        >${ editor.I18n.t('@silexlabs/grapesjs-notifications.Show') }</button>
      </summary>
      <ul>
        ${groupedNotifications.map(notification => html`
          ${renderNotification(editor, notification)}
        `)}
      </ul>
    </details>
    </li>
  `
}

function renderNotification(editor: NotificationEditor, notification: Notification): TemplateResult {
  console.log('notification', notification)
  return html`
    <li class=${classMap({
      'gjs-sm': true,
      'gjs-one-bg': true,
      'gjs-two-color': true,
      'gjs-notification__item': true,
      'gjs-notification__info': notification.type === 'info',
      'gjs-notification__warning': notification.type === 'warning',
      'gjs-notification__error': notification.type === 'error',
      'gjs-notification__success': notification.type === 'success',
    })}>
      <header class="gjs-sm-header gjs-label">
        <span>${notification.getSvgIcon(notification.type)}</span>
        <span class="gjs-sm-header">${notification.message}</span>
      </header>
      <footer class="gjs-sm-footer">
        <button @click=${() => notification.remove()} class="gjs-btn-prim">${editor.I18n.t('@silexlabs/grapesjs-notifications.Close')}</button>
        ${notification.component ? html`
          <button @click=${() => notification.select()} class="gjs-btn-prim">${editor.I18n.t('@silexlabs/grapesjs-notifications.Select', { params: { componentName: notification.component.getName() }})}</button>
        ` : ''}
      </footer>
    </li>
  `
}
