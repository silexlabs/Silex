# GrapesJs Notifications Plugin

This GrapesJs plugin is designed to enhance the user experience within the editor by providing a robust notification system. This plugin captures and displays various types of notifications including errors, warnings, and activities, thereby facilitating a more interactive and responsive interface.

> This code is part of a larger project: [about Silex v3](https://www.silexlabs.org/silex-v3-kickoff/)

[DEMO](https://codepen.io/lexoyo/full/mdgzKQb)

Features

* [x] Notification types with corresponding icons
* [x] Select component attached to the notification
* [x] Customizable notification style
* [x] Internationalization
* [x] Local storage for persistent notifications
* [x] Maximum number of notifications to display
* [x] Notification timeout
* [x] Custom notification container
* [x] Notification events
* [x] Notification commands
* [x] editor.NotificationManager API
* [ ] Group notifications

### HTML
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/@silexlabs/grapesjs-notifications"></script>

<div id="gjs"></div>
```

### JS
```js
const editor = grapesjs.init({
	container: '#gjs',
  height: '100%',
  fromElement: true,
  storageManager: false,
  plugins: ['@silexlabs/grapesjs-notifications'],
});
```

### CSS
```css
body, html {
  margin: 0;
  height: 100%;
}
```

## Summary

Plugin name: `@silexlabs/grapesjs-notifications`

API:

* Notification object:
  * `type`: `error`, `warning`, `success`, `info`
  * `message`: `string`
  * `timeout`: `number` (ms)
  * `component`: `string` or GrapesJs `Component` (optional)
* `editor.Notifications` methods:
  * `add(notification)`
  * `remove(notification)` 
  * `clear()`
* Commands: `editor.runCommand('notifications:add', notification)`
  * `notifications:add` - Add a notification
  * `notifications:remove` - Remove a notification
  * `notifications:clear` - Clear all notifications
* Events:
  * `notifications:changed` - When any change to the notifications occurs
  * `notifications:added` - When a notification is added
  * `notifications:removed` - When a notification is removed
  * `notifications:cleared` - When all notifications are cleared

## Options

| Option | Description | Type | Default |
|-|-|-|-
| `style` | Custom style for the notification | `object` | `{}` |
| `timeout` | Default timeout for the notification in ms | `number` | No timeout |
| `container` | Container for the notifications | `HTMLElement` | `document.body` |
| `storeKey` | Store notifications in local storage under this key | `string` | No storage |
| `icons` | Icons for the notification types | `object` | `{error: '\u2716', warning: '\u26A0', success: '\u2714', info: '\u2139'}` |
| `i18n` | Internationalization | `object` | Check the values in locale/en.js |
| `maxNotifications` | Maximum number of notifications to display | `number` | `5` |

## Download

* CDN
  * `https://unpkg.com/@silexlabs/grapesjs-notifications`
* NPM
  * `npm i @silexlabs/grapesjs-notifications`
* GIT
  * `git clone https://github.com/silexlabs/grapesjs-notifications.git`



## Usage

Directly in the browser
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>
<script src="https://unpkg.com/grapesjs"></script>
<script src="path/to/grapesjs-notifications.min.js"></script>

<div id="gjs"></div>

<script type="text/javascript">
  var editor = grapesjs.init({
      container: '#gjs',
      // ...
      plugins: ['@silexlabs/grapesjs-notifications'],
      pluginsOpts: {
        '@silexlabs/grapesjs-notifications': { /* options */ }
      }
  });
</script>
```

Modern javascript
```js
import grapesjs from 'grapesjs';
import plugin from '@silexlabs/grapesjs-notifications';
import 'grapesjs/dist/css/grapes.min.css';

const editor = grapesjs.init({
  container : '#gjs',
  // ...
  plugins: [plugin],
  pluginsOpts: {
    [plugin]: { /* options */ }
  }
  // or
  plugins: [
    editor => plugin(editor, { /* options */ }),
  ],
});
```



## Development

Clone the repository

```sh
$ git clone https://github.com/silexlabs/grapesjs-notifications.git
$ cd @silexlabs/grapesjs-notifications
```

Install dependencies

```sh
$ npm i
```

Start the dev server

```sh
$ npm start
```

Build the source

```sh
$ npm run build
```



## License

MIT
