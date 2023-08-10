# Grapesjs Storage Rate Limit

[DEMO](##)
> **Provide a live demo of your plugin**
For a better user engagement create a simple live demo by using services like [JSFiddle](https://jsfiddle.net) [CodeSandbox](https://codesandbox.io) [CodePen](https://codepen.io) and link it here in your README (attaching a screenshot/gif will also be a plus).
To help you in this process here below you will find the necessary HTML/CSS/JS, so it just a matter of copy-pasting on some of those services. After that delete this part and update the link above

### HTML
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/@silexlabs/grapesjs-storage-rate-limit"></script>

<div id="gjs"></div>
```

### JS
```js
const editor = grapesjs.init({
	container: '#gjs',
  height: '100%',
  fromElement: true,
  storageManager: false,
  plugins: ['@silexlabs/grapesjs-storage-rate-limit'],
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

* Plugin name: `@silexlabs/grapesjs-storage-rate-limit`
* Components
    * `component-id-1`
    * `component-id-2`
    * ...
* Blocks
    * `block-id-1`
    * `block-id-2`
    * ...



## Options

| Option | Description | Default |
|-|-|-
| `option1` | Description option | `default value` |



## Download

* CDN
  * `https://unpkg.com/@silexlabs/grapesjs-storage-rate-limit`
* NPM
  * `npm i @silexlabs/grapesjs-storage-rate-limit`
* GIT
  * `git clone https://github.com/lexoyo/@silexlabs/grapesjs-storage-rate-limit.git`



## Usage

Directly in the browser
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>
<script src="https://unpkg.com/grapesjs"></script>
<script src="path/to/@silexlabs/grapesjs-storage-rate-limit.min.js"></script>

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

Modern javascript
```js
import grapesjs from 'grapesjs';
import plugin from '@silexlabs/grapesjs-storage-rate-limit';
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

MIT
