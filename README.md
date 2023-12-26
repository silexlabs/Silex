## Silex meta repo

This is a meta repository for Silex website builder

It includes all projects needed for Silex development as git submodules. This is the repo you need to contribute to Silex as many of the projects are dependencies of each other, so we can iterate in all at the same time and benefit from using [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) or [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces).

There is no issue on this repo, please use the individual project's issues

## Included repositories in this meta repo

> Leave the line bellow as it is used in the doc script to insert content in the readme
> 
> Auto generated submodules

# Silex packages

| Name | Directory | Repo | Description |
| ---- | --------- | ---- | ----------- |
| Silex | `packages/Silex` | `git@github.com:silexlabs/Silex.git` | Silex is a no-code tool for building websites. It also lets you code when needed. It can be used online, offline or in a JAMStack project. |
| Silex plugins | `packages/silex-plugins` | `git@github.com:silexlabs/silex-plugins.git` | Environment agnostic (node.js, browser, commonjs, esnext...) open architecture (plugin system) inspired by 11ty.dev config |
| Silex Plugin Starter | `packages/silex-plugin-starter` | `git@github.com:silexlabs/silex-plugin-starter.git` | A good place to start writing a Silex plugin. It supports server and/or client side plugins, in Javascript and TypeScript. Check [Silex developer docs if you need help](https://docs.silex.me/en/dev) or [join the discussions in the forum](https://community.silex.me/) |
| Silex Dashboard | `packages/silex-dashboard` | `git@github.com:silexlabs/silex-dashboard.git` | Here is the source code of Silex dashboard. It is a [Silex](https://www.silex.me) plugin which can be installed to manage websites you will then edit in Silex. |
| Silex CMS | `packages/silex-cms` | `git@github.com:silexlabs/silex-cms.git` | This is a Silex plugin to make Eleventy layouts visually with integration of any GraphQL API, allowing for a streamlined, code-free development process |
| Access node_modules in package.json | `packages/node_modules-path` | `git@github.com:lexoyo/node_modules-path.git` | Use it in your `packge.json` like this: |
| Grapesjs Ui Suggest Classes | `packages/grapesjs-ui-suggest-classes` | `git@github.com:silexlabs/grapesjs-ui-suggest-classes.git` | [DEMO](https://codepen.io/lexo1000/pen/abErmeW) |
| Symbols plugin for GrapesJS | `packages/grapesjs-symbols` | `git@github.com:silexlabs/grapesjs-sympbols.git` | This plugin adds feature to GrapesJS editor, for users to be able to reuse elements in a website and accross pages |
| Grapesjs Storage Rate Limit | `packages/grapesjs-storage-rate-limit` | `git@github.com:silexlabs/grapesjs-storage-rate-limit.git` | A plugin for GrapesJS that provides rate-limited storage, allowing you to save changes immediately and then cool down for a specified period before saving again. |
| Grapesjs Loading | `packages/grapesjs-loading` | `git@github.com:silexlabs/grapesjs-loading.git` | Shows a loading bar while the site is loaded or saved. By default it looks like the classic loading bar on top of the page, e.g. on github.com. |
| Grapesjs Fonts | `packages/grapesjs-fonts` | `git@github.com:silexlabs/grapesjs-fonts.git` | Custom Fonts plugin for grapesjs |
| Grapesjs Filter Styles | `packages/grapesjs-filter-styles` | `git@github.com:silexlabs/grapesjs-filter-styles.git` | This plugin adds a search bar in the Style manager so that users can search for a CSS style |
| Grapesjs Directus Storage | `packages/grapesjs-directus-storage` | `git@github.com:silexlabs/grapesjs-directus-storage.git` | Directus as a backend for GrapesJS |
| GrapesJs Data Source plugin | `packages/grapesjs-data-source` | `git@github.com:silexlabs/grapesjs-data-source.git` | This GrapesJS plugin integrates various APIs into the editor.  |
| Expression Input component and familly | `packages/expression-input` | `git@github.com:silexlabs/expression-input.git` | A web component to include in your JS/TS projects. Your users can create an expression or a ordoned list with your data as a tree. |
| Eleventy Plugin Directus | `packages/eleventy-plugin-directus` | `git@github.com:silexlabs/eleventy-plugin-directus.git` | ![combined](https://user-images.githubusercontent.com/715377/202714740-44db41be-27a7-42d9-aa58-8d72d486bcbf.png) |
| eleventy-plugin-concat | `packages/eleventy-plugin-concat` | `git@github.com:silexlabs/eleventy-plugin-concat.git` | Eleventy plugin to bundle your scripts and styles |
| Silex instances by Silex Labs | `packages/editor.silex.me` | `git@github.com:silexlabs/editor.silex.me.git` | This repo holds the code for the [public Silex instance hosted for free by Silex Labs foundation](https://editor.silex.me). |


> Auto generated submodules

## Instruction

To contribute to Silex you need to clone this repo with its submodules, make sure you use the required nodejs version (nvm) and install its dependencies (you can replace `npm` with `yarn`):

```
$ git clone git@github.com:silexlabs/silex-meta.git --recurse-submodules -j8
$ cd silex-meta
$ nvm use
$ npm install
$ npm start
```

Useful commands

* Start Silex: `npm start` (or use `npm run start:debug`)
* Release a package (which is in packages/$PACKAGE_NAME) and bump version of a library and all its dependents: `scripts/release-version packages/$PACKAGE_NAME $VERSION`, then you probably want to `git push --follow-tags` the changed packages
* Add a project: `git submodules add $PACKAGE_GIT_URL packages/$PACKAGE_NAME`, then add it to `workspaces` in `package.json`, then run `npm run doc`

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

github.com/AlDanial/cloc v 1.98  T=0.50 s (472.0 files/s, 55262.0 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
TypeScript                     139           1549           5243          16518
JavaScript                      89            383           1002           2823
Dockerfile                       2              8              7             54
INI                              2              4              0             21
liquid                           3              0              0             17
Text                             1              0              0              2
-------------------------------------------------------------------------------
SUM:                           236           1944           6252          19435
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
