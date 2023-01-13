import {html, render} from 'lit-html'
import {live} from 'lit-html/directives/live.js'
import { map } from 'lit-html/directives/map.js'
import {styleMap} from 'lit-html/directives/style-map.js'
import {ref, createRef} from 'lit-html/directives/ref.js'
import * as grapesjs from 'grapesjs/dist/grapes.min.js'

import { Font } from '../../types'

const pluginName = 'fonts-dialog'
const el = document.createElement('div')
let modal

export const cmdOpenFonts = 'open-fonts'

const FONTS_API = 'https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyAdJTYSLPlKz4w5Iqyy-JAF2o8uQKd1FKc'
let _fontsList
async function loadFontList() {
  return _fontsList ?? (await (await fetch(FONTS_API)).json())?.items
}

export const fontsDialog = grapesjs.plugins.add(pluginName, (editor, opts) => {
  editor.Commands.add(cmdOpenFonts, {
    run: (_, sender) => {
      modal = editor.Modal.open({
        title: 'Fonts',
        content: '',
        attributes: { class: 'fonts-dialog' },
      })
      .onceClose(() => {
        editor.stopCommand(cmdOpenFonts) // apparently this is needed to be able to run the command several times
      })
      modal.setContent(el)
      displayFonts(editor, opts, [])
      loadFontList()
      .then(fontsList => {
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
    editor.getModel().set('fonts', data.fonts || [])
    setTimeout(() => {
      updateHead(editor, data.fonts)
      updateUi(editor, data.fonts)
    })
  })
})

function match(hay, s) {
    const h = hay.toLowerCase()
    let i = 0, n = -1, l
    s = s.toLowerCase()
    for (; l = s[i++] ;) if (!~(n = h.indexOf(l, n + 1))) return false
    return true
}

const searchInputRef = createRef()
const fontRef = createRef()

function displayFonts(editor, config, fontsList, model = editor.getModel()) {
  const searchInput = searchInputRef.value as HTMLInputElement
  const activeFonts = fontsList.filter(f => match(f.family, searchInput?.value || ''))
  searchInput?.focus()
  const fonts: Font[] = model.get('fonts')
  model.set('fonts', fonts)
  function findFont(font: Font) {
    return fontsList.find(f => font.name === f.family)
  }
  render(html`
    <form class="silex-form">
      <div class="silex-form__group">
        <div class="silex-bar">
          <input
            style=${styleMap({
              width: '100%',
            })}
            placeholder="Search fonts..."
            type="text"
            ${ref(searchInputRef)}
            @keydown=${e => {
              //(fontRef.value as HTMLSelectElement).selectedIndex = 0
              setTimeout(() => displayFonts(editor, config, fontsList, model))
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
            type="button" @click=${e => {
              addFont(
                editor,
                config,
                fonts,
                activeFonts[(fontRef.value as HTMLSelectElement).selectedIndex]
              )
              displayFonts(editor, config, fontsList, model)
            }}>
            Add&nbsp;to&nbsp;website
          </button>
        </div>
      </div>
      <hr/>
      <label
        class="silex-form__element">
        <h2>Installed fonts</h2>
        <ol class="silex-list">
        ${ map(fonts, f => html`
          <li>
          <h5>${f.name}
          <input type="text" name="name" .value=${live(f.value)}/>
          <fieldset class="silex-group--simple">
            <legend>Variants</legend>
            ${ map(
              // keep only variants which are letters, no numbers
              // FIXME: we need the weights
              findFont(f)?.variants.filter((v: string) => v.replace(/[a-z]/g, '') === ''),
              (v: string) => html`
              <input
                id=${ f.name + v }
                type="checkbox"
                value=${v}
                ?checked=${f.variants?.includes(v)}
                @change=${e => {
                  updateVariant(editor, fonts, f, v, e.target.checked)
                  displayFonts(editor, config, fontsList, model)
                }}
              /><label for=${ f.name + v }>${v}</label>
            `)}
          </fieldset>
          <button class="silex-button" type="button" @click=${e => {
            removeFont(editor, fonts, f)
            displayFonts(editor, config, fontsList, model)
          }}>Remove</button>
          </li>
        `) }
        </ol>
      </label>
      <footer>
        <input class="silex-button" type="button" @click=${e => editor.stopCommand(cmdOpenFonts)} value="Cancel">
        <input class="silex-button" type="submit" value="Ok">
      </footer>
    </form>
  `, el)
}

function addFont(editor, config, fonts: Font[], font: any) {
  const name = font.family
  const value = `"${font.family}", ${font.category}`
  fonts.push({ name, value, variants: [] })

  updateHead(editor, fonts)
  updateUi(editor, fonts)
}

function insertOnce(doc, attr, tag, attributes) {
  if(!doc.head.querySelector(`[${ attr }]`)) {
    insert(doc, attr, tag, attributes)
  }
}
function insert(doc, attr, tag, attributes) {
  const el = doc.createElement(tag) as HTMLLinkElement
  el.setAttribute(attr, '')
  Object.keys(attributes).forEach(key => el.setAttribute(key, attributes[key]))
  doc.head.appendChild(el)
}
function removeAll(doc, attr) {
  Array.from(doc.head.querySelector(`[${ attr }]`))
  .forEach((el: HTMLElement) => el.remove())
}
const GOOGLE_APIS_ATTR = 'data-silex-google-apis'
const GSTATIC_ATTR = 'data-silex-gstatic'
const GOOGLE_FONTS_ATTR = 'data-silex-gstatic'
function updateHead(editor, fonts) {
  const doc = editor.Canvas.getDocument()
  insertOnce(doc, GOOGLE_APIS_ATTR, 'link', { 'href': 'https://fonts.googleapis.com', 'rel': 'preconnect' })
  insertOnce(doc, GSTATIC_ATTR, 'link', { 'href': 'https://fonts.gstatic.com', 'rel': 'preconnect', 'crossorigin': '' })
  removeAll(doc, GOOGLE_FONTS_ATTR)

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

  // https://developers.google.com/fonts/docs/getting_started#a_quick_example
  fonts.forEach(f => {
    const prefix = f.variants.length ? ':' : ''
    const variants = prefix + f.variants.map(v => v.replace(/\d+/g, '')).filter(v => !!v).join(',')
    insert(doc, GOOGLE_FONTS_ATTR, 'link', { 'href': `https://fonts.googleapis.com/css?family=${f.name.replace(/ /g, '+')}${variants}&display=swap`, 'rel': 'stylesheet' })
  })
}

function updateUi(editor, fonts) {
  const styleManager = editor.StyleManager
  const fontProperty = styleManager.getProperty('typography', 'font-family')
  fontProperty.setOptions(fonts)
  styleManager.render()
}
function updateVariant(editor, fonts, font, variant, checked) {
  const has = font.variants?.includes(variant)
  if(has && !checked) font.variants = font.variants.filter(v => v !== variant)
  else if(!has && checked) font.variants.push(variant)
  updateHead(editor, fonts)
}
function removeFont(editor, fonts, font) {
  const idx = fonts.findIndex(f => f === font)
  fonts.splice(idx, 1)
  updateHead(editor, fonts)
  updateUi(editor, fonts)
}
function saveFonts(editor, config) {
  // save if auto save is on
  editor.getModel().set('changesCount', editor.getDirtyCount() + 1)
}

