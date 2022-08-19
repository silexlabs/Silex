/**
 * @fileoverview This is the dialog box containing the
 *     Cloud Explorer file picker
 *     this is only the UI part, to let user choose a file in the cloud
 *     @see silex.service.CloudStorage     for the service/network part
 *
 */

import { ModalDialog } from '../../components/ModalDialog'
import { CloudExplorer } from '../../externs'
import { CloudStorage, FileInfo } from '../../io/CloudStorage'
import { Notification } from '../Notification'
import { getUiElements } from '../../ui-store/UiElements'
import { Url } from '../../utils/Url'

/**
 * the Silex FileExplorer class
 * @class {silex.view.dialog.FileExplorer}
 */
export class FileExplorer {
  static get IMAGE_EXTENSIONS() {
    return ['.jpg', '.jpeg', '.png', '.gif', '.svg']
  }
  static get HTML_EXTENSIONS() {
    return ['.html', '.zip']
  }

  // singleton pattern
  // FIXME: refactor it as a function and use import
  static getInstance(): FileExplorer {
    FileExplorer.instance = FileExplorer.instance || new FileExplorer()
    return FileExplorer.instance
  }
  private static instance: FileExplorer

  /**
   * reference to the filepicker instance
   */
  ce: CloudExplorer = null

  // make this a dialog
  modalDialog: any

  private constructor() {
    const element = getUiElements().fileExplorer

    // cloud explorer instance
    CloudStorage.getInstance().ready(() => {
      this.ce = CloudStorage.getInstance().ce
    })
    this.modalDialog = new ModalDialog({name: 'File explorer', element, onOpen: (args) => {}, onClose: () => {}})
  }

  /**
   * method passed to then in order to add the desired path format everywhere in
   * silex
   */
  addAbsPath(fileInfo: FileInfo): FileInfo {
    if (fileInfo) {
      const absPath = fileInfo.service ? `${ Url.getPath() }/ce/${fileInfo.service}/get/${fileInfo.path}` : fileInfo.absPath
      return {
        ...fileInfo,
        absPath,
      }
    }
  }

  /**
   * pick file
   * @param opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   */
  async openFile(opt_extensions?: string[]): Promise<FileInfo> {
    this.open()
    const fileInfo = await this.ce.openFile(opt_extensions)
    if (fileInfo) {
      if (fileInfo.urls && fileInfo.urls.big && fileInfo.urls.small) {
        const absPath = await this.promptAttributionAndGetSize(fileInfo.attribution, fileInfo.urls)
        this.close()
        return {
          ...fileInfo,
          absPath,
        }
      }
      this.close()
      return this.addAbsPath(fileInfo)
    }
    this.close()
    return null
  }

  async promptAttributionAndGetSize(attribution, urls): Promise<string> {
    return new Promise((resolve, reject) => {
      const attributionText = attribution ? `
        <h3>About this image and the author</h3>
        <p>
          ${attribution.message}
        </p><br/>
        <code>
          ${attribution.content}
        </code>
        <button class="copy-btn">Copy</button>
      ` : ''
      const sizeText = `
        <h3>Image size</h3>
        <p>You need to choose an image size to continue</p>
        <ul>
          <li>Open the <a target="_blank" href="${urls.big}">big version</a> in a new tab</li>
          <li>Or the <a target="_blank" href="${urls.small}">small version</a></li>
        </ul>
      `
      const form: HTMLElement = document.createElement('div')
      form.innerHTML = attributionText + sizeText
      const copyBtn: HTMLButtonElement = form.querySelector('.copy-btn')
      copyBtn.onclick = () => this.copy(attribution.content)
      Notification.confirm('Insert image', '', (ok) => {
        if (ok) {
          resolve(urls.big)
        } else {
          resolve(urls.small)
        }
      }, 'Big size', 'Small size')
      Notification.setContent(form, false)
    })
  }

  copy(text: string) {
    const copyText = document.createElement('div')
    document.body.appendChild(copyText)
    try {
      copyText.innerHTML = text
      const range = document.createRange()
      range.selectNode(copyText)
      window.getSelection().addRange(range)
      const success = document.execCommand('copy')
      if (success) {
        Notification.notifySuccess('Attribution copied to clipboard')
      } else {
        Notification.notifyError('Attribution has not been copied to clipboard')
        console.error('Could not copy to clipboard', text)
      }
    } catch (err) {
      Notification.notifyError('Attribution has not been copied to clipboard')
      console.error('Could not copy to clipboard', err, text)
    }
    document.body.removeChild(copyText)
  }

  /**
   * pick multiple files
   * @param opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   */
  async openFiles(opt_extensions?: string[]): Promise<FileInfo> {
    this.open()
    const fileInfo = await this.ce.openFiles(opt_extensions)
    const fileInfo_2 = this.addAbsPath(fileInfo)
    this.close()
    return fileInfo_2
  }

  /**
   * pick a folder
   */
  async openFolder(): Promise<FileInfo> {
    this.open()
    const fileInfo = await this.ce.openFolder()
    const fileInfo_2 = this.addAbsPath(fileInfo)
    this.close()
    return fileInfo_2
  }

  /**
   * choose a name for the file
   * @param opt_extensions optional array of file extensions, e.g.
   *                           ['.jpg'] to show *.jpg and *.JPG
   *                           null to show all the files and folders
   *                           [] to show only folders
   */
  async saveAs(defaultName: string, opt_extensions?: string[]):
      Promise<FileInfo> {
    this.open()
    const fileInfo = await this.ce.saveAs(defaultName, opt_extensions)
    const fileInfo_2 = this.addAbsPath(fileInfo)
    this.close()
    return fileInfo_2
  }

  /**
   * Open the editor
   */
  open() {
    this.modalDialog.open()
  }

  /**
   * Close the editor
   */
  close() {
    this.modalDialog.close()
  }
}
