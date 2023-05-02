const { basename } = require('path')

function fileName(ext, preprend = '') {
  return page => `${ preprend }${ ext }/${ basename(page.outputPath, '.html') }-concat.${ ext }`
}

module.exports = {
  input: '.',
  output: '_site',
  jsUrl: fileName('js', '/'),
  jsPath: fileName('js'),
  jsSelector: 'head script[data-concat]',
  jsAttributes: 'defer',
  cssUrl: fileName('css', '/'),
  cssPath: fileName('css'),
  cssSelector: 'head link[data-concat], head style[data-concat]',
  cssAttributes: '',
  baseUrl: 'http://localhost:8080',
}
