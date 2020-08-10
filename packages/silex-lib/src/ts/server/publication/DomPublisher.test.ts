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
      hookedRootUrl: null,
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
      hookedRootUrl: null,
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
    expect(document.querySelector('img').getAttribute('src')).toEqual('destFolder/test.jpg')
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
      hookedRootUrl: null,
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
    expect(document.querySelector('img').getAttribute('src')).toEqual('destFolder/test.jpg')

    window.document.body.innerHTML = `
      <img src="./srcfolder/test.jpg"/>
    `
    expect(extractAssets({
      baseUrl: 'http://baseurl.com/base_src/',
      rootUrl: 'http://baseurl.com/path/random/',
      hookedRootUrl: null,
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
      hookedRootUrl: null,
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
  test('CSS stylesheet', () => {
    window.document.head.innerHTML = `
      <style>
        body {
          background-image: url(./srcfolder/test.jpg);
        }
      </style>
    `
    const getDestFolder = jest.fn((ext: string, tagName: string) => {
      return 'destFolder'
    })
    extractAssets({
      baseUrl: 'http://baseurl.com/base_src/',
      rootUrl: 'http://baseurl.com/path/random/',
      hookedRootUrl: null,
      rootPath: 'rootPath',
      win: window as any,
      getDestFolder,
    })
    expect(window.getComputedStyle(document.body)['background-image']).toEqual('url(../destFolder/test.jpg)')
    expect(getDestFolder).toHaveBeenCalledTimes(1)
  })
  test('Hooked root URL', () => {
    window.document.head.innerHTML = `
      <img src="./srcfolder/test.jpg"/>
    `
    const getDestFolder = jest.fn((ext: string, tagName: string) => {
      return 'destFolder'
    })
    extractAssets({
      baseUrl: 'http://baseurl.com/base_src/',
      rootUrl: 'http://baseurl.com/path/random/',
      hookedRootUrl: '{hookedRootUrl}',
      rootPath: 'rootPath',
      win: window as any,
      getDestFolder,
    })
    expect(document.querySelector('img').getAttribute('src')).toEqual('{hookedRootUrl}destFolder/test.jpg')
    expect(getDestFolder).toHaveBeenCalledTimes(1)
  })
})

describe('splitInFiles', () => {
  test('empty document', () => {
    expect(splitInFiles({
      hookedRootUrl: null,
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
      hookedRootUrl: null,
      win: window as any,
      userHead: 'userHead',
    })).toEqual({'scriptTags': [script], 'styleTags': []})
  })
})
