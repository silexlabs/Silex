const assert = require('assert')
const helpers = require('./desktop-bridge.js')

let passed = 0
let total = 0

function test(name, fn) {
  total++
  try {
    fn()
    passed++
    console.log(`  PASS  ${name}`)
  } catch (err) {
    console.error(`  FAIL  ${name}`)
    console.error(`        ${err.message}`)
  }
}

console.log('desktop-bridge MCP helpers\n')

test('pageFontsAvailable caps at 20 and says how many remain', () => {
  const fonts = Array.from({ length: 25 }, (_, i) => ({ family: 'Font' + i }))
  const paged = helpers.pageFontsAvailable(fonts)
  assert.strictEqual(paged.fonts.length, 20)
  assert.strictEqual(paged.remaining, 5)
  assert.match(paged.hint, /5 more fonts available/)
  assert.match(paged.hint, /search/)
})

test('pageFontsAvailable keeps extra keys and has no hint when nothing remains', () => {
  const paged = helpers.pageFontsAvailable({
    result: [{ family: 'Roboto' }],
    selection: { page: 'index' },
  })
  assert.strictEqual(paged.remaining, 0)
  assert.strictEqual(paged.hint, undefined)
  assert.strictEqual(paged.selection.page, 'index')
  assert.strictEqual(paged.result, undefined)
})

test('publish start answers immediately with the follow-up message', () => {
  const start = helpers.publishStartAnswer()
  assert.strictEqual(start.status, 'pending')
  assert.strictEqual(
    start.message,
    'Publication started. Call publish with action status to follow it.',
  )
})

test('beginPublication returns before a long publish promise settles', () => {
  const hanging = helpers.beginPublication(() => new Promise(() => {}), () => {})
  assert.strictEqual(hanging.status, 'pending')
  assert.match(hanging.message, /Publication started/)
  const thrown = helpers.beginPublication(() => { throw new Error('User not logged in to a hosting connector') }, () => {})
  assert.strictEqual(thrown.status, 'error')
  assert.strictEqual(thrown.message, helpers.NO_HOSTING)
})

test('publish status is pending while the manager is running', () => {
  const status = helpers.publishStatusAnswer({
    managerStatus: 'STATUS_PENDING',
    jobStatus: 'pending',
    logs: [['building'], ['uploading']],
    errors: [],
  })
  assert.strictEqual(status.status, 'pending')
  assert.match(status.message, /Still publishing/)
  assert.match(status.message, /Do not tell the user it is done/)
  assert.deepStrictEqual(status.logs, ['building', 'uploading'])
})

test('publish status returns success with the URL', () => {
  const status = helpers.publishStatusAnswer({
    managerStatus: 'STATUS_SUCCESS',
    message: 'Published',
    url: 'https://example.com',
    logs: [['done']],
    errors: [],
  })
  assert.strictEqual(status.status, 'success')
  assert.strictEqual(status.url, 'https://example.com')
  assert.strictEqual(status.message, 'Published')
})

test('publish status maps a missing host to the next step', () => {
  const status = helpers.publishStatusAnswer({
    managerStatus: 'STATUS_ERROR',
    message: 'User not logged in to a hosting connector',
    errors: [['hosting missing']],
    logs: [['start']],
  })
  assert.strictEqual(status.status, 'error')
  assert.strictEqual(status.message, helpers.NO_HOSTING)
  assert.deepStrictEqual(status.errors, ['hosting missing'])
  assert.deepStrictEqual(status.logs, ['start'])
})

test('publish status with no job tells the agent to start', () => {
  const status = helpers.publishStatusAnswer({ jobStatus: 'idle' })
  assert.strictEqual(status.status, 'error')
  assert.strictEqual(status.message, helpers.NO_PUBLICATION)
})

test('lastLogLines keeps the last 20 and flattens groups', () => {
  const groups = [Array.from({ length: 25 }, (_, i) => 'L' + i)]
  const lines = helpers.lastLogLines(groups)
  assert.strictEqual(lines.length, 20)
  assert.strictEqual(lines[0], 'L5')
  assert.strictEqual(lines[19], 'L24')
})

test('successful answers drop warnings but keep selection', () => {
  const wrapped = helpers.wrapDynamicResult(
    { ok: true },
    { page: 'index', warnings: ['No element selected'] },
    false,
  )
  assert.strictEqual(wrapped.selection.page, 'index')
  assert.strictEqual(wrapped.selection.warnings, undefined)
})

test('failed answers keep selection and warnings', () => {
  const wrapped = helpers.wrapDynamicResult(
    { error: 'Required: property' },
    { page: 'index', warnings: ['No element selected'] },
    true,
  )
  assert.strictEqual(wrapped.selection.page, 'index')
  assert.deepStrictEqual(wrapped.selection.warnings, ['No element selected'])
  assert.strictEqual(helpers.isCommandError(wrapped), true)
})

test('pending publish is not a command error', () => {
  assert.strictEqual(helpers.isCommandError(helpers.publishStartAnswer()), false)
})

console.log(`\n${passed}/${total} passed, ${total - passed} failed`)
process.exit(passed === total ? 0 : 1)
