import {html, render} from 'lit-html'
import {live} from 'lit-html/directives/live.js'
import { map } from 'lit-html/directives/map.js'
import {styleMap} from 'lit-html/directives/style-map.js'
import {ref, createRef} from 'lit-html/directives/ref.js'

const el = document.createElement('div')
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
let fonts
let defaults = []

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
    fonts = structuredClone(editor.getModel().get('fonts') || [])
}

/**
 * When the dialog is closed
 */
function saveFonts(editor, opts) {
    const model = editor.getModel()

    // Store the modified fonts
    model.set('fonts', fonts)

    // Update the HTML head with style sheets to load
    updateHead(editor, fonts)

    // Update the "font family" dropdown
    updateUi(editor, fonts, opts)

    // Save website if auto save is on
    model.set('changesCount', editor.getDirtyCount() + 1)
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
  console.log({editor}, editor)
    defaults = editor.StyleManager.getBuiltIn('font-family').options
    if(!opts.api_key) throw new Error(editor.I18n.t('grapesjs-fonts.You must provide Google font api key'))
    editor.Commands.add(cmdOpenFonts, {
        /* eslint-disable-next-line */
        run: (_, sender) => {
            modal = editor.Modal.open({
                title: editor.I18n.t('grapesjs-fonts.Fonts'),
                content: '',
                attributes: { class: 'fonts-dialog' },
            })
                .onceClose(() => {
                    editor.stopCommand(cmdOpenFonts) // apparently this is needed to be able to run the command several times
                })
            modal.setContent(el)
            loadFonts(editor)
            displayFonts(editor, opts, [])
            loadFontList('https://www.googleapis.com/webfonts/v1/webfonts?key=' + opts.api_key)
                .then(fontsList => { // the run command will terminate before this is done, better for performance
                    displayFonts(editor, opts, fontsList)
                    const form = el.querySelector('form')
                    form.onsubmit = event => {
                        event.preventDefault()
                        saveFonts(editor, opts)
                        editor.stopCommand(cmdOpenFonts)
                    }
                    form.querySelector('input')?.focus()
                })
            return modal
        },
        stop: () => {
            modal.close()
        },
    })
    // add fonts to the website
    editor.on('storage:start:store', (data) => {
        data.fonts = editor.getModel().get('fonts')
    })
    editor.on('storage:end:load', (data) => {
        const fonts = data.fonts || []
        editor.getModel().set('fonts', fonts)
        setTimeout(() => {
            updateHead(editor, fonts)
            updateUi(editor, fonts, opts)
        })
    })
}

function match(hay, s) {
    const regExp = new RegExp(s, 'i')
    return hay.search(regExp) !== -1
}

const searchInputRef = createRef()
const fontRef = createRef()

function displayFonts(editor, config, fontsList) {
    const searchInput = searchInputRef.value
    const activeFonts = fontsList.filter(f => match(f.family, searchInput?.value || ''))
    searchInput?.focus()
    function findFont(font) {
        return fontsList.find(f => font.name === f.family)
    }
    render(html`
    <form class="silex-form grapesjs-fonts">
      <div class="silex-form__group">
        <div class="silex-bar">
          <input
            style=${styleMap({
        width: '100%',
    })}
            placeholder="${editor.I18n.t('grapesjs-fonts.Search')}"
            type="text"
            ${ref(searchInputRef)}
            @keydown=${() => {
        //(fontRef.value as HTMLSelectElement).selectedIndex = 0
        setTimeout(() => displayFonts(editor, config, fontsList))
    }}/>
          <select
            style=${styleMap({
        width: '150px',
    })}
            ${ref(fontRef)}
          >
            ${ map(activeFonts, f => html`
              <option value=${f['family']}>${f['family']}</option>
            `)}
          </select>
          <button class="silex-button"
            ?disabled=${!fontRef.value || activeFonts.length === 0}
            type="button" @click=${() => {
        addFont(
            editor,
            config,
            fonts,
            activeFonts[fontRef.value.selectedIndex]
        )
        displayFonts(editor, config, fontsList)
    }}>
            ${editor.I18n.t('grapesjs-fonts.Add font')}
          </button>
        </div>
      </div>
      <hr/>
      <div
        class="silex-form__element">
        <h2>${editor.I18n.t('grapesjs-fonts.Installed fonts')}</h2>
        <ol class="silex-list">
        ${ map(fonts, f => html`
          <li>
            <div class="silex-list__item__header">
              <h4>${f.name}</h4>
            </div>
            <div class="silex-list__item__body">
              <fieldset class="silex-group--simple full-width">
                <legend>CSS rules</legend>
                <input
                  class="full-width"
                  type="text"
                  name="name"
                  .value=${live(f.value)}
                  @change=${e => {
        updateRules(editor, fonts, f, e.target.value)
        displayFonts(editor, config, fontsList)
    }}
                />
              </fieldset>
              <fieldset class="silex-group--simple full-width">
                <legend>Variants</legend>
                ${ map(
        // keep only variants which are letters, no numbers
        // FIXME: we need the weights
        findFont(f)?.variants.filter(v => v.replace(/[a-z]/g, '') === ''),
        v => html`
                  <div>
                    <input
                      id=${ f.name + v }
                      type="checkbox"
                      value=${v}
                      ?checked=${f.variants?.includes(v)}
                      @change=${e => {
        updateVariant(editor, fonts, f, v, e.target.checked)
        displayFonts(editor, config, fontsList)
    }}
                    /><label for=${ f.name + v }>${v}</label>
                  </div>
                `)}
              </fieldset>
            </div>
            <div class="silex-list__item__footer">
              <button class="silex-button" type="button" @click=${() => {
        removeFont(editor, fonts, f)
        displayFonts(editor, config, fontsList)
    }}>${editor.I18n.t('grapesjs-fonts.Remove')}</button>
            </div>
          </li>
        `) }
        </ol>
      </div>
      <footer>
        <input class="silex-button" type="button" @click=${() => editor.stopCommand(cmdOpenFonts)} value="${editor.I18n.t('grapesjs-fonts.Cancel')}">
        <input class="silex-button" type="submit" value="${editor.I18n.t('grapesjs-fonts.Save')}">
      </footer>
    </form>
  `, el)
}

