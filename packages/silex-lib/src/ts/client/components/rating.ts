import { Notification } from './Notification'

export function rating() {
  Notification.lightDialog(`
    <p>
      Do you like Silex? I need your feedback!&nbsp;
      <a href="https://www.trustpilot.com/evaluate/silex.me" target="_blank">Rate Silex on Trustpilot</a>
    </p>
  `, () => {})
}
