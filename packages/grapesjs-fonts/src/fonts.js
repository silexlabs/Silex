import { html, render } from 'lit-html'
import { map } from 'lit-html/directives/map.js'

import {ref, createRef} from 'lit-html/directives/ref.js'

const el = document.createElement('div')
const styles = document.createElement('style')
styles.textContent = `
  .gfonts-section { padding: 8px 0 }
  .gfonts-list { list-style: none; padding: 0; margin: 0 }
  .gfonts-item { padding: 10px 12px; border: 1px solid var(--gjs-light-border); border-radius: 8px; margin-bottom: 10px; background: transparent; color: var(--gjs-font-color) }
  .gfonts-item strong { display: block; font-size: 14px; margin-bottom: 4px; color: var(--gjs-font-color-active) }
  .gfonts-item p { margin: 0 0 8px 0; color: var(--gjs-font-color); font-size: 12px }
  .variants-toolbar { display: flex; align-items: center; gap: 8px; margin: 6px 0 }
  .variants-grid { display: flex; flex-wrap: wrap; gap: 6px }
  .variants-grid label { background: var(--gjs-soft-light-color); border-radius: 4px; padding: 4px 6px; cursor: pointer; border: 1px solid transparent; color: var(--gjs-font-color) }
  .variants-grid input { margin: 0 }
  .gfonts-preview { padding: 6px; border: 1px solid var(--gjs-light-border); border-radius: 8px; background: var(--gjs-soft-light-color); margin: 6px 0 8px }
  .preview-iframe { width: 100%; border: 0; height: 56px; background: transparent }
  .silex-bar, .pagination-controls { display: flex; gap: 8px; align-items: center }
  .silex-list { list-style: none; margin: 0; padding: 0 }
  .silex-list > li { list-style: none }
  fieldset.silex-group--simple { border: 0; padding: 0; margin: 0 }
  fieldset.silex-group--simple legend { margin: 0; color: var(--gjs-font-color); font-size: 12px }
  .gfonts-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap }
  .gfonts-toolbar select, .gfonts-toolbar input { background: var(--gjs-main-light-color); color: var(--gjs-font-color); border: 1px solid var(--gjs-light-border); border-radius: 4px; padding: 4px 6px }
  .gfonts-toolbar .silex-button { background: var(--gjs-main-light-color); color: var(--gjs-font-color); border: 1px solid var(--gjs-light-border) }
  .gfonts-pager { margin-left: auto; display: inline-flex; gap: 6px; align-items: center; color: var(--gjs-font-color) }
  .gfonts-pager .page { opacity: .8 }
  .gfonts-actions { display: flex; gap: 8px; margin-top: 6px }
  .gfonts-btn--ghost { background: transparent; border: 1px solid var(--gjs-light-border); color: var(--gjs-font-color); padding: 2px 6px; font-size: 11px }
  .gfonts-btn--danger { background: transparent; border: 1px solid var(--gjs-color-red); color: var(--gjs-color-red) }
`
document.head.appendChild(styles)
let modal

export const cmdOpenFonts = 'open-fonts'

/**
 * Constants
 */
const LS_FONTS = 'silex-loaded-fonts-list'

/**
 * Module variables
 */
let _fontsList
let fonts = []
let defaults = []

/**
 * Options
 */
let fontServer = 'https://fonts.googleapis.com'
let fontApi = 'https://www.googleapis.com'

/**
 * Load available fonts only once per session
 * Use local storage
 */
try {
    _fontsList = JSON.parse(localStorage.getItem(LS_FONTS))
} catch(e) {
    console.error('Could not get fonts from local storage:', e)
}

/**
 * Promised wait function
 */
async function wait(ms = 0) {
    return new Promise(resolve => setTimeout(() => resolve(), ms))
}

/**
 * When the dialog is opened
 */
async function loadFonts(editor) {
    fonts = structuredClone(editor.getModel().get('fonts') || []).map(f => ({
        ...f,
        variants: f.variants || []
    }))
}

