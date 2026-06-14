import { getHtml, refresh, getAvailableFonts, getApiUrl, loadFontList } from './fonts'

export const cmdGetCss = 'get-fonts-css'
export const cmdGetHtml = 'get-fonts-html'
export const cmdFontsInstalled = 'fonts:installed'
export const cmdFontsAvailable = 'fonts:available'
export const cmdFontsInstall = 'fonts:install'
export const cmdFontsRemove = 'fonts:remove'

export default function (editor, opts) {
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
        return fonts.map(f => ({
            family: f.family,
            category: f.category,
            variants: f.variants || [],
        }))
    })

    // List available Google Fonts (with optional search/category filter).
    // Loads the font list on demand from the Google Fonts API if not cached.
    // Returns a Promise — callers must await the result.
    editor.Commands.add(cmdFontsAvailable, async (editor, sender, options = {}) => {
        let list = getAvailableFonts()
        if (!list) {
            if (!opts || !opts.api_key) {
                throw new Error('Font list not loaded and no api_key configured. Provide api_key in plugin options to enable Google Fonts.')
            }
            list = await loadFontList(`${getApiUrl()}/webfonts/v1/webfonts?key=${encodeURIComponent(opts.api_key)}`)
        }
        if (!list) throw new Error('Could not load font list from Google Fonts API. Check api_key and network.')

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

    // Install a font by family name
    editor.Commands.add(cmdFontsInstall, (editor, sender, options = {}) => {
        const { family } = options
        if (!family) throw new Error('Required: family (e.g. "Roboto", "Open Sans"). Use fonts:available to search.')

        const fonts = editor.getModel().get('fonts') || []
        if (fonts.find(f => f.family.toLowerCase() === family.toLowerCase())) {
            throw new Error(`Font "${family}" already installed. Use fonts:installed to list installed fonts.`)
        }

        const available = getAvailableFonts() || []
        const fontData = available.find(f => f.family.toLowerCase() === family.toLowerCase())
        if (!fontData) {
            throw new Error(`Font "${family}" not found in available fonts. Run fonts:available to load the font list first, then retry.`)
        }

        const newFont = {
            family: fontData.family,
            name: fontData.family,
            category: fontData.category,
            variants: fontData.variants,
            value: `"${fontData.family}", ${fontData.category}`,
        }
        fonts.push(newFont)
        editor.getModel().set('fonts', [...fonts])
        refresh(editor, opts)
        return { family: newFont.family, category: newFont.category, variants: newFont.variants }
    })

    // Remove an installed font
    editor.Commands.add(cmdFontsRemove, (editor, sender, options = {}) => {
        const { family } = options
        if (!family) throw new Error('Required: family (e.g. "Roboto"). Use fonts:installed to list installed fonts.')

        const fonts = editor.getModel().get('fonts') || []
        const idx = fonts.findIndex(f => f.family === family)
        if (idx === -1) throw new Error(`Font "${family}" not installed. Use fonts:installed to list installed fonts.`)

        fonts.splice(idx, 1)
        editor.getModel().set('fonts', [...fonts])
        refresh(editor, opts)
    })
}
