import { invoke } from '@tauri-apps/api/core'

export interface Website {
  websiteId: string
  name: string
  imageUrl?: string
  updatedAt?: string
  repoUrl?: string
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/website${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message ?? response.statusText)
  return data
}

// Tauri rejects with the error of the command as it is, a plain string for most of ours
const call = <T>(command: string, args: Record<string, unknown>) =>
  invoke<T>(command, args).catch((error: unknown) => {
    throw typeof error === 'string' ? new Error(error) : error
  })

export const listWebsites = () => request<Website[]>('GET', '')

export const createWebsite = (name: string) =>
  request<{ websiteId: string }>('PUT', '', { name }).then(({ websiteId }) => websiteId)

export const renameWebsite = (website: Website, name: string) =>
  request('POST', `/meta?websiteId=${encodeURIComponent(website.websiteId)}`, { name, imageUrl: website.imageUrl })

export const duplicateWebsite = (websiteId: string, name: string) =>
  request('POST', `/duplicate?websiteId=${encodeURIComponent(websiteId)}&name=${encodeURIComponent(name)}`)

export interface TemplateNotUsed {
  unreachable: boolean
  message: string
}

export const createWebsiteFromTemplate = (name: string, repoUrl: string) =>
  call<string>('create_website_from_template', { name, repoUrl })

export const trashWebsite = (websiteId: string) => call<void>('trash_website', { websiteId })

export const showWebsiteFolder = (websiteId: string) => call<void>('show_website_folder', { websiteId })

// The editor keeps the path of the file in the website, as it does for any image of the website
export function thumbnailOf(website: Website) {
  const { imageUrl, websiteId } = website
  if (!imageUrl?.startsWith('/assets/')) return imageUrl ?? ''
  return `/api/website${imageUrl}?websiteId=${encodeURIComponent(websiteId)}`
}

// A website no integration looks after has a file:// link, which says nothing to the user
export function hostOf(website: Website) {
  try {
    const url = new URL(website.repoUrl ?? '')
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.host : ''
  } catch {
    return ''
  }
}
