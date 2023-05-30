# Silex plugins

Open architecture / plugin system for node.js and the browser. Inspired by 11ty.dev config

1. Install with `npm i @silexlabs/silex-plugins`
1. Use in your app to add a plugin system
1. Create plugins for your app

In your app

`app.js`
```js
import config from './config'

// Add a first plugin which is the main config
const userConfig = config().addPlugin('.myapp.js')
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
