[![status of silex.me instance](https://monitoshi.lexoyo.me/badge/1525963562293-6552)](https://v3.silex.me)

![Silex UI](https://github.com/silexlabs/www.silex.me/raw/gh-pages/assets/silex-ui.gif)

Brought to you by [Alex Hoyau](https://lexoyo.me) and [Silex contributors](https://github.com/silexlabs/Silex/graphs/contributors).

Help make Silex sustainable by being [part of the community](https://community.silex.me/), [contributing documentation](https://docs.silex.me/), [making a financial contribution](https://opencollective.com/silex), [report bugs](https://github.com/silexlabs/Silex/issues).

## Silex

Silex is a no-code tool for building websites. It also lets you code when needed. It can be used online, offline or in a JAMStack project.

Silex lets you create websites without coding, but it also has built-in editors for HTML, CSS, and JavaScript for when you need more control. It is used by freelancers and web studios to make real websites for real clients. Also Silex can generate templates or be integrated in a nodejs project, it has a plugin system and can integrate with headleass CMS and static site generators, it is part of the JSAMStack ecosystem since the v3.

Useful links

* [Official website](https://www.silex.me/)
* [Road map (please help defining tasks and prioritising)](https://roadmap.silex.me)
* [Bug report in Github issues](https://github.com/silexlabs/Silex/issues)
* [Forums in Github discussions](https://community.silex.me)
* [Silex meta package with more source code](https://github.com/silexlabs/silex-meta)

Here are the main features of Silex website builder:

* Free and Open Source, open to contributions
* Visual Editor: Silex offers a visual editor that allows users to create websites without needing to write code. It supports drag-and-drop functionality for easy website creation.
* Online CSS Editor: Alongside the visual editor, Silex also provides an online CSS editor for more advanced customization.
* Static HTML Websites: Silex is designed to create static HTML websites, which are fast, secure, and easy to host.
* SEO Features: Silex includes SEO features to help improve the visibility of websites on search engines.
* Editor UI: Silex offers features like fonts, visual CSS editor, publication...
* Self-hosting Option: Users can choose to host their Silex website builder on their own server.
* Community Support: Being an open-source project, Silex has a community of developers who contribute to its development and provide support.
* Silex v3 > Silex is based on [GrapesJs](https://grapesjs.com/)
* Silex v2 > Sync with Dropbox and FTP: Users can sync their Silex projects with Dropbox and FTP, allowing for easy access and management of files.
* Silex v2 > Templates: Silex comes with a growing number of templates (both free and paid) that users can use as a starting point for their websites.

## Getting Started

### Online Version

The easiest way to start using Silex is by using the online version provided by [Silex Labs foundation](https://www.silexlabs.org). Simply visit [editor.silex.me](https://editor.silex.me) and start building your website right away.

### Desktop App (beta)

There is a desktop application that you can install on your computer which may be faster since it uses your local files and it works offline. You can download the desktop app from the [Silex desktop  repository](https://github.com/silexlabs/silex-desktop/releases/latest).

### Local or Server Installation

You can also run Silex locally or on your server using `npx`, `npm`, or `Docker`.

Check the [developer docs](https://docs.silex.me/en/dev) for configuration options and integration with your js projects.

#### Using npx

```bash
npx @silexlabs/silex
```

This command will run Silex with default config.

#### Using Docker

```bash
docker run -p 6805:6805 silexlabs/silex
```

This command will run Silex in a Docker container.

#### Using npm

First, install Silex as a dev dependency in your project:

```bash
npm install --save-dev @silexlabs/silex
```

Then, you can run Silex with the `silex` command in your `package.json` scripts:

```json
{
  "scripts": {
    "start": "silex"
  }
}
```

## Configuration

You can configure Silex using environment variables and command-line options. All available options can be found in the [developer docs](https://docs.silex.me/en/dev) as well as in the code: [`src/ts/server/cli.ts`](./src/ts/server/cli.ts).

Check the example config files - which are the same as plugins in Silex, in the [`examples/`](./examples/) folder. To test these configs, start Silex locally like this:

```sh
$ npx silex --client-config=./examples/client-config-transformers.js --server-config=`pwd`/examples/server-config-plugins.js 
```

Or like this:

```sh
$ SILEX_CLIENT_CONFIG=./examples/client-config-transformers.js SILEX_SERVER_CONFIG=`pwd`/examples/server-config-plugins.js npm run start:debug
```

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) for details on how to contribute to Silex.

## License

Silex is free and open-source software licensed under the [GPL-3.0](LICENSE.md).

## Dependencies

The upstream projects we use in Silex are all listed in [Silex meta package](https://github.com/silexlabs/silex-meta)

## Github stars history

[![Star History Chart](https://api.star-history.com/svg?repos=silexlabs/Silex&type=Timeline)](https://star-history.com/#silexlabs/Silex&Timeline)

