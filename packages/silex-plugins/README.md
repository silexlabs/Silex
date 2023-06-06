# Silex plugins

Environment agnostic (node.js, browser, commonjs, esnext...) open architecture (plugin system) inspired by 11ty.dev config

## In a nutshell

Plugins can be added as a function or loaded from absolute path, relative path or URL

A plugin takes a Config object and returns an object which will be merged into the initial Config object. The config object emits events and has a method `addPlugin` to attach other plugins from a plugin on specific events.

## How it works

1. Install with `npm i @silexlabs/silex-plugins`
1. Use in your app to add a plugin system
1. Create plugins for your app

In your app

`app.js`
```js
import config from '@silexlabs/silex-plugins'

// Create a config instance
const userConfig = config()

// Add a first plugin which is the main config
userConfig.addPlugin('.myapp.js')

// Notify plugins of important events
userConfig.emit('ready')
```

`.myapp.js`: This is a config file and a plugin
```js
export default (config) => {
  config.on('ready', () => 'do something')
  config.addPlugin('myplugin.js', {
    text: 'some options',
  })
  return {
    defaultOption: 'value',
  }
}
```
`myplugin.js`: This is a plugin
```js
export default (config, options) => {
  config.on('ready', () => `do something else with ${ options.text }`)

  return {
    defaultOption: 'override config',
  }
}
```

Other ways to add plugins:

```js
// Add a multiple plugins at once
// Path or URL
config.addPugin([
  'https://unpkg.com/some-plugin',
  'node_modules/some-plugin',
  '.myappconfig',
  function namedFunction(config, options) {
    return {
      text: 'returns some options to merge into the config',
      other: `this is the ${options} object`,
    }
  },
  (config, options) => ({
    text: 'returns some options to merge into the config',
    other: `this is the ${options} object`,
  }),
], {
  'https://unpkg.com/some-plugin': {},
  'node_modules/some-plugin': {},
  '.myappconfig': {},
  'namedFunction': {},
})

```
