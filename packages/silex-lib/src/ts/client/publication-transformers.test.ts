import { jest,  expect, describe, it, beforeEach } from '@jest/globals'
import { Mock } from 'jest-mock'
import {
  transformComponents,
  transformStyles,
  transformPages,
  transformFiles,
  resetTransformComponents,
  resetTransformStyles,
  resetTransformPages,
  PublicationTransformer
} from './publication-transformers'
import { ClientConfig } from './config'
import GrapesJS, { Component, Editor, ObjectStrings } from 'grapesjs'
import { ClientSideFile, PublicationData } from '../types'
import exp from 'constants'

describe('publication-transformers', () => {
  let mockConfig: ClientConfig
  let mockFile: ClientSideFile
  let mockData: PublicationData
  let transformer: PublicationTransformer

  let editor: Editor

  beforeEach(() => {
    // Initialize your mocks here
    editor = GrapesJS.init({
      headless: true,
      storageManager: { autoload: false },
    })
    expect(editor).not.toBeUndefined()
    editor.addComponents(`
      <nav class="parent">
        <div class="child">Hello world</div>
      <nav>
    `)
    editor.addStyle(`
      .parent {
        color: red;
      }
      .child {
        color: blue;
      }
    `)
    mockFile = {
      path: 'test path',
      content: 'test content',
    } as ClientSideFile
    mockData = { files: [mockFile] } as PublicationData
    transformer = {
      renderComponent: jest.fn(),
      renderCssRule: jest.fn(),
      pageToSlug: jest.fn(),
      transformFile: jest.fn()
    } as PublicationTransformer
    mockConfig = { getEditor: jest.fn(() => editor), publicationTransformers: [transformer] } as unknown as ClientConfig
  })

  it('should transform components', () => {
    const renderComponent = transformer.renderComponent as Mock
    renderComponent.mockReturnValue('mockHtml')
    transformComponents(mockConfig)
    const html = editor.getHtml()
    expect(renderComponent).toBeCalledTimes(6)
    const results = renderComponent.mock.calls.map(call => call[0] as Component)
    const parent = results.find(c => c.getClasses()[0] === 'parent')
    expect(parent).not.toBeUndefined()
    const child = results.find(c => c.getClasses()[0] === 'child')
    expect(child).not.toBeUndefined()
  })

  it('should reset transformed pages', () => {
    const renderComponent = transformer.renderComponent as Mock
    renderComponent.mockReturnValue('mockHtml')
    transformComponents(mockConfig)
    resetTransformComponents(mockConfig)
    const html = editor.getHtml()
    expect(renderComponent).toBeCalledTimes(0)
    expect(html).toContain('Hello world')
  })

  it('should transform styles', () => {
    const renderCssRule = transformer.renderCssRule as Mock
    const returned = {color: 'test'} as ObjectStrings
    renderCssRule.mockReturnValue(returned)
    transformStyles(mockConfig)
    const css = editor.getCss()
    expect(renderCssRule).toBeCalledTimes(2)
    const results = renderCssRule.mock.calls.map(call => call[1] as ObjectStrings)
    const parent = results.find(c => c.color === 'red')
    expect(parent).not.toBeUndefined()
    const child = results.find(c => c.color === 'blue')
    expect(child).not.toBeUndefined()
    expect(css).toContain('color:test')
    expect(css).not.toContain('blue')
  })

  it('should reset transformed styles', () => {
    const renderCssRule = transformer.renderCssRule as Mock
    const returned = {color: 'test'} as ObjectStrings
    renderCssRule.mockReturnValue(returned)
    transformStyles(mockConfig)
    resetTransformStyles(mockConfig)
    const css = editor.getCss()
    expect(renderCssRule).toBeCalledTimes(0)
    expect(css).toContain('color:blue')
  })

  it('should transform pages', () => {
    const PAGE_SLUG = 'test page slug'
    const pageToSlug = transformer.pageToSlug as Mock
    pageToSlug.mockReturnValue(PAGE_SLUG)
    transformPages(mockConfig)
    const pages = editor.Pages.getAll()
    expect(pageToSlug).toBeCalledTimes(1)
    expect(pages[0].get('slug')).toBe(PAGE_SLUG)
  })

  it('should reset transformed components', () => {
    const PAGE_SLUG = 'test page slug'
    const pageToSlug = transformer.pageToSlug as Mock
    pageToSlug.mockReturnValue(PAGE_SLUG)
    transformPages(mockConfig)
    resetTransformPages(mockConfig)
    const pages = editor.Pages.getAll()
    expect(pageToSlug).toBeCalledTimes(1)
    expect(pages[0].get('slug')).not.toBe(PAGE_SLUG)
  })

  it('should transform files', () => {
    const transformFile = transformer.transformFile as Mock
    const returned = {path: 'test path changed', content: 'test content changed'} as ClientSideFile
    transformFile.mockReturnValue(returned)
    expect(mockData.files?.length).toBe(1)
    if (mockData.files?.length) { // To avoid ! operator on mockData.files and make the lint happy
      expect(mockData.files[0]).toBe(mockFile)
      transformFiles(mockConfig, mockData)
      expect(transformFile).toBeCalledTimes(1)
      expect(mockData.files[0]).toBe(returned)
    }
  })
})
