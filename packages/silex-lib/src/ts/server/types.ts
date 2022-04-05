export interface Config {
  debug: boolean
  port: string
  url: string
  sessionSecret: string
  apiPath: string
  sslOptions: SslOptions
  staticOptions: StaticOptions
}

export interface SslOptions {
  forceHttps: boolean
  trustXFPHeader: boolean
  privateKey: string
  certificate: string
  sslPort: string
}

export type StaticOptions = {
  routes: Array<{
    path?: string
    route?: string
    module?: string
  }>
}

