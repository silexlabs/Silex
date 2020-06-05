import { FileInfo } from './CloudStorage'

/**
 * clear the recent files
 */
export function clearLatestFiles() {
  window.localStorage.removeItem('silex:recent-files')
}

/**
 * get the latest opened files
 */
export function getLatestFiles(): FileInfo[] {
  const str = window.localStorage.getItem('silex:recent-files')
  if (str) {
    return (JSON.parse(str) as FileInfo[])
  } else {
    return []
  }
}

/**
 * max number of items in recent files
 */
const MAX_RECENT_FILES = 5

/**
 * store this file in the latest opened files
 */
export function addToLatestFiles(fileInfo: FileInfo) {
  const latestFiles = [
    fileInfo,
    ...getLatestFiles().filter((item, idx) => item.absPath !== fileInfo.absPath && idx < MAX_RECENT_FILES),
  ]
  window.localStorage.setItem('silex:recent-files', JSON.stringify(latestFiles))
}
