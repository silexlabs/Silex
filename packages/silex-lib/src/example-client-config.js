import directusStorage from 'https://unpkg.com/@silexlabs/grapesjs-directus-storage'
console.log('directusStorage', directusStorage, directusStorage?.default)

// Use the environment variable SILEX_CLIENT_CONFIG or the CLI option --client-config to override the default config with this file
export default async function (config, options) {
  console.log('In example config')
  //await config.addPlugin('gjs-blocks-basic', 'https://unpkg.com/grapesjs-blocks-basic', {
  //    blocks: ['text', 'image', 'video', 'map'],
  //})

  // Optional plugins
  await config.addPlugin([
    '@silexlabs/grapesjs-directus-storage',
    './plugins/@silexlabs/grapesjs-directus-storage/dist/index.js',
  ], {
    '@silexlabs/grapesjs-directus-storage': {
      directusUrl: 'http://localhost:8055',
    },
    './plugins/@silexlabs/grapesjs-directus-storage/dist/index.js': {
      directusUrl: 'http://localhost:8055',
    },
  })

  // Return an object to override default config
  return {
    ...config,
    ...options,
    editor: {
      ...config.editor,
      storageManager: {
        autoload: false,
        type: 'directus',
      },
      plugins: [
        ...config.editor.plugins,
        directusStorage,
      ],
      pluginsOpts: {
        ...config.editor.pluginsOpts,
        [directusStorage]: {
          directusUrl: 'http://localhost:8055',
        },
      },
    },
  }
}

