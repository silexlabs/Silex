import {live} from 'lit-html/directives/live.js'
import {html, TemplateResult, nothing} from 'lit-html'
import { WebsiteMeta, WebsiteSettings } from '../../types'
import { websiteMetaRead } from '../api' // Adjust as needed
import { ClientConfig, config } from '..'
import { Editor } from 'grapesjs'
import { cmdRenderSection } from './settings'

// ID of the code editor wrapper
export const idCodeWrapper = 'settings-head-wrapper'

export let websiteMeta: WebsiteMeta | null = null
export async function updateInfo() {
  /* @ts-ignore There should be a better way to get Silex config */
  const config = window.silex.config as ClientConfig
  if (!websiteMeta) {
    const { websiteId, storageId } = config
    websiteMeta = await websiteMetaRead({ websiteId, connectorId: storageId })
    console.log('RE RENDER PLS', { websiteMeta, websiteId, storageId })
    config.getEditor().runCommand(cmdRenderSection)
  }
}

// Is the model a site or a page?
export function isSite(model: any) { return !!model.getHtml }
export function siteOrPage(model: any) { return isSite(model) ? 'website' : 'page' }

export interface SettingsSection {
  id: string
  label: string
  render: (settings: WebsiteSettings, model: Backbone.Model) => TemplateResult
}

/**
 * This is the settings dialog default sections
 * Each section has an entry in the sidebar
 * Each section render as part of the settings form
 * The form is submitted to save the settings with all FormData
 */
