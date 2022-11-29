> This code is very early stage, it is not working as expected yet. It is part of a bigger project for me: [Silex v3](https://github.com/silexlabs/Silex/tree/v3)

# Symbols for GrapesJS

[DEMO on Codepen](https://codepen.io/lexo1000/pen/gOKjNdz)

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
  pluginsOpts: {
    '@silexlabs/grapesjs-symbols': {
      appendTo: '.gjs-pn-views-container',
    },
  },
})
```

### CSS
```css
body, html {
  margin: 0;
  height: 100%;
}
```

### Add a UI

Add a button to create a new symbol

```html
<div id='basic-actions' class="panel__basic-actions" style="z-index: 9; background: red; position: absolute; min-height: 500px"></div>
```

And the JS for the button

```js
var idx = 0
editor.on('load', () => {
  editor.Panels.addPanel({
    id: 'basic-actions',
    el: '.panel__basic-actions',
    buttons: [
      {
        id: 'alert-button',
        className: 'btn-alert-button',
        label: 'Create symbol pink',
        command(editor) {
          var label = prompt('Label', 'Symbol ' + ++idx)
          var icon = prompt('Icon', 'fa-list')
          editor.runCommand('symbols:add', { label, icon })
        }
      },
    ]
  })
})
```

Add some content programmatically if you need to

```js
editor.addComponents([{
  tagName: 'div',
  components: [
    {
      tagName: 'h1',
      content: 'Content text',
      style: { color: 'red'},
      attributes: { title: 'here' }
    },{
      tagName: 'p',
      content: 'Content text',
      style: { color: 'red'},
      attributes: { title: 'here' }
    }, ],
  style: { "background-color": 'blue', "padding": "20px"},
}])
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
