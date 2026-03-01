# GrapesJS CSS Variables

Define and manage CSS custom properties (design tokens) for colors, sizes, and typography directly within GrapesJS.

> This code is part of a larger project: [about Silex v3](https://www.silex.me/)

### Links

- [DEMO on CodePen](https://codepen.io/lexoyo/full/ogzXKaL)
- [Npm package](https://www.npmjs.com/package/@silexlabs/grapesjs-css-variables)

### Features

- [x] Manage CSS variables from a modal dialog (colors, sizes, font families)
- [x] Responsive variables with per-breakpoint values (one column per device)
- [x] Style Manager integration: assign variables to properties via a "+" dropdown
- [x] Variable pills in the Style Manager showing the applied variable name
- [x] Drag-to-reorder variables in the modal
- [x] Duplicate and rename variables
- [x] Preset variables for first load
- [x] i18n support (English and French included)
- [x] Undo/redo support
- [x] Variables are saved and restored with site data

---

## Installation

Choose one of the following methods:

### CDN
```html
<script src="https://unpkg.com/@silexlabs/grapesjs-css-variables"></script>
```

### NPM
```bash
npm i @silexlabs/grapesjs-css-variables
```

### GIT
```bash
git clone https://github.com/silexlabs/grapesjs-css-variables.git
```

---

## Usage

### Basic HTML Setup

```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/@silexlabs/grapesjs-css-variables"></script>

<div id="gjs"></div>
```

### Basic JS Initialization

```js
const editor = grapesjs.init({
  container: '#gjs',
  height: '100%',
  fromElement: true,
  storageManager: false,
  plugins: ['@silexlabs/grapesjs-css-variables'],
});
```

Open the CSS Variables dialog:

```js
editor.runCommand('open-css-variables')
```

---

### Options

Customize the plugin by passing options:

| Option | Description | Default |
|--------|-------------|---------|
| `prefix` | Variable name prefix (e.g. `'my-'` produces `--my-color-primary`) | `''` |
| `enableColors` | Enable color variables | `true` |
| `enableSizes` | Enable size variables | `true` |
| `enableTypography` | Enable font-family variables | `true` |
| `presets` | Pre-defined variables for first load (array of `{name, value, type}`) | `[]` |
| `i18n` | Internationalization overrides | `{}` |

#### Presets example

```js
plugins: ['@silexlabs/grapesjs-css-variables'],
pluginsOpts: {
  '@silexlabs/grapesjs-css-variables': {
    presets: [
      { name: 'primary', value: '#3498db', type: 'color' },
      { name: 'spacing', value: '16px', type: 'size' },
      { name: 'heading', value: '"Inter", sans-serif', type: 'typo' },
    ],
  },
},
```

---

## Advanced Usage

Use the plugin with modern JavaScript imports:

```js
import grapesjs from 'grapesjs';
import plugin from '@silexlabs/grapesjs-css-variables';
import 'grapesjs/dist/css/grapes.min.css';

const editor = grapesjs.init({
  container: '#gjs',
  plugins: [plugin],
  pluginsOpts: {
    [plugin]: {
      prefix: '',
      enableColors: true,
      enableSizes: true,
      enableTypography: true,
    },
  },
});
```

---

## Development

To contribute, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/silexlabs/grapesjs-css-variables.git
   cd grapesjs-css-variables
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm start
   ```

4. **Build the Plugin**:
   ```bash
   npm run build
   ```

---

## License

GPL-3.0
