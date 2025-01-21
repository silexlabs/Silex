import {live} from 'lit-html/directives/live.js'
import {html, TemplateResult} from 'lit-html'
import { WebsiteSettings } from '../../types'

// ID of the code editor wrapper
export const idCodeWrapper = 'settings-head-wrapper'

// Is the model a site or a page?
export function isSite(model: any) { return !!model.getHtml }

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
      <div class="gjs-sm-sector-title">General</div>
      <div class="silex-form__group col2">
        <label class="silex-form__element">
          <h3>${isSite(model) ? 'Site name' : 'Page name'}</h3>
          <p class="silex-help">${isSite(model) ? 'The project name in the editor, for you to remember what it is about.' : 'Label of the page in the editor, and file name of the published HTML page.'}</p>
          <input type="text" name="name" .value=${live(model.get('name') || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Website language</h3>
          <p class="silex-help">This is the default language code for this website. Example: en, fr, es...</p>
          <input type="text" name="lang" .value=${live(settings.lang || '')}/>
        </label>
      </div>
    </div>
  `,
}, {
  id: 'seo',
  label: 'SEO',
  render: (settings, model) => html`
    <div id="settings-seo" class="silex-hideable silex-hidden">
      <div class="gjs-sm-sector-title">SEO</div>
      <div class="silex-form__group col2">
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
      <div class="gjs-sm-sector-title">Social</div>
      <div class="silex-help">
        <p>Once your website is live, you can use these tools to test sharing:&nbsp;<a target="_blank" href="https://developers.facebook.com/tools/debug/">Facebook</a>,
        <a target="_blank" href="https://cards-dev.twitter.com/validator">Twitter</a>,
        <a target="_blank" href="https://www.linkedin.com/post-inspector/inspect/">Linkedin</a></p>
      </div>
      <div class="silex-form__group col2">
        <label class="silex-form__element">
          <h3>Title</h3>
          <p class="silex-help">The title of your website displayed when a user shares your website on a social network.
        Do not include any branding in this title, just eye-catching phrase, e.g. "Learn everything about fishing".
        Title should be between 60 and 90 characters long.</p>
          <input type="text" name="og:title" .value=${live(settings['og:title'] || '')}/>
        </label>
        <label class="silex-form__element">
          <h3>Description</h3>
          <p class="silex-help">Description displayed when a user shares your website on a social network. Make it catchy, and invite readers to visit your website too, e.g. "Sam's website about fishing, check it out!" Title should be between 60 and 90 characters long.</p>
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
      <div class="gjs-sm-sector-title">Code</div>
      <div class="silex-form__group">
        <label class="silex-form__element" id="${idCodeWrapper}">
          <h3>HTML head</h3>
          <p class="silex-help">HTML code which will be inserted in the HEAD tag.</p>
        </label>
      </div>
    </div>
  `,
}]