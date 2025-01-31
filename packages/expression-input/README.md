# Expression & Popin Form Components

A set of reusable web components to manage expressions (chains of tokens) and form overlays.  
This is part of a bigger project: [Silex no-code website builder](https://www.silex.me).

## Components

1. **[Expression Input](./docs/expression-input.md)**  
   Build an expression from multiple selectable tokens or switch to a fixed value.

2. **[Input Chain](./docs/input-chain.md)**  
   Create a sequence of selectable steps (e.g., multiple `<select>` elements).

3. **[Popin Form](./docs/popin-form.md)**  
   A simple pop-up form overlay that can manage its own inputs and be integrated into a parent form.

## Installation

```bash
npm install --save @silexlabs/expression-input
```

Or include it via a `<script>` tag:

```html
<script src="/path/to/@silexlabs/expression-input/expression-input.js"></script>
```

## Documentation

- **[Expression Input](./docs/expression-input.md)**  
  How to add `<expression-input>` to your project and build dynamic expressions.

- **[Input Chain](./docs/input-chain.md)**  
  How to use `<input-chain>` to create a chain of interdependent `<select>` elements.

- **[Popin Form](./docs/popin-form.md)**  
  How to open a form in a pop-up overlay and manage form data inside it.

Each `.md` file contains instructions, examples, attributes, and events for its respective component.  
