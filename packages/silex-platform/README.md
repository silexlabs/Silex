
This is a simple project which uses Silex and has 1 custom component.

See [this page for explanation and details](https://github.com/silexlabs/Silex/wiki/Create-Silex-components).

## Setup

To setup this repo and start customizing Silex, there are 2 main methods described below. If you encounter a bug please let me know in Silex issues, and once you fixed it please and submit a Pull Request here.

If you are using **Windows 7+** it will be easier to usethe Docker method. If you are on linux or MacOs, you can use npm directly.

With the Docker method, a Docker container is running Silex and compiling your components or templates. The current folder is shared with the container so you can work on your components locally and let the Docker container build them.

> Notes for Windows 7+ users: you probably want to use PowerShell for the command line

### Use with Docker

Please make sure that you do not have `node_modules/` and `package-lock.json` in the current directory as our Dockerfile will need to create them with a specific version of nodejs.


Clone this repo

```
$ git clone git@github.com:silexlabs/custom-silex-components.git
$ cd custom-silex
```

Build the image

```
$ docker build -t custom-silex .
```

Install Silex and run it
```
$ docker run --privileged=true -v $PWD:/local custom-silex npm install
$ docker run --privileged=true -i -p 6805:6805 -v $PWD:/local custom-silex npm start
```

You might need to replace $PWD with the path of your project.

### Use with npm

Please check that you have the node version specified by the `.nvmrc` file.

Clone this repo

```
$ git clone git@github.com:silexlabs/custom-silex-components.git
$ cd custom-silex
```

Install Silex and run it
```
$ npm install
$ npm start
```

Now you can open [http://localhost:6805](http://localhost:6805) and use Silex

## Build the project

When you [add custom components](https://github.com/silexlabs/Silex/wiki/Create-Silex-components) or [add custom templates](https://github.com/silexlabs/Silex/wiki/Create-templates-for-Silex) you will need to rebuild Silex components and templates with this command:

```
$ npm run build
```

Or if you use Docker

```
$ docker run --privileged=true -v $PWD:/local custom-silex npm run build
```
