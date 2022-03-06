/**
 * @fileoverview The settings dialog which handles the file settings
 * TODO: refactor font list and data source list which should share more code
 * TODO: remove the logic to open tabs and handle it in CSS/HTML only with check boxes
 *
 */

import { getSite, subscribeSite, updateSite } from '../../site-store/index'
import { CloudStorage, FileInfo } from '../../io/CloudStorage'
import { Notification } from '../Notification'
import { Url } from '../../utils/Url'
import { ModalDialog } from '../ModalDialog'
import { FileExplorer } from './FileExplorer'
import { DataSources, DataSource, Font } from '../../site-store/types'
import { getUiElements } from '../../ui-store/UiElements'
import { getUi, subscribeUi, updateUi } from '../../ui-store'
import { getVisibleDialogs } from '../../ui-store/utils'
import { tabbed } from '../tabbed'

/**
 * constant for all pane css classes
 */
const PANE_CSS_CLASSES = [{
  displayName: 'General',
  id: 'general-pane',
}, {
  displayName: 'Social Networks',
  id: 'social-pane',

}, {
  displayName: 'Publish settings',
  id: 'publish-pane',
}, {
  displayName: 'Fonts',
  id: 'fonts-pane',
}, {
  displayName: 'Data sources',
  id: 'data-sources-pane',
}]

///////////////////
// API for the outside world
let settingsDialog: SettingsDialog
function initSettingsDialog() {
  settingsDialog = settingsDialog || new SettingsDialog(getUiElements().settingsDialog)
  return settingsDialog
}

export function openSettingsDialog(opt_cbk?: (() => any), opt_paneCssClass?: string) {
  initSettingsDialog()
  return settingsDialog.open(opt_cbk, opt_paneCssClass)
}

/**
 * the Silex SettingsDialog class
 * TODO: make this only methods and write tests
 */
class SettingsDialog {
  /**
   * store the mobile checkbox
   */
  mobileCheckbox: HTMLInputElement = null

  onClose: (() => any) = null

  // navigation
  fontList: HTMLElement
  dataSourcesList: HTMLElement

  // make this a dialog
  modalDialog: any

