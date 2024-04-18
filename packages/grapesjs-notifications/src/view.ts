import { html, render } from 'lit';
import { Notification } from './Notification';

export default function(container: HTMLElement, notifications: Notification[]): void {
  render(notifications.map(notification => {
    return html`<li>${notification.render()}</li>`
  }), container)
}