/**
 * When the dialog is closed
 */
function saveFonts(editor, opts) {
    const model = editor.getModel()
    model.set('fonts', fonts)
    updateHead(editor, fonts)
    updateUi(editor, fonts, opts)
}

/**
 * Load the available fonts from google
 */
async function loadFontList(url) {
    _fontsList = _fontsList ?? (await (await fetch(url)).json())?.items

    localStorage.setItem(LS_FONTS, JSON.stringify(_fontsList))
    await wait() // let the dialog open
    return _fontsList
}

export const fontsDialogPlugin = (editor, opts) => {
    defaults = editor.StyleManager.getBuiltIn('font-family').options || []
    if(opts.server_url) fontServer = opts.server_url
    if(opts.api_url) fontApi = opts.api_url
    if(!opts.api_key) throw new Error(editor.I18n.t('grapesjs-fonts.You must provide Google font api key'))

    editor.Commands.add(cmdOpenFonts, {
        run: (_, sender) => {
            modal = editor.Modal.open({
                title: editor.I18n.t('grapesjs-fonts.Fonts'),
                content: '',
                attributes: { class: 'fonts-dialog' },
            })
                .onceClose(() => {
                    editor.stopCommand(cmdOpenFonts)
                })
            modal.setContent(el)
            loadFonts(editor)
            displayFontLists(editor, opts)
            loadFontList(`${fontApi}/webfonts/v1/webfonts?key=${opts.api_key}`)
                .then(fontsList => {
                    displayFontLists(editor, opts, fontsList)
                })
            return modal
        },
        stop: () => {
            modal.close()
        },
    })

    // Add fonts to the website on save
    editor.on('storage:start:store', (data) => {
        data.fonts = editor.getModel().get('fonts')
    })

    // Helper to register debounced font refreshes
    let debouncedRefreshTimeout
    const debouncedRefresh = () => {
        clearTimeout(debouncedRefreshTimeout)
        debouncedRefreshTimeout = setTimeout(() => refresh(editor, opts), 50)
    }

    // Add fonts to the website on load
    editor.on('storage:end:load', (data) => {
        const fonts = data.fonts || []
        editor.getModel().set('fonts', fonts)
        debouncedRefresh()
    })

    // Update the head and the ui when the frame is loaded
    editor.on('canvas:frame:load', () => {
        debouncedRefresh()
    })

    // When the page changes, update the dom
    editor.on('page', () => {
        debouncedRefresh()
    })
}

const searchInputRef = createRef()

let currentPage = 0
let selectedCategory = ''

