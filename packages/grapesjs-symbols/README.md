> This code is very early stage, it is not working as expected yet. It is part of a bigger project for me: [Silex v3](https://github.com/silexlabs/Silex/tree/v3)

# Symbols for GrapesJS

[DEMO](##)
> **Provide a live demo of your plugin**
For a better user engagement create a simple live demo by using services like [JSFiddle](https://jsfiddle.net) [CodeSandbox](https://codesandbox.io) [CodePen](https://codepen.io) and link it here in your README (attaching a screenshot/gif will also be a plus).
To help you in this process here below you will find the necessary HTML/CSS/JS, so it just a matter of copy-pasting on some of those services. After that delete this part and update the link above

### HTML
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/@silexlabs/grapesjs-symbols"></script>

<div id="gjs"></div>
```

### JS
```js
const editor = grapesjs.init({
	container: '#gjs',
  height: '100%',
  fromElement: true,
  storageManager: false,
  plugins: ['grapesjs-symbols'],
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

* Plugin name: `grapesjs-symbols`
* Components
    * `component-id-1`
    * `component-id-2`
    * ...
* Blocks
    * `block-id-1`
    * `block-id-2`
    * ...

### Vocabulary

A **symbol** is a structure holding the symbol data, see [the comment in the Symbol module](./src/model/Symbol.js)

A **symbol model** is a grapesjs Component which is not attached to the DOM and is used to create instances of a symbol

An **instance** is a grapesjs Component which is in sync with a Symbol, it is a root component with child components which are also synced between symbols

### About IDs

These are the IDs we need in models attributes

* Each Symbol has `symbolId`
* Each instance (the root component) has `symbolId` set to its symbol cid, this is used to find the symbol associated to this instance
* Each model also has the `symbolId` set to its symbol cid
* Each child of an instance has `symbolChildId` set to the same ID in all the symbols, this is used to sync the symbol instances children

Notes

* `symbolChildId` attributes are not synced between symbol instances (the root of a symbol instance) since it can be different when an instance is in two different other symbols
* In a collection of Symbol, you can get the symbol with `.get(symbolId)` since the symbols have their cid set to their initial `symbolId` - see [the initialize method in Symbol.js](./src/model/Symbol.js)


## Options

| Option | Description | Default |
|-|-|-
| `option1` | Description option | `default value` |



## Download

* CDN
  * `https://unpkg.com/@silexlabs/grapesjs-symbols`
* NPM
  * `npm i @silexlabs/grapesjs-symbols`
* GIT
  * `git clone https://github.com/silexlabs/grapesjs-symbols.git`



## Usage

Directly in the browser
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>
<script src="https://unpkg.com/grapesjs"></script>
<script src="path/to/grapesjs-symbols.min.js"></script>

<div id="gjs"></div>

<script type="text/javascript">
  var editor = grapesjs.init({
      container: '#gjs',
      // ...
      plugins: ['grapesjs-symbols'],
      pluginsOpts: {
        'grapesjs-symbols': { /* options */ }
      }
  });
</script>
```

Modern javascript
```js
import grapesjs from 'grapesjs';
import plugin from '@silexlabs/grapesjs-symbols';
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
$ git clone https://github.com/silexlabs/grapesjs-symbols.git
$ cd grapesjs-symbols
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
