import onboarding from './js/client-plugins/onboarding.js'

// This file is loaded by Silex when the user opens the editor
// Its path is set in the environment variable SILEX_CLIENT_CONFIG in index.js
import websiteInfoPlugin from './plugins/client/website-info.js'

export default async function (config) {
    config.addPlugin(websiteInfoPlugin, {})
    config.addPlugin(onboarding, {})
    config.addPublicationTransformers({
        transformPermalink: (path, type) => {
            // Replace /index.html with /
            return type === 'html' && path.endsWith('/index.html') ? path.replace(/index\.html$/, '') : path
        },
    })
    // CMS is now built into silex-lib and enabled by default
    // To configure CMS options, use: config.cmsConfig = { ... }
    // To disable CMS, use: config.cmsConfig = { enabled: false }
    return {}
}