function displayFontLists(editor, opts, originalFontsList = []) {
    const searchInput = searchInputRef.value
    const fontsPerPage = 10
    let fontsList = JSON.parse(JSON.stringify(originalFontsList)) // deep copy to maintain original list
    const activeFonts = fontsList.filter(f => {
        const nameOk = match(f.family, searchInput?.value || '')
        const catOk = selectedCategory ? f.category === selectedCategory : true
        return nameOk && catOk
    })

    let pageCount = Math.ceil(activeFonts.length / fontsPerPage)
    const cats = Array.from(new Set((originalFontsList || []).map(f => f.category).filter(Boolean))).sort()

    // Adjust currentPage if it exceeds the available pages
    if (currentPage >= pageCount) {
        currentPage = Math.max(0, pageCount - 1)
    }

    const currentFonts = activeFonts.slice(currentPage * fontsPerPage, (currentPage + 1) * fontsPerPage)


    render(html`
    <div>
      <div class="silex-form__element">
        <h2>${editor.I18n.t('grapesjs-fonts.Installed fonts')}</h2>
        <ul class="silex-list">
          ${fonts && fonts.length ? map(fonts, font => html`
            <li class="gfonts-item">
              <strong>${font.family || 'Unknown Font'}</strong>
              <p>${(font.category || ((_fontsList || []).find(f => f.family === font.family)?.category)) || 'No category'} - ${font.variants?.length || 0} variants</p>

              <div class="gfonts-preview">
                ${generateFontPreview(font)}
              </div>
              <fieldset class="silex-group--simple full-width">
                <div class="variants-toolbar">
                  <legend>${editor.I18n.t('grapesjs-fonts.Variants') || 'Variants'}</legend>
                  <button class="silex-button gfonts-btn--ghost" type="button" @click=${() => {
                    const all = (((_fontsList || []).find(f => f.family === font.family)?.variants) || [])
                    const isAll = Array.isArray(font.variants) && all.length && all.every(v => font.variants.includes(v))
                    font.variants = isAll ? [] : [...all]
                    saveFonts(editor, opts)
                    displayFontLists(editor, opts, originalFontsList)
                  }}>${editor.I18n.t('grapesjs-fonts.Toggle all') || 'Toggle all'}</button>
                </div>
                <div class="variants-grid">
                  ${map(((_fontsList || []).find(f => f.family === font.family)?.variants) || [], v => html`
                    <label>
                      <input
                        type="checkbox"
                        .checked=${(font.variants || []).includes(v)}
                        @change=${e => {
                          const checked = e.target.checked
                          font.variants = Array.isArray(font.variants) ? font.variants : []
                          const has = font.variants.includes(v)
                          if (checked && !has) font.variants = [...font.variants, v]
                          if (!checked && has) font.variants = font.variants.filter(x => x !== v)
                          saveFonts(editor, opts)
                          displayFontLists(editor, opts, originalFontsList)
                        }}
                      />
                      ${v}
                    </label>
                  `)}
                </div>
              </fieldset>
              <div class="gfonts-actions">
                <button class="silex-button gfonts-btn--danger" type="button" @click=${() => { fonts = fonts.filter(x => x.family !== font.family); saveFonts(editor, opts); displayFontLists(editor, opts, originalFontsList) }}>${editor.I18n.t('grapesjs-fonts.Remove')}</button>
              </div>

            </li>
          `) : html`<li class="gfonts-item" style="border-style:dashed; text-align:center; font-style:italic; color: var(--gjs-secondary-light-color)">${editor.I18n.t('grapesjs-fonts.No installed fonts') || 'No installed fonts yet'}</li>`}
        </ul>

      </div>
      <div>
        <h2>${editor.I18n.t('grapesjs-fonts.All fonts') || 'All fonts'}</h2>
        <div class="silex-bar gfonts-toolbar">
          <select @change=${e => { selectedCategory = e.target.value || ''; currentPage = 0; displayFontLists(editor, opts, originalFontsList) }}>
            <option value="">All categories</option>
            ${cats.map(c => html`<option value=${c} ?selected=${selectedCategory === c}>${c}</option>`)}
          </select>
          <input
            type="text"
            ${ref(searchInputRef)}
            @input=${() => {
              currentPage = 0
              displayFontLists(editor, opts, originalFontsList)
            }}
            placeholder="${editor.I18n.t('grapesjs-fonts.Search')}"
          />
          <div class="gfonts-pager">
            <button class="silex-button" ?disabled=${currentPage === 0} @click=${() => {
              if (currentPage > 0) {
                currentPage--
                displayFontLists(editor, opts, originalFontsList)
              }
            }}>${editor.I18n.t('grapesjs-fonts.Previous Page')}</button>
            <span class="page">Page ${currentPage + 1} / ${pageCount}</span>
            <button class="silex-button" ?disabled=${currentPage === pageCount - 1} @click=${() => {
              if (currentPage < pageCount - 1) {
                currentPage++
                displayFontLists(editor, opts, originalFontsList)
              }
            }}>${editor.I18n.t('grapesjs-fonts.Next Page')}</button>
          </div>
        </div>
        <ul class="silex-list">
          ${map(currentFonts, f => html`
            <li class="gfonts-item">
              <strong>${f.family}</strong>
              <p>${f.category} - ${f.variants.length} variants</p>

              <div class="gfonts-preview">
                ${generateFontPreview(f)}
              </div>
              <button class="silex-button" @click=${() => installFont(editor, opts, f, fontsList)}>${editor.I18n.t('grapesjs-fonts.Add font')}</button>
            </li>
          `)}
        </ul>
      </div>
    </div>
    `, el)
}

