import { ElementType, ElementData, LinkType } from '../client/element-store/types'
import { PageData } from '../client/page-store/types'
import { SiteState } from '../client/site-store/types'

export function mockForAllTests() {
  jest.doMock('../../../../node_modules/sortablejs/modular/sortable.core.esm.js', () => jest.fn())
}

export function mockUiElements(): {siteIFrame: HTMLIFrameElement, uiIFrame: HTMLIFrameElement} {
  const uiIFrame: HTMLIFrameElement = document.createElement('iframe')
  document.body.appendChild(uiIFrame)

  // fake ui elements
  jest.doMock('../client/ui-store/UiElements', () => ({
    getSiteDocument: () => uiIFrame.contentDocument,
    getSiteWindow: () => uiIFrame.contentWindow,
    getUiElements: () => ({
      stage: uiIFrame,
      fileExplorer: uiIFrame.contentDocument.body,
      contextMenu: uiIFrame.contentDocument.body,
      menu: uiIFrame.contentDocument.body,
      breadCrumbs: uiIFrame.contentDocument.body,
      pageTool: uiIFrame.contentDocument.body,
      htmlEditor: uiIFrame.contentDocument.body,
      cssEditor: uiIFrame.contentDocument.body,
      jsEditor: uiIFrame.contentDocument.body,
      settingsDialog: uiIFrame.contentDocument.body,
      dashboard: uiIFrame.contentDocument.body,
      propertyTool: uiIFrame.contentDocument.body,
      textFormatBar: uiIFrame.contentDocument.body,
      workspace: uiIFrame.contentDocument.body,
      verticalSplitter: uiIFrame.contentDocument.body,
    }),
  }))


  const siteIFrame: HTMLIFrameElement = document.createElement('iframe')
  document.body.appendChild(siteIFrame)
  jest.doMock('../client/components/SiteFrame', () => ({
    getSiteWindow: () => siteIFrame.contentWindow,
    getSiteDocument: () => siteIFrame.contentDocument,
    getSiteIFrame: () => siteIFrame,
  }))

  return { uiIFrame, siteIFrame }
}

let nextId = 0
function getNextId(label='') { return 'testId' + (nextId++) + label }
export const ELEM_TEXT: ElementData = {
  id: getNextId('Text'),
  pageNames: [],
  classList: [],
  attr: {},
  tagName: 'DIV',
  type: ElementType.TEXT,
  enableEdit: true,
  isSectionContent: false,
  children: [],
  alt: null,
  title: 'test title',
  link: null,
  enableDrag: true,
  enableDrop: false,
  enableResize: {
    top: true,
    bottom: true,
    left: true,
    right: true,
  },
  selected: false,
  useMinHeight: true,
  visibility: {
    desktop: true,
    mobile: true,
  },
  style: {
    desktop: {
      top: '0px',
      left: '0px',
      width: '100px',
      height: '100px',
    },
    mobile: {},
  },
  data: {
    component: null,
  },
  innerHtml: 'SOME TEXT CONTENT',
}

export const ELEM_IMAGE: ElementData = {
  ...ELEM_TEXT,
  id: getNextId('Image'),
  type: ElementType.IMAGE,
  useMinHeight: false,
  innerHtml: '',
}

export const ELEM_HTML: ElementData = {
  ...ELEM_TEXT,
  id: getNextId('Html'),
  type: ElementType.HTML,
  innerHtml: '',
}

export const ELEM_CONTAINER: ElementData = {
  ...ELEM_TEXT,
  id: getNextId('Container'),
  type: ElementType.CONTAINER,
  innerHtml: '',
  children: [ELEM_TEXT.id, ELEM_IMAGE.id, ELEM_HTML.id],
  style: {
    ...ELEM_TEXT.style,
    desktop: {
      top: '10px',
      left: '10px',
      width: '1000px',
      height: '1000px',
    },
    mobile: {
      height: '900px',
    },
  },
}

export const ELEM_CONTAINER_2_CHILDREN: ElementData = {
  ...ELEM_CONTAINER,
  children: [ELEM_TEXT.id, ELEM_IMAGE.id],
}

export const ELEM_SECTION_CONTENT: ElementData = {
  ...ELEM_CONTAINER,
  id: getNextId('SectionContent'),
  type: ElementType.CONTAINER,
  isSectionContent: true,
  innerHtml: '',
  children: [ELEM_CONTAINER.id],
  style: {
    desktop: {
      height: '500px',
    },
    mobile: {},
  },
}

export const ELEM_SECTION: ElementData = {
  ...ELEM_SECTION_CONTENT,
  id: getNextId('Section'),
  tagName: 'SECTION',
  type: ElementType.SECTION,
  isSectionContent: false,
  innerHtml: '',
  children: [ELEM_SECTION_CONTENT.id],
  style: {
    desktop: {},
    mobile: {},
  },
}

export const PAGE1: PageData = {
  id: 'page-page-1',
  displayName: 'Page 1',
  link: {
    linkType: LinkType.PAGE,
    href: '#!page-page-1',
  },
  canDelete: true,
  canProperties: true,
  canMove: true,
  canRename: true,
}

export const PAGE2: PageData = {
  id: 'page-page-2',
  displayName: 'Page 2',
  link: {
    linkType: LinkType.PAGE,
    href: '#!page-page-2',
  },
  canDelete: true,
  canProperties: true,
  canMove: true,
  canRename: true,
}
export const PAGE3: PageData = {
  id: 'page-page-3',
  displayName: 'Page 3',
  link: {
    linkType: LinkType.PAGE,
    href: '#!page-page-3',
  },
  canDelete: true,
  canProperties: true,
  canMove: true,
  canRename: true,
}

export const SITE1: SiteState = {
  headUser: 'headUser',
  headStyle: 'headStyle',
  headScript: 'headScript',
  title: 'title',
  description: 'description',
  isTemplate: false,
  enableMobile: true,
  publicationPath: null,
  websiteUrl: 'websiteUrl',
  faviconPath: 'faviconPath',
  thumbnailSocialPath: 'thumbnailSocialPath',
  descriptionSocial: 'descriptionSocial',
  titleSocial: 'titleSocial',
  lang: 'lang',
  width: 1000,
  hostingProvider: 'hostingProvider',
  twitterSocial: 'twitterSocial',
  dataSources: {},
  fonts: [],
  data: {},
  styles: {
    'all-style': {
      'className': 'all-style',
      'templateName': 'text',
      'displayName': 'All style',
      'styles': {
        'desktop': {
          'normal': {
            'className': 'all-style',
            'pseudoClass': 'normal',
            'All': {
              'font-family': '\'Roboto\', sans-serif'
            }
          }
        }
      }
    }
  },
  file: null,
  prodotypeDependencies: {
    'script': [{
        'src': 'https://code.jquery.com/jquery-2.1.4.min.js'
    }],
    'link': [{
        'rel': 'stylesheet',
        'href': 'https://cdnjs.cloudflare.com/ajax/libs/unslider/2.0.3/css/unslider.css'
    }]
  }
}
