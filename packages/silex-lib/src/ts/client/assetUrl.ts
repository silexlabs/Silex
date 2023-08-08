import { API_PATH, API_WEBSITE_ASSET_READ, API_WEBSITE_PATH } from '../constants'
import { Asset, ClientSideFileType, Component, ConnectorId, Page, Style, WebsiteId } from '../types'

/**
 * @fileoverview Helpers to manage assets URL
 * Assets URLs are stored on storage in their "stored version": `/assets/image.webp`
 * But the client side uses the "display version": `/api/website/assets/image.webp?websiteId=47868975&connectorId=gitlab`
 * After loading the site data we convert all URLs to the client side version
 * Before saving the site data we convert all URLs to the storage version
 * During publicationn we convert all URLs to the storage version and back
 */

// Get the base URL where Silex is served
const baseUrl = window.location.pathname.replace(/\/$/, '')

// Orging and path, should we use config.rootUrl?
const SERVER_URL = window.location.origin + baseUrl

/**
 * Function to convert a path from it stored version to the displayed version
 * Stored version is like `/assets/image.webp`
 * Grapesjs version is like `/api/website/assets/image.webp?websiteId=47868975&connectorId=gitlab`
 * Exported for unit tests
 */
export function storedToDisplayed(path: string, websiteId: WebsiteId, storageId: ConnectorId): string {
  // Check the path is a stored path
  if (path.startsWith('/assets')) {
    const url = new URL(path, SERVER_URL)
    url.pathname = url.pathname.replace(/^\/assets/, '')
    url.pathname = `${baseUrl}${API_PATH}${API_WEBSITE_PATH}${API_WEBSITE_ASSET_READ}${url.pathname}`
    url.searchParams.set('websiteId', websiteId)
    url.searchParams.set('connectorId', storageId)
    const encodedPath = '/' + url.toString() // add a leading slash
      .replace(new RegExp(`^${SERVER_URL}`), '')
      .replace(/^\//, '') // remove the first slash if it exists
    return decodeURIComponent(encodedPath)
  } else {
    console.error('storedToDisplayed: path is not a stored path', path)
    return path
  }
}

/**
 * Function to convert a path from the one we give to grapesjs to the stored version
 * Grapesjs version is like `/api/website/assets/image.webp?websiteId=47868975&connectorId=gitlab`
 * Stored version is like `/assets/image.webp`
 * @param path the path to convert
 * @returns the converted path
 * Exported for unit tests
 */
export function displayedToStored(path: string): string {
  // The path to the assets API
  const apiPath = `${baseUrl}${API_PATH}${API_WEBSITE_PATH}${API_WEBSITE_ASSET_READ}`
  // Check the path is a displayed path
  if (path.startsWith(apiPath)) {
    const url = new URL(path, SERVER_URL)
    url.pathname = url.pathname.replace(new RegExp(`^${apiPath}`), '')
    url.pathname = `/assets${url.pathname}`
    url.searchParams.delete('websiteId')
    url.searchParams.delete('connectorId')
    const encodedPath = '/' + url.toString() // add a leading slash
      .replace(new RegExp(`^${SERVER_URL}`), '')
      .replace(/^\//, '') // remove the first slash if it exists
    return decodeURIComponent(encodedPath)
  } else {
    console.error('displayedToStored: path is not a displayed path', path)
    return path
  }
}

/**
 * Publication transformer to convert the asset URL during publication
 */
export const assetsPublicationTransformer = {
  transformPath(path: string, type: ClientSideFileType): string {
    if(type === ClientSideFileType.ASSET) {
      const result = displayedToStored(path)
      return result
    }
    return undefined
  },
  transformPermalink(path: string, type: ClientSideFileType): string {
    if(type === ClientSideFileType.ASSET) {
      const result = displayedToStored(path)
      return result
    }
    return undefined
  },
}

/**
 * Update asset URL to use the current storage connector and website ID
 * Assets URLs are stored in the project data in the form `/assets/image.webp`
 * This function adds the API path and the connectorId and websiteId like so: `/api/website/assets/image.webp?websiteId=47868975&connectorId=gitlab`
 */
export function addTempDataToAssetUrl(assets: Asset[], websiteId: WebsiteId, storageId: ConnectorId): Asset[] {
  return assets.map((asset: Asset) => {
    return asset.src ? {
      ...asset,
      src: storedToDisplayed(asset.src, websiteId, storageId),
    } : asset
  })
}

/**
 * Remove the temporary data from the asset URL
 * Remove the API path and the connectorId and websiteId like so: `/assets/image.webp`
 */
export function removeTempDataFromAssetUrl(assets: Asset[]): Asset[] {
  return assets.map((asset: Asset) => {
    // Return the asset with the new URL
    return asset.src ? {
      ...asset,
      src: displayedToStored(asset.src),
    } : asset
  })
}

/**
 * Reucrsive function to update the asset URL in the components
 */
function addTempDataToComponents(component: Component, websiteId: WebsiteId, storageId: ConnectorId): Component {
  // Update the asset URL in the component
  const newComponent = component.attributes?.src ? {
    ...component,
    attributes: {
      ...component.attributes,
      src: storedToDisplayed(component.attributes.src, websiteId, storageId),
    },
  } : component
  // Update the asset URL in the children
  if (newComponent.components) {
    newComponent.components = newComponent.components.map((childComponent: Component) => {
      return addTempDataToComponents(childComponent, websiteId, storageId)
    })
  }
  return newComponent
}

/**
 * Reucrsive function to update the asset URL in the components
 */
function removeTempDataFromComponents(component: Component): Component {
  // Update the asset URL in the component
  const newComponent = component.attributes?.src ? {
    ...component,
    attributes: {
      ...component.attributes,
      src: displayedToStored(component.attributes.src),
    },
  } : component
  // Update the asset URL in the children
  if (newComponent.components) {
    newComponent.components = newComponent.components.map((childComponent: Component) => {
      return removeTempDataFromComponents(childComponent)
    })
  }
  return newComponent
}

/**
 * Add temp data to pages
 */
export function addTempDataToPages(pages: Page[], websiteId: WebsiteId, storageId: ConnectorId): Page[] {
  return pages.map((page: Page) => {
    return {
      ...page,
      frames: page.frames.map(frame => ({
        ...frame,
        component: addTempDataToComponents(frame.component, websiteId, storageId),
      }))
    }
  })
}

/**
 * Remove temp data from asset URL in the components
 */
export function removeTempDataFromPages(pages: Page[]): Page[] {
  return pages.map((page: Page) => {
    return {
      ...page,
      frames: page.frames.map(frame => ({
        ...frame,
        component: removeTempDataFromComponents(frame.component),
      }))
    }
  })
}

/**
 * Add data to stylesheets
 */
export function addTempDataToStyles(styles: Style[], websiteId: WebsiteId, storageId: ConnectorId): Style[] {
  const pattern = /url\((["']?)([^"']+?)\1\)/g
  return styles.map((style: Style) => {
    if (style.style && style.style['background-image']) {
      const urls = [...style.style['background-image'].matchAll(pattern)].map(match => storedToDisplayed(match[2], websiteId, storageId))
      return {
        ...style,
        style: {
          ...style.style,
          'background-image': urls.map(url => `url('${url}')`).join(', '),
        },
      }
    }
    return style
  })
}

/**
 * Remove temp data from stylesheets
 */
export function removeTempDataFromStyles(styles: Style[]): Style[] {
  const pattern = /url\((["']?)([^"']+?)\1\)/g
  return styles.map((style: Style) => {
    if (style.style && style.style['background-image']) {
      const urls = [...style.style['background-image'].matchAll(pattern)].map(match => displayedToStored(match[2]))
      return {
        ...style,
        style: {
          ...style.style,
          'background-image': urls.map(url => `url('${url}')`).join(', '),
        },
      }
    }
    return style
  })
}