function generateFontPreview(font) {
    const family = font.family || font.name || ''
    const famQ = family.replace(/ /g, '+')
    const color = (getComputedStyle(document.documentElement).getPropertyValue('--gjs-font-color') || '').trim() || getComputedStyle(el).color || '#ddd'
    const inList = (_fontsList || []).find(f => f.family === family)
    const rawVariants = Array.isArray(font.variants) && font.variants.length ? font.variants : (inList?.variants || ['regular'])
    const pairs = []
    rawVariants.forEach(v => {
        const italic = /italic/i.test(v) ? 1 : 0
        const m = String(v).match(/\d+/)
        const w = m ? parseInt(m[0], 10) : 400
        const key = `${italic},${w}`
        if (!pairs.includes(key)) pairs.push(key)
    })
    const axis = pairs.length ? `:ital,wght@${pairs.join(';')}` : ''
    const lines = pairs.map(k => {
        const [ital, wght] = k.split(',')
        const fs = ital === '1' ? 'italic' : 'normal'
        return `<p style="margin:0; line-height:1.5; font-style:${fs}; font-weight:${wght}">${family} — Sphinx of black quartz, judge my vow. 0123456789</p>`
    }).join('')
    return html`
    <iframe
      class="preview-iframe"
      srcdoc="<html><head><link href='https://fonts.googleapis.com/css2?family=${famQ}${axis}&display=swap' rel='stylesheet'><style>body { margin: 0; color: ${color}; font-family: '${family}', sans-serif }</style></head><body>${lines}</body></html>"></iframe>
    `
}

function installFont(editor, opts, font, fontsList) {
    const existingFont = fonts.find(f => f.family === font.family)
    if (!existingFont) {
        fonts.push({
            family: font.family,
            name: font.family,  // Ensure the font family name is set for both 'family' and 'name'
            category: font.category,
            variants: font.variants,
            value: `"${font.family}", ${font.category}`
        })
    }
    saveFonts(editor, opts)
    displayFontLists(editor, opts, fontsList)
}



function match(hay, s) {
    return hay.toLowerCase().includes(s.toLowerCase())
}

function removeAll(doc, attr) {
    const all = doc.head.querySelectorAll(`[${attr}]`)
    Array.from(all).forEach((el) => el.remove())
}

function updateHead(editor, fonts) {
    const doc = editor.Canvas.getDocument()
    if (!doc) {
        return
    }
    removeAll(doc, GOOGLE_FONTS_ATTR)
    const html = getHtml(fonts, GOOGLE_FONTS_ATTR)
    doc.head.insertAdjacentHTML('beforeend', html)
}

function updateUi(editor, fonts, opts) {
    const styleManager = editor.StyleManager
    const fontProperty = styleManager.getProperty('typography', 'font-family')
    if (!fontProperty) return
    let list = fonts
    if (opts && opts.preserveDefaultFonts) {
        list = defaults.concat(fonts || [])
    } else if (!fonts || fonts.length === 0) {
        list = defaults
    }
    fontProperty.setOptions(list)
}
const GOOGLE_FONTS_ATTR = 'data-silex-gstatic'

export function refresh(editor, opts) {
    const fonts = editor.getModel().get('fonts') || []
    updateHead(editor, fonts)
    updateUi(editor, fonts, opts)
}

export function getHtml(fonts, attr = '') {
    const preconnect = fonts.length ? `<link href="${fontServer}" rel="preconnect" ${attr}><link href="${fontServer}/css2" rel="preconnect" crossorigin ${attr}>` : ''
    const links = fonts.map(f => `<link href="${fontServer}/css2?family=${f.name.replace(/ /g, '+')}&display=swap" rel="stylesheet" ${attr}>`).join('')
    return preconnect + links
}
