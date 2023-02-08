import { fontsDialogPlugin as _fontsDialogPlugin, cmdOpenFonts as _cmdOpenFonts } from './fonts'
import en from './locale/en';

export default (editor, opts = {}) => {

  const options = { ...{
    i18n: {},
    // default options
  },  ...opts };

  
  // Load i18n files
  editor.I18n && editor.I18n.addMessages({
      en,
      ...options.i18n,
  });

  _fontsDialogPlugin(editor, opts)
};

export const fontsDialogPlugin = _fontsDialogPlugin;
export const cmdOpenFonts = _cmdOpenFonts;
