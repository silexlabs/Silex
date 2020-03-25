import { ElementType, ElementData, LinkType } from '../src/client/element/types'
import { crudIdKey } from '../src/client/flux/crud-store'
import { PageData } from '../src/client/page/types';
import { SiteData } from '../src/client/site/types';

export function mockUiElements(): HTMLIFrameElement {
  const iframe: HTMLIFrameElement = document.createElement('iframe')
  document.body.appendChild(iframe)

  // fake ui elements
  jest.doMock('../src/client/ui/UiElements', () => ({
    getSiteDocument: () => iframe.contentDocument,
    getSiteWindow: () => iframe.contentWindow,
    getUiElements: () => ({
      stage: iframe,
      fileExplorer: iframe.contentDocument.body,
      contextMenu: iframe.contentDocument.body,
      menu: iframe.contentDocument.body,
      breadCrumbs: iframe.contentDocument.body,
      pageTool: iframe.contentDocument.body,
      htmlEditor: iframe.contentDocument.body,
      cssEditor: iframe.contentDocument.body,
      jsEditor: iframe.contentDocument.body,
      settingsDialog: iframe.contentDocument.body,
      dashboard: iframe.contentDocument.body,
      propertyTool: iframe.contentDocument.body,
      textFormatBar: iframe.contentDocument.body,
      workspace: iframe.contentDocument.body,
      verticalSplitter: iframe.contentDocument.body,
    }),
  }))

  return iframe
}

let nextId = 0;
function getNextId() { return 'testId' + (nextId++) }
export const ELEM_TEXT: ElementData = {
  [crudIdKey]: Symbol(),
  id: getNextId(),
  pageNames: [],
  classList: [],
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
  innerHtml: 'SOME CONTENT ELEM1',
}

export const ELEM_IMAGE: ElementData = {
  ...ELEM_TEXT,
  [crudIdKey]: Symbol(),
  id: getNextId(),
  type: ElementType.IMAGE,
  innerHtml: '',
}

export const ELEM_HTML: ElementData = {
  ...ELEM_TEXT,
  [crudIdKey]: Symbol(),
  id: getNextId(),
  type: ElementType.HTML,
  innerHtml: '',
}

export const ELEM_CONTAINER: ElementData = {
  ...ELEM_TEXT,
  [crudIdKey]: Symbol(),
  id: getNextId(),
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
  [crudIdKey]: Symbol(),
  id: getNextId(),
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
  [crudIdKey]: Symbol(),
  id: getNextId(),
  type: ElementType.SECTION,
  isSectionContent: false,
  innerHtml: '',
  children: [ELEM_SECTION_CONTENT.id],
  style: {
    desktop: {},
    mobile: {},
  },
}

export const PAGE1 = {
  [crudIdKey]: Symbol(),
  id: 'page-1',
  displayName: 'Page 1',
  element: document.createElement('a'),
  link: {
    type: LinkType.PAGE,
    value: '#!page-page-1',
  },
  idx: 0,
  opened: false,
  canDelete: true,
  canProperties: true,
  canMove: true,
  canRename: true,
}

export const PAGE2 = {
  [crudIdKey]: Symbol(),
  id: 'page-2',
  displayName: 'Page 2',
  element: document.createElement('a'),
  link: {
    type: LinkType.PAGE,
    value: '#!page-page-2',
  },
  idx: 1,
  opened: false,
  canDelete: true,
  canProperties: true,
  canMove: true,
  canRename: true,
}
export const PAGE3 = {
  [crudIdKey]: Symbol(),
  id: 'page-3',
  displayName: 'Page 3',
  element: document.createElement('a'),
  link: {
    type: LinkType.PAGE,
    value: '#!page-page-3',
  },
  idx: 2,
  opened: false,
  canDelete: true,
  canProperties: true,
  canMove: true,
  canRename: true,
}

export const SITE1: SiteData = {
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
    'test-component': [{
      'script': [{
          'src': 'https://code.jquery.com/jquery-2.1.4.min.js'
      }],
      'link': [{
          'rel': 'stylesheet',
          'href': 'https://cdnjs.cloudflare.com/ajax/libs/unslider/2.0.3/css/unslider.css'
      }]
  }]
  }
}
