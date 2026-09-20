/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals'

// FIXME: Workaround to avoid import of lit-html which breakes unit tests
jest.mock('lit', () => {
  class LitElement {
    requestUpdate() { /* no-op for unit tests */ }
    connectedCallback() { /* no-op for unit tests */ }
    disconnectedCallback() { /* no-op for unit tests */ }
    render() { return undefined }
  }
  const html = (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values })
  return { LitElement, html }
})
jest.mock('lit/decorators.js', () => ({
  property: () => () => { /* no-op decorator */ },
}))
jest.mock('lit/directives/ref.js', () => ({
  createRef: () => ({ value: undefined }),
  ref: () => { /* no-op directive */ },
}))
jest.mock('lit/directives/style-map.js', () => ({
  styleMap: () => '',
}))
jest.mock('@silexlabs/expression-input', () => ({}), { virtual: true })
jest.mock('../model/completion', () => ({ getCompletion: jest.fn(() => []) }))
jest.mock('../model/expressionEvaluator', () => ({ evaluateExpressionTokens: jest.fn() }))
jest.mock('../model/dataSourceRegistry', () => ({ getAllDataSources: jest.fn(() => []) }))
jest.mock('../model/dataSourceManager', () => ({
  getFilters: jest.fn(() => []),
  getPreviewData: jest.fn(() => ({})),
  getManager: jest.fn(),
}))
jest.mock('../model/token', () => ({
  fromStored: jest.fn((token: unknown) => token),
  getExpressionResultType: jest.fn(),
}))

import { StateEditor } from './state-editor'

describe('StateEditor empty selection', () => {
  let errorSpy: ReturnType<typeof jest.spyOn>

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /* swallow */ })
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  test('data getter returns [] without console.error when nothing is selected', () => {
    const editor = new StateEditor()
    expect(editor.data).toEqual([])
    expect(errorSpy).not.toHaveBeenCalled()
  })

  test('render is empty without console.error or an error block when nothing is selected', () => {
    const editor = new StateEditor()
    editor.name = 'eleventyPageData'
    const result = editor.render() as { strings?: TemplateStringsArray }
    const markup = result?.strings?.join('') ?? String(result)
    expect(markup).not.toContain('Error rendering')
    expect(markup).not.toContain('selected and editor are required')
    expect(errorSpy).not.toHaveBeenCalled()
  })

  test('token conversion failures still log at error', () => {
    const editor = new StateEditor()
    editor.selected = { getId: () => 'comp-1' } as never
    editor.editor = {} as never
    ;(editor as unknown as { expressionInputRef: { value: { fixed: boolean, value: string[] } } }).expressionInputRef = {
      value: { fixed: false, value: ['broken-token'] },
    }
    expect(editor.data).toEqual([expect.objectContaining({ fieldId: 'unknown', label: 'Unknown' })])
    expect(errorSpy).toHaveBeenCalled()
    expect(errorSpy.mock.calls.some(args => String(args[0]).includes('Error while getting token from id'))).toBe(true)
    expect(errorSpy.mock.calls.some(args => String(args[0]).includes('selected and editor are required'))).toBe(false)
  })
})
