# Silex plugins

Environment agnostic (node.js and browser) open architecture (plugin system) inspired by 11ty.dev config

## How it works

1. Install with `npm i @silexlabs/silex-plugins`
1. Use in your app to add a plugin system
1. Create plugins for your app

In your app

`app.js`
```js
import config from './config'

// Add a first plugin which is the main config
const userConfig = config().addPlugin('.myapp.js')

// Notify plugins of important events
userConfig.emit('ready')
```

`.myapp.js`
```js
export default (config) => {
  config.addPlugin('myplugin.js', {
    some: 'options',
  })
  return {
    defaultOption: 'value',
  }
}
```
