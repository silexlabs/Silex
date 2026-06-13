// This file is loaded by Silex when the user opens the editor (SaaS only).
// Its path is set in the environment variable SILEX_CLIENT_CONFIG.
// NB: website-info is now a default editor plugin (bundled, see editor/config.ts
// addDefaultPlugins) — no longer loaded here. Only the SaaS-specific onboarding remains.
import onboarding from './js/client-plugins/onboarding.js'

export default async function (config) {
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
