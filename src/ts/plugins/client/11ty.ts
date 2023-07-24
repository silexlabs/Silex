import { Page } from "grapesjs";
import { ClientConfig } from "../../client/config";
import { ClientSideFile, ClientSideFileWithContent } from "../../types";

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
      url: '/css',
      path: './css',
      ...opts.css,
    },
    assets: {
      url: '/assets',
      path: './', // assets is already in the assets urls
      ...opts.assets,
    },
  }

  config.addPublicationTransformers({
    transformFile: (file: ClientSideFile, page: Page) => {
      const fileWithContent = file as ClientSideFileWithContent
      console.log('Silex: transform file for 11ty', fileWithContent)
      switch (file.type) {
        case 'html':
          return {
            ...file,
            path: options.html.path + fileWithContent.path,
            //content: `---\npermalink: ${options.html.url}${fileWithContent.path}\n---\n${fileWithContent.content}`
          }
        case 'css':
          return {
            ...file,
            path: options.css.path + fileWithContent.path.replace(/\.css$/, '.css.liquid'),
            content: `---\npermalink: ${options.css.url}${fileWithContent.path}\n---\n${fileWithContent.content}`
          }
        case 'asset':
          return {
            ...file,
            path: options.assets.path + fileWithContent.path,
          }
      }
      throw new Error(`Unknown file type ${file.type}`)
    },
    renderComponent: (c, toHtml) => {
      if (c.get('type') === 'image') {
        // Concat the paths, handles the trailing and leading slashes
        const publishedUrl = path => `${options.assets.url.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
        const src = c.get('src')
        c.set('src', publishedUrl(src))
        const html = toHtml()
        console.log('Silex: transform component for 11ty', publishedUrl, html)
        c.set('src', src)
        return html
      }
    },
    renderCssRule(c, getStyle) {
      const publishedUrl = path => `${options.assets.url.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
      const url = getStyle()['background-image']
      const bgUrl = url?.match(/url\('(.*)'\)/)?.pop()
      if (bgUrl) {
        return {
          ...getStyle(),
          'background-image': `url('${publishedUrl(bgUrl)}')`,
        }
      }
    }
  })
}
