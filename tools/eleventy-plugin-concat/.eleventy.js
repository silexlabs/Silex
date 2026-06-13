const {writeFile, mkdir} = require('fs/promises')
const {dirname, resolve} = require('path')
const defaults = require('./src/defaults')
const {process} = require('./src/index')

module.exports = function (eleventyConfig, _options) {
  // merge default and options
  const options = {
    ...defaults,
    input: eleventyConfig.dir.input,
    output: eleventyConfig.dir.output,
    ..._options,
  }
  eleventyConfig.addTransform(
    'eleventy-plugin-concat-transform',
    async function(content) {
      if(this.page.outputPath && this.page.outputPath.endsWith(".html")) {
        console.log(`[11ty][Concat Plugin] Optimizing ${this.outputPath}`)
        const jsOutput = resolve(
          eleventyConfig.dir.output,
          options.jsPath(this.page)
        )
        const cssOutput = resolve(
          eleventyConfig.dir.output,
          options.cssPath(this.page)
        )
        await mkdir(
          dirname(jsOutput),
          { recursive: true }
        )
        await mkdir(
          dirname(cssOutput),
          { recursive: true }
        )
        const [html, js, css] = await process(this.page, content, options)
        await writeFile(jsOutput, js)
        await writeFile(cssOutput, css)
        return html
      }
      return content
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