function addFont(editor, config, fonts, font) {
    const name = font.family
    const value = `"${font.family}", ${font.category}`
    fonts.push({ name, value, variants: [] })
}

function removeFont(editor, fonts, font) {
    const idx = fonts.findIndex(f => f === font)
    fonts.splice(idx, 1)
}

function insertOnce(doc, attr, tag, attributes) {
    if(!doc.head.querySelector(`[${ attr }]`)) {
        insert(doc, attr, tag, attributes)
    }
}
function insert(doc, attr, tag, attributes) {
    const el = doc.createElement(tag)
    el.setAttribute(attr, '')
    Object.keys(attributes).forEach(key => el.setAttribute(key, attributes[key]))
    doc.head.appendChild(el)
}
function removeAll(doc, attr) {
    Array.from(doc.head.querySelector(`[${ attr }]`))
        .forEach((el) => el.remove())
}
const GOOGLE_APIS_ATTR = 'data-silex-google-apis'
const GSTATIC_ATTR = 'data-silex-gstatic'
const GOOGLE_FONTS_ATTR = 'data-silex-gstatic'
function updateHead(editor, fonts) {
    const doc = editor.Canvas.getDocument()
    insertOnce(doc, GOOGLE_APIS_ATTR, 'link', { 'href': 'https://fonts.googleapis.com', 'rel': 'preconnect' })
    insertOnce(doc, GSTATIC_ATTR, 'link', { 'href': 'https://fonts.gstatic.com', 'rel': 'preconnect', 'crossorigin': '' })
    removeAll(doc, GOOGLE_FONTS_ATTR)

    // FIXME: how to use google fonts v2?
    // google fonts V2: https://developers.google.com/fonts/docs/css2
    //fonts.forEach(f => {
    //  const prefix = f.variants.length ? ':' : ''
    //  const variants = prefix + f.variants.map(v => {
    //    const weight = parseInt(v)
    //    const axis = v.replace(/\d+/g, '')
    //    return `${axis},wght@${weight}`
    //  }).join(',')
    //  insert(doc, GOOGLE_FONTS_ATTR, 'link', { 'href': `https://fonts.googleapis.com/css2?family=${f.name.replace(/ /g, '+')}${variants}&display=swap`, 'rel': 'stylesheet' })
    //})

    // Google fonts v1
    // https://developers.google.com/fonts/docs/getting_started#a_quick_example
    fonts.forEach(f => {
        const prefix = f.variants.length ? ':' : ''
        const variants = prefix + f.variants.map(v => v.replace(/\d+/g, '')).filter(v => !!v).join(',')
        insert(doc, GOOGLE_FONTS_ATTR, 'link', { 'href': `https://fonts.googleapis.com/css?family=${f.name.replace(/ /g, '+')}${variants}&display=swap`, 'rel': 'stylesheet' })
    })
}

function updateUi(editor, fonts, opts) {
    const styleManager = editor.StyleManager
    const fontProperty = styleManager.getProperty('typography', 'font-family')
    if (opts.preserveDefaultFonts) {
        fonts = defaults.concat(fonts)
    } else if (fonts.length === 0) {
        fonts = defaults
    }
    fontProperty.setOptions(fonts)
}

function updateRules(editor, fonts, font, value) {
    font.value = value
}
function updateVariant(editor, fonts, font, variant, checked) {
    const has = font.variants?.includes(variant)
    if(has && !checked) font.variants = font.variants.filter(v => v !== variant)
    else if(!has && checked) font.variants.push(variant)
}
