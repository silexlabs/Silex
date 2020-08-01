# Silex desktop

This is the official [Silex](https://www.silex.me) desktop version, an installable application for Windows, MacOS and linux.

![Silex desktop app](https://user-images.githubusercontent.com/715377/36344714-bf264de2-141e-11e8-8c87-f698e96d91c9.png)


We are looking for someone to create the releases every 2 months, and for testers to test each new version on Windows and MacOS and linux after each release, [please apply here](https://github.com/silexlabs/Silex/issues/927)

## Instructions

Go ahead and [download the version for your system here](https://github.com/lexoyo/silex-desktop/releases)

### Windows

__The app is not build for windows anymore, for now__ 

You can probably download the .AppImage and see [instructions here](https://discourse.appimage.org/t/run-appimage-on-windows/177)

### Mac

Download the .dmg and double click it to start Silex

### Linux

Downolad the .AppImage, make it executable and run it

Note: you may need libvips-dev installed (`apt install libvips-dev` or `dnf install vips-devel`)


## Release a new version

For developers, here is how to create a new release for the latest version of Silex

1. edit `package.json` and set `version` to the same version as Silex version, e.g. `2.10.5`, commit the changes and push them
2. create a git tag with this version, e.g. `git tag -a v2.10.5`
3. push the tag to github with `git push origin 2.10.5`

