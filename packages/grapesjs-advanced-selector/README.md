# Grapesjs Advanced Selector

Links

* [DEMO](##) (TODO: **Provide a live demo of your plugin**)
* [Discussion about this plugin](https://github.com/GrapesJS/grapesjs/discussions/5262)
* [Feature request in Silex project](https://github.com/silexlabs/Silex/issues/1496)

### Roadmap

Features

* [ ] Replace the Selector Manager UI with a custom one
* [ ] Use the Style Manager to edit the current CSS selector

Use cases

* [ ] `.child` (default Selector Manager)
* [ ] `.child:pseudo` (default Selector Manager)
* [ ] `.parent > .child`
* [ ] `.parent:pseudo > .child`
* [ ] `.parent:pseudo .child`
* [ ] `tag .child`
* [ ] Pseudo with param, e.g. `:nth-child(2)`

### HTML
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/@silexlabs/grapesjs-advanced-selector"></script>

<div id="gjs"></div>
```

### JS
```js
const editor = grapesjs.init({
	container: '#gjs',
  height: '100%',
  fromElement: true,
  storageManager: false,
  plugins: ['@silexlabs/grapesjs-advanced-selector'],
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

* Plugin name: `@silexlabs/grapesjs-advanced-selector`
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
  * `https://unpkg.com/@silexlabs/grapesjs-advanced-selector`
* NPM
  * `npm i @silexlabs/grapesjs-advanced-selector`
* GIT
  * `git clone https://github.com/silexlabs/@silexlabs/grapesjs-advanced-selector.git`



## Usage

Directly in the browser
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>
<script src="https://unpkg.com/grapesjs"></script>
<script src="path/to/@silexlabs/grapesjs-advanced-selector.min.js"></script>

<div id="gjs"></div>

<script type="text/javascript">
  var editor = grapesjs.init({
      container: '#gjs',
      // ...
      plugins: ['@silexlabs/grapesjs-advanced-selector'],
      pluginsOpts: {
        '@silexlabs/grapesjs-advanced-selector': { /* options */ }
      }
  });
</script>
```

Modern javascript
```js
import grapesjs from 'grapesjs';
import plugin from '@silexlabs/grapesjs-advanced-selector';
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
$ git clone https://github.com/silexlabs/@silexlabs/grapesjs-advanced-selector.git
$ cd @silexlabs/grapesjs-advanced-selector
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
