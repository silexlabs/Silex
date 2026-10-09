import { getHtml, refresh, getAvailableFonts, getApiUrl, loadFontList, fontValue } from './fonts'

export const cmdGetCss = 'get-fonts-css'
export const cmdGetHtml = 'get-fonts-html'
export const cmdFontsInstalled = 'fonts:installed'
export const cmdFontsAvailable = 'fonts:available'
export const cmdFontsInstall = 'fonts:install'
export const cmdFontsRemove = 'fonts:remove'
export const cmdFontsSearch = 'fonts:search'

const MAX_FOUND = 20

export default function (editor, opts) {
  // Loaded once from the Google Fonts API, when a command first needs it
  const fontList = async () => {
    if (getAvailableFonts()) return getAvailableFonts()
    if (!opts?.api_key) throw new Error('No Google Fonts api_key configured.')
    let list
    try {
      list = await loadFontList(`${getApiUrl()}/webfonts/v1/webfonts?key=${encodeURIComponent(opts.api_key)}`)
    } catch (cause) {
      throw new Error(`Could not load the Google Fonts list: ${cause.message}.`, { cause })
    }
    if (!Array.isArray(list)) throw new Error('Could not load the Google Fonts list. Check the network.')
    return list
  }

  editor.Commands.add(cmdGetCss, () => {
    throw new Error('get-fonts-css is not implemented. Use get-fonts-html instead.')
  })
  editor.Commands.add(cmdGetHtml, (editor) => {
    const fonts = editor.getModel().get('fonts') || []
    return getHtml(fonts)
  })

  // List installed fonts
  editor.Commands.add(cmdFontsInstalled, () => {
    const fonts = editor.getModel().get('fonts') || []
    return fonts.length ? fonts.map(f => `${f.family} → font-family: ${f.value}`).join('\n') : 'No font installed.'
  })

  // List available Google Fonts (with optional search/category filter).
  // Loads the font list on demand from the Google Fonts API if not cached.
  // Returns a Promise — callers must await the result.
  editor.Commands.add(cmdFontsAvailable, async (editor, sender, options = {}) => {
    const list = await fontList()

    const { search, category } = options
    let filtered = list
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(f => f.family.toLowerCase().includes(q))
    }
    if (category) {
      filtered = filtered.filter(f => f.category === category)
    }
    return filtered.map(f => ({
      family: f.family,
      category: f.category,
      variants: f.variants,
    }))
  })

  editor.Commands.add(cmdFontsSearch, async (editor, sender, options = {}) => {
    const q = (options.query ?? '').toLowerCase()
    const found = (await fontList())
      .filter(f => f.family.toLowerCase().includes(q) && (!options.category || f.category === options.category))
    if (!found.length) return `No Google Font matches${q ? ` "${options.query}"` : ''}${options.category ? ` in ${options.category}` : ''}.`
    const more = found.length - MAX_FOUND
    return found.slice(0, MAX_FOUND).map(f => `${f.family} (${f.category})`).join('\n') + (more > 0 ? `\n${more} more: set query to narrow.` : '')
  })

  // Install a font by family name
  editor.Commands.add(cmdFontsInstall, async (editor, sender, options = {}) => {
    const { family } = options
    if (!family) throw new Error('Required: family (e.g. "Roboto", "Open Sans"). Use font(action:\'search\') to search.')

    const fonts = editor.getModel().get('fonts') || []
    if (fonts.find(f => f.family.toLowerCase() === family.toLowerCase())) {
      throw new Error(`Font "${family}" already installed. Use font(action:'list') to list installed fonts.`)
    }

    const available = await fontList()
    const fontData = available.find(f => f.family.toLowerCase() === family.toLowerCase())
    if (!fontData) {
      const start = family.toLowerCase().slice(0, 4)
      const close = available.filter(f => f.family.toLowerCase().startsWith(start)).slice(0, 5)
      throw new Error(`No Google Font "${family}".${close.length ? ` Close ones: ${close.map(f => f.family).join(', ')}.` : ' Use font(action:\'search\').'}`)
    }

    const newFont = {
      family: fontData.family,
      name: fontData.family,
      category: fontData.category,
      variants: fontData.variants,
      value: fontValue(fontData),
    }
    fonts.push(newFont)
    editor.getModel().set('fonts', [...fonts])
    refresh(editor, opts)
    return { family: newFont.family, css: `font-family: ${newFont.value}` }
  })

  // Remove an installed font
  editor.Commands.add(cmdFontsRemove, (editor, sender, options = {}) => {
    const { family } = options
    if (!family) throw new Error('Required: family (e.g. "Roboto"). Use font(action:\'list\') to list installed fonts.')

    const fonts = editor.getModel().get('fonts') || []
    const idx = fonts.findIndex(f => f.family.toLowerCase() === family.toLowerCase())
    if (idx === -1) {
      const installed = fonts.map(f => f.family)
      throw new Error(installed.length
        ? `Font "${family}" not installed. Installed fonts: ${installed.join(', ')}.`
        : `Font "${family}" not installed. No fonts installed.`)
    }

    fonts.splice(idx, 1)
    editor.getModel().set('fonts', [...fonts])
    refresh(editor, opts)
  })
}
