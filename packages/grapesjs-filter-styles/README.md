# Grapesjs Filter Styles

This plugin adds a search bar in the Style manager so that users can search for a CSS style

> This code is part of a bigger project: [about Silex v3](https://www.silexlabs.org/silex-v3-kickoff/)

[DEMO](https://codepen.io/lexoyo/full/WNLbXxY)

![Grapesjs Filter Styles plugin](./doc/grapesjs-filter-styles1.png)
![Grapesjs Filter Styles plugin](./doc/grapesjs-filter-styles2.png)
![Grapesjs Filter Styles plugin](./doc/grapesjs-filter-styles3.png)

### HTML
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/@silexlabs/grapesjs-filter-styles"></script>

<div id="gjs"></div>
```

### JS
```js
const editor = grapesjs.init({
	container: '#gjs',
  height: '100%',
  fromElement: true,
  storageManager: false,
  plugins: ['@silexlabs/grapesjs-filter-styles'],
});
```

### CSS
```css
body, html {
  margin: 0;
  height: 100%;
}
```


## Options

| Option | Description | Default |
|-|-|-
| `option1` | Description option | `default value` |
| `placeholder` | Text in the empty text input | 'Search...' |
| `appendTo` | Element where the text input shoud be added, can be CSS selector or an HTML element | null |
| `appendBefore` | Element where the text input shoud be added, can be CSS selector or an HTML element | null |



## Download

* CDN
  * `https://unpkg.com/@silexlabs/grapesjs-filter-styles`
* NPM
  * `npm i @silexlabs/grapesjs-filter-styles`
* GIT
  * `git clone https://github.com/silexlabs/grapesjs-filter-styles.git`



## Usage

Directly in the browser
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>
<script src="https://unpkg.com/grapesjs"></script>
<script src="path/to/@silexlabs/grapesjs-filter-styles.min.js"></script>

<div id="gjs"></div>

<script type="text/javascript">
  var editor = grapesjs.init({
      container: '#gjs',
      // ...
      plugins: ['@silexlabs/grapesjs-filter-styles'],
      pluginsOpts: {
        '@silexlabs/grapesjs-filter-styles': { /* options */ }
      }
  });
</script>
```

Modern javascript
```js
import grapesjs from 'grapesjs';
import plugin from '@silexlabs/grapesjs-filter-styles';
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
$ git clone https://github.com/silexlabs/grapesjs-filter-styles.git
$ cd @silexlabs/grapesjs-filter-styles
```

Install dependencies

```sh
$ npm i
```

Build the project

```sh
$ npm run build
```

Start the dev server

```sh
$ npm start
```


## License

AGPL-3.0-or-later
