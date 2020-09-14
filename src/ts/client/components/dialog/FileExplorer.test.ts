import { FileExplorer } from './FileExplorer'

const fileInfo = {
  service: 'test-srv',
  path: 'test-path',
  name: 'test-name',
  mime: 'test-mime',
  isDir: false,
  absPath: 'test-absPath',
  url: 'test-url'
}

let openFile

jest.mock('../../ui-store/UiElements', () => ({
  getUiElements: () => ({
    fileExplorer: document.body,
  }),
}))

jest.mock('../../io/CloudStorage', () => ({
  CloudStorage: {
    getInstance: () => ({
      ready: (cbk: any) => cbk(),
      ce: {
        openFile: () => openFile(),
      },
    }),
  }
}))

test('addAbsPath', () => {
  const fileExplorer = FileExplorer.getInstance()
  expect(fileExplorer.addAbsPath(fileInfo)).toEqual({
    ...fileInfo,
    absPath: '/ce/test-srv/get/test-path',
  })
})

test('openFile', async () => {
  const fileExplorer = FileExplorer.getInstance()
  openFile = () => fileInfo
  expect(await fileExplorer.openFile()).toEqual({
    ...fileInfo,
    absPath: '/ce/test-srv/get/test-path',
  })
})

test('openFile with attribution', async () => {
  const fileExplorer = FileExplorer.getInstance()
  fileExplorer.promptAttributionAndGetSize = jest.fn(() => Promise.resolve('test-big'))
  const imageInfo = {
    ...fileInfo,
    urls: {
      big: 'test-big',
      small: 'test-small',
    },
  }
  openFile = () => imageInfo
  expect(await fileExplorer.openFile()).toEqual({
    ...imageInfo,
    absPath: 'test-big',
  })
})
