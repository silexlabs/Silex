import { jest,  expect, describe, it, beforeEach } from '@jest/globals'
import { Mock } from 'jest-mock'
import {
  renderComponents,
  renderCssRules,
  resetRenderComponents,
  resetRenderCssRules,
  PublicationTransformer,
  transformFiles,
  transformBgImage
} from './publication-transformers'
import { ClientConfig } from './config'
import grapesjs, { Component, Editor, StyleProps, Page } from 'grapesjs'
import { ClientSideFile, ClientSideFileType, PublicationData } from '../types'

describe('publication-transformers', () => {
  let mockConfig: ClientConfig
  let mockFile: ClientSideFile
  let mockData: PublicationData
  let transformer: PublicationTransformer

  let editor: Editor

  beforeEach(() => {
    // Initialize your mocks here
    /* @ts-ignore */
    editor = grapesjs.init({
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
    mockData = {
      files: [mockFile],
      pages: [{} as Page],
    } as any as PublicationData
    transformer = {
      renderComponent: jest.fn(),
      renderCssRule: jest.fn(),
      transformFile: jest.fn(),
      transformPermalink: jest.fn(),
      transformPath: jest.fn(),
    } as PublicationTransformer
    mockConfig = { getEditor: jest.fn(() => editor), publicationTransformers: [transformer] } as unknown as ClientConfig
    editor.getModel().set('config', mockConfig)
  })

  it('should transform components', () => {
    const renderComponent = transformer.renderComponent as Mock
    renderComponent.mockReturnValue('mockHtml')
    renderComponents(editor)
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
    renderComponents(editor)
    resetRenderComponents(editor)
    const html = editor.getHtml()
    expect(renderComponent).toBeCalledTimes(0)
    expect(html).toContain('Hello world')
  })

  it('should transform styles', () => {
    const transformCssRule = transformer.renderCssRule as Mock
    transformCssRule.mockImplementation((rule: any) => {
      return { color: 'test'+rule.color } as StyleProps
    })
    renderCssRules(editor)
    const css = editor.getCss()
    expect(transformCssRule).toBeCalledTimes(2)
    const results = transformCssRule.mock.results.map(r => r.value as StyleProps)
    const parent = results.find(c => c.color === 'testred')
    expect(parent).not.toBeUndefined()
    const child = results.find(c => c.color === 'testblue')
    expect(child).not.toBeUndefined()
    expect(css).toContain('color:test')
    expect(css).not.toContain('color:blue')
  })

  it('should reset transformed styles', () => {
    const renderCssRule = transformer.renderCssRule as Mock
    const returned = {color: 'test'} as StyleProps
    renderCssRule.mockReturnValue(returned)
    renderCssRules(editor)
    resetRenderCssRules(editor)
    const css = editor.getCss()
    expect(renderCssRule).toBeCalledTimes(0)
    expect(css).toContain('color:blue')
  })

  it('should transform files', () => {
    const transformFile = transformer.transformFile as Mock
    const returned = {path: 'test path changed', content: 'test content changed'} as ClientSideFile
    transformFile.mockReturnValue(returned)
    expect(mockData.files?.length).toBe(1)
    if (mockData.files?.length) { // To avoid ! operator on mockData.files and make the lint happy
      expect(mockData.files[0]).toBe(mockFile)
      transformFiles(editor, mockData)
      expect(transformFile).toBeCalledTimes(1)
      expect(mockData.files[0]).toBe(returned)
    }
  })
  it('should transform permalinks of images src', () => {
    editor.addComponents(`
      <img src="test.png">
    `)
    const transformPermalink = transformer.transformPermalink as Mock
    const transformedSrc = 'transformed.png'
    transformPermalink.mockReturnValue(transformedSrc)
    renderComponents(editor)
    const html = editor.getHtml()
    expect(transformPermalink).toBeCalledTimes(2) // 2x because of c.attributes.src and c.attributes.attributes.src
    expect(transformPermalink.mock.calls[0][0]).toBe('test.png')
    expect(transformPermalink.mock.calls[0][1]).toBe('asset')
  })

  it('should transform a style rule with background image', () => {
    expect(transformBgImage(editor, { 'background-image': 'url(test.png)' })).toEqual({ 'background-image': 'url("test.png")' })
    const transformPermalink = transformer.transformPermalink as Mock
    const transformedSrc = 'transformed.png'
    const transformedSrc2 = 'transformed2.png'
    transformPermalink.mockImplementation((url, type) => (url as string).replace('test.png', transformedSrc).replace('test2.png', transformedSrc2))
    expect(transformBgImage(editor, { 'background-image': 'url(test.png)' })).toEqual({ 'background-image': `url("${transformedSrc}")` })
    expect(transformBgImage(editor, { 'background-image': 'url("test.png")' })).toEqual({ 'background-image': `url("${transformedSrc}")` })
    expect(transformBgImage(editor, {
      'background-image': 'linear-gradient(to right, rgb(30 75 115 / 100%), url(test.png), linear-gradient(to left, rgb(30 75 115 / 10%), url(test2.png), rgb(255 255 255 / 0%));',
    })).toEqual({
      'background-image': `linear-gradient(to right, rgb(30 75 115 / 100%), url("${transformedSrc}"), linear-gradient(to left, rgb(30 75 115 / 10%), url("${transformedSrc2}"), rgb(255 255 255 / 0%));`,
    })
  })

  it('should transform permalinks of background images in inline css', () => {
    const el = document.createElement('div')
    const [comp] = editor.addComponents(el)
    comp.setStyle({ 'background-image': 'url("test.png")' })
    //editor.addComponents(`
    //  <div style="color: black; background-image: url("test.png");"></div>
    //`)
    const transformPermalink = transformer.transformPermalink as Mock
    const transformedSrc = 'transformed.png'
    transformPermalink.mockReturnValue(transformedSrc)
    renderComponents(editor)
    const css = editor.getCss()
    expect(transformPermalink).toBeCalledTimes(1)
    expect(transformPermalink.mock.calls[0][0]).toBe('test.png')
    expect(transformPermalink.mock.calls[0][1]).toBe('asset')
    expect(css).toContain('url("test.png")')
  })
  it('should transform permalinks of background images in styles', () => {
    editor.addComponents(`
      <div class="test"></div>
    `)
    editor.addStyle(`
      .test {
        background-image: url("test.png");
      }
    `)
    const transformPermalink = transformer.transformPermalink as Mock
    const transformedSrc = 'transformed.png'
    transformPermalink.mockReturnValue(transformedSrc)
    renderCssRules(editor)
    const css = editor.getCss()
    expect(transformPermalink).toBeCalledTimes(1)
    expect(transformPermalink.mock.calls[0][0]).toBe('test.png')
    expect(transformPermalink.mock.calls[0][1]).toBe('asset')
    expect(css).toContain(`url("${transformedSrc}")`)
  })
  it('should transform links to pages to match permalinks ', () => {
    editor.addComponents(`
      <a href="./index.html">test</a>
    `)
    const transformPermalink = transformer.transformPermalink as Mock
    const transformedPermalink = './transformed-page.html'
    transformPermalink.mockReturnValue(transformedPermalink)
    renderComponents(editor)
    const html = editor.getHtml()
    expect(transformPermalink).toBeCalledTimes(1)
    expect((transformPermalink.mock.calls[0][0])).toBe('./index.html')
    expect((transformPermalink.mock.calls[0][1])).toBe(ClientSideFileType.HTML)
    expect(html).not.toContain('href="./index.html"')
    expect(html).toContain(`href="${transformedPermalink}"`)
  })
})
