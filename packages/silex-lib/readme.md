[![license: GPL](https://img.shields.io/badge/license-GPL-green.svg)](http://www.silexlabs.org/silex/silex-licensing/)
[![Build Status](https://circleci.com/gh/silexlabs/Silex.svg?style=svg)](https://circleci.com/gh/silexlabs/Silex)
[![status of silex.me instance](http://monitoshi.lexoyo.me/badge/1488579168302-7057)](https://editor.silex.me)

## About Silex, live web creation.

Silex, is a free and open source website builder in the cloud. Create websites directly in the browser without writing code. And it is suitable for professional designers to produce great websites without constraints. Silex is also known as the HTML5 editor.

![Silex UI](https://github.com/silexlabs/www.silex.me/raw/gh-pages/assets/silex-ui.gif)

Brought to you by Silex Labs team, promoting free software.

Links
* [Silex official website](http://www.silex.me/)
* [Documentation wiki](https://github.com/silexlabs/Silex/wiki)
* [questions and answers, bug report, feature requests](http://www.silexlabs.org/silex/)
* [Silex license is GPL](http://www.silexlabs.org/silex/silex-licensing/)
* [Road map](https://github.com/silexlabs/Silex/blob/master/docs/roadmap.md) and [change log](https://github.com/silexlabs/Silex/blob/master/docs/change-log.md)

News and tutorials

* See Silex wiki, there is a tutorials section
* [Silex blog](http://www.silexlabs.org/category/the-blog/blog-silex/)
* [subscribe by email](http://eepurl.com/F48q5)

Contact us and let people know about Silex

* [Facebook](http://www.facebook.com/silexlabs)
* [Twitter](https://twitter.com/silexlabs)
* [Google plus](https://plus.google.com/communities/107373636457908189681)
* [Contributors list](https://github.com/silexlabs/Silex/graphs/contributors)

## Host an instance of Silex

If you plan to host Silex for your clients, your users or the community, this section is for you.

If you feel like helping and host an instance of Silex as an alternative to the official Silex site http://editor.silex.me/ please let us know so that we can advertise it to the community.

You will need a nodejs server, which you can setup yourself or host at [Gandi](https://www.gandi.net/) or [IndieHosters](https://indiehosters.net/shop/product/silex-23) for example.

Download the zip file on github or clone this repository, and then follow the same steps as the developers when they install silex locally on linux - starting at npm install. See instructions bellow.

For the lazy ones, there is the [Heroku One-Click Deploy](https://heroku.com/deploy): [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/silexlabs/Silex/tree/master)

For Heroku as for Gandi, you need to set environments variables, see the environment variables bellow.

## Installation on your local computer

This is for developers only, since our beloved designers can use the [online version](http://editor.silex.me/).

Developers you can clone this repository and start Silex, with nodejs. To do this you can use just nodejs or Docker, see instructions bellow.

### Recommended: with Docker

Prerequisite :
* [docker](https://www.docker.com/)

Clone this repo with `git clone https://github.com/silexlabs/Silex.git` and then `cd Silex`

Build the docker image for Silex

```
$ docker build -t silex-image .
$ docker run -p 6805:6805 -t silex-image
```

Open http://localhost:6805/ and you are ready!

The default env vars can be overriden using the `-e` option in docker run, see the section about env vars bellow

### local installation on linux or macos or cloud9

Prerequisite:

* [node.js](http://nodejs.org/) installed
* [NPM](https://npmjs.org/) installed
* [python](https://www.python.org/downloads/) (version >= V2.7)
* [java](https://www.java.com/en/download/index.jsp) (version >= 7)

Clone this repository, and do not forget the sub modules (cloud-explorer and unifile)

```
$ git clone --depth 10 https://github.com/silexlabs/Silex.git
```

Install all needed modules and build the assets

```
$ npm install
$ npm run build
```

Start the server and then open [http://localhost:6805/](http://localhost:6805/) - note that the port is 6805, which is easy to remember, since it is the date of sexual revolution started in paris france 8-)

```
$ npm start
```

> Note for [cloud9](http://c9.io) users: you may want to activate python with this command:

```
$ nada-nix install python
```

And finally, take a look at the "available commands" section bellow

### local installation on Windows

> instructions provided by Régis RIGAUD:)

Prerequisite:

* [node.js](http://nodejs.org/) installed
* Git Client installed (e.g. [windows github client](http://windows.github.com/))
* [NPM installed](https://npmjs.org/)
* [python](https://www.python.org/downloads/)

Installation of Silex:

* Launch the "Git Shell"
* Create a clone of Silex Project: git clone --depth 10 https://github.com/silexlabs/Silex.git
* Go to Silex's Directory.
* install depedencies : npm install

Start Silex:

* Launch Silex from a command prompt (Silex's Directory): `npm start`
* Open your favorite browser on http://localhost:6805/ and ENJOY !!!
* also take a look at the "available commands" section bellow

### Available commands

If you develop or debug Silex, these npm scripts can be used with npm (they are defined in the file [package.json](./package.json))

* `$ npm start` will start the server
* `$ npm run start:debug` will start the server in debug mode (no error catchall, enable local service to use local file system as a storage)
* `$ npm run build` will build the client side code (html, css, js), ready for production
* `$ npm run build:server` this only check that the server scripts are correct
* `$ npm run watch:client` will watch the html, js and css source folders and rebuild when a file changes

### environment variables

* `APP_URL` base URL of your Silex instance, passed to OAuth services like github si they can come back to you with a token
* `PORT`, optional, default: 6805, [used here in the code](dist/server/server.js#L148)
* `SSL_PORT`, optional, default: to 443, [used here in the code]()
* `SILEX_FORCE_HTTPS`, optional [used here in the code](dist/server/server.js#102) to force https/ssl (default is `false`)
* `SILEX_SSL_PRIVATE_KEY`, optional (see ssl section bellow), [used here in the code](dist/server/server.js#L124)
* `SILEX_SSL_CERTIFICATE`, optional (see ssl section bellow), [used here in the code](dist/server/server.js#L124)
* `SILEX_FORCE_HTTPS_TRUST_XFP_HEADER`: optional, useful only if `SILEX_FORCE_HTTPS` is true, [see the param `trustXFPHeader` in this doc](https://www.npmjs.com/package/express-force-ssl)
* `SILEX_SESSION_FOLDER`, optional, default: `$HOME/.silex/sessions`, [used here in the code](dist/server/server.js#L53)
* `SILEX_DEBUG`, optional, default: `false`, when `true` this will enable the service "www" (storage on the local server in `www/`) with login `admin` and pass `admin`, [used here in the code](dist/server/server.js#L78)
* `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: optional, to activate github service, you need to create a github app to get these info ([create a github app](https://github.com/settings/applications/new) to get those)
* `DROPBOX_CLIENT_ID` and `DROPBOX_CLIENT_SECRET`: optional, this will activate Dropbox service, you need to create a Dropbox app on developers.dropbox.com
* `ENABLE_FTP`, `ENABLE_SFTP`, `ENABLE_WEBDAV`: optional, used to activate the corresponding services
* `SILEX_ELECTRON`: this is set by Silex electron app, in order to activate the `fs` service and access your file system from within Silex

> Tip: for your tests on localhost, you can use these test apps
> ```
> $ export DROPBOX_CLIENT_ID=ckixgyo62obeo05
> $ export DROPBOX_CLIENT_SECRET=ptg6u5iw7gs6r6o
> $ export GITHUB_CLIENT_ID=f124e4148bf9d633d58b
> $ export GITHUB_CLIENT_SECRET=1a8fcb93d5d0786eb0a16d81e8c118ce03eefece
> ```


### enable https / SSL

When you start Silex, it looks for the environment variables `SILEX_SSL_PRIVATE_KEY` and `SILEX_SSL_CERTIFICATE`. If they are present, it enables SSL.

`SILEX_SSL_PRIVATE_KEY` is expected to be the path to a `.key` file, and `SILEX_SSL_CERTIFICATE` the path to a  `.crt`.


## Size of the project's code base

As of june 2017, around 100.000 lines of code. See [github API count (includes blank lines and comments I guess)](https://api.github.com/repos/silexlabs/Silex/languages):

```
JavaScript: 856643,
CSS: 82702,
HTML: 53727,
Shell: 1532
```

[cb372's report](http://line-count.herokuapp.com/silexlabs/Silex):

<table id="results" class="table table-striped">
<tbody>
    <tr>
        <th>File Type</th>
        <th>Files</th>
        <th>Lines of Code</th>
        <th>Total lines</th>
    </tr>
    <tr>
        <td>JavaScript</td>
        <td>422</td>
        <td>138797</td>
        <td>183644</td>
    </tr>
    <tr>
        <td>Json</td>
        <td>3</td>
        <td>146</td>
        <td>146</td>
    </tr>
    <tr>
        <td>Text</td>
        <td>12</td>
        <td>0</td>
        <td>1047</td>
    </tr>
    <tr>
        <td>Shell</td>
        <td>4</td>
        <td>24</td>
        <td>47</td>
    </tr>
    <tr>
        <td>Stylesheets</td>
        <td>90</td>
        <td>17777</td>
        <td>21504</td>
    </tr>
    <tr>
        <td>Html</td>
        <td>7</td>
        <td>545</td>
        <td>726</td>
    </tr>
</tbody>
</table>


[Cloc's report](https://github.com/AlDanial/cloc):

```
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JavaScript                     404           9616          14937          50841
CSS                             75           1580           1652          11394
LESS                            20            141             87           1768
Markdown                        10            334              0            657
YAML                            14              3              1            581
HTML                             7            177             22            527
JSON                             3              0              0            146
Bourne Shell                     4              6             13             28
-------------------------------------------------------------------------------
SUM:                           541          12030          16712          66869
-------------------------------------------------------------------------------
```

## dependencies

These are the upstream projects we use in Silex

* [unifile](https://github.com/silexlabs/unifile), a nodejs server which provides a unified access to cloud services. This projects uses nodejs and these modules: express, dbox, express, googleapis, logger, node-oauth, oauth, path
* [Cloud explorer](https://github.com/silexlabs/cloud-explorer), a file manager for the cloud services. It is a front end javascript app which connects to a unifile server
* [Prodotype](https://github.com/silexlabs/Prodotype), Build components and generate a UI to make them editable in your app.
* [ace](http://ace.c9.io/), an excellent code editor in javascript
* google closure library and compiler
* jquery and jquery UI are included in the sites generated by Silex
* [GLYPHICONS library of precisely prepared monochromatic icons and symbols](http://glyphicons.com/) ([CC license](http://creativecommons.org/licenses/by/3.0/))
