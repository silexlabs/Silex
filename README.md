## Silex meta repo

This is a meta repository for Silex website builder

It includes all projects needed for Silex development as git submodules. This is the repo you need to contribute to Silex as many of the projects are dependencies of each other, so we can iterate in all at the same time and benefit from using [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) or [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces).

To execute a command in every package, use `scripts/exec.js ls` or `npm run exec -- ls`

There is no issue on this repo, please use the individual project's issues

## Included repositories in this meta repo

> Leave the line bellow as it is used in the doc script to insert content in the readme
> 
> Auto generated submodules

# Silex packages

| Name | Directory | Repo | Description |
| ---- | --------- | ---- | ----------- |
| Silex | `packages/Silex` | `git@github.com:silexlabs/Silex.git` | Silex is a no-code tool for building websites. It also lets you code when needed. It can be used online, offline or in a JAMStack project. |
| Silex Puter Plugin | `packages/silex-puter` | `git@github.com:silexlabs/silex-puter.git` | A good place to start writing a Silex plugin. It supports server and/or client side plugins, in Javascript and TypeScript. Check [Silex developer docs if you need help](https://docs.silex.me/en/dev) or [join the discussions in the forum](https://community.silex.me/) |
| Silex plugins | `packages/silex-plugins` | `git@github.com:silexlabs/silex-plugins.git` | Environment agnostic (node.js, browser, commonjs, esnext...) open architecture (plugin system) inspired by 11ty.dev config |
| Silex Plugin Starter | `packages/silex-plugin-starter` | `git@github.com:silexlabs/silex-plugin-starter.git` | A good place to start writing a Silex plugin. It supports server and/or client side plugins, in Javascript and TypeScript. Check [Silex developer docs if you need help](https://docs.silex.me/en/dev) or [join the discussions in the forum](https://community.silex.me/) |
| Silex Dashboard | `packages/silex-dashboard` | `git@github.com:silexlabs/silex-dashboard.git` | Here is the source code of Silex dashboard. It is a [Silex](https://www.silex.me) plugin which can be installed to manage websites you will then edit in Silex. |
| Silex CMS | `packages/silex-cms` | `git@github.com:silexlabs/silex-cms.git` | This is a Silex plugin to make Eleventy layouts visually with integration of any GraphQL API, allowing for a streamlined, code-free development process |
| node_modules Path | `packages/node_modules-path` | `git@github.com:lexoyo/node_modules-path.git` | Get the path of the `node_modules` folder in your scripts or CLI or `package.json`. This is useful when you are building a library that can either be used as an npm dependency or directly, [see this question on SO](https://stackoverflow.com/questions/44279838/copy-assets-from-npm). |
| Libre Friends | `packages/libre-friends` | `git@gitlab.com:silexlabs/libre-friends.git` |  |
| Grapesjs Ui Suggest Classes | `packages/grapesjs-ui-suggest-classes` | `git@github.com:silexlabs/grapesjs-ui-suggest-classes.git` | A grapesjs plugin to enable auto-complete of classes in the SelectorManager UI  |
| Symbols plugin for GrapesJS | `packages/grapesjs-symbols` | `git@github.com:silexlabs/grapesjs-sympbols.git` | This plugin adds feature to GrapesJS editor, for users to be able to reuse elements in a website and accross pages |
| Grapesjs Storage Rate Limit | `packages/grapesjs-storage-rate-limit` | `git@github.com:silexlabs/grapesjs-storage-rate-limit.git` | A plugin for GrapesJS that provides rate-limited storage, allowing you to save changes immediately and then cool down for a specified period before saving again. |
| GrapesJs Notifications Plugin | `packages/grapesjs-notifications` | `git@github.com:silexlabs/grapesjs-notifications.git` | Why this plugin? GrapesJs is a powerful framework to build no-code tools and allow users to create templates using a drag-and-drop interface. However, the framework does not offer a standard way of notifying users and each plugin implements its own, which is messy and not user friendly. This plugin provides a centralized notification system that can be used by all plugins to display messages to the user. |
| Grapesjs Loading | `packages/grapesjs-loading` | `git@github.com:silexlabs/grapesjs-loading.git` | Shows a loading bar while the site is loaded or saved. By default it looks like the classic loading bar on top of the page, e.g. on github.com. |
| GrapesJS Keymap Dialog | `packages/grapesjs-keymaps-dialog` | `git@github.com:silexlabs/grapesjs-keymaps-dialog.git` | This GrapesJS plugin implements a floating UI showing the available keymaps for the editor. |
| Grapesjs Fonts | `packages/grapesjs-fonts` | `git@github.com:silexlabs/grapesjs-fonts.git` | Custom Fonts plugin for grapesjs |
| Grapesjs Filter Styles | `packages/grapesjs-filter-styles` | `git@github.com:silexlabs/grapesjs-filter-styles.git` | This plugin adds a search bar in the Style manager so that users can search for a CSS style |
| Grapesjs Directus Storage | `packages/grapesjs-directus-storage` | `git@github.com:silexlabs/grapesjs-directus-storage.git` | Directus as a backend for GrapesJS |
| GrapesJs Data Source plugin | `packages/grapesjs-data-source` | `git@github.com:silexlabs/grapesjs-data-source.git` | This GrapesJS plugin integrates various APIs into the editor.  |
| Grapesjs Advanced Selector | `packages/grapesjs-advanced-selector` | `git@github.com:silexlabs/grapesjs-advanced-selector.git` | Links |
| Expression Input web component | `packages/expression-input` | `git@github.com:silexlabs/expression-input.git` | A web component to include in your JS/TS projects. Your users can create an expression which is a ordoned list of tokens. It feels like auto completion without typing text. The token can have options too. |
| eleventy-plugin-concat | `packages/eleventy-plugin-concat` | `git@github.com:silexlabs/eleventy-plugin-concat.git` | Eleventy plugin to bundle your scripts and styles |
| Silex instances by Silex Labs | `packages/editor.silex.me` | `git@github.com:silexlabs/editor.silex.me.git` | This repo holds the code for the [public Silex instance hosted for free by Silex Labs foundation](https://editor.silex.me) and [The v3 instance too](https://v3.silex.me). |


> Auto generated submodules

## Instruction

To contribute to Silex you need to fork this repo then clone locally this repo with its submodules, make sure you use the required nodejs version (nvm) and install its dependencies (you can replace `npm` with `yarn`):

* On github, fork this repo
* Then clone and setup the project:

```
$ git clone git@github.com:<your github handle>/silex-meta.git --recurse-submodules -j8
$ cd silex-meta
$ nvm install # [optional] Get the node version from .nvmrc
$ npm install # Will install dependencies in all submodules too
$ npm start # Will run the Silex editor from packages/Silex
```

Troubleshooting:
```
$ scripts/exec.js "git checkout {{branch}}" # checkout the default branch in all submodules
$ scripts/exec.js "npm install" # install dependencies in all submodules
$ cd packages/Silex && npm run build && cd ../.. # build the Silex editor
```

Then you can open your browser at [http://localhost:6800](http://localhost:6800) to see the Silex editor running locally.

When you are ready to contribute to a specific library or libraries, you can do the following:

* On github, fork the libraries you intend to contribute to, e.g. `silex-desktop`
* In your local clone of this meta repo, update submodule URLs to point to your own forks of each library, e.g:
```sh
$ cd packages/silex-desktop
$ git remote set-url origin git@github.com:<your-username>/silex-desktop.git'
```
* Sync Changes: Once your contributions are merged into the main library repositories, they will automatically sync with the meta repository when submodules are updated.

Useful commands

* Start Silex: `npm start` (or use `npm run start:debug`)
* Release a package (which is in packages/$PACKAGE_NAME) and bump version of a library and all its dependents: `scripts/release-version packages/$PACKAGE_NAME $VERSION`, then you probably want to `git push --follow-tags` the changed packages
* Add a project: `git submodules add $PACKAGE_GIT_URL packages/$PACKAGE_NAME`, then run `npm run doc`

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

github.com/AlDanial/cloc v 2.00  T=1.00 s (295.0 files/s, 97205.0 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JavaScript                     113            977           2337          63534
TypeScript                     168           1965           5943          21273
GraphQL                          3             63              6            667
JSX                              1              0              2            256
Dockerfile                       4             14              9             78
Text                             2              7              0             39
INI                              2              4              0             21
liquid                           1              0              0              9
Bourne Shell                     1              0              0              1
-------------------------------------------------------------------------------
SUM:                           295           3030           8297          85878
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
