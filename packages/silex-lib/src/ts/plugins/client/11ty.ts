import { ClientConfig } from '../../client/config'
import { ClientSideFile, ClientSideFileWithContent } from '../../types'

interface PluginOptions {
  html: {
    url: string,
    path: string,
  },
  css: {
    url: string,
    path: string,
  },
  assets: {
    url: string,
    path: string,
  },
}

export default (config: ClientConfig, opts: Partial<PluginOptions>) => {
  const options = {
    ...opts,
    html: {
      url: '/',
      path: './',
      ...opts.html,
    },
    css: {
      url: '/css', // For the HTML links
      path: './css', // For the file system
      permalink: '/css', // For the frontmatter
      ...opts.css,
    },
    assets: {
      url: '/',
      path: './', // assets is already in the assets urls
      ...opts.assets,
    },
  }

  config.addPublicationTransformers({
    transformPermalink: (path, type) => {
      switch (type) {
      case 'html':
        console.log('Silex: transform path for 11ty', path, options.html.url + path)
        return options.html.url + path
      case 'css':
        console.log('Silex: transform path for 11ty', path, options.css.url + path.replace(/\.css$/, '.css.liquid'))
        return options.css.url + path
          .replace(/^\/css/, '')
          .replace(/\.css.liquid$/, '.css')
      case 'asset':
        console.log('Silex: transform path for 11ty', path, options.assets.url + path)
        return options.assets.url + path
      }
      throw new Error(`Unknown file type ${type}`)
    },
    transformPath: (path, type) => {
      switch (type) {
      case 'html':
        return options.html.path + path
      case 'css':
        const res = options.css.path + path
          // Remove default path
          .replace(/^\/css/, '')
          // Change extension
          .replace(/\.css$/, '.css.liquid')
        return res
      case 'asset':
        return options.assets.path + path
          // Remove default path
          .replace(/^\/assets/, '')
      }
      throw new Error(`Unknown file type ${type}`)
    },
    transformFile: (file: ClientSideFile) => {
      const fileWithContent = file as ClientSideFileWithContent
      switch (file.type) {
      case 'html':
        return {
          ...file,
          //path: options.html.path + fileWithContent.path,
          //content: `---\npermalink: ${options.html.url}${fileWithContent.path}\n---\n${fileWithContent.content}`
        }
      case 'css':
        const path = fileWithContent.path
          // Remove extension added in transformPath (options.css.path)
          .replace(new RegExp(`^${options.css.path}`), '')
          // Remove path added in transformPath (options.css.path)
          .replace(/\.css\.liquid$/, '.css')
        return {
          ...file,
          //path: options.css.path + fileWithContent.path.replace(/\.css$/, '.css.liquid'),
          content: `---\npermalink: ${options.css.permalink}${path}\n---\n${fileWithContent.content}`
        }
      case 'asset':
        return {
          ...file,
          //path: options.assets.path + fileWithContent.path,
        }
      }
      throw new Error(`Unknown file type ${file.type}`)
    },
  })
}
