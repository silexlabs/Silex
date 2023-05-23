const defaultConfig = require('./.silex.js')

module.exports = function(silexConfig) {
    // Add plugins
    silexConfig.addPlugin([
        {
            require: './plugins/AuthPlugin',
            active: true,
            type: ['SERVER'],
            options: {
                directusUrl: process.env.DIRECTUS_SERVER_TO_SERVER_URL || process.env.DIRECTUS_URL,
                directusToken: process.env.DIRECTUS_TOKEN, // In case no token is passed in the request body
            },
        }, 
    ])

    // Based on default config
    defaultConfig(silexConfig)
}