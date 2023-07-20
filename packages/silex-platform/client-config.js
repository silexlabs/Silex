// This file is loaded by Silex when the user opens the editor
// Its path is set in the environment variable SILEX_CLIENT_CONFIG in index.js
import websiteInfoPlugin from './plugins/client/website-info.js'

export default async function (config) {
    config.addPlugin(websiteInfoPlugin, {})
    return {}
}
