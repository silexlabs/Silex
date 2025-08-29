# Expression & Popin Form Components

A set of reusable web components to manage expressions (chains of tokens) and form overlays.  
This is part of a bigger project: [Silex no-code website builder](https://www.silex.me).

## Components

1. **[Expression Input](./docs/expression-input.md)**  
   Build an expression from multiple selectable tokens or switch to a fixed value.

2. **[Popin Form](./docs/popin-form.md)**  
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

- **[Popin Form](./docs/popin-form.md)**  
  How to open a form in a pop-up overlay and manage form data inside it.

Each `.md` file contains instructions, examples, attributes, and events for its respective component.

## Development

To contribute to this project:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/silexlabs/expression-input.git
   cd expression-input
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build the Project**:
   ```bash
   npm run build
   ```

4. **Start Development Server**:
   ```bash
   npm run serve
   ```
