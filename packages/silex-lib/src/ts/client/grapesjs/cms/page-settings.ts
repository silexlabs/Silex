import { removeState, setState, toExpression } from '@silexlabs/grapesjs-data-source'
import { CMS_SETTINGS_SECTION_ID, EleventyPluginOptions, Silex11tyPluginWebsiteSettings } from './index'
import { html, TemplateResult } from 'lit-html'
import { Page, Editor, Component } from 'grapesjs'
import { WebsiteSettings } from '../../../types'
import { ClientEvent } from '../../events'
import { cmdAddSection } from '../settings'
import { createRef, ref } from 'lit-html/directives/ref.js'

/**
 * Main function to add the settings to the page
 */
export default function(editor: Editor, opts: EleventyPluginOptions): void {
  if (!opts.enable11ty) return // Do not add the settings if 11ty is disabled

  editor.on(ClientEvent.SETTINGS_SAVE_END, handleSettingsSaveEnd(editor))
  editor.on(ClientEvent.SETTINGS_CLOSE, handleSettingsClose(editor))

  editor.runCommand(cmdAddSection, {
    section: {
      id: CMS_SETTINGS_SECTION_ID,
      label: 'CMS',
      render: (settings: WebsiteSettings, page: Backbone.Model) => {
        currentPage = page as Page
        return renderSettingsSection(settings, editor, currentPage)
      },
    },
    siteOrPage: 'page',
    position: 'last',
  })
}

// Store original settings for revert functionality
let originalSettings: Silex11tyPluginWebsiteSettings | null = null
let currentPage: Page | undefined

function handleSettingsSaveEnd(editor: Editor) {
  return (page: Page) => {
    updateBodyStates(editor, page)
    currentPage = null
    originalSettings = null
  }
}

function handleSettingsClose(editor: Editor) {
  return () => {
    if (currentPage && originalSettings) {
      const currentSettings = currentPage.get('settings') as Silex11tyPluginWebsiteSettings || {}
      // Revert the whole settings object if it was changed
      if (JSON.stringify(currentSettings) !== JSON.stringify(originalSettings)) {
        currentPage.set('settings', originalSettings)
        updateBodyStates(editor, currentPage)
      }
    }
    currentPage = null
    originalSettings = null
  }
}

function updateTemporarySettings(editor: Editor, page: Page, pageDataEditor: HTMLInputElement | undefined): void {
  if (!pageDataEditor) return
  originalSettings = page.get('settings') as WebsiteSettings
  const eleventyPageData = pageDataEditor.value || ''
  page.set('settings', {
    ...originalSettings,
    eleventyPageData,
  } as Silex11tyPluginWebsiteSettings)
  updateBodyStates(editor, page)
}

/**
 * Set the state on the body component
 * This is only useful to build the GraphQL query
 */
function stateOnBody(editor: Editor, value: string, name: string, body: Component): void {
  if (value) {
    const expression = toExpression(value)
    if (expression) {
      setState(body, name, {
        label: name,
        hidden: true,
        expression,
      })
    } else {
      removeState(body, name)
      editor.runCommand('notifications:add', {
        type: 'error',
        message: `Invalid JSON for ${name}`,
        group: 'Errors in your settings',
      })
    }
  } else {
    removeState(body, name)
  }
}

/**
 * Set the state on the body component
 * This is only useful to build the GraphQL query
 */
const bodyStateKeys: (keyof Silex11tyPluginWebsiteSettings)[] = [
  'eleventySeoTitle',
  'eleventySeoDescription',
  'eleventyFavicon',
  'eleventyOGImage',
  'eleventyOGTitle',
  'eleventyOGDescription',
  'eleventyPageData',
  'eleventyPermalink',
]

function updateBodyStates(editor: Editor, page: Page): void {
  if (page) {
    const settings = page?.get('settings') as Silex11tyPluginWebsiteSettings | undefined
    if (settings) {
      const body = page.getMainComponent()
      for (const key of bodyStateKeys) {
        stateOnBody(editor, (settings as Record<string, string>)[key], key, body)
      }
    }
  }
}

/**
 * Render the settings form
 */
