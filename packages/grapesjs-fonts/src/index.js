import { fontsDialogPlugin as _fontsDialogPlugin, cmdOpenFonts as _cmdOpenFonts } from './fonts.js'
import en from './locale/en.js'
import fr from './locale/fr.js'

export default (editor, opts = {}) => {

    const options = { ...{
        // default options
        i18n: {},
        preserveDefaultFonts: true,
    },  ...opts }

  
    // Load i18n files
    editor.I18n && editor.I18n.addMessages({
        en,
        fr,
        ...options.i18n,
    })

    _fontsDialogPlugin(editor, options)
}

export const fontsDialogPlugin = _fontsDialogPlugin
export const cmdOpenFonts = _cmdOpenFonts
