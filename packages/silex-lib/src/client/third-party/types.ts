/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

/**
 * @fileoverview Type definitions. Cross platform, it needs to run client and server side
 *
 */

// FIXME: choose between path and folder + name, remove absPath
// This comes from Cloud Explorer
export interface FileInfo {
  path: string,
  service: string,
  name: string,
  isDir: boolean,
  mime: string,
  absPath: string,
  folder?: string,
  size?: number,
  modified?: string,
}
