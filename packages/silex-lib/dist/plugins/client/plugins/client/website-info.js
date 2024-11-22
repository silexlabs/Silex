/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { ClientEvent } from '../../client/events.js';
// Silex plugin
export default async function (config) {
    let websiteMeta = null;
    config.on(ClientEvent.GRAPESJS_START, async () => {
        // GrapesJs plugin
        const grapesPlugin = (editor, opts) => {
            const options = {
                appendTo: 'commands',
                ...opts,
            };
            editor.on('storage:end:load', async () => {
                // Get website meta data
                const { websiteId, connectorId } = options;
                // Get the website meta data
                websiteMeta = await config.api.websiteMetaRead({ websiteId, connectorId });
                displayWebsiteMeta();
            });
            return {};
        };
        // Add the plugin to the GrapeJS
        config.grapesJsConfig.plugins.push(grapesPlugin);
        config.grapesJsConfig.pluginsOpts[grapesPlugin.toString()] = {
            websiteId: config.websiteId,
            connectorId: config.storageId,
        };
    });
    config.on(ClientEvent.GRAPESJS_END, async ({ editor }) => {
        // Detect when the page changes
        editor.on('page:select', async () => {
            displayWebsiteMeta();
        });
    });
    // Display the website meta data
    function displayWebsiteMeta() {
        // Get or create the container
        const container = document.querySelector('#gjs-website-meta') ?? (function () {
            const c = document.createElement('div');
            c.id = 'gjs-website-meta';
            c.classList.add('gjs-website-meta');
            // Add the container to the UI
            // Add the name of the website in the top bar
            const topBar = document.querySelector('.gjs-pn-devices-c');
            topBar?.appendChild(c);
            return c;
        })();
        // Get the current page
        const currentPage = config.getEditor().Pages?.getSelected();
        // Display the website meta data
        container.innerHTML = `
        ${websiteMeta?.imageUrl ? `<div class="gjs-website-meta-image" style="background: url(${websiteMeta?.imageUrl});"></div>` : ''}
        <div class="gjs-website-meta-name">${websiteMeta?.name ?? 'Unknown'} | ${currentPage.get('name') ?? currentPage.get('type')}</div>
      `;
    }
}
//# sourceMappingURL=website-info.js.map