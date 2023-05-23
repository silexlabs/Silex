module.exports = function(silexConfig) {
    silexConfig.addPlugin([
        { require: 'src/plugins/ExpressPlugin.js', options: {}, active: true, type: ['SERVER'], hidden: true },
        { require: 'src/plugins/SslPlugin.js', options: {}, active: true, type: ['SERVER'], hidden: true },
        { require: 'src/plugins/StaticPlugin.js', options: {}, active: true, type: ['SERVER'], hidden: true },
        {
            require: 'src/plugins/WebsitePlugin.js',
            active: true,
            type: ['SERVER'],
            hidden: true,
            options: {
                backend: 'src/plugins/DefaultBackend.js',
            },
        },
        {
            require: 'src/plugins/PublishPlugin.js',
            active: true,
            type: ['SERVER'],
            hidden: true,
            options: {
                backend: 'src/plugins/DefaultBackend.js',
            },
        },
    ])
}