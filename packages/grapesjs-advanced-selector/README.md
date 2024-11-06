# GrapesJS Advanced Selector Manager

An advanced selector management plugin for GrapesJS, specifically designed for cases where the default Selector Manager falls short, 

### Links

- [DEMO](##) (TODO: **Provide a live demo**)
- [Discussion on GrapesJS Forum](https://github.com/GrapesJS/grapesjs/discussions/5262)
- [Feature Request in Silex Project](https://github.com/silexlabs/Silex/issues/1496)

### Roadmap

#### Feature Goals

- [ ] Replace the default Selector Manager UI with a custom interface
- [ ] Integrate with the Style Manager for editing complex CSS selectors

#### Selector Examples

- `.child` (already possible with the default Selector Manager)
- `.child:pseudo` (already possible with the default Selector Manager)
- `.parent > .child`
- `.parent:pseudo > .child`
- `.parent:pseudo .child`
- `tag .child`
- Pseudo selectors with parameters, e.g., `:nth-child(2)`
- Pseudo selectors with a selector, e.g., `:not(.child)`

---

## Installation

Choose one of the following methods:

### CDN
```html
<script src="https://unpkg.com/@silexlabs/grapesjs-advanced-selector"></script>
```

### NPM
```bash
npm i @silexlabs/grapesjs-advanced-selector
```

### GIT
```bash
git clone https://github.com/silexlabs/@silexlabs/grapesjs-advanced-selector.git
```

---

## Usage

### Basic HTML Setup
Include the plugin with GrapesJS in your HTML:

```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/@silexlabs/grapesjs-advanced-selector"></script>

<div id="gjs"></div>
```

### Basic JS Initialization
```js
const editor = grapesjs.init({
  container: '#gjs',
  height: '100%',
  fromElement: true,
  storageManager: false,
  plugins: ['@silexlabs/grapesjs-advanced-selector'],
});
```

---

### Options

Customize the plugin’s behavior by passing options:

| Option      | Description                            | Default          |
|-------------|----------------------------------------|------------------|
| `option1`   | Description for option1                | `default value`  |

---

## Advanced Usage

Use the plugin with modern JavaScript imports:

```js
import grapesjs from 'grapesjs';
import plugin from '@silexlabs/grapesjs-advanced-selector';
import 'grapesjs/dist/css/grapes.min.css';

const editor = grapesjs.init({
  container: '#gjs',
  plugins: [plugin],
  pluginsOpts: {
    [plugin]: { /* options */ }
  },
});
```

---

## Development

To contribute, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/silexlabs/@silexlabs/grapesjs-advanced-selector.git
   cd @silexlabs/grapesjs-advanced-selector
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

MIT License
