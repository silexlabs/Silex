const fs = require('fs')
const defaults = require('./src/defaults')
const process = require('./src/index')

module.exports = function (eleventyConfig, _options) {
  // merge default and options
  const options = {
    ...defaults,
    ..._options,
  }

  // eleventyConfig.addLinter(
  //   "eleventy-plugin-concat-linter",
  //   async function(content) {
  //     console.log('linter', content)
  //     console.log( 'linter', this.inputPath )
  //     console.log( 'linter', this.outputPath )
  //     console.log( 'linter', this.page.inputPath )
  //     console.log( 'linter', this.page.outputPath )
  //   }
  // )
  eleventyConfig.addTransform(
    'eleventy-plugin-concat-transform',
    async function(content) {
      //console.log('transform', content )
      //console.log('transform', this.inputPath )
      //console.log('transform', this.outputPath )
      //console.log('transform', this.page.inputPath )
      //console.log('transform', this.page.outputPath )
      const [html, js, css] = process(content, options)
      // fs.writeSync(js, jsOutput)
      // fs.writeSync(css, cssOutput)
      return html
    }
  )

  /**
   *   dir: { input: '.', includes: '_includes', data: '_data', output: '_site' },
   * runMode: 'serve',
   * outputMode: 'fs'
   */
  // eleventyConfig.on(
  //   "eleventy.before",
  //   ({ dir, runMode, outputMode }) => console.log('eleventy.before', { dir, runMode, outputMode })
  // )

  /**
   * dir: { input: '.', includes: '_includes', data: '_data', output: '_site' },
   * results: [
   *   {
   *     inputPath: './src/test.html',
   *     outputPath: '_site/test/index.html',
   *     url: '/test/',
   *     content: 'test\n'
   *   }
   * ],
   * runMode: 'serve',
   * outputMode: 'fs'
   */
  // eleventyConfig.on(
  //   "eleventy.after",
  //   ({ dir, results, runMode, outputMode }) => console.log('eleventy.after', { dir, results, runMode, outputMode })
  // )
}
