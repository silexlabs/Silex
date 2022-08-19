/**
 * @fileoverview Silex Dashboard / "new website" dialog which displays templates
 *
 */
import { config } from '../../ClientConfig'
import { ModalDialog } from '../ModalDialog'
import { TipOfTheDay } from '../TipOfTheDay'
import { getUiElements } from '../../ui-store/UiElements'
import { clearLatestFiles, getLatestFiles } from '../../io/latest-files'
import { openFile } from '../../file'
import { FileInfo } from '../../io/CloudStorage'
import { Url } from '../../utils/Url'

export interface DashboardOptions {
  openFileInfo: (p1: FileInfo) => any
  openTemplate: (p1: string) => any
  ready: (() => any)
  error: ((p1?: any) => any)
}

///////////////////
// API for the outside world
let dashboard: Dashboard
function initDashboard() {
  dashboard = dashboard || new Dashboard(getUiElements().dashboard)
  return dashboard
}

export function openDashboard(options: DashboardOptions) {
  initDashboard()
  return dashboard.openDialog(options)
}

/**
 * Silex Dashboard dialog
 * TODO: make this only methods and write tests
 */
class Dashboard {
  // define properties
  readyCbk: (() => any) = null
  errorCbk: ((p1?: any) => any) = null
  selected: {url: string, fileInfo: FileInfo} = null

  // make this a dialog
  modalDialog: ModalDialog

  /**
   * flag set to 'success' when the template list is loaded
   * and set to 'error' when the loading failed
   */
  state: string = ''

  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(protected element: HTMLElement) {
    // keep this bit even when Config.singleSiteMode is true, this will hide the Dashboard
    this.modalDialog = new ModalDialog({
      name: 'Dashboard',
      element,
      onOpen: (args) => this.redraw(),
      onClose: () => {},
    })

    if (config.singleSiteMode) {
      return
    }

    const createList = (ul, className, repo, success, error) => {
      const repoUrl = `./get/${repo}` // add "./" in case we serve silex with a rootPath
      const oReq = new XMLHttpRequest()
      oReq.addEventListener('error', (e) => {
        ul.innerHTML = 'It looks like you are offline. I could not load data from github issues'
        success()
      })
      oReq.addEventListener('load', (e) => {
        const list = JSON.parse(oReq.responseText)
        this.renderTemplateList(ul, className, repo, list)
        success()
      })
      oReq.open('GET', repoUrl)
      oReq.send()
    }

    // click event
    const body = this.element.querySelector('.body') as HTMLElement
    body.onclick = (e) => {
      // listen for a click in the list of recent files
      const a = (e.target as HTMLElement)

      // get the attribute of the link (<a> tag)
      // it might be in (e.target as HTMLElement).parentElement since there are <strong> tags in the
      // <a>
      const templateUrl = a.getAttribute('data-editable') ||
          a.parentElement.getAttribute('data-editable')
      const recentFileInfo = a.getAttribute('data-file-info') ||
          a.parentElement.getAttribute('data-file-info')
      if (!!templateUrl || !!recentFileInfo) {
        this.selected = {
          fileInfo: (JSON.parse(recentFileInfo) as FileInfo),
          url: templateUrl,
        }

        // close the dialog, which will trigger a call the dialog onClose
        // callback and then this.selected will be used to open the selected
        // file
        this.modalDialog.close()
        e.preventDefault()
        return false
      }
    }
    const loadNext = (toLoad) => {
      if (toLoad.length > 0) {
        const item = toLoad.pop()
        const listElement = this.element.querySelector(item.selector)
        if (listElement) {
          createList(
            listElement, item.className,
            item.repo, () => loadNext(toLoad), (e) => {
              this.state = 'error'
              if (this.errorCbk) {
                this.errorCbk(e)
              }
              this.readyCbk = null
              this.errorCbk = null
            })
        } else {
          loadNext(toLoad)
        }
      } else {
        this.state = 'ready'
        if (this.readyCbk) {
          this.readyCbk()
        }
        this.readyCbk = null
        this.errorCbk = null
      }
    }
    const _toLoad = [
      {
        selector: '.general-pane ul',
        repo: 'silex-templates',
        className: 'silex-templates',
      },
      {
        selector: '.general-pane ul',
        repo: 'silex-blank-templates',
        className: 'silex-blank-templates',
      },
    ]
    loadNext(_toLoad)

    // clear button
    const clearBtn = this.element.querySelector('.clear-btn') as HTMLElement
    clearBtn.onclick = (e) => {
      clearLatestFiles()
      this.redraw()
    }

    // browse / import button
    const moreBtn = this.element.querySelector('.more-btn') as HTMLElement
    moreBtn.onclick = (e) => {
      this.modalDialog.close()

      // note that if there is an error in CE, we keep it open so that the user
      // can do something, e.g. navigate awway from a non existing folder
      openFile(null, null, () => this.modalDialog.open())
    }

    // tip of the day
    const tipOfTheDayElement = this.element.querySelector('.tip-of-the-day') as HTMLElement
    if (tipOfTheDayElement) {
      new TipOfTheDay(tipOfTheDayElement)
    }
  }

