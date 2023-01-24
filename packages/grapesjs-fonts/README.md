# Grapesjs Fonts

Custom Fonts plugin for grapesjs

> This code is part of a bigger project for me (@lexoyo): [about Silex v3](https://www.silexlabs.org/silex-v3-kickoff/)

## About this plugin

Links

* [DEMO on Codepen](https://codepen.io/lexoyo/pen/zYLWdxY)
* [Npm package](https://www.npmjs.com/package/@silexlabs/grapesjs-fonts)
* [Discussion about this plugins and Symbols, bug report etc](https://github.com/artf/grapesjs/discussions/4317)
* [Discussion about ongoing developments](https://github.com/artf/grapesjs/discussions/4858#discussioncomment-4756119)

It looks like this:

![Screenshot from 2023-01-20 16-20-56](https://user-images.githubusercontent.com/715377/213734511-7e66175b-cb72-4a61-b215-2af64f5d532c.png)
![Screenshot from 2023-01-20 16-19-41](https://user-images.githubusercontent.com/715377/213734520-adc1072f-ed94-4a01-b1e0-3560a6816083.png)


The plugin currently has these features

* API to add / remove fonts from the site (from goole font name) 
* Updates the DOM and the "font family" dropdown
* Save the fonts with the site data
* Load the fonts when site data is loaded (add to the DOM on load)
* UI to manage fonts
* Integration with google API
* Store google fonts list in local storage for performance and API quotas

Limitations:

For now this plugin supports only Goolge fonts and use the V2 API. It should be upgraded to V3 and take advantage of variable fonts.

I would love help on this:

* Code review and suggestions
* Support Google fonts V3 API
* Other providers than Google fonts

See the "Development" section bellow to contribute

### Motivations

I saw discussions and issues like "How can i add custom fonts in grapesjs editor? #4563" 

What seems to work for me is

1. update the "font family" dropdown
    ```
    const styleManager = editor.StyleManager
    const fontProperty = styleManager.getProperty('typography', 'font-family')
    fontProperty.setOptions(fonts)
    styleManager.render()
    ```
1. update the DOM to display the font correctly: add style elements to the editor.Canvas.getDocument()

This is quite easy but here are the things which took me time as I implemented google fonts

* use google fonts api to select fonts and get their name, variants, weights
* build the URL of the fonts to load
* the UI to manage and install fonts

## Use the plugin in your website builder

### HTML
```html

<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/grapesjs-fonts"></script>

<div id="gjs"></div>
```

### JS
```js
const editor = grapesjs.init({
  container: '#gjs',
  height: '100%',
  fromElement: true,
  storageManager: false,
  plugins: ['@silexlabs/grapesjs-fonts'],
});
```

This will make sure the fonts are saved and loaded with the website data

Here is how to open the fonts dialog:

```js
editor.runCommand('open-fonts')
```

And you can use the plugin's API:

```js
// TODO: expose the API

```

### CSS
```css
body, html {
  margin: 0;
  height: 100%;
}
```

Also you should style the dialog:

```css
.silex-form select {
  ...
}
```


## Summary

* Plugin name: `@silexlabs/grapesjs-fonts`
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
| `api_key` | Google fonts API key, [see this doc to get an API key](https://developers.google.com/fonts/docs/developer_api#APIKey) | `default value` |



## Download

* CDN
  * `https://unpkg.com/@silexlabs/grapesjs-fonts`
* NPM
  * `npm i @silexlabs/grapesjs-fonts`
* GIT
  * `git clone https://github.com/silexlabs/grapesjs-fonts.git`



## Usage

Directly in the browser
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>
<script src="https://unpkg.com/grapesjs"></script>
<script src="path/to/grapesjs-fonts.min.js"></script>

<div id="gjs"></div>

<script type="text/javascript">
  var editor = grapesjs.init({
      container: '#gjs',
      // ...
      plugins: ['@silexlabs/grapesjs-fonts'],
      pluginsOpts: {
        '@silexlabs/grapesjs-fonts': {
          api_key: '...',
        }
      }
  });
</script>
```

Modern javascript
```js
import grapesjs from 'grapesjs';
import plugin from '@silexlabs/grapesjs-fonts';
import 'grapesjs/dist/css/grapes.min.css';

const editor = grapesjs.init({
  container : '#gjs',
  // ...
  plugins: [plugin],
  pluginsOpts: {
    [plugin]: {
      api_key: '...',
    }
  }
  // or
  plugins: [
    editor => plugin(editor, {
      api_key: '...',
    }),
  ],
});
```

## Development

Clone the repository

```sh
$ git clone https://github.com/silexlabs/grapesjs-fonts.git
$ cd grapesjs-fonts
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

