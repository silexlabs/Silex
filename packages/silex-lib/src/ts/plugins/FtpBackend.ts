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

import JsFTP from 'jsftp'
import { Readable } from 'stream'
import express from 'express'
import {Backend} from '../server/backends'

function formHtml({ host = null, user = null, pass = null, port = null, secure = null, id = null }, err = '') {
  return `
    ${ err && `<div class="error">${err || ''}</div>` }
    <form method="post">
      <label for="host">Host</label>
      <input type="text" name="host" value="${host || ''}" />
      <label for="user">User</label>
      <input type="text" name="user" value="${user || ''}" />
      <label for="pass">Pass</label>
      <input type="password" name="pass" value="${pass || ''}" />
      <label for="port">Port</label>
      <input type="number" name="port" value="${port || '21'}" />
      <label for="secure">Secure</label>
      <input type="checkbox" name="secure" value="true" ${secure ? 'checked' : ''} />
      <label for="id">Path where to publish</label>
      <input type="text" name="id" value="${id || ''}" />
      <button type="submit">Login</button>
    </form>
  `
}

const formCss = `
  body {
    font-family: Arial, sans-serif;
    background-color: #f2f2f2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
  }

  form {
    background-color: #ffffff;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    width: 400px;
    max-width: 100%;
  }

  label {
    display: block;
    font-weight: bold;
    margin-top: 20px;
  }

  input[type="text"], input[type="password"], input[type="number"] {
    width: 100%;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ddd;
    box-sizing: border-box;
  }

  input[type="checkbox"] {
    margin-top: 10px;
  }

  button {
    display: block;
    background-color: #007BFF;
    color: #fff;
    border-radius: 5px;
    border: none;
    padding: 10px 20px;
    margin-top: 20px;
    cursor: pointer;
    font-size: 16px;
    width: 100%;
  }

  button:hover {
    background-color: #0056b3;
  }
  .error {
    color: red;
    margin: 10px;
  }
`

export default class FtpBackend implements Backend {
  id = 'ftp'
  displayName = 'Ftp'
  icon = 'ftp'
  options

  constructor(opts = {}) {
    this.options = {
      rootPath: '/.silex',
      authorizeURL: '/api/authorize/ftp/',
      authorizePath: '/api/authorize/ftp/',
      ...opts,
    }
  }

  async getClient({host, user, pass, port, secure}): Promise<any> {
    console.log('FTP login', { host, user, pass, port, secure })
    return new Promise((resolve, reject) => {
      const ftp = new JsFTP({
        host,
        port,
        user,
        pass,
      })

      ftp['on']('error', (err) => {
        console.error('FTP error', err)
        reject(err)
      })

      ftp['on']('connect', () => {
        console.log('FTP connected')
        resolve(ftp)
      })
    })
  }

  async isLoggedIn(session) {
    try {
      await this.checkAuth(session)
    } catch(err) {
      return false
    }
    return true
  }

  async checkAuth({host, user, pass, port, secure}) {
    const ftp = await this.getClient({ host, user, pass, port, secure })
    const result = await ftp.raw('noop')
    console.log('FTP auth success', result)
  }