function renderSettingsSection(settings: Silex11tyPluginWebsiteSettings, editor: Editor, page: Page): TemplateResult {
  const body = page.getMainComponent()
  const pageDataEditor = createRef<HTMLInputElement>()
  setTimeout(() => {
    // Update all input fields with their corresponding values from settings
    // This is needed because we change things without refreshing the DOM in JS
    ;(document.querySelectorAll(`
      #settings-${CMS_SETTINGS_SECTION_ID} input,
      #settings-${CMS_SETTINGS_SECTION_ID} state-editor
    `) as NodeListOf<HTMLInputElement>)
      .forEach((input: HTMLInputElement) => {
        const value = settings[input.name]
        if (input.type === 'checkbox') {
          input.checked = !!value
        } else if (typeof value !== 'undefined') {
          input.value = value
        } else {
          input.value = ''
        }
      })
  })
  return html`
    <style>
      .silex-warning {
        margin-top: 10px
        padding: 10px
        background-color: var(--ds-primary)
        border-color: var(--ds-button-color)
        color: #721c24
        border: 1px solid transparent
        border-radius: .25rem
      }
    </style>
    <div id="settings-${CMS_SETTINGS_SECTION_ID}" class="silex-hideable silex-hidden">
      <div class="silex-help">
        The "Silex CMS" feature integrates <a target="_blank" href="https://www.11ty.dev/">11ty</a> static site generator and your favorite headless CMS with Silex.
        <br>Read Silex <a target="_blank" href="https://docs.silex.me/en/user/cms">documentation</a> to learn more.
      </div>
      <div class="silex-form__group col2">
        <label class="silex-form__element">
          <p class="silex-help">Pagination allows you to iterate over data and create multiple website pages from a single page in Silex. This feature is based on <a target="_blank" href="https://www.11ty.dev/docs/pagination/">Eleventy pagination, read more in the docs</a>.</p>
          <state-editor
            ${ref(pageDataEditor)}
            id="eleventyPageData"
            name="eleventyPageData"
            value=${settings.eleventyPageData ?? ''}
            .editor=${editor}
            .selected=${body}
            @change=${() => updateTemporarySettings(editor, page, pageDataEditor.value)}
            no-states
            no-filters
          >
            <label slot="label">Pagination Data</label>
          </state-editor>
          <state-editor
            id="eleventyPermalink"
            name="eleventyPermalink"
            value=${settings.eleventyPermalink ?? ''}
            .editor=${editor}
            .selected=${body}
          >
            <label slot="label">Permalink</label>
          </state-editor>
          <details class="silex-more"><summary>Advanced params</summary>
          <label class="silex-form__element">Reverse
            <input type="checkbox" name="eleventyPageReverse" ?checked=${!!settings.eleventyPageReverse}/>
          </label>
          <label class="silex-form__element">Size
            <input type="number" name="eleventyPageSize" .value=${settings.eleventyPageSize ?? 1} placeholder="1" />
          </label>
          <label class="silex-form__element">Available languages
            <p class="silex-help">Silex can duplicate this page for each language and generate a different URL for each language. Provide a comma separated list of languages. For example: <code>en,fr</code>. An empty value will deactivate this feature.</p>
            <input type="text" name="silexLanguagesList" .value=${settings.silexLanguagesList ?? ''} placeholder="en, fr, es" />
          </label>
        </label>
        <label class="silex-form__element">
          <h3 class="gjs-sm-sector-title">Navigation Plugin</h3>
          <p class="silex-help">This 11ty plugin enables infinite-depth hierarchical navigation in Eleventy projects. Supports breadcrumbs too! <a target="_blank" href="https://www.11ty.dev/docs/plugins/navigation/">Read more about the Navigation Plugin</a>.</p>
          <label class="silex-form__element">Key
            <input type="text" name="eleventyNavigationKey" .value=${settings.eleventyNavigationKey ?? ''}/>
          </label>
          <label class="silex-form__element">Title
            <input type="text" name="eleventyNavigationTitle" .value=${settings.eleventyNavigationTitle ?? ''}/>
          </label>
          <label class="silex-form__element">Order
            <input type="number" name="eleventyNavigationOrder" .value=${settings.eleventyNavigationOrder ?? ''}/>
          </label>
          <label class="silex-form__element">Parent
            <input type="text" name="eleventyNavigationParent" .value=${settings.eleventyNavigationParent ?? ''}/>
          </label>
          <label class="silex-form__element">URL
            <input type="text" name="eleventyNavigationUrl" .value=${settings.eleventyNavigationUrl ?? ''}/>
          </label>
        </label>
        </details>
        <details class="silex-more"><summary>Override SEO and social settings</summary>
        <label class="silex-form__element">
          <h3>SEO</h3>
          <state-editor
            id="eleventySeoTitle"
            name="eleventySeoTitle"
            .value=${settings.eleventySeoTitle ?? ''}
            .editor=${editor}
            .selected=${body}
          >
            <label slot="label">Title</label>
          </state-editor>
          <state-editor
            id="eleventySeoDescription"
            name="eleventySeoDescription"
            .value=${settings.eleventySeoDescription ?? ''}
            .editor=${editor}
            .selected=${body}
          >
            <label slot="label">Description</label>
          </state-editor>
          <state-editor
            id="eleventyFavicon"
            name="eleventyFavicon"
            .value=${settings.eleventyFavicon ?? ''}
            .editor=${editor}
            .selected=${body}
          >
            <label slot="label">Favicon</label>
          </state-editor>
        </label>
        <label class="silex-form__element">
          <h3>Social</h3>
          <state-editor
            id="eleventyOGImage"
            name="eleventyOGImage"
            .value=${settings.eleventyOGImage ?? ''}
            .editor=${editor}
            .selected=${body}
          >
            <label slot="label">OG Image</label>
          </state-editor>
          <state-editor
            id="eleventyOGTitle"
            name="eleventyOGTitle"
            .value=${settings.eleventyOGTitle ?? ''}
            .editor=${editor}
            .selected=${body}
          >
            <label slot="label">OG Title</label>
          </state-editor>
          <state-editor
            id="eleventyOGDescription"
            name="eleventyOGDescription"
            .value=${settings.eleventyOGDescription ?? ''}
            .editor=${editor}
            .selected=${body}
          >
            <label slot="label">OG Description</label>
          </state-editor>
        </label>
        </details>
      </div>
    </div>
    `
}
