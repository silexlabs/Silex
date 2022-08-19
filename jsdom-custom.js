const Environment = require('jest-environment-jsdom')

/**
 * A custom environment to set the TextEncoder that is required by our tests
 * https://github.com/jsdom/whatwg-url/issues/209
 *
 * FIXME: remove this settings as it is a temporary workaround for a bug in jsdom/whatwg-url
 * @see jest.config.js
 * testEnvironment: "jest-environment-jsdom",
 * Fix from here https://github.com/influxdata/ui/commit/5e113e32f47a5242d0b1246caf406d9af14fbaa7
 * Workaround issue ReferenceError: TextEncoder is not defined
 */
module.exports = class CustomTestEnvironment extends Environment {
  async setup() {
    await super.setup()
    if (typeof this.global.TextEncoder === 'undefined') {
      const {TextEncoder, TextDecoder} = require('util')
      this.global.TextEncoder = TextEncoder
      this.global.TextDecoder = TextDecoder
    }
  }
}
