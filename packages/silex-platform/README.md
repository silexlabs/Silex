## Silex instances by Silex Labs

This repo holds the code for the [public Silex instance hosted for free by Silex Labs foundation](https://editor.silex.me).

This is also a good example on how to customize Silex.

## Features

This code adds features to the editor specific to our instance (in `index.js` and `index.pug`):

* analytics - we use [microanalytics.io](https://microanalytics.io/) because it is green.
* debugging with Sentry
* a popin window which asks the user to rate the service on trustpilot
* enable or disable cloud services and hosting providers
* automatic deployment to heroku (see `.github/workflows/heroku.yml`)

## Support

[Please use the main Silex repository](https://github.com/silexlabs/Silex/) for docs and issues
