[![Repository's starts](https://img.shields.io/github/stars/silexlabs/Silex?colorA=2c2837&colorB=c9cbff&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/stargazers)
[![Issues](https://img.shields.io/github/issues-raw/silexlabs/Silex?colorA=2c2837&colorB=f2cdcd&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/issues)
[![License](https://img.shields.io/github/license/silexlabs/Silex?colorA=2c2837&colorB=b5e8e0&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/blob/main/LICENSE)
[![Latest commit](https://img.shields.io/github/last-commit/silexlabs/Silex/main?colorA=2c2837&colorB=ddb6f2&style=for-the-badge&logo=starship)](https://github.com/silexlabs/Silex/commits/main)


## Silex meta repo

Silex is a no-code tool for building websites. It also lets you code when needed. It can be used online, offline or in a JAMStack project.

Silex lets you create websites without coding, but it also has built-in editors for HTML, CSS, and JavaScript for when you need more control. It is used by freelancers and web studios to make real websites for real clients. Also Silex can generate templates or be integrated in a nodejs ilproject, it has a plugin system and can integrate with headleass CMS and static site generators, it is part of the JSAMStack ecosystem since the v3.

![Silex UI](https://github.com/silexlabs/www.silex.me/raw/gh-pages/assets/silex-ui.gif)

Brought to you by [Alex Hoyau](https://lexoyo.me) and [Silex contributors](https://github.com/silexlabs/silex-lib/graphs/contributors).

Silex is free/libre software, users are expected to help make Silex sustainable by being [part of the community](https://community.silex.me/), [contributing documentation](https://docs.silex.me/), [making a financial contribution](https://opencollective.com/silex), [report bugs](https://github.com/silexlabs/Silex/issues).

Useful links

* [User docs](https://docs.silex.me/en/user/selectors)
* [Official website](https://www.silex.me/)
* [Road map (please help defining tasks and prioritising)](https://roadmap.silex.me)
* [Bug report in Github issues](https://github.com/silexlabs/Silex/issues)
* [Forums in Github discussions](https://community.silex.me)
* [Silex meta package with more source code](https://github.com/silexlabs/Silex)

Here are the main features of Silex website builder:

* Free and Open Source, open to contributions
* Visual Editor: Silex offers a visual editor that allows users to create websites without needing to write code. It supports drag-and-drop functionality for easy website creation.
* Online CSS Editor: Alongside the visual editor, Silex also provides an online CSS editor for more advanced customization.
* Static HTML Websites: Silex is designed to create static HTML websites, which are fast, secure, and easy to host.
* SEO Features: Silex includes SEO features to help improve the visibility of websites on search engines.
* Editor UI: Silex offers features like fonts, visual CSS editor, publication...
* Self-hosting Option: Users can choose to host Silex website builder on their own server, using docker, nodejs or helpers for [Caprover](https://caprover.com/), [Yunohost](https://yunohost.org/), [Elest.io](https://elest.io/)
* Community Support: Being an open-source project, Silex has a community of developers who contribute to its development and provide support.
* Silex v3 > Silex is based on [GrapesJs](https://grapesjs.com/)
* Silex v2 > Sync with Dropbox and FTP: Users can sync their Silex projects with Dropbox and FTP, allowing for easy access and management of files.
* Silex v2 > Templates: Silex comes with a growing number of templates (both free and paid) that users can use as a starting point for their websites.

## About this repo

This is a meta repository for Silex website builder.

It includes all projects needed for Silex development as git submodules. This is the repo you need to contribute to Silex, many of the repositories are dependencies of each other so use this meta repo and benefit from using [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) or [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces).

To execute a command in every package, use `git submodule foreach 'command'` or `npm run exec -- 'command'` or `scripts/exec.js 'command'`.

## Included repositories in this meta repo

> Leave the line bellow as it is used in the doc script to insert content in the readme
>
> Auto generated submodules

# Silex packages

| Name | Directory | Repo | Description |
| ---- | --------- | ---- | ----------- |
| @silexlabs/sitemapgen | `packages/SitemapGen` | `git@github.com:silexlabs/SitemapGen.git` | Generate a`sitemap.xml` from a static site generator (SSG) output directory. |
| Silex Puter Plugin | `packages/silex-puter` | `git@github.com:silexlabs/silex-puter.git` | The **Silex Puter Plugin** brings Silex’s professional website-building capabilities to the Puter environment, letting users create, save, and publish static websites directly in Puter. This plugin enables seamless integration, making it easier than ever to use Silex within Puter for web design and content management. |
| Silex plugins | `packages/silex-plugins` | `git@github.com:silexlabs/silex-plugins.git` | Environment agnostic (node.js, browser, commonjs, esnext...) open architecture (plugin system) inspired by 11ty.dev config |
| Silex Plugin Starter | `packages/silex-plugin-starter` | `git@github.com:silexlabs/silex-plugin-starter.git` | A good place to start writing a Silex plugin. It supports server and/or client side plugins, in Javascript and TypeScript. Check [Silex developer docs if you need help](https://docs.silex.me/en/dev) or [join the discussions in the forum](https://community.silex.me/) |
| Silex Platform by Silex Labs | `packages/silex-platform` | `git@github.com:silexlabs/silex-platform.git` | This is also a good example on how to customize Silex. And it has a Dockerfile for easy deployment. |
| Silex core library | `packages/silex-lib` | `git@github.com:silexlabs/silex-lib.git` | This repository is the core library of Silex, it is a nodejs server which serves the Silex editor and the websites created with Silex. The core library is used in the online version of Silex, in the desktop app, and in the nodejs integration. It is available as a npx cli, as a docker image, and as a npm/nodejs library. |
| Silex desktop (v2) | `packages/silex-desktop` | `git@github.com:silexlabs/silex-desktop.git` | This is the official [Silex](https://www.silex.me) desktop version, an installable application for Windows, MacOS and linux. |
| Silex Dashboard | `packages/silex-dashboard` | `git@github.com:silexlabs/silex-dashboard.git` | Here is the source code of Silex dashboard. It is a [Silex](https://www.silex.me) plugin which can be installed to manage websites you will then edit in Silex. |
| node_modules Path | `packages/node_modules-path` | `git@github.com:lexoyo/node_modules-path.git` | Get the path of the `node_modules` folder in your scripts or CLI or `package.json`. This is useful when you are building a library that can either be used as an npm dependency or directly, [see this question on SO](https://stackoverflow.com/questions/44279838/copy-assets-from-npm). |
| @silexlabs/grapesjs-version-flow | `packages/grapesjs-version-flow` | `git@github.com:silexlabs/grapesjs-version-flow.git` | A GrapesJS plugin for managing version upgrades and migrations with sequential upgrade flow and modal UI |
| Grapesjs Ui Suggest Classes | `packages/grapesjs-ui-suggest-classes` | `git@github.com:silexlabs/grapesjs-ui-suggest-classes.git` | A grapesjs plugin to enable auto-complete of classes in the SelectorManager UI  |
| Grapesjs Tailwind(WIP) | `packages/grapesjs-tailwind` | `git@github.com:silexlabs/grapesjs-tailwind.git` | [DEMO](https://codepen.io/ju99ernaut/pen/BaKGadb) |
| Symbols plugin for GrapesJS | `packages/grapesjs-symbols` | `git@github.com:silexlabs/grapesjs-sympbols.git` | This plugin enables users to create symbols, which are reusable elements, in a page and accross pages |
| Grapesjs Storage Rate Limit | `packages/grapesjs-storage-rate-limit` | `git@github.com:silexlabs/grapesjs-storage-rate-limit.git` | A plugin for GrapesJS that provides rate-limited storage, allowing you to save changes immediately and then cool down for a specified period before saving again. |
| GrapesJs Notifications Plugin | `packages/grapesjs-notifications` | `git@github.com:silexlabs/grapesjs-notifications.git` | Why this plugin? GrapesJs is a powerful framework to build no-code tools and allow users to create templates using a drag-and-drop interface. However, the framework does not offer a standard way of notifying users and each plugin implements its own, which is messy and not user friendly. This plugin provides a centralized notification system that can be used by all plugins to display messages to the user. |
| Grapesjs Loading | `packages/grapesjs-loading` | `git@github.com:silexlabs/grapesjs-loading.git` | Shows a loading bar while the site is loaded or saved. By default it looks like the classic loading bar on top of the page, e.g. on github.com. |
| GrapesJS Keymap Dialog | `packages/grapesjs-keymaps-dialog` | `git@github.com:silexlabs/grapesjs-keymaps-dialog.git` | This GrapesJS plugin implements a floating UI showing the available keymaps for the editor. |
| Grapesjs Fonts | `packages/grapesjs-fonts` | `git@github.com:silexlabs/grapesjs-fonts.git` | Custom Fonts plugin for grapesjs |
| Grapesjs Filter Styles | `packages/grapesjs-filter-styles` | `git@github.com:silexlabs/grapesjs-filter-styles.git` | This plugin adds a search bar in the Style manager so that users can search for a CSS style |
| GrapesJs Data Source plugin | `packages/grapesjs-data-source` | `git@github.com:silexlabs/grapesjs-data-source.git` | This GrapesJS plugin integrates various APIs into the editor, providing powerful data-driven website building capabilities. |
| GrapesJS AI Copilot | `packages/grapesjs-ai-copilot` | `git@github.com:silexlabs/grapesjs-ai-copilot.git` | ![AI Copilot Banner](https://img.shields.io/badge/AI-Copilot-blue?style=for-the-badge) |
| GrapesJS Advanced Selector Manager | `packages/grapesjs-advanced-selector` | `git@github.com:silexlabs/grapesjs-advanced-selector.git` | An advanced selector management plugin for GrapesJS, designed for cases where the default Selector Manager falls short |
| Expression & Popin Form Components | `packages/expression-input` | `git@github.com:silexlabs/expression-input.git` | A set of reusable web components to manage expressions (chains of tokens) and form overlays.   |
| eleventy-plugin-concat | `packages/eleventy-plugin-concat` | `git@github.com:silexlabs/eleventy-plugin-concat.git` | Eleventy plugin to bundle your scripts and styles |


> Auto generated submodules

## Instruction

> For the initial setup, please use yarn instead of npm, as it handles workspaces better. You can use npm after the initial setup.
> For the versionning process, please use npm instead of yarn, as it has not been migrated to yarn yet.

To contribute to Silex you need to fork this repo then clone locally (mini 2CPU and 4GoRAM) this repo with its submodules, make sure you use the required nodejs version (nvm) and install its dependencies (you can replace `npm` with `yarn`):

* On github, fork this repo
* Be sure of your ssh key for gitlab and github configured (we use both for repos)
* Don't forget to verify if nodejs, nvm and npm are installed on your server
* Then clone and setup the project:

```
$ git clone git@github.com:<your github handle>/Silex.git --recurse-submodules -j8
$ cd Silex
$ nvm install # [optional] Get the node version from .nvmrc
$ npm install # Will install dependencies in all submodules too
$ npm start # Will run the Silex editor from packages/silex-lib
```
If needed, add your .env file in <your-install-dir>/Silex/ [Server side options documentation](https://docs.silex.me/en/dev/options#server-side-options) and your server-side config file .<name>.silex.js in <your-install-dir>/Silex/packages/silex-lib/ [Server side configuration documentation](https://docs.silex.me/en/dev/connect#configuring-silex-with-existing-connectors)

Then you can open your browser at [http://localhost:6805](http://localhost:6805) to see the Silex editor running locally.

When you are ready to contribute to a specific library or libraries, you can do the following:

* On github, fork the libraries you intend to contribute to, e.g. `silex-desktop`
* In your local clone of this meta repo, update submodule URLs to point to your own forks of each library, e.g:
  ```sh
  $ cd packages/silex-desktop
  $ git remote set-url origin git@github.com:<your-username>/silex-desktop.git'
  ```
* Sync Changes: Once your contributions are merged into the main library repositories, they will automatically sync with the meta repository when submodules are updated.

Troubleshooting:

If you find your repositories in a strange state, e.g repositories are on commits instead of the main branch, or if your `npm install` fails... You can do this:
```
$ scripts/exec.js "git checkout {{branch}}" # checkout the default branch in all submodules
$ scripts/exec.js "npm install" # install dependencies in all submodules
$ cd packages/Silex && npm run build && cd ../.. # build the Silex editor
```

Useful commands

* Start Silex: `npm start` (or use `npm run start:debug`)
* Release a package (which is in packages/$PACKAGE_NAME) and bump version of a library and all its dependents: `scripts/release-version packages/$PACKAGE_NAME $VERSION`, then you probably want to `git push --follow-tags` the changed packages
* Add a project: `git submodule add $PACKAGE_GIT_URL packages/$PACKAGE_NAME`, then run `npm run doc`
* Update `package-lock.json` for a particular package: `npm i --package-lock-only --workspaces false` in the package directory
* Publish a new version of a package: `npm version --patch && git push --follow-tags` in the package directory

## Third party dependencies

* The excellent [GrapesJs framework](https://grapesjs.com/) used for the front end drag/drop feature
* [Typescript](https://www.typescriptlang.org/) is used to build Silex
* [GLYPHICONS library of icons and symbols](http://glyphicons.com/) ([CC license](http://creativecommons.org/licenses/by/3.0/)) and [fontawesome icons](http://fontawesome.io/)

## Size of Silex code base

This includes all the packages of this repo.

> Auto generated count

```

> silex-meta@1.0.0 count
> cloc packages --exclude-dir node_modules,doc,strapi,test,dist,mock --exclude-ext=md,xml,pug,njk,ini,scss,css,json,svg,yaml,yml,html

     100 files     200 files     300 files     400 files     500 files     600 files     700 files     800 files     900 files     948 text files.
classified 562 filesDuplicate file check 562 files (466 known unique)Unique:      100 files                                          Unique:      200 files                                          Unique:      300 files                                          Unique:      400 files                                               483 unique files.                              
Counting:  100Counting:  200Counting:  300Counting:  400     543 files ignored.

github.com/AlDanial/cloc v 1.96  T=0.95 s (506.7 files/s, 118537.7 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JavaScript                     273           1932           2944          68982
TypeScript                     197           2909           6811          27772
GraphQL                          4            115              6           1002
JSX                              1              0              2            266
Text                             2             32              0             86
Dockerfile                       2             10              7             67
Bourne Shell                     3              8              1             24
liquid                           1              0              0              9
-------------------------------------------------------------------------------
SUM:                           483           5006           9771          98208
-------------------------------------------------------------------------------

```

> Auto generated count

[Cloc's report](https://github.com/AlDanial/cloc) in mar. 2021:

```
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JavaScript                     149           9652          10733          54582
JSON                            55              3              0          52723
TypeScript                     178           2591           4713          21524
HTML                           114          16988            380          16689
CSS                             57           2142           1098          14399
SCSS                            57            881            415           5444
SVG                             17              0              0           4810
LESS                            36            172            203           4039
YAML                            38             18             46           2607
EJS                             28             40              9           1627
JSX                             14            160            109           1406
Markdown                        42            472              0           1067
Pug                             17             54             36            938
Dockerfile                       1              3              3              9
Properties                       1              1              0              1
-------------------------------------------------------------------------------
SUM:                           804          33177          17745         181865
-------------------------------------------------------------------------------
```

[Cloc's report](https://github.com/AlDanial/cloc) in feb 2023:

```
$ cloc packages
     515 text files.
     345 unique files.
     697 files ignored.

github.com/AlDanial/cloc v 1.92  T=1.00 s (345.0 files/s, 212776.0 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JSON                            22              1              0         119875
JavaScript                      62           7190           7805          38240
TypeScript                     142           2035           4067          17106
CSS                             21            594            715           5761
YAML                            23             53             39           2914
LESS                            21            138            159           2234
Markdown                        15            413              0            932
Pug                             14             49             30            899
EJS                              7             35              4            798
HTML                             3             56             12            495
SVG                             13              0              0             96
Dockerfile                       2              9              9             13
-------------------------------------------------------------------------------
SUM:                           345          10573          12840         189363
-------------------------------------------------------------------------------
```
