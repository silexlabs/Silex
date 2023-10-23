# GrapesJs Data Source plugin

This GrapesJS plugin integrates various APIs, such as GraphQL and REST, into the editor. 

It makes a new UI available to the user so that she can manage custom states on components, linking them to data from a CMS or a data base or an API.

The plugin has data management feature needed to manage components states, expressions made of tokens, build a query from the component states.

The output of this plugin is data stored on the components as states. This data then needs to be used by other plugins or the application starting grapesjs. For example you can implement a "publish" feature to generate pages and data files for a static site generator or CMSs

> This code is part of a larger project: [about Silex v3](https://www.silexlabs.org/silex-v3-kickoff/)

[DEMO](##)
> **Provide a live demo of your plugin**
For a better user engagement create a simple live demo by using services like [JSFiddle](https://jsfiddle.net) [CodeSandbox](https://codesandbox.io) [CodePen](https://codepen.io) and link it here in your README (attaching a screenshot/gif will also be a plus).
To help you in this process here below you will find the necessary HTML/CSS/JS, so it just a matter of copy-pasting on some of those services. After that delete this part and update the link above

### HTML
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>
<script src="https://unpkg.com/@silexlabs/grapesjs-data-source"></script>

<div id="gjs"></div>
```

### JS
```js
const editor = grapesjs.init({
	container: '#gjs',
  height: '100%',
  fromElement: true,
  storageManager: false,
  plugins: ['@silexlabs/grapesjs-data-source'],
  pluginsOpts: {
    '@silexlabs/grapesjs-data-source': {
      dataSources: [{
        id: 'directus',
        type: 'graphql',
        name: 'Directus',
        url: `https://localhost:8085/graphql`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer yjgwcj...0c_0zex',
        },
      }, {
        id: 'strapi',
        type: 'graphql',
        name: 'Strapi',
        url: 'http://localhost:1337/graphql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 456fe45a764921a2...6b2298b3cc8',
        },
      }, {
        id: 'supabase',
        type: 'graphql',
        name: 'Supabase',
        url: `https://api.supabase.io/platform/projects/jpslgeqihfj/api/graphql`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyjhbgcioijiuz...tww8imndplsfm',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      }],
      properties: {
        appendTo: () => editor.Panels.getPanel('views-container').view.el,
        button: () => editor.Panels.getPanel('views').get('buttons').get('open-tm'),
      },
      filters: 'liquid',
    }
  }
});
```

### CSS
```css
body, html {
  margin: 0;
  height: 100%;
}
```

## Local tests and development

Use a local strapi to test GraphQL data source

```sh
$ cd strapi
$ yarn develop
```

Strapi admin

* `http://localhost:1337/admin/`
* Login: `alex@test.com`
* Password: `test_TEST1`

Strapi GraphQL:

* `http://localhost:1337/graphql`
* `Bearer 456fe45a764921a26a81abd857bf987cd1735fbdbe58951ff5fc45a1c0ed2c52ab920cc0498b17411cd03954da7bb3e62e6bae612024360fb89717bd2274493ce190f3be14cdf47fccd33182fd795a67e48624e37f7276d9f84e98b2ec6945926d7a150e8c5deafa272aa9d9d97ee89e227c1edb1d6740ffd37a16b2298b3cc8`

Use this as a data source in the plugin options:

```js
grapesjs.init({
  // ...
  // Your config here
  // ...

  plugins: ['@silexlabs/grapesjs-data-source'],
  pluginsOpts: {
    '@silexlabs/grapesjs-data-source': {
      dataSources: [
        {
          id: 'strapi',
          type: 'graphql',
          name: 'Strapi',
          url: 'http://localhost:1337/graphql',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 79c9e74b3cf4a9f5ce2836b81fd8aaf8a986b5696769456d3646a3213f5d7228634a1a15a8bbad4e87c09ab864c501499c6f8955cf350e49b89311764009aee68589a4b78f22c06b7e09835b48cd6f21fb84311ce873cd5672bd4652fde3f5f0db6afb258dfe7b93371b7632b551ecdd969256ffc076ab8f735b5d8c7d228825',
          },
        },
      ],
      properties: {
        appendTo: () => editor.Panels.getPanel('views-container').view.el,
        button: () => editor.Panels.getPanel('views').get('buttons').get('open-tm'),
      },
      filters: 'liquid',
    }
  }
});
```

## Summary

* Plugin name: `@silexlabs/grapesjs-data-source`
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
| `option1` | Description option | `default value` |



## Download

* CDN
  * `https://unpkg.com/@silexlabs/grapesjs-data-source`
* NPM
  * `npm i @silexlabs/grapesjs-data-source`
* GIT
  * `git clone https://github.com/silexlabs/grapesjs-data-source.git`



## Usage

Directly in the browser
```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>
<script src="https://unpkg.com/grapesjs"></script>
<script src="path/to/grapesjs-data-source.min.js"></script>

<div id="gjs"></div>

<script type="text/javascript">
  var editor = grapesjs.init({
      container: '#gjs',
      // ...
      plugins: ['@silexlabs/grapesjs-data-source'],
      pluginsOpts: {
        '@silexlabs/grapesjs-data-source': { /* options */ }
      }
  });
</script>
```

Modern javascript
```js
import grapesjs from 'grapesjs';
import plugin from '@silexlabs/grapesjs-data-source';
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
$ git clone https://github.com/silexlabs/grapesjs-data-source.git
$ cd grapesjs-data-source
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

### Developement notes

Here are the key parts of the plugin:

1. **editor.DataSourceManager**: A Backbone collection to manage the APIs. This collection holds the different available data sources and their settings (type, url, auth...). This data is provided by the config. The main API of this class is `getDataTree()` to get the data tree

1. **DataTree**: A class to manage component states and generate queries to APIs. Component states are used to build the query needed for the current page, and they can be used to create other states in child components or override a component's attributes or style. This collection is generated from the components attributes, it is not stored with the site data.

1. **DataSource**: An interface for classes managing an API, abstracting the calls and queries. It includes methods like `getData(query)` and `getTypes()`.

The components with "Loop Template" also have a `current` state, similar to dynamic pages.

The plugin's architecture is designed to provide a flexible and efficient way to manage data and rendering in the editor, supporting dynamic content and static site generation. It abstracts the complexities of working with different APIs and provides a unified way to manage component states, templates, and dynamic content.



## License

MIT
