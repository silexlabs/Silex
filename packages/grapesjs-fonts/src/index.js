import { fontsDialogPlugin } from './fonts.js'
import commands from './commands.js'
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

    commands(editor, options)
    fontsDialogPlugin(editor, options)
}

// Expose commands to the app
export * from './fonts.js'
export * from './commands.js'
