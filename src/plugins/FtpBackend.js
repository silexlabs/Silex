const JsFTP = require('jsftp');
const { Readable } = require('stream');

module.exports = class FtpStorage {
  name = 'ftp'

  constructor(opts = {}) {
    this.options = {
      rootPath: '/.silex',
      authorizeURL: '/authorize/ftp/',
      ...opts,
    }
  }

  async getClient({host, user = 'anonymous', pass = 'anonymous', port = 21, secure = false}) {
    return new Promise((resolve, reject) => {
      const ftp = new JsFTP({
        host,
        port,
        user,
        pass,
      });

      ftp.on('error', (err) => {
        reject(err);
      });

      ftp.on('connect', () => {
        resolve(ftp)
      })
    })
  }


  async getAuthorizeURL(session) {
    return this.options.authorizeURL
  }

  async setAuthToken(session, token) {
    session.ftp = token
  }

  async login(session, userData) {
    return this.setAuthToken(session, userData)
  }

  async logout(session) {
    session.ftp = null
  }

  async getAdminUrl(session, id) {
    throw new Error('TODO: not implemented.')
  }

  async init(session, id) {
    throw new Error('TODO: not implemented.')
  }


  async readFile(session, id, path) {
    return new Promise((resolve, reject) => {
      this.getClient(session)
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
    const ftp = await this.getClient(session)
    return Promise.all(
      files.map((file) =>
        new Promise((resolve, reject) => {
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
    const ftp = await this.getClient(session)
    await Promise.all(
      paths.map((path) =>
        new Promise((resolve, reject) => {
          ftp.raw.dele(`${this.options.rootPath}/${id}${path}`, (err) => {
            if (err) {
              return reject(err)
            }
            resolve();
          });
        })
      )
    );
  }

  async listDir(session, id, path) {
    const ftp = await this.getClient(session)
    return new Promise((resolve, reject) => {
      ftp.ls(`${this.options.rootPath}/${id}${path}`, (err, res) => {
        if (err) {
          return reject(err);
        }
        const fileNames = res.map((file) => file.name);
        resolve(fileNames);
      });
    });
  }

  async createDir(session, id, path) {
    const ftp = await this.getClient(session)
    return new Promise((resolve, reject) => {
      ftp.raw.mkd(`${this.options.rootPath}/${id}${path}`, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  async deleteDir(session, id, path) {
    const ftp = await this.getClient(session)
    return new Promise((resolve, reject) => {
      ftp.raw.rmd(`${this.options.rootPath}/${id}${path}`, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
}