export const defaultSections: SettingsSection[] = [{
  id: 'general',
  label: 'General',
  render: (settings, model) => html`
    <div id="settings-general" class="silex-hideable">
      <div class="silex-form__group col2">
        ${!isSite(model) ? html`
          <label class="silex-form__element">
            <h3>Page name</h3>
            <p class="silex-help">Label of the page in the editor, and file name of the published HTML page.</p>
            <input type="text" name="name" .value=${live(model.get('name') || '')}/>
          </label>
          ` : nothing }
      </div>
      ${isSite(model) ? html`
        <div class="silex-repo-section">
          <h4 class="silex-repo-section__title">Storage & Publication</h4>
          <p class="silex-help silex-repo-section__help">
            Your website is stored as a <strong>GitLab project</strong>, which handles versioning and publishing.
            ${websiteMeta?.repoUrl?.includes('gitlab.com') ? html`
              <a href="https://gitlab.com" target="_blank" rel="noopener">GitLab.com</a> is the official free hosting service provided by GitLab Inc.
            ` : nothing}
          </p>
          <div class="silex-repo-section__content">
            ${websiteMeta?.repoUrl ? html`
              ${websiteMeta.forkedFrom && websiteMeta.forkedFrom.name ? html`
                <div class="silex-repo-fork-notice">
                  <div class="silex-repo-fork-notice__header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="18" r="3"></circle>
                      <circle cx="6" cy="6" r="3"></circle>
                      <circle cx="18" cy="6" r="3"></circle>
                      <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"></path>
                      <path d="M12 12v3"></path>
                    </svg>
                    <strong>Based on template</strong>
                  </div>
                  <p class="silex-repo-fork-notice__text">
                    This site was created from the template
                    <a href="${websiteMeta.forkedFrom.webUrl ?? '#'}" target="_blank" rel="noopener">${websiteMeta.forkedFrom.name}</a>.
                    Your copy is independent — changes you make here won't affect the original template.
                    ${websiteMeta.forkedFrom.license ? html`<br/>License: <strong>${websiteMeta.forkedFrom.license}</strong>` : nothing}
                  </p>
                  <div class="silex-repo-fork-notice__actions">
                    <a href="${websiteMeta.forkedFrom.webUrl ?? '#'}" target="_blank" rel="noopener" class="silex-repo-fork-notice__link">
                      ⭐ Star template
                    </a>
                    <a href="${websiteMeta.repoUrl}/-/merge_requests/new?merge_request%5Btarget_project_id%5D=${websiteMeta.forkedFrom.id}" target="_blank" rel="noopener" class="silex-repo-fork-notice__link">
                      Contribute changes
                    </a>
                  </div>
                  <p class="silex-repo-fork-notice__contribute">
                    Want to improve the template for everyone? Use "Contribute changes" to propose your modifications back to the original.
                  </p>
                </div>
              ` : nothing}
              <div class="silex-repo-field">
                <label class="silex-repo-field__label">GitLab Project</label>
                <div class="silex-repo-field__input-wrapper">
                  <input type="text" class="silex-repo-field__input" value="${websiteMeta.repoUrl}" readonly />
                  <button type="button" class="silex-repo-field__btn" title="Copy to clipboard" @click=${(e: Event) => {
    navigator.clipboard.writeText(websiteMeta.repoUrl!)
    const btn = e.currentTarget as HTMLButtonElement
    btn.classList.add('silex-repo-field__btn--copied')
    setTimeout(() => btn.classList.remove('silex-repo-field__btn--copied'), 1500)
  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                  <a class="silex-repo-field__btn" href="${websiteMeta.repoUrl}" target="_blank" rel="noopener" title="Open in GitLab (new tab)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                </div>
              </div>
              <div class="silex-repo-info-grid">
                <div class="silex-repo-info-item">
                  <span class="silex-repo-info-item__label">Project visibility</span>
                  <span class="silex-repo-info-item__value">${websiteMeta.visibility ?? '—'}</span>
                  <span class="silex-repo-info-item__links">
                    <a class="silex-repo-info-item__action" href="${websiteMeta.repoUrl}/edit#js-shared-permissions" target="_blank" rel="noopener">settings</a>
                    <a class="silex-repo-info-item__action" href="https://docs.gitlab.com/user/public_access/" target="_blank" rel="noopener">help</a>
                  </span>
                </div>
                <div class="silex-repo-info-item">
                  <span class="silex-repo-info-item__label">Website visibility</span>
                  <span class="silex-repo-info-item__value">${websiteMeta.pagesVisibility ?? '—'}</span>
                  <span class="silex-repo-info-item__links">
                    <a class="silex-repo-info-item__action" href="${websiteMeta.repoUrl}/edit#pages_access_level" target="_blank" rel="noopener">settings</a>
                    <a class="silex-repo-info-item__action" href="https://docs.gitlab.com/ee/user/project/pages/pages_access_control/" target="_blank" rel="noopener">help</a>
                  </span>
                </div>
              </div>
              ${websiteMeta.pagesUrl ? html`
                <div class="silex-repo-field">
                  <label class="silex-repo-field__label">
                    Published Website
                    ${websiteMeta.lastJob ? html`
                      <span class="silex-repo-field__status silex-repo-field__status--${websiteMeta.lastJob.status?.toLowerCase() ?? 'unknown'}">${websiteMeta.lastJob.status ?? 'unknown'}</span>
                    ` : html`
                      <span class="silex-repo-field__status silex-repo-field__status--unknown">not published yet</span>
                    `}
                  </label>
                  <div class="silex-repo-field__input-wrapper">
                    <input type="text" class="silex-repo-field__input" value="${websiteMeta.pagesUrl}" readonly />
                    <button type="button" class="silex-repo-field__btn" title="Copy to clipboard" @click=${(e: Event) => {
    navigator.clipboard.writeText(websiteMeta.pagesUrl!)
    const btn = e.currentTarget as HTMLButtonElement
    btn.classList.add('silex-repo-field__btn--copied')
    setTimeout(() => btn.classList.remove('silex-repo-field__btn--copied'), 1500)
  }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                    <a class="silex-repo-field__btn" href="${websiteMeta.pagesUrl}" target="_blank" rel="noopener" title="Open website (new tab)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  </div>
                  ${websiteMeta.lastJob?.date ? html`
                    <span class="silex-repo-field__meta">
                      Last published: ${new Date(websiteMeta.lastJob.date).toLocaleString()}
                      ${websiteMeta.lastJob.webUrl ? html`— <a href="${websiteMeta.lastJob.webUrl}" target="_blank" rel="noopener">view logs</a>` : nothing}
                    </span>
                  ` : nothing}
                </div>
              ` : nothing}
            ` : websiteMeta?.createdAt ? html`
              <div class="silex-repo-info-grid">
                <div class="silex-repo-info-item">
                  <span class="silex-repo-info-item__label">Created</span>
                  <span class="silex-repo-info-item__value">${new Date(websiteMeta.createdAt).toLocaleString()}</span>
                </div>
                <div class="silex-repo-info-item">
                  <span class="silex-repo-info-item__label">Updated</span>
                  <span class="silex-repo-info-item__value">${new Date(websiteMeta.updatedAt!).toLocaleString()}</span>
                </div>
              </div>
            ` : html`<p class="silex-repo-section__empty">No repository or publication information available for this site.</p>`
}
          </div>
        </div>
      ` : nothing }
    </div>
  `,
}, {
  id: 'seo',
  label: 'SEO',
  render: (settings, model) => html`
    <div id="settings-seo" class="silex-hideable silex-hidden">
      <div class="silex-form__group col2">
        <label class="silex-form__element">
          <h3 class="silex-capitalize">${ siteOrPage(model) } language</h3>
          <p class="silex-help">This is the default language code for this website or page. Example: en, fr, es...</p>
          <input type="text" name="lang" .value=${live(settings.lang || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Title</h3>
          <p class="silex-help">Title of the browser window, and title in the search engines results. It is used by search engines to find out what your site is talking about. The title should be a maximum of 70 characters long, including spaces.</p>
          <input type="text" name="title" .value=${live(settings.title || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Description</h3>
          <p class="silex-help">Description displayed by the search engines in search results. It is used by search engines to find out what your site is talking about. It is best to keep meta descriptions between 150 and 160 characters.</p>
          <input type="text" name="description" .value=${live(settings.description || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Favicon</h3>
          <p class="silex-help">Small image displayed in the browser's address bar and in tabs. The recommended size is 16×16 or 32×32 pixels. This can be a URL or a relative path.</p>
          <input type="text" name="favicon" .value=${live(settings.favicon || '')}/>
        </label>
      </div>
    </div>
  `,
}, {
  id: 'social',
  label: 'Social',
  render: (settings, model) => html`
    <div id="settings-social" class="silex-hideable silex-hidden">
      <div class="silex-help">
        <p>Once your website is live, you can use these tools to test sharing:&nbsp;<a target="_blank" href="https://developers.facebook.com/tools/debug/">Facebook</a>,
        <a target="_blank" href="https://cards-dev.twitter.com/validator">Twitter</a>,
        <a target="_blank" href="https://www.linkedin.com/post-inspector/inspect/">Linkedin</a></p>
      </div>
      <div class="silex-form__group col2">
        <label class="silex-form__element">
          <h3>Title</h3>
          <p class="silex-help">The title of your website or page displayed when a user shares your website on a social network.
        Do not include any branding in this title, just eye-catching phrase, e.g. "Learn everything about fishing".
        Title should be between 60 and 90 characters long.</p>
          <input type="text" name="og:title" .value=${live(settings['og:title'] || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Description</h3>
          <p class="silex-help">Description displayed when a user shares your website or page on a social network. Make it catchy, and invite readers to visit your website too, e.g. "Sam's website about fishing, check it out!" Title should be between 60 and 90 characters long.</p>
          <input type="text" name="og:description" .value=${live(settings['og:description'] || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Image</h3>
          <div class="silex-help">
            <p>Thumbnail image which is displayed when your website is shared on a social network. The optimal size is 1200×627 pixels. At this size, your thumbnail will be big and stand out from the crowd. But do not exceed the 5MB size limit. If you use an image that is smaller than 400 pixels x 209 pixels, it will render as a much smaller thumbnail.</p>
            <p>Please enter the full URL here, e.g. "http://mysite.com/path/to/image.jpg"</p>
          </div>
          <input type="text" name="og:image" .value=${live(settings['og:image'] || '')}/>
        </label>
      </div>
    </div>
  `,
}, {
  id: 'code',
  label: 'Code',
  render: (settings, model) => html`
    <div id="settings-code" class="silex-hideable silex-hidden">
      <div class="silex-form__group">
        <label class="silex-form__element" id="${idCodeWrapper}">
          <p class="silex-help">HTML code which will be inserted in the HEAD tag.</p>
        </label>
      </div>
    </div>
  `,
}]
