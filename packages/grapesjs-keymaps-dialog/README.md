# GrapesJS Keymap Dialog

This GrapesJS plugin implements a floating UI showing the available keymaps for the editor.
You can open it by holding a key (``Shift`` by default) during a certain amount of time and/or with a shortcut (``Shift+K`` by default).

> This code is part of a bigger project. Check out [Silex v3](https://github.com/silexlabs/Silex).

### Features

- Customizable CSS
- Modern UI
- No configuration needed (uses the GrapesJS Keymap API)
- Lightweight plugin

### Demonstration

You can check a demonstration of this plugin [here](##). [SOON]

![demo](https://github.com/SuperDelphi/grapesjs-keymaps-dialog/assets/44942598/32a4bc74-d8ff-4855-910f-fb6e6167c168)

## Options

| Option | Description | Default |
|-|-|-
| `longPressKey` | The key you can hold to open the dialog. | `shift` |
| `longPressDuration` | The minimum hold time of the ``longPressKey`` (in milliseconds). Set to `0` to deactivate. | `800`
| `shortcut` | The (optional) shortcut that can open/close the dialog. | `shift+k`
| `css` | The (optional) CSS of the dialog in case you wish to customize it. | `null`



## Download

* CDN
  * `https://unpkg.com/@silexlabs/grapesjs-keymaps-dialog`
* NPM
  * `npm i silexlabs@grapesjs-keymaps-dialog`
* GIT
  * `git clone https://github.com/silexlabs/grapesjs-keymaps-dialog.git`



## Usage

Directly in the browser
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/@silexlabs/grapesjs-keymaps-dialog"></script>

<div id="gjs"></div>

<script type="text/javascript">
  var editor = grapesjs.init({
      container: '#gjs',
      // ...
      plugins: ['grapesjs-keymaps-dialog'],
      pluginsOpts: {
        'grapesjs-keymaps-dialog': { /* options */ }
      }
  });
</script>
```

Modern javascript
```js
import grapesjs from 'grapesjs';
import plugin from '@silexlabs/grapesjs-keymaps-dialog';
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
$ git clone https://github.com/silexlabs/grapesjs-keymaps-dialog.git
$ cd grapesjs-keymaps-dialog
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
