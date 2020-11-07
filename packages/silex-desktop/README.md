# Silex desktop

This is the official [Silex](https://www.silex.me) desktop version, an installable application for Windows, MacOS and linux.

![Silex desktop app](https://user-images.githubusercontent.com/715377/36344714-bf264de2-141e-11e8-8c87-f698e96d91c9.png)


We are looking for someone to create the releases every 2 months, and for testers to test each new version on Windows and MacOS and linux after each release, [please apply here](https://github.com/silexlabs/Silex/issues/927)


## Support and documentation

Please use the mother project's [Silex issues](https://github.com/silexlabs/Silex/issues) and [Silex documentation](https://github.com/silexlabs/Silex/wiki)

## Instructions

Go ahead and [download the version for your system here](https://github.com/lexoyo/silex-desktop/releases)

### Windows

__The app is not build for windows anymore, for now__ 

You can probably download the .AppImage and see [instructions here](https://discourse.appimage.org/t/run-appimage-on-windows/177)

### Mac

Download the .dmg and double click it to start Silex

### Linux

Downolad the .AppImage, make it executable and run it

Note: in order to have the "thumbnails" in cloud explorer, you may need libvips-dev installed (`apt install libvips-dev` or `dnf install vips-devel`) and/or glib2.0-dev installed (`apt install glib2.0-dev` or `dnf install glib-devel`)


## Release a new version

For developers, here is how to create a new release for the latest version of Silex

```
$ npm version patch
$ git push origin master --follow-tags
```
