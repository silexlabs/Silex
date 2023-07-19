// This file is loaded by Silex when the user opens the editor
// Its path is set in the environment variable SILEX_CLIENT_CONFIG in index.js
export default async function (config) {
    console.log('Silex client config loaded', config)
    return {}
}
