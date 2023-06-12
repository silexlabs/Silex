# Silex plugins

Environment agnostic (node.js, browser, commonjs, esnext...) open architecture (plugin system) inspired by 11ty.dev config

## In a nutshell

Plugins can be added as a function or loaded from absolute path, relative path or URL

A plugin takes a Config object and returns an object which will be merged into the initial Config object. The config object emits events and has a method `addPlugin` to attach other plugins from a plugin on specific events.

## How it works

1. Install with `npm i @silexlabs/silex-plugins`
1. Use in your app to add a plugin system
1. Create plugins for your app

## Example

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

## The many ways to add a plugin from a config object

It can be done from a plugin or your app which creates the config object

1. A plugin which is just a simple function
  ```js
  function plugin(config, options) { console.log(options.anoption) } // This will log "a value"
  export default(config, _) {
    config.addPlugin(plugin, { anoption: "a value" })
  }
  ```
1. A plugin from npm
  ```js
  export default(config, _) {
    config.addPlugin('https://unpkg.com/some-plugin', { anoption: "a value" })
  }
  ```
1. A plugin you import yourself
  ```js
  import plugin from 'a-plugin'
  export default(config, _) {
    config.addPlugin(plugin, { anoption: "a value" })
  }
  ```
1. Multiple plugins at once
  ```js
  // Define a function
  // The return value will be merged in the config object
  function namedFunction(config, options) {
    return {
      text: 'returns some options to merge into the config',
      other: `this is the ${options} object`,
    }
  }
  export default(config, _) {
    // Add a multiple plugins at once
    // Path or URL
    config.addPugin([
      'https://unpkg.com/some-plugin',
      'node_modules/some-plugin',
      '.myappconfig',
      namedFunction,
    ], { // Here is how to pass options to the plugins
      'https://unpkg.com/some-plugin': {},
      'node_modules/some-plugin': {},
      '.myappconfig': {},
      [namedFunction]: {},
    })
  }
  ```