  async addAuthRoutes(router) {
    router.post(this.options.authorizePath, express.urlencoded(), async (req, res) => {
      const { session } = req
      const { redirect } = req.query
      const { host, user, pass, port, secure = false, id = '/' } = req.body
      try {
        console.log('FTP auth', { host, user, pass, port, secure, id })
        await this.checkAuth({ host, user, pass, port, secure })
        await this.setAuthToken(session, { host, user, pass, port, secure })
        req.session.ftp = { host, user, pass, port, secure }
        res
        //.sendStatus(200)
        //.send(`FTP auth success, you can close this window`)
          .redirect(`${redirect}?backendId=${encodeURIComponent(this.id)}&icon=${encodeURIComponent(this.icon)}&id=${encodeURIComponent(id)}`)
      } catch(err) {
        console.error('FTP auth failed', err.message)
        res
          .status(403)
          .redirect(`${this.options.authorizeURL}?error=${encodeURIComponent(err.message)}`)
      }
    })
    router.get(this.options.authorizePath, async (req, res) => {
      const { session } = req
      const { redirect } = req.query
      // Check if the user is already logged in
      const { host, user, pass, port, secure, id = '/' } = session?.ftp ?? {}
      if(host && user && pass && port && secure) {
        try {
          await this.checkAuth({ host, user, pass, port, secure })
          res
            .sendStatus(200)
          //.send(`FTP auth success, you can close this window`)
            .redirect(redirect)
          return
        } catch(err) {
          // TODO: check if the error is a 403
          console.log('User not logged in yet, let\'s display the login form', err.message)
        }
      }
      // If not, display the login page
      res.send(`
        <html>
          <head>
            <title>FTP auth</title>
            <style>
              ${formCss}
            </style>
          </head>
          <body>
            ${ formHtml({ host, user, pass, port, secure, id }, req.query.error) }
          </body>
        </html>
      `)
    })
  }

  async getAuthorizeURL(session) {
    return this.options.authorizeURL
  }

  async setAuthToken(session, token) {
    session.ftp = token
  }

  async login(session, userData): Promise<void> {
    await this.checkAuth(userData)
    await this.setAuthToken(session, userData)
  }

  async logout(session) {
    session.ftp = null
  }

  async getAdminUrl(session, id) {
    throw new Error('TODO: not implemented.')
    return ''
  }

  async init(session, id) {
    throw new Error('TODO: not implemented.')
  }


  async readFile(session, id, path) {
    return new Promise((resolve, reject) => {
      this.getClient(session.ftp)
        .then(ftp => {
          ftp.get(
            `${this.options.rootPath}/${id}${path}`,
            (err, socket) => {
              if (err) {
                return reject(err)
              }
              resolve({
                path,
                content: Readable.from(socket),
              })
              socket.resume()
            })
        })
        .catch(reject)
    })
  }

  async writeFiles(session, id, files) {
    console.log('writeFiles', id, files, session)
    const ftp = await this.getClient(session.ftp)
    return Promise.all(
      files.map((file) =>
        new Promise<void>((resolve, reject) => {
          const content = typeof file.content === 'string' ? Buffer.from(file.content) : file.content
          ftp.put(content, `${this.options.rootPath}/${id}${file.path}`, (err) => {
            if (err) {
              return reject(err)
            }
            resolve()
          })
        })
      )
    )
  }

  async deleteFiles(session, id, paths) {
    const ftp = await this.getClient(session.ftp)
    await Promise.all(
      paths.map((path) =>
        new Promise<void>((resolve, reject) => {
          ftp.raw.dele(`${this.options.rootPath}/${id}${path}`, (err) => {
            if (err) {
              return reject(err)
            }
            resolve()
          })
        })
      )
    )
  }

  async listDir(session, id, path) {
    const ftp = await this.getClient(session.ftp)
    return new Promise((resolve, reject) => {
      ftp.ls(`${this.options.rootPath}/${id}${path}`, (err, res) => {
        if (err) {
          return reject(err)
        }
        const fileNames = res.map((file) => file.name)
        resolve(fileNames)
      })
    })
  }

  async createDir(session, id, path) {
    const ftp = await this.getClient(session.ftp)
    return new Promise<void>((resolve, reject) => {
      ftp.raw.mkd(`${this.options.rootPath}/${id}${path}`, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  async deleteDir(session, id, path) {
    const ftp = await this.getClient(session.ftp)
    return new Promise<void>((resolve, reject) => {
      ftp.raw.rmd(`${this.options.rootPath}/${id}${path}`, (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  async getFileUrl(session, id, path) {
    return `${session.ftp.url}/${id}${path}`
  }

  async getPublicationStatusUrl(session, id) {
    return `/status/ftp/${id}`
  }

}