  unsub: () => void = null

  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(protected element: HTMLElement) {
    // tabbed behavior
    subscribeUi(() => {
      const [currentToolbox] = getVisibleDialogs('settings')
      const rightPane: HTMLElement = element.querySelector('.right-pane')
      Array.from(rightPane.querySelectorAll('.on'))
      .forEach((el) => el.classList.remove('on'))
      const pane = rightPane.querySelector('.' + currentToolbox.id)
      if(pane) {
        pane.classList.add('on')
      } else {
        // could be a pane added by a plugin
        console.warn('Error in settings dialog: no pane found with ID')
      }
    })
    // add the tabs to the store
    const ui = getUi()
    updateUi({
      ...ui,
      dialogs: ui.dialogs.concat(
        PANE_CSS_CLASSES
        .map(({displayName, id}, idx) => ({
          id,
          type: 'settings',
          visible: idx === 0,
          data: {
            displayName,
            tag: 'li',
          },
        }))
      )
    })
    const leftPaneUl: HTMLElement = element.querySelector('.left-pane ul')
    tabbed(leftPaneUl, 'settings')

    // modal dialog behavior
    this.modalDialog = new ModalDialog({
      name: 'Settings dialog',
      element,
      onOpen: (args) => {
        this.onClose = args.cbk
        if (args.pane) {
          const latest = getUi()
          updateUi({
            ...latest,
            dialogs: latest.dialogs
            .filter(({type}) => type === 'settings')
            .map(dialog => ({
              ...dialog,
              visible: dialog.id === args.pane,
            }))
          })
        }
        this.unsub = subscribeSite(() => this.redraw())
        this.redraw()
      },
      onClose: () => {
        if (this.unsub) {
          this.unsub()
        }
        // notify the caller of this dialog
        if (this.onClose) {
          this.onClose()
        }
      },
    })

    // input text fields
    this.bindTextField(
      '.general-pane .input-title',
      (v) => updateSite({
        ...getSite(),
        title: v,
      }))
    this.bindTextField(
      '.general-pane .input-lang',
      (v) => updateSite({
        ...getSite(),
        lang: v,
      }))
    this.bindTextField(
      '.general-pane .input-site-width',
      (v) => updateSite({
        ...getSite(),
        width: !!v ? parseInt(v) : null,
      }))
    this.bindTextField(
      '.social-pane .input-title',
      (v) => updateSite({
        ...getSite(),
        titleSocial: v,
      }))
    this.bindTextField(
      '.general-pane .input-description',
      (v) => updateSite({
        ...getSite(),
        description: v,
      }))
    this.bindTextField(
      '.social-pane .input-description',
      (v) =>
          updateSite({
            ...getSite(),
            descriptionSocial: v,
          }))
    this.bindTextField(
      '.social-pane .input-twitter',
      (v) => updateSite({
        ...getSite(),
        twitterSocial: v,
      }))
    this.bindTextField(
      '.general-pane .input-favicon-path',
      (v) => updateSite({
        ...getSite(),
        faviconPath: v,
      }))
    this.bindTextField(
      '.social-pane .input-image-path',
      (v) =>
          updateSite({
            ...getSite(),
            thumbnailSocialPath: v,
          }))
    this.bindTextField('.publish-pane .input-publication-path', (v) => this.updatePublicationPath({path: v}))
    this.bindTextField('.publish-pane .input-publication-service', (v) => this.updatePublicationPath({service: v}))
    this.bindTextField('.publish-pane .input-website-url', (v) => {
      if (v === '') {
        v = null
      }
      updateSite({
        ...getSite(),
        websiteUrl: v,
      })
    })

    // image path browse button
    this.bindBrowseButton('.general-pane .browse-favicon-path', () => {
      FileExplorer.getInstance().openFile(FileExplorer.IMAGE_EXTENSIONS)
      .then((fileInfo) => {
        if (fileInfo) {
          // set the new favicon path
          updateSite({
            ...getSite(),
            faviconPath: fileInfo.absPath,
          })
          this.open()
        }
      })
      .catch((error) => {
        Notification.notifyError(
            'Error: I could not select the favicon. <br /><br />' +
            (error.message || ''))
      })
    })

    this.bindBrowseButton('.publish-pane .browse-publication-path', () => {
      FileExplorer.getInstance().openFolder()
      .then((fileInfo) => {
        if (fileInfo) {
          // set the new publication path
          updateSite({
            ...getSite(),
            publicationPath: fileInfo,
          })
          this.open()
        }
      })
      .catch((error) => {
          Notification.notifyError(
              'Error: I could not select the publication path. <br /><br />' +
              (error.message || ''))
      })
    })

    // build UI
    this.mobileCheckbox = this.element.querySelector('.mobile-check')
    this.mobileCheckbox.addEventListener('click', () => {
      updateSite({
        ...getSite(),
        enableMobile: this.mobileCheckbox.checked,
      })
    }, false)

    // fill the options of the service selector
    CloudStorage.getInstance().ready(() => {
      CloudStorage.getInstance().getServices((services) => {
        const select = this.element.querySelector(
            '.publish-pane .input-publication-service')
        select.innerHTML = ''
        services.forEach((service) => {
          const option = document.createElement('option')
          option.value = service.name
          option.innerHTML = service.displayName || service.name
          select.appendChild(option)
        })
      })
    });

    // add data source button
    (this.element.querySelector('.pane.data-sources-pane .add-data-source-btn') as HTMLElement).onclick = (e) => this.addDataSource();
    (this.element.querySelector('.pane.data-sources-pane .reload-data-sources-btn') as HTMLElement).onclick = (e) => updateSite({
      ...getSite(),
      dataSources: {
        ...getSite().dataSources, // simply update with the same data to reload in observer
      },
    })
    this.dataSourcesList = this.element.querySelector('.data-sources-list') as HTMLElement
    this.dataSourcesList.onclick = (e) => {
      const el = (e.target as HTMLElement)
      if (el.classList.contains('del-btn')) {
        const idx = el.getAttribute('data-idx')
        const site = getSite()
        const dataSources = { ...site.dataSources }
        delete dataSources[idx]
        updateSite({
          ...site,
          dataSources,
        })
      } else {
        if (el.classList.contains('edit-btn')) {
          const idx = el.getAttribute('data-idx')
          const site = getSite()
          this.editDataSource(idx, site.dataSources[idx], (newName, dataSource) => {
            const dataSources = { ...site.dataSources }
            dataSources[newName] = dataSource
            if (newName !== idx) { delete dataSources[idx] }
            updateSite({
              ...site,
              dataSources,
            })
          })
        }
      }
    }
    // font button
    (this.element.querySelector('.pane.fonts-pane .add-font-btn') as HTMLElement).onclick = (e) => this.addFont()
    this.fontList = this.element.querySelector('.fonts-list') as HTMLElement
    this.fontList.onclick = (e) => {
      const el = (e.target as HTMLElement)
      if (el.classList.contains('del-btn')) {
        const idx = parseInt(el.getAttribute('data-idx'), 10)
        const fonts = getSite().fonts
        const newFonts = fonts.slice()
        newFonts.splice(idx, 1)
        updateSite({
          ...getSite(),
          fonts: newFonts,
        })
      } else {
        if (el.classList.contains('edit-btn')) {
          const idx = parseInt(el.getAttribute('data-idx'), 10)
          const fonts = getSite().fonts
          this.editFont(fonts[idx], (font) => {
            const newFonts = fonts.slice()
            newFonts[idx] = font
            updateSite({
              ...getSite(),
              fonts: newFonts,
            })
          })
        }
      }
    }
  }

