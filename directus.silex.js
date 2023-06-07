module.exports = function (silexConfig) {
  // Add plugins
  silexConfig.addPlugin(__dirname + '/src/plugins/AuthPlugin', {
    directusUrl: process.env.DIRECTUS_SERVER_TO_SERVER_URL || process.env.DIRECTUS_URL,
    directusToken: process.env.DIRECTUS_TOKEN, // In case no token is passed in the request body
  })
}
