# GrapesJS Advanced Selector Manager

An advanced selector management plugin for GrapesJS, specifically designed for cases where the default Selector Manager falls short,

> This code is part of a larger project: [about Silex v3](https://www.silexlabs.org/silex-v3-kickoff/)
> The Advanced Selector Manager comes pre-installed in Silex v3, [give it a try here](https://v3.silex.me/)

Before: GrapesJs default Selector Manager

![GrapesJs default Selector Manager](https://github.com/user-attachments/assets/dcd85a63-78f4-4bb9-bde3-06009b02ae68)

After:

[GrapesJs Advanced Selector Manager](https://github.com/user-attachments/assets/14417ce8-004c-4657-a5a0-26d1969d06be)

With `body h1.btn` selected:

![Advanced Selector Manager with complex selector](https://github.com/user-attachments/assets/8628cdf5-d19e-4838-9584-b94a20b12434)



### Links

- [DEMO](https://codepen.io/lexoyo/full/EaxZrmz)
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
git clone https://github.com/silexlabs/grapesjs-advanced-selector.git
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
| `i18n`      | Internationalization object see the files in `src/i18n` | The content of `src/i18n/en.ts` |
| `helpLinks` | Links to help resources                | `{}`             |
| `helpLinks.actionBar` | Link to help resources for the action bar | `https://docs.silex.me/en/user/selectors` |

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
   git clone https://github.com/silexlabs/grapesjs-advanced-selector.git
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