  /**
   * open the given pane
   * adds the desired pane class + '-visible' to this.element
   */
  openPane(paneCssClass: string) {
    this.element.classList.add(paneCssClass + '-visible')
    // change the selection in case it is not from a user click
    const input = this.element.querySelector(`#settings-${paneCssClass}`) as HTMLInputElement
    input.checked = true
  }

  /**
   * binds an input element with a callback
   */
  bindTextField(cssSelector: string, cbk: (p1: string) => any) {
    const input = this.element.querySelector(cssSelector) as HTMLInputElement
    if (!input) {
      throw new Error(
          'Settings panel error: could not find the element to bind.')
    }
    input.onkeyup = (e) => {
      cbk(input.value)
    }
  }

  /**
   * binds a button element with a callback
   */
  bindBrowseButton(cssSelector: string, cbk: () => any) {
    const btn = this.element.querySelector(cssSelector)
    if (!btn) {
      throw new Error(
          'Settings panel error: could not find the element to bind.')
    }
    btn.addEventListener('click', () => {
      cbk()
    }, false)
  }

  /**
   * set the value to the input element
   * @see silex.model.Head
   */
  setInputValue(cssSelector: string, opt_value?: string) {
    const input = this.element.querySelector(cssSelector) as HTMLInputElement
    if (opt_value) {
      if (opt_value !== input.value) input.value = opt_value
    } else {
      if (input.value !== '') input.value = ''
    }
  }

  /**
   * set the pubication path to display
   * @see silex.model.Head
   * @param fileInfo   the publication path
   */
  setPublicationPath(fileInfo?: FileInfo) {
    if (fileInfo != null ) {
      // set input tags the values
      this.setInputValue('.publish-pane .input-publication-service', fileInfo.service)
      this.setInputValue('.publish-pane .input-publication-path', fileInfo.path)

      // display the UI with publication path set
      this.element.classList.remove('publication-path-not-set')
    } else {
      this.setInputValue('.publish-pane .input-publication-service', '')
      this.setInputValue('.publish-pane .input-publication-path', '')

      // display the "not set" UI
      this.element.classList.add('publication-path-not-set')
    }
  }

  /**
   * open settings dialog
   * @param opt_cbk   callback to be called when the user closes the dialog
   * @param opt_paneCssClass   css class of the pane to open
   */
  open(opt_cbk?: (() => any), opt_paneCssClass?: string) {
    this.modalDialog.open({cbk: opt_cbk, pane: opt_paneCssClass})
  }

  /**
   * redraw the dialog
   */
  redraw() {
    const site = getSite()

    this.fontList.innerHTML = this.getFontList(getSite().fonts)
    this.dataSourcesList.innerHTML = this.getDataSourcesList(site.dataSources)

    this.setPublicationPath(site.publicationPath)
    this.mobileCheckbox.checked = site.enableMobile

    this.setInputValue('.general-pane .input-favicon-path', site.faviconPath)
    this.setInputValue('.publish-pane .input-website-url', site.websiteUrl)
    this.setInputValue('.general-pane .input-site-width', site.width.toString())
    this.setInputValue('.general-pane .input-title', site.title)
    this.setInputValue('.general-pane .input-lang', site.lang)
    this.setInputValue('.general-pane .input-description', site.description)
    this.setInputValue('.social-pane .input-twitter', site.twitterSocial)
    this.setInputValue('.social-pane .input-description', site.descriptionSocial)
    this.setInputValue('.social-pane .input-title', site.titleSocial)
    this.setInputValue('.social-pane .input-image-path', site.thumbnailSocialPath)
  }
  getDataSourcesList(dataSources: DataSources) {
    return '<ul>' +
        Object.keys(dataSources)
            .map((name, idx) => {
              const dataSource = dataSources[name]
              const htmlEntityP = document.createElement('p')
              htmlEntityP.textContent = dataSource.data ? JSON.stringify(dataSource.data) : ''
              return `<li>
        <div class="ui">
          <button class="edit-btn fa fa-pencil" title="Edit this data source" data-idx="${name}"></button>
          <button class="del-btn" title="Remove this data source" data-idx="${name}"></button>
        </div>
        <div class="content">
          <h3>${ name } &nbsp<small>(${ dataSource.data ? Object.keys(dataSource.data).length + ' elements' : 'loading data...' })</small></h3>
          <p>${ dataSource.href }</p>
          <pre>${ htmlEntityP.innerHTML }</pre>
        </div>
      </li>`
            })
            .join('') +
        '</ul>'
  }

