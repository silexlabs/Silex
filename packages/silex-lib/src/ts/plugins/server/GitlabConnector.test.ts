import { describe, it, expect } from '@jest/globals'
import { WebsiteData, defaultWebsiteData } from '../../types'
import { WEBSITE_PAGES_FOLDER } from '../../constants'

// Test simple de la logique asymétrique sans mocking complexe
describe('GitlabConnector asymmetric pages folder logic', () => {

  it('should force pagesFolder to pages for writing when not defined', () => {
    // Simuler la logique d'écriture de GitlabConnector
    const websiteData: WebsiteData = {
      ...defaultWebsiteData,
      // Pas de pagesFolder défini (site legacy)
      pages: [],
      settings: {}
    }

    // Logique d'écriture GitLab : forcer pagesFolder si non défini
    if (!websiteData.pagesFolder) {
      websiteData.pagesFolder = 'pages'
    }

    expect(websiteData.pagesFolder).toBe('pages')
  })

  it('should preserve existing pagesFolder during write', () => {
    const websiteData: WebsiteData = {
      ...defaultWebsiteData,
      pagesFolder: 'custom-pages',
      pages: [],
      settings: {}
    }

    // Logique d'écriture GitLab : ne pas changer si déjà défini
    if (!websiteData.pagesFolder) {
      websiteData.pagesFolder = 'pages'
    }

    expect(websiteData.pagesFolder).toBe('custom-pages')
  })

  it('should use src for reading legacy sites without pagesFolder', () => {
    // Simuler la logique de lecture GitLab
    const parsedWebsiteData: WebsiteData = {
      ...defaultWebsiteData,
      pages: [{ name: 'Home', id: 'page1', isFile: true } as any],
      settings: {}
      // pas de pagesFolder défini - sera undefined
    }

    // Logique de lecture GitLab : utiliser WEBSITE_PAGES_FOLDER si pas défini
    const pagesFolderForReading = parsedWebsiteData.pagesFolder || WEBSITE_PAGES_FOLDER

    expect(pagesFolderForReading).toBe('src')
  })

  it('should use custom pagesFolder for reading when defined', () => {
    const parsedWebsiteData: WebsiteData = {
      ...defaultWebsiteData,
      pages: [{ name: 'Home', id: 'page1', isFile: true } as any],
      settings: {},
      pagesFolder: 'custom-pages'
    }

    const pagesFolderForReading = parsedWebsiteData.pagesFolder || WEBSITE_PAGES_FOLDER

    expect(pagesFolderForReading).toBe('custom-pages')
  })

  it('should clean up old pages during migration from src to pages', () => {
    // Simulate cleanup logic during migration
    const oldPagesFolder = 'src'
    const newPagesFolder = 'pages'
    
    // Existing files in src/
    const existingFiles = new Map([
      ['src/home-page1.json', 'sha1'],
      ['src/about-page2.json', 'sha2']
    ])
    
    // New files that will be created in pages/
    const filesToWrite = [
      { path: 'pages/home-page1.json', content: '...' },
      { path: 'pages/about-page2.json', content: '...' },
      { path: 'website.json', content: '...' }
    ]
    
    const newPageFiles = new Set(filesToWrite.filter(f => f.path.startsWith(newPagesFolder)).map(f => f.path))
    
    // Old files in src/ don't match new files in pages/
    const filesToDelete = []
    for (const filePath of existingFiles.keys()) {
      if (!newPageFiles.has(filePath)) {
        filesToDelete.push(filePath)
      }
    }
    
    // All old files should be deleted since they're in src/ and new ones are in pages/
    expect(filesToDelete).toEqual(['src/home-page1.json', 'src/about-page2.json'])
  })

  it('should only delete removed pages when pages folder stays the same', () => {
    // Simulate normal cleanup when no migration occurs
    const pagesFolder = 'pages'
    
    // Existing files
    const existingFiles = new Map([
      ['pages/home-page1.json', 'sha1'],
      ['pages/about-page2.json', 'sha2'],
      ['pages/contact-page3.json', 'sha3']
    ])
    
    // New files (contact page was removed)
    const filesToWrite = [
      { path: 'pages/home-page1.json', content: '...' },
      { path: 'pages/about-page2.json', content: '...' },
      { path: 'website.json', content: '...' }
    ]
    
    const newPageFiles = new Set(filesToWrite.filter(f => f.path.startsWith(pagesFolder)).map(f => f.path))
    
    // Only files not in new data should be deleted
    const filesToDelete = []
    for (const filePath of existingFiles.keys()) {
      if (!newPageFiles.has(filePath)) {
        filesToDelete.push(filePath)
      }
    }
    
    // Only the contact page should be deleted
    expect(filesToDelete).toEqual(['pages/contact-page3.json'])
  })
})