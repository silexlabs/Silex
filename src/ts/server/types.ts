import { URL } from 'url'

import { Config } from './ServerConfig'
import { FileInfo } from '../client/io/CloudStorage'
import { PersistantData } from '../client/store/types'
import { Provider, VHost } from '../client/site-store/types'

export interface HostingProvider {
  getOptions: (session: any) => Provider,
  beforeWrite?: (context: PublishContext, actions: any[]) => any[],
  finalizePublication?: (context: PublishContext, onStatus: (msg: string) => void) => Promise<void>,
  getDefaultPageFileName?: (context: PublishContext, data: PersistantData) => string,
  getPermalink?: (context: PublishContext) => string,
  getHtmlFolder?: (context: PublishContext, default_: string) => string,
  getJsFolder?: (context: PublishContext, default_: string) => string,
  getCssFolder?: (context: PublishContext, default_: string) => string,
  getAssetsFolder?: (context: PublishContext, default_: string) => string,
  getVhosts?: (session: any) => Promise<VHost[]>,
  getVhostData?: (session: any, name: string) => Promise<VHostData>,
  setVhostData?: (session: any, name: string, data: VHostData) => Promise<void>,
  getRootUrl?: (context: PublishContext, baseUrl: URL) => string,
}

export interface VHostData {
  domain: string,
  url?: string,
  status?: string,
}

export interface PublishContext {
  from: FileInfo,
  to: FileInfo,
  url: string,
  session: object,
  cookies: object,
  hostingProvider: HostingProvider,
  config: Config,
}