  addDataSource() {
    this.editDataSource('My photos', {href: 'https://jsonplaceholder.typicode.com/photos', root: ''},
        (name, dataSource) => {
          const dataSources = { ...getSite().dataSources }
          if (dataSources[name]) {
            console.warn('This data source already exists in this website')
            Notification.alert('Error', 'This data source already exists in this website', () => {})
          } else {
            dataSources[name] = dataSource
            updateSite({
              ...getSite(),
              dataSources,
            })
          }
        })
  }

  editDataSource(oldName: string, dataSource: DataSource, cbk: (name: string, dataSource: DataSource) => void) {
    Notification.prompt('Edit Data Source',
      'What is the URL of your data source?',
      dataSource.href, 'https://jsonplaceholder.typicode.com/photos', (ok, href) => {
        if (ok) {
          Notification.prompt('Edit Data Source',
            'What is the name of your data source?',
            oldName, 'My photos', (_ok, name) => {
              if (_ok) {
                Notification.prompt('Edit Data Source',
                  'What is the root of your data source?',
                  dataSource.root, '', (__ok, root) => {
                    if (__ok) {
                      cbk(name, {href, root})
                    }
                  },
                )
              }
            },
          )
        }
      },
    )
  }

  getFontList(fonts: Font[]) {
    return '<ul>' +
        fonts
            .map((font, idx) => {
              const iframeContent = encodeURIComponent(`
        <link href="${font.href}" rel="stylesheet">
        <style>
          body {
            width: 100%;
            font-family: ${font.family};
            color: white;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
          }
        </style>
        <span style="font-size:14px;">${font.family}</span> -&nbsp;
        <span style="font-size:28px;">${font.family}</span> -&nbsp;
        <span style="font-size:56px;">${font.family}</span>
      `)
              return `<li>
        <div class="ui">
          <button class="edit-btn fa fa-pencil" title="Edit this font" data-idx="${idx}"></button>
          <button class="del-btn" title="Remove this font" data-idx="${idx}"></button>
        </div>
        <div class="content">
          <iframe src="data:text/html,${iframeContent}"></iframe>
        </div>
      </li>`
            })
            .join('') +
        '</ul>'
  }  addFont() {
    this.editFont(
        {
          href: 'https://fonts.googleapis.com/css?family=Roboto',
          family: '\'Roboto\', sans-serif',
        },
        (newFont) => {
          const fonts = getSite().fonts
          if (!!fonts.find((font: Font) => font.href === newFont.href && font.family === newFont.family)) {
            console.warn('This font is already embedded in this website')
          } else {
            updateSite({
              ...getSite(),
              fonts: fonts.concat(newFont),
            })
          }
        })
  }

  editFont(font, cbk) {
    Notification.prompt('Edit font',
      'What is the CSS stylesheet for your font, e.g. https://fonts.googleapis.com/css?family=Roboto',
      font.href, 'https://fonts.googleapis.com/css?family=Roboto', (ok, href) => {
        if (ok) {
          Notification.prompt('Edit font',
            'What is the name of your font, e.g. \'Roboto\', sans-serif',
            font.family, '\'Roboto\', sans-serif', (_ok, family) => {
              if (_ok) {
                cbk(({family, href} as Font))
              }
            },
          )
        }
      },
    )
  }

  /**
   * close editor
   * this is private method, do not call it
   */
  close() {
    this.modalDialog.close()
  }

  private updatePublicationPath(updateObj: any) {
    const fileInfo = getSite().publicationPath
    const fileInfoNew = Url.updateFileInfo(fileInfo, updateObj)
    updateSite({
      ...getSite(),
      publicationPath: fileInfoNew,
    })
  }
}
