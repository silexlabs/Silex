[![status of silex.me instance](https://monitoshi.lexoyo.me/badge/1525963562293-6552)](https://editor.silex.me)

![Silex UI](https://github.com/silexlabs/www.silex.me/raw/gh-pages/assets/silex-ui.gif)

Brought to you by [Alex Hoyau](https://www.patreon.com/lexoyo) and [Silex contributors](https://github.com/silexlabs/Silex/graphs/contributors).

You can help make Silex sustainable by being part of the community, contributing documentation or making a financial contribution. [Let's chat - every little bit helps!](https://github.com/silexlabs/Silex/discussions)

## About Silex, live web creation.

Silex is a no-code tool for building websites. It also lets you code when needed. It can be used online, offline or in a JAMStack project.

Silex lets you create websites without coding, but it also has built-in editors for HTML, CSS, and JavaScript for when you need more control. It is used by freelancers and web studios to make real websites for real clients. Also Silex can generate templates or be integrated in a nodejs project, it has a plugin system and can integrate with headleass CMS and static site generators, it is part of the JSAMStack ecosystem since the v3.

Useful links

* [Official website](https://www.silex.me/)
* [Road map (please help defining tasks and prioritising)](https://github.com/orgs/silexlabs/projects/1/views/7)
* [Bug report in Github issues](https://github.com/silexlabs/Silex/issues)
* [Forums in Github discussions](https://github.com/silexlabs/Silex/discussions)
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

#### Using npx

```bash
npx @silexlabs/silex
```

This command will run Silex with the entry point being `src/ts/server/cli.ts`.

#### Using Docker

```bash
docker run -p 6805:6805 silexlabs/silex
```

This command will run Silex in a Docker container with the entry point being `src/ts/server/index.ts`.

#### Using npm

First, install Silex as a dev dependency in your project:

```bash
npm install --save-dev @silexlabs/silex
```

Then, you can run Silex with the `silex` command. The entry point is `src/ts/server/cli.ts`.

## Configuration

You can configure Silex using environment variables and command-line options. All available options can be found in `src/ts/server/cli.ts`.

There are config files (same as plugins) in the `examples/` folder. To start Silex locally with these config:

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

