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
const SERVER_URL = window.location.origin

/**
 * Function to convert a path from it stored version to the displayed version
 * Stored version is like `/assets/image.webp`
 * Grapesjs version is like `/api/website/assets/image.webp?websiteId=47868975&connectorId=gitlab`
 * Exported for unit tests
 */
export function storedToDisplayed(path: string, websiteId: WebsiteId, storageId: ConnectorId): string {
  // Check the path is a stored path
  if (path.startsWith('/assets')) {
    // Make an absolute URL
    const url = new URL(path, SERVER_URL)
    // Remove the assets folder as it is part of the saved path
    url.pathname = url.pathname.replace(/^\/assets/, '')
    // Add the API path and the connectorId and websiteId
    url.pathname = `${baseUrl}${API_PATH}${API_WEBSITE_PATH}${API_WEBSITE_ASSET_READ}${url.pathname}`
    // Add the GET params
    url.searchParams.set('websiteId', websiteId)
    url.searchParams.set('connectorId', storageId || '')
    // Back to a relative URL, keep the path but not the origin
    return `${decodeURIComponent(url.pathname)}${url.search}`
    //const encodedPath = '/' + url.toString() // add a leading slash
    //  .replace(new RegExp(`^${SERVER_URL}`), '')
    //  .replace(/^\//, '') // remove the first slash if it exists
    //return decodeURIComponent(encodedPath)
  } else {
    if(path.startsWith('<svg') || path.startsWith('data:image')) {
      // SVG or data URL
      return path
    }
    // Not a stored path, is there a problem?
    console.warn('storedToDisplayed: path is not a stored path', path)
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
    url.pathname = `${baseUrl}/assets${url.pathname}`
    url.searchParams.delete('websiteId')
    url.searchParams.delete('connectorId')
    const encodedPath = '/' + url.toString() // add a leading slash
      .replace(new RegExp(`^${SERVER_URL}${baseUrl}`), '')
      .replace(/^\//, '') // remove the first slash if it exists
    return decodeURIComponent(encodedPath)
  } else {
    if(path.startsWith('<svg') || path.startsWith('data:image')) {
      // SVG or data URL
      return path
    }
    console.warn('displayedToStored: path is not a displayed path', path)
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
 * Add data to stylesheets
 *   e.g. linear-gradient(to right, #1fb101 0%, #df1313 67%, rgba(234, 97, 97, 255) 78%, white 100%), url('/assets/qIg7JPRc.webp'), linear-gradient(#0ca311 0%, #0ca311 100%)
 */
export function addTempDataToStyles(styles: Style[], websiteId: WebsiteId, storageId: ConnectorId): Style[] {
  const regex = new RegExp(/(.*)(url\((["']?)([^"']+?)\1\))*(.*)/, 'g')

  return styles.map((style: Style) => {
    if (style.style && style.style['background-image']) {
      const bgImage = style.style['background-image']
        .replace(/url\((['"]?)([^'"]+)\1\)/g, (match, quote, url) => {
          return `url(${quote}${storedToDisplayed(url, websiteId, storageId)}${quote})`
        })
      return {
        ...style,
        style: {
          ...style.style,
          'background-image': bgImage,
        },
      }
    }
    return style
  })
}

/**
 * Remove temp data from stylesheets
 * The property `background-image` contains the URLs of the assets and other values,
 *   e.g. `linear-gradient(to right, #1fb101 0%, #df1313 67%, rgba(234, 97, 97, 255) 78%, white 100%), url('/api/website/assets/qIg7JPRc.webp?websiteId=default&connectorId=fs-storage'), linear-gradient(#0ca311 0%, #0ca311 100%)`
 */
export function removeTempDataFromStyles(styles: Style[]): Style[] {
  const pattern = /url\((["']?)([^"']+?)\1\)/g
  return styles.map((style: Style) => {
    if (style.style && style.style['background-image']) {
      const bgImage = style.style['background-image']
        .replace(/url\((['"]?)([^'"]+)\1\)/g, (match, quote, url) => {
          return `url(${quote}${displayedToStored(url)}${quote})`
        })
      return {
        ...style,
        style: {
          ...style.style,
          'background-image': bgImage,
        },
      }
    }
    return style
  })
}