  /**
   * open the dialog
   * @param options   options object
   */
  openDialog(options: DashboardOptions) {
    if (config.singleSiteMode) {
      if (options.ready) {
        options.ready()
      }
      return
    }

    // is ready callback
    if (this.state === 'ready') {
      // notify the owner
      if (options.ready) {
        options.ready()
      }
    } else {
      if (this.state === 'error') {
        // error callback
        if (options.error) {
          options.error()
        }
      } else {
        // store them for later
        this.readyCbk = options.ready
        this.errorCbk = options.error
      }
    }
    this.selected = null
    this.modalDialog.onClose = () => {
      // notify the owner, with the url to load or nothing (will load blank
      // template)
      if (this.selected) {
        if (this.selected.fileInfo) {
          options.openFileInfo(this.selected.fileInfo)
        } else {
          options.openTemplate(this.selected.url)
        }
      } else {
        options.openTemplate(null)
      }
    }
    this.modalDialog.open()
  }

  /**
   * render the data loaded from github into a <ul>
   */
  private renderTemplateList(ul: HTMLElement, className: string, repo: string, data: any) {
    // // handle previously rendered elements
    // const elements = ul.querySelectorAll('li.rendered-item');
    // for(let idx=0; idx<elements.length; idx++) {
    //   const el = elements[idx];
    //   el.parentElement.removeChild(el);
    // }
    if (Array.isArray(data)) {
      // render the data

      // add the <li> tags to the <ul> tag

      // make a list of <li> tags
      data.map((item) => {
            const li = document.createElement('li')
            li.classList.add('rendered-item', className)

            // thumbnail
            const thumbnail = document.createElement('div')
            const templateFolder = `/libs/templates/${repo}/${item}`
            thumbnail.classList.add('thumbnail')
            thumbnail.style.backgroundImage =
                `url(${ Url.getPath() }${templateFolder}/screenshot.png)` // add base url in case we serve silex with a rootPath
            thumbnail.setAttribute(
                'data-editable', `${templateFolder}/editable.html`)
            thumbnail.setAttribute('data-is-template', 'true')
            li.appendChild(thumbnail)

            // UI container
            const ui = document.createElement('div')
            ui.classList.add('ui')
            li.appendChild(ui)

            // title
            const h3 = document.createElement('h3')
            h3.innerHTML = item
            h3.setAttribute('data-editable', `${templateFolder}/editable.html`)
            h3.setAttribute('data-is-template', 'true')
            ui.appendChild(h3)

            // preview
            const previewEl = document.createElement('a')
            previewEl.classList.add('fa', 'fa-external-link')
            previewEl.innerHTML = 'Preview'
            previewEl.setAttribute('data-action', 'preview')
            previewEl.target = '_blank'
            previewEl.href = `${templateFolder}/index.html`
            ui.appendChild(previewEl)

            // info
            const infoEl = document.createElement('a')
            infoEl.classList.add('fa', 'fa-info')
            infoEl.innerHTML = 'Info'
            infoEl.target = '_blank'
            infoEl.href = `https://github.com/silexlabs/${repo}/blob/gh-pages/${
                item}/README.md`
            infoEl.setAttribute('data-action', 'info')
            ui.appendChild(infoEl)

            // edit
            const editEl = document.createElement('a')
            editEl.classList.add('fa', 'fa-pencil')
            editEl.innerHTML = 'Select'
            editEl.setAttribute(
                'data-editable',
                `/libs/templates/${repo}/${item}/editable.html`)
            editEl.setAttribute('data-is-template', 'true')
            ui.appendChild(editEl)
            return li
          })
          .forEach((li) => ul.appendChild(li))
    }
  }

  /**
   * redraw UI each time the dialog opens
   */
  private redraw() {
    // recent files
    const recentFiles = getLatestFiles()

    // buttons visibility
    const pane = this.element.querySelector('.open-pane')
    if (recentFiles.length > 0) {
      pane.classList.remove('emty-list')
    } else {
      pane.classList.add('emty-list')
    }

    // fill the list
    const ul = pane.querySelector('ul.list')
    ul.innerHTML = ''

    // add the <li> tags to the <ul> tag
    recentFiles
        .map((blob) => {
          // there may be errors due to wrong data in the local storage
          try {
            const li = document.createElement('li')
            li.setAttribute('data-file-info', JSON.stringify(blob))
            li.classList.add('list-item')
            const icon = document.createElement('span')
            icon.setAttribute('data-file-info', JSON.stringify(blob))

            // cloudIcon= fa-github | fa-dropbox | fa-server | fa-cloud |
            // fa-cloud-download
            const cloudIcon = (() => {
              switch (blob.service) {
                case 'github':
                  return ['fa', 'fa-github']
                case 'dropbox':
                  return ['fa', 'fa-dropbox']
                case 'webdav':
                  return ['fa', 'fa-cloud-download']
                case 'ftp':
                case 'sftp':
                  return ['fa', 'fa-server']
                case 'fs':
                  return ['fa', 'fa-hdd-o']
                default:
                  return ['fa', 'fa-cloud']
              }
            })()
            icon.classList.add(...cloudIcon)
            li.appendChild(icon)
            const name = document.createElement('span')
            name.setAttribute('data-file-info', JSON.stringify(blob))
            name.innerHTML = blob.folder + '<strong>' + (blob.name.startsWith('/') ? '' : '/') + blob.name + '</strong>/'

            // the '/' is at the end because the css are "ltr" in order to have
            // ellipsis at the beginning
            li.appendChild(name)
            return li
          } catch (e) {
            console.error('Catched error: ', e)
          }
          return null
        })
        .filter((item) => !!item)
        .forEach((li) => ul.appendChild(li))
  }
}
