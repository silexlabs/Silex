# eleventy-plugin-concat

Eleventy plugin to bundle your scripts and styles

This plugin is contributed by [Internet 2000 web studio](https://internet2000.net/), it is used to create green websites with [Silex website builder](https://www.silex.me/)

## Links

* [The plugin on npm](https://www.npmjs.com/package/@silexlabs/eleventy-plugin-concat) (`@silexlabs/eleventy-plugin-concat`)
* [Github repo](https://github.com/silexlabs/eleventy-plugin-concat)

## Overview

1. Add the plugin to your `.eleventy.js` config
1. Add `data-concat` attribute to `<script>`, `<script src=`, `<style>` and `<link rel="stylesheet" href=` which are in the page `<head>`
1. After the site has been built by eleventy, the plugin will write new `script.js` and `style.css` files with the content of all the scripts and styles with `data-concat`
1. The plugin will also change you HTML to load the new script and style in place of the old ones

> Tip: this plugin works great with [eleventy-plugin-helmet](https://www.npmjs.com/package/eleventy-plugin-helmet) which makes it easy to group scripts of templates in HEAD

## Features

This is the roadmap and feature list:

* [x] Transform all generated pages after the build
* [x] Concat inline scripts
* [x] Concat loaded scripts from base url and get their content from file system
* [x] Concat loaded third-party scripts and fetch their content
* [x] Concat inline styles
* [x] Concat loaded stylesheets from base url and get their content from file system
* [x] Concat loaded third-party stylesheets and fetch their content

## Example

`page.njk` (also works with liquid or other template language):
```html
<!doctype html>
<html>
  <head>
    <script src="/site.js" data-concat></script>
    <script src="/page.js" data-concat></script>
    <script data-concat>
        console.log('concat')
    </script>
    <link rel="stylesheet" href="/site.css" data-concat />
    <link rel="stylesheet" href="/page.css" data-concat />
    <style data-concat>
        body { background: blue; }
    </style>
  </head>
</html>
```

Generated `_site/page.html`:
```html
<!doctype html>
<html>
  <head>
    <script src="/script.js"></script>
    <link rel="stylesheet" href="/style.css" />
  </head>
</html>
```

Generated `_site/script.js`:
```js
// ... content of site.js
// ... content of page.js
console.log('concat')
```

Generated `_site/style.css`:
```js
/* ... content of site.css */
/* ... content of page.css */
body { background: blue; }
```
### Usage

1. Install the plugin using npm:

   ```sh
   npm install @silexlabs/eleventy-plugin-concat
   ```

2. Add the plugin to your `.eleventy.js` config:

   ```js
   const pluginConcat = require("@silexlabs/eleventy-plugin-concat")

   module.exports = (eleventyConfig) => {
     eleventyConfig.addPlugin(pluginConcat, {
       baseUrl: 'http://localhost:8080',
     })
   }
   ```
3. Use the global `data-concat` attribute in your templates

## Options

The default options are stored in `src/defaults.js`

| Name | Description | Default |
| -- | -- | -- |
| jsUrl | Url of the generated script (what you want the plugin to insert in your HTML) | '/js/script.js' |
| jsPath | Path of the generated script inside the output dir | 'js/script.js' |
| jsSelector | Selector used to find the scripts to be concatenated in the HTML page | 'head script[data-concat]' |
| jsAttributes | Attributes you want the plugin to add to the JS tag in your HTML, e.g. `async` | '' |
| cssUrl | Url of the generated stylesheet (what you want the plugin to insert in your HTML) | '/css/styles.css' |
| cssPath | Path of the generated stylesheet inside the output dir | 'css/styles.css' |
| cssSelector | Selector used to find the styles to be concatenated in the HTML page | 'head link[data-concat], head style[data-concat]' |
| cssAttributes | Attributes you want the plugin to add to the CSS tag in your HTML, e.g. `data-custom="abcd"` | '' |
| baseUrl | The URL where your site will be available, e.g. `https://www.silex.me` => `https://www.silex.me/js/test.js` will be read from file system in `./js` | 'http://localhost:8080' |

