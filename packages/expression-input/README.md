# Expression Input web component

A web component to include in your JS/TS projects. Your users can create an expression which is a ordoned list of tokens. It feels like auto completion without typing text. The token can have options too.

This web component implements the same API as HTML inputs so it can be used inside a `<form>`, with support of the `FormData` API. It supports focus and keyboard navigation too.

> This is part of a bigger project: [Silex no-code website builder](https://www.silex.me)

This feature is made of these components

- [x] `<popin-overlay>` behaves like a popin, disapears when it loses focus
- [x] `<popin-form>` extends the `<popin-overlay>` component, behaves both like a form with the inputs inside it and like an input for a parent form
- [x] `<expression-input>` handles "fixed value" which is a simple text input and "expression" which is an editable list of tokens

Use cases

- Build an expression the no-code way - e.g. `obj.prop1.subProp` (js), `posts | where: 'id', '123'` (liquidjs)
- Select a folder in a file system
- Make decisions in a decision tree
- Edit a list of tokens

## Roadmap

Project

- [x] Licence AGPL
- [x] Automated publish to npm with github action
- [ ] Unit tests still fail on github actions (playwrite issue)

Popin

- [x] Display where placed
- [x] Handle focus

ExpressionInput

- [x] values: icon, name (may be a function of options), tags, options, optionsForm, type, helpText (with html links to directus collection)
- [x] callback getNextChoices(pastChoices)
- [x] message (if error or warning)
- [x] events: change
- [x] styling
- [ ] copy / paste / set / unset
- [ ] result (the final value resulting the current choices)
- [ ] state: valid, warning, error
- [x] helpText

## Integration guide

Install the npm package in your project

```shell
$ npm install --save @silexlabs/expression-input
```

Include the library with ESNext `import "@silexlabs/expression-input"` or directly in the HTML with `<script src="/path/to/expression-input.js"></script>`

Use in your HTML as a web component:

```html
<html>
  <body>
    <expression-input
      name="form-data-name"
      onload="event => console.log(event.target)"
      onchange="event => console.log('onchange', event)"
    >
      <span slot="label">Test label</span>
      <select>
          <option value="">+</option>
          <option value="Blog Post" selected>Blog Post</option>
          <option value="Page">Page</option>
          <option value="Settings">Settings</option>
      </select>
    </expression-input>
  </body>
</html>
```

Check the files in `/dev/` folder for examples.

## API

The `expression-input` component has these events:

- load
- change

It has these attributes:

- fixed: if present the UI shows a text input 
- fixed-type: 'none' | 'text' | 'date' | 'email' | 'number' | 'password' | 'tel' | 'time' | 'url' = 'text'
- allow-fixed: shows the buttons to switch from expression to fixed
- placeholder
- for: Form id. This is the same API as input elements
- reactive: if present, when the user changes the selection of a select, then all the selects after it will be removed. This feels like data is a tree.

It has these properties:

- value: the concatenation of all select' values. This is readonly.
- options: array of all selected `<option>`
- dirty

It has these slots:

- placeholder
- dirty-icon
- fixed: you can use it to control the text input. Add an `<inout>` or a `<textarea>` into it
- default: contains the select elements

## Development / contribution

### Setup

Install dependencies:

```bash
npm i
```

### Build

This sample uses the TypeScript compiler to produce JavaScript that runs in modern browsers.

To build the JavaScript version of your component:

```bash
npm run build
```

To watch files and rebuild when the files are modified, run the following command in a separate shell:

```bash
npm run build:watch
```

Both the TypeScript compiler and lit-analyzer are configured to be very strict. You may want to change `tsconfig.json` to make them less strict.

### Testing

This sample uses modern-web.dev's
[@web/test-runner](https://www.npmjs.com/package/@web/test-runner) for testing. See the
[modern-web.dev testing documentation](https://modern-web.dev/docs/test-runner/overview) for
more information.

Tests can be run with the `test` script, which will run your tests against Lit's development mode (with more verbose errors) as well as against Lit's production mode:

```bash
npm test
```

For local testing during development, the `test:dev:watch` command will run your tests in Lit's development mode (with verbose errors) on every change to your source files:

```bash
npm test:watch
```

Alternatively the `test:prod` and `test:prod:watch` commands will run your tests in Lit's production mode.

### Dev Server

This sample uses modern-web.dev's [@web/dev-server](https://www.npmjs.com/package/@web/dev-server) for previewing the project without additional build steps. Web Dev Server handles resolving Node-style "bare" import specifiers, which aren't supported in browsers. It also automatically transpiles JavaScript and adds polyfills to support older browsers. See [modern-web.dev's Web Dev Server documentation](https://modern-web.dev/docs/dev-server/overview/) for more information.

To run the dev server and open the project in a new browser tab:

```bash
npm run serve
```

There is a development HTML file located at `/dev/index.html` that you can view at http://localhost:8000/dev/index.html. Note that this command will serve your code using Lit's development mode (with more verbose errors). To serve your code against Lit's production mode, use `npm run serve:prod`.

### Editing

If you use VS Code, we highly recommend the [lit-plugin extension](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin), which enables some extremely useful features for lit-html templates:

- Syntax highlighting
- Type-checking
- Code completion
- Hover-over docs
- Jump to definition
- Linting
- Quick Fixes

The project is setup to recommend lit-plugin to VS Code users if they don't already have it installed.

### Linting

Linting of TypeScript files is provided by [ESLint](eslint.org) and [TypeScript ESLint](https://github.com/typescript-eslint/typescript-eslint). In addition, [lit-analyzer](https://www.npmjs.com/package/lit-analyzer) is used to type-check and lint lit-html templates with the same engine and rules as lit-plugin.

The rules are mostly the recommended rules from each project, but some have been turned off to make LitElement usage easier. The recommended rules are pretty strict, so you may want to relax them by editing `.eslintrc.json` and `tsconfig.json`.

To lint the project run:

```bash
npm run lint
```

### Formatting

[Prettier](https://prettier.io/) is used for code formatting. It has been pre-configured according to the Lit's style. You can change this in `.prettierrc.json`.

Prettier has not been configured to run when committing files, but this can be added with Husky and `pretty-quick`. See the [prettier.io](https://prettier.io/) site for instructions.

### Static Site

This project includes a simple website generated with the [eleventy](https://11ty.dev) static site generator and the templates and pages in `/docs-src`. The site is generated to `/docs` and intended to be checked in so that GitHub pages can serve the site [from `/docs` on the master branch](https://help.github.com/en/github/working-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

To enable the site go to the GitHub settings and change the GitHub Pages &quot;Source&quot; setting to &quot;master branch /docs folder&quot;.</p>

To build the site, run:

```bash
npm run docs
```

To serve the site locally, run:

```bash
npm run docs:serve
```

To watch the site files, and re-build automatically, run:

```bash
npm run docs:watch
```

The site will usually be served at http://localhost:8000.

**Note**: The project uses Rollup to bundle and minify the source code for the docs site and not to publish to NPM. For bundling and minification, check the [Bundling and minification](#bundling-and-minification) section.

### Bundling and minification

As stated in the [static site generation](#static-site) section, the bundling and minification setup in the Rollup configuration in this project is there specifically for the docs generation.

We recommend publishing components as unoptimized JavaScript modules and performing build-time optimizations at the application level. This gives build tools the best chance to deduplicate code, remove dead code, and so on.

Please check the [Publishing best practices](https://lit.dev/docs/tools/publishing/#publishing-best-practices) for information on publishing reusable Web Components, and [Build for production](https://lit.dev/docs/tools/production/) for building application projects that include LitElement components, on the Lit site.

### More information

See [Get started](https://lit.dev/docs/getting-started/) on the Lit site for more information.
