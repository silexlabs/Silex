/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Readable } from 'stream'

/**
 * @fileoverview define types for Silex backends
 * Bakends can provide storage for website data and assets, and/or hosting to publish the website online
 */

/**
 * Files are stored in backend as a File object
 */
export interface File {
  path: string,
  content: string | Readable,
}

/**
 * Backends are the base interface for Storage and Hosting providers
 * 
 */
export interface Backend {
  name: string
  getAuthorizeURL(session: any): Promise<string>
  setAuthToken(session: any, token: any): Promise<void>
  login(session: any): Promise<void>
  logout(session: any): Promise<void>
  getAdminUrl(session: any, id: string): Promise<string>
  init(session: any, id: string): Promise<void>
}

/**
 * Storage are used to store the website data and assets
 * And possibly rename files and directories, and get the URL of a file
 * 
 */
export interface Storage extends Backend {
  readFile(session: any, id: string, path: string): Promise<File>
  writeFiles(session: any, id: string, files: File[]): Promise<void>
  deleteFiles(session: any, id: string, paths: string[]): Promise<void>
  listDir(session: any, id: string, path: string): Promise<string[]>
  createDir(session: any, id: string, path: string): Promise<void>
  deleteDir(session: any, id: string, path: string): Promise<void>
}

/**
 * Hosting providers are used to publish the website
 */
export interface HostingProvider extends Backend {
  publish(session: any, id: string): Promise<void>
}
