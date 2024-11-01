# Silex desktop

This is the official [Silex](https://www.silex.me) desktop version, an installable application for Windows, MacOS and linux.

# Silex Desktop (v2)

🚨 **Notice:** This repository currently contains the v2 version of Silex Desktop. It has not yet been updated to the latest v3 version of Silex. 🚨

We have a feature request to upgrade Silex Desktop to v3 with improved features! If you'd like to see this happen, please support the request by voting [here on our roadmap](https://roadmap.silex.me/posts/3/silex-desktop).

Your support helps prioritize this upgrade, so every vote counts. Thank you!

![Silex desktop app](https://user-images.githubusercontent.com/715377/36344714-bf264de2-141e-11e8-8c87-f698e96d91c9.png)


We are looking for someone to create the releases every 2 months, and for testers to test each new version on Windows and MacOS and linux after each release, [please apply here](https://github.com/silexlabs/Silex/issues/927)


## Support and documentation

Please use the mother project's [Silex issues](https://github.com/silexlabs/Silex/issues) and [Silex documentation](https://github.com/silexlabs/Silex/wiki)

## Instructions

Go ahead and [download the version for your system here](https://github.com/silexlabs/silex-desktop/releases/latest)

### Windows

[Download the .exe](https://github.com/lexoyo/silex-desktop/releases) and double click it to start Silex.

### Mac

1. [Download the .dmg](https://github.com/lexoyo/silex-desktop/releases)
1. Double click the .dmg file
1. Drag and drop Silex icon to the Application folder

The first time you want to open Silex:

1. Go to your Application folder
1. Right-click silex app and select "open"
1. Accept "the risk" in the security dialog
1. Silex will show up

The next time you want to open Silex, just click on Silex in your apps.

### Linux

[Downolad the .AppImage](https://github.com/lexoyo/silex-desktop/releases), make it executable (`chmod +x` the file) and run it.

Note: in order to have the "thumbnails" in cloud explorer, you may need libvips-dev installed (`apt install libvips-dev` or `dnf install vips-devel`) and/or glib2.0-dev installed (`apt install glib2.0-dev` or `dnf install glib-devel`)


## Release a new version

For developers, here is how to create a new release for the latest version of Silex

```
$ npm version patch
$ git push origin master --follow-tags
```
