# Grapesjs Storage Rate Limit

A plugin for GrapesJS that provides rate-limited storage, allowing you to save changes immediately and then cool down for a specified period before saving again.

This plugin will intercept when user saves a website and make sure it doesn't occure more than once every second or any duration you setup

Features

- **Works with any storage:** This plugin place itself between the storage and your app.
- **Immediate Save:** The first save is performed immediately.
- **Cooldown Period:** After saving, the plugin enters a cooldown period during which subsequent saves are ignored.
- **Post-Cooldown Save:** If there are more calls to the `store` function during the cooldown, one final save occurs after the cooldown expires, and the cooldown period restarts.

[Live DEMO on codepen](https://codepen.io/lexoyo/full/zYMQgNg)

[Here is the plugin on npm](https://www.npmjs.com/package/@silexlabs/grapesjs-storage-rate-limit)

## Options

| Option | Description | Default |
|-|-|-
| `time` | The cooldown period in milliseconds. After saving, the plugin will wait for this duration before allowing another save. | `1000` (ms) |



## Download

* CDN
  * `https://unpkg.com/@silexlabs/grapesjs-storage-rate-limit`
* NPM
  * `npm i @silexlabs/grapesjs-storage-rate-limit`
* GIT
  * `git clone https://github.com/lexoyo/@silexlabs/grapesjs-storage-rate-limit.git`


## Installation

```bash
npm install @silexlabs/grapesjs-rate-limited-storage --save
```

## Usage

Import and initialize the plugin with GrapesJS:

```javascript
import grapesjs from 'grapesjs';
import rateLimitedStorage from '@your-npm-namespace/grapesjs-rate-limited-storage';

const editor = grapesjs.init({
  // ... other GrapesJS options
  plugins: [rateLimitedStorage],
  pluginsOpts: {
    rateLimitedStorage: {
      time: 2000,  // Optional: cooldown time in ms, default is 1000ms
    }
  }
  // or
  plugins: [
    editor => rateLimitedStorage(editor, { /* options */ }),
  ],
});
```


Directly in the browser

```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/@silexlabs/grapesjs-storage-rate-limit.min.js"></script>

<div id="gjs"></div>

<script type="text/javascript">
  var editor = grapesjs.init({
      container: '#gjs',
      // ...
      plugins: ['@silexlabs/grapesjs-storage-rate-limit'],
      pluginsOpts: {
        '@silexlabs/grapesjs-storage-rate-limit': { /* options */ }
      }
  });
</script>
```


## Development

Clone the repository

```sh
$ git clone https://github.com/lexoyo/@silexlabs/grapesjs-storage-rate-limit.git
$ cd @silexlabs/grapesjs-storage-rate-limit
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

[AGPL v3](LICENSE.md)
