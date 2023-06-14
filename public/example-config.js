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
    },
  }
}

