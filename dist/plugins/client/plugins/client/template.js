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
throw new Error('This file is obsolete, templates have been replaced by Silex CMS plugin: https://github.com/silexlabs/silex-cms/');
// Silex serves /clients
// @ts-ignore
import { onAll } from '../client/utils.js';
// @ts-ignore
import { ClientEvent } from '../client/events.js';
// You need to serve lit-html at /js/lit-html/
// @ts-ignore
import { html, render } from '../js/lit-html/lit-html.js';
// @ts-ignore
import { styleMap } from '../js/lit-html/directives/style-map.js';
const silex = window['silex'];
const pluginName = 'template';
const templateType = 'templateType';
const templateKey = 'template';
function createCodeEditor(editor, mode = 'htmlmixed', singleLine = false) {
    const options = {
        readOnly: false,
        codeName: mode,
    };
    if (singleLine) {
        options.lineWrapping = false;
        options.lineNumbers = false;
        options.indentWithTabs = false;
    }
    else {
        options.lineNumbers = true;
        options.lineWrapping = true;
    }
    return editor.CodeManager.createViewer(options);
}
export default async (config, opts = {}) => {
    config.on(ClientEvent.GRAPESJS_END, () => {
        const editor = silex.getEditor();
        // Get the necessary code editors
        const editors = {
            before: createCodeEditor(editor),
            replace: createCodeEditor(editor),
            after: createCodeEditor(editor),
            attributes: createCodeEditor(editor, 'text', true),
            classname: createCodeEditor(editor, 'text', true),
            style: createCodeEditor(editor, 'css', true),
        };
        const is1line = {
            before: false,
            replace: false,
            after: false,
            attributes: true,
            classname: true,
            style: true,
        };
        // Add the new trait to all component types
        editor.DomComponents.getTypes().map(type => {
            const originalType = editor.DomComponents.getType(type.id);
            editor.DomComponents.addType(type.id, {
                model: {
                    defaults: {
                        traits: [
                            // Keep the type original traits
                            ...originalType.model.prototype.defaults.traits,
                            // Add the new trait
                            {
                                label: false,
                                type: templateType,
                                name: pluginName,
                            },
                        ]
                    }
                }
            });
        });
        function doRender(el) {
            const template = editor.getSelected()?.get(templateKey) || {};
            const taStyle = opts.styles?.textarea ?? styleMap({
                xxbackgroundColor: 'var(--darkerPrimaryColor)',
            });
            const sepStyle = opts.styles?.sep ?? styleMap({ height: '10px' });
            const labels = {
                before: html `<strong>Before</strong> the element`,
                replace: html `<strong>Replace</strong> the element's children`,
                after: html `<strong>After</strong> the element`,
                attributes: html `HTML attributes`,
                classname: html `CSS classes`,
                style: html `CSS styles`,
            };
            render(html `
      <style>
        .CodeMirror {
          height: 100%;
        }
      </style>
      <div>
        <h3>Template</h3>
        <p>This will be inserted in the published version</p>
      </div>
      ${[
                'classname',
                'attributes',
                'style',
                'before',
                'replace',
                'after',
            ].map(id => html `
      <label data-contain="${id}" class="template-wrapper-${id}">
        ${labels[id]}
      </label>
      `)}
    `, el);
            el.querySelectorAll('[data-contain]').forEach(container => {
                const id = container.getAttribute('data-contain');
                const codeEditor = editors[id];
                container.appendChild(codeEditor.getElement());
                codeEditor.getElement().style.display = 'block';
                codeEditor.getElement().style.height = is1line[id] ? '' : '200px';
                codeEditor.getElement().style.width = '100%';
                codeEditor.setContent(template[id] ?? '');
                codeEditor.refresh();
            });
            // Make sure we apply the changes when the user presses any key
            // The events should be triggered by the trait manager (call onEvent) but it doesn't work for "delete" key for example
            el.onkeyup = () => {
                applyChanges(editor.getSelected());
            };
        }
        function applyChanges(component) {
            const template = {
                before: editors.before.getContent(),
                replace: editors.replace.getContent(),
                after: editors.after.getContent(),
                attributes: editors.attributes.getContent(),
                classname: editors.classname.getContent(),
                style: editors.style.getContent(),
            };
            // Store the new template
            if (Object.values(template).filter(val => !!val && !!cleanup(val)).length > 0) {
                component.set(templateKey, template);
            }
            else {
                component.set(templateKey);
            }
        }
        editor.TraitManager.addType(templateType, {
            createInput({ trait }) {
                // Create a new element container and add some content
                const el = document.createElement('div');
                el.classList.add('gjs-one-bg');
                // update the UI when a page is added/renamed/removed
                editor.on('page', () => doRender(el));
                doRender(el);
                // this will be the element passed to onEvent and onUpdate
                return el;
            },
            // Update the component based on UI changes
            // `elInput` is the result HTMLElement you get from `createInput`
            onEvent({ elInput, component, event }) {
                applyChanges(component);
            },
            // Update UI on the component change
            onUpdate({ elInput, component }) {
                doRender(elInput);
            },
        });
        // Make html attribute
        // Quote strings, no values for boolean
        function makeAttribute(key, value) {
            switch (typeof value) {
                case 'boolean': return value ? key : '';
                default: return `${key}="${value}"`;
            }
        }
        // Remove empty lines in templates
        function cleanup(template) {
            return template
                // split in lines
                .split('\n')
                // remove lines with only spaces
                .map(line => line.trim())
                .filter(line => !!line)
                // put back together
                .join('\n');
        }
        if (opts.publication !== false) {
            editor.on(ClientEvent.PUBLISH_START, () => {
                // Insert templates
                onAll(editor, c => {
                    const template = c.get(templateKey);
                    const toHTML = c.toHTML;
                    const classes = c.getClasses();
                    const before = cleanup(template?.before || '');
                    const replace = cleanup(template?.replace || '');
                    const after = cleanup(template?.after || '');
                    const classname = cleanup(template?.classname || '');
                    const style = cleanup(template?.style || '');
                    const attributes = cleanup(template?.attributes || '');
                    // Store the initial method
                    if (!c.has('tmpHtml'))
                        c.set('tmpHtml', toHTML);
                    // Override the method
                    c.toHTML = () => {
                        return `${before}${c.get('tagName') ? `<${c.get('tagName')}
            ${Object.entries(c.get('attributes')).map(([key, value]) => makeAttribute(key, value)).join(' ')}
            ${classes.length || classname ? `class="${classes.join(' ')} ${classname}"` : ''}
            ${attributes}
            ${style ? `style="${style}"` : ''}
            >` : ''}${replace || c.getInnerHTML()}${c.get('tagName') ? `</${c.get('tagName')}>` : ''}${after}`;
                    };
                });
            });
            editor.on(ClientEvent.PUBLISH_END, () => {
                onAll(editor, c => {
                    // Restore the original method
                    c.toHTML = c.get('tmpHtml');
                });
            });
        }
    });
};
//# sourceMappingURL=template.js.map