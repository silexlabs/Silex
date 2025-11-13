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

import { Editor } from 'grapesjs'

/**
 * Lottie animation block plugin for Silex
 * Allows users to embed Lottie animations using the lottie-player web component
 * Follows GrapesJS best practices for loading external scripts
 */
export const lottiePlugin = (editor: Editor, opts = {}) => {
  const options = {
    category: 'Media',
    ...opts,
  }

  const componentId = 'lottie-animation'

  // Add the Lottie block to the block manager
  editor.BlockManager.add(componentId, {
    label: 'Lottie',
    category: options.category,
    media: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
    </svg>`,
    content: {
      type: componentId,
    },
  })

  // Define the Lottie component type
  editor.DomComponents.addType(componentId, {
    model: {
      defaults: {
        // Use a div container for the lottie-player
        tagName: 'div',
        attributes: {
          'data-lottie-src': 'https://assets2.lottiefiles.com/packages/lf20_uwR49r.json',
        },
        style: {
          width: '300px',
          height: '300px',
        },
        // Declare which properties to pass to the script
        // This will also reset the script on their changes
        'script-props': ['lottie-src', 'lottie-loop', 'lottie-autoplay', 'lottie-speed', 'lottie-background', 'lottie-controls', 'lottie-mode'],
        // Script to load and initialize lottie-player
        // Use regular function (not arrow function) so `this` binds to the component element
        script: function(props) {
          const initLottie = () => {
            // Get properties from script-props
            const src = props['lottie-src'] || this.getAttribute('data-lottie-src') || ''
            const loop = props['lottie-loop'] !== 'false'
            const autoplay = props['lottie-autoplay'] !== 'false'
            const speed = props['lottie-speed'] || '1'
            const background = props['lottie-background'] || 'transparent'
            const controls = props['lottie-controls'] === 'true'
            const mode = props['lottie-mode'] || 'normal'

            // Create the lottie-player element
            this.innerHTML = `<lottie-player
              src="${src}"
              background="${background}"
              speed="${speed}"
              ${loop ? 'loop' : ''}
              ${autoplay ? 'autoplay' : ''}
              ${controls ? 'controls' : ''}
              mode="${mode}"
              style="width: 100%; height: 100%;">
            </lottie-player>`
          }

          // Load the lottie-player script if not already loaded
          // This ensures the script is only loaded once and is included in exported HTML
          const scriptId = 'lottie-player-script'
          const existingScript = document.getElementById(scriptId)

          if (!existingScript && (typeof customElements === 'undefined' || !customElements.get('lottie-player'))) {
            // Script not loaded yet, add it
            const script = document.createElement('script')
            script.id = scriptId
            script.onload = initLottie
            script.src = '/lottie-player/lottie-player.js'
            document.head.appendChild(script)
          } else if (existingScript && typeof customElements !== 'undefined' && !customElements.get('lottie-player')) {
            // Script tag exists but not loaded yet, wait for it
            existingScript.addEventListener('load', initLottie)
          } else {
            // Script already loaded
            initLottie()
          }
        },
        // Define component traits (settings panel)
        traits: [
          {
            type: 'text',
            label: 'Animation URL',
            name: 'lottie-src',
            placeholder: 'https://assets.lottiefiles.com/...',
            changeProp: true,
          },
          {
            type: 'checkbox',
            label: 'Loop',
            name: 'lottie-loop',
            valueTrue: 'true',
            valueFalse: 'false',
            changeProp: true,
          },
          {
            type: 'checkbox',
            label: 'Autoplay',
            name: 'lottie-autoplay',
            valueTrue: 'true',
            valueFalse: 'false',
            changeProp: true,
          },
          {
            type: 'number',
            label: 'Speed',
            name: 'lottie-speed',
            min: 0.1,
            max: 3,
            step: 0.1,
            placeholder: '1',
            changeProp: true,
          },
          {
            type: 'select',
            label: 'Background',
            name: 'lottie-background',
            options: [
              { id: 'transparent', name: 'Transparent' },
              { id: '#ffffff', name: 'White' },
              { id: '#000000', name: 'Black' },
            ],
            changeProp: true,
          },
          {
            type: 'checkbox',
            label: 'Show Controls',
            name: 'lottie-controls',
            valueTrue: 'true',
            valueFalse: 'false',
            changeProp: true,
          },
          {
            type: 'select',
            label: 'Mode',
            name: 'lottie-mode',
            options: [
              { id: 'normal', name: 'Normal' },
              { id: 'bounce', name: 'Bounce' },
            ],
            changeProp: true,
          },
        ],
      },
    },
  })
}
