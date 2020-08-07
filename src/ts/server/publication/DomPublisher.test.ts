import { extractAssets, splitInFiles } from './DomPublisher'

beforeEach(() => {
  window.document.body.innerHTML = ''
  window.document.head.innerHTML = ''
})

describe('extractAssets', () => {
  test('empty document', () => {
    const getDestFolder = jest.fn()
    expect(extractAssets({
      baseUrl: 'baseUrl',
      rootUrl: 'rootUrl',
      rootPath: 'rootPath',
      win: window as any,
      getDestFolder,
    })).toEqual([])
    expect(getDestFolder).toHaveBeenCalledTimes(0)
  })
  test('body absolute', () => {
    window.document.body.innerHTML = `
      <img src="http://baseurl.com/srcfolder/test.jpg"/>
    `
    const getDestFolder = jest.fn((ext: string, tagName: string) => {
      return 'destFolder'
    })
    expect(extractAssets({
      baseUrl: 'http://baseurl.com/base_src/',
      rootUrl: 'http://baseurl.com/path/random/',
      rootPath: 'rootPath',
      win: window as any,
      getDestFolder,
    })).toEqual([{
      destPath: 'rootPath/destFolder/test.jpg',
      displayName: 'test.jpg',
      original: 'http://baseurl.com/srcfolder/test.jpg',
      srcPath: 'http://baseurl.com/srcfolder/test.jpg',
      tagName: 'IMG',
    }])
    expect(getDestFolder).toHaveBeenCalledTimes(1)
  })
  test('body relative', () => {
    window.document.body.innerHTML = `
      <img src="srcfolder/test.jpg"/>
    `
    const getDestFolder = jest.fn((ext: string, tagName: string) => {
      return 'destFolder'
    })
    expect(extractAssets({
      baseUrl: 'http://baseurl.com/base_src/',
      rootUrl: 'http://baseurl.com/path/random/',
      rootPath: 'rootPath',
      win: window as any,
      getDestFolder,
    })).toEqual([{
      destPath: 'rootPath/destFolder/test.jpg',
      displayName: 'test.jpg',
      original: 'srcfolder/test.jpg',
      srcPath: 'http://baseurl.com/base_src/srcfolder/test.jpg',
      tagName: 'IMG',
    }])
    expect(getDestFolder).toHaveBeenCalledTimes(1)

    window.document.body.innerHTML = `
      <img src="./srcfolder/test.jpg"/>
    `
    expect(extractAssets({
      baseUrl: 'http://baseurl.com/base_src/',
      rootUrl: 'http://baseurl.com/path/random/',
      rootPath: 'rootPath',
      win: window as any,
      getDestFolder,
    })).toEqual([{
      destPath: 'rootPath/destFolder/test.jpg',
      displayName: 'test.jpg',
      original: './srcfolder/test.jpg',
      srcPath: 'http://baseurl.com/base_src/srcfolder/test.jpg',
      tagName: 'IMG',
    }])
    expect(getDestFolder).toHaveBeenCalledTimes(2)
  })
  test('head relative', () => {
    window.document.head.innerHTML = `
      <script src="./srcfolder/test.js"/>
    `
    const getDestFolder = jest.fn((ext: string, tagName: string) => {
      return 'destFolder'
    })
    expect(extractAssets({
      baseUrl: 'http://baseurl.com/base_src/',
      rootUrl: 'http://baseurl.com/path/random/',
      rootPath: 'rootPath',
      win: window as any,
      getDestFolder,
    })).toEqual([{
      destPath: 'rootPath/destFolder/test.js',
      displayName: 'test.js',
      original: './srcfolder/test.js',
      srcPath: 'http://baseurl.com/base_src/srcfolder/test.js',
      tagName: 'SCRIPT',
    }])
    expect(getDestFolder).toHaveBeenCalledTimes(1)
  })
})

describe('splitInFiles', () => {
  test('empty document', () => {
    expect(splitInFiles({
      rootUrl: 'http://baseurl.com/path/random/',
      win: window as any,
      userHead: 'userHead',
    })).toEqual({'scriptTags': [], 'styleTags': []})
  })
  test('non empty', () => {
    const script = document.createElement('script')
    script.innerHTML = 'scriptcontent'
    script.type = 'text/NOT-javascript'
    window.document.head.appendChild(script)
    expect(splitInFiles({
      rootUrl: 'http://baseurl.com/path/random/',
      win: window as any,
      userHead: 'userHead',
    })).toEqual({'scriptTags': [script], 'styleTags': []})
  })
})
