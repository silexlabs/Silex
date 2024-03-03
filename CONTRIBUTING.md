### Overview

This page is about contributing code, but other types of contribution are welcome, [let's chat](https://github.com/silexlabs/Silex/discussions)!

Useful links

* [Silex meta repository](https://github.com/silexlabs/silex-meta)
* [Open positions, join the team](https://github.com/silexlabs/Silex/issues?q=is%3Aissue+is%3Aopen+label%3A%22open+position%22)
* [Become a core contributor with these issues to get started](https://github.com/silexlabs/Silex/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)
* [Testers, docs and other help wanted annoucements](https://github.com/silexlabs/Silex/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22)

To contribute code (features, bug fixes, design changes etc.) to the Silex code base, you'll need to complete a few steps to get a local working copy of our repository. Below are the steps you'll need to fork, clone, branch, and create a pull request.

Please be sure to conform to the coding standards used throughout our project and bear in mind that, by contributing to this project, you agree to our [Code of Conduct](https://github.com/silexlabs/Silex/wiki/Silex-Code-of-Conduct).

## Code base overview

The Silex API is primarily divided into two parts: the client-side and the server-side.

### Client-side

The client-side is primarily handled by the files in the `src/ts/client` directory. The main entry point is defined in `index.ts`, which initializes the Silex application. The `config.ts` file contains the `SilexConfig` class that holds the configuration for the client-side application, including the GrapesJS editor configuration and the client config URL. The `grapesjs` directory contains the GrapesJS editor configuration and plugins. The `utils.ts` file contains utility functions.

### Server-side

The server-side is primarily handled by the files in the `src/ts/server` directory. The main entry point is defined in `index.ts`, which initializes the server-side application. The `config.ts` file contains the `ServerConfig` class that holds the configuration for the server-side application. The `express.ts` file sets up the Express.js application and starts the server. The `cli.ts` file handles the command-line interface for the server, parsing command-line arguments and setting environment variables accordingly. The `events.ts` file defines events for the startup process.

## Code contribution process

### Steps

   If you don't have a GitHub account, start [here](https://github.com/join).

1. **Fork the project**

	 Open the [Silex Project](https://github.com/silexlabs/Silex/) in GitHub. Click `Fork` in the upper right corner of the window. This adds a copy of the Silex repository to your GitHub account.

1. **Clone the fork**

   Now you'll make a local copy of the repository. From the command line:

   ```bash
   # Open command line terminal
   # Navigate to your desired working directory
   cd <your-desired-working-directory>
   git clone https://github.com/<your-username>/Silex.git
    ```

1. **Set the upstream repository**

   Assign Silex as the upstream repository. Setting the upstream repository tells Git where to pull from when you use the pull command (which you'll do in the next step).

	 ```bash
	 cd Silex
	 git remote add upstream https://github.com/silexlabs/Silex.git
	 ```

1. **Create a new branch** (Recommended)

	 Though you can work directly in the default dev branch, it is best practice to keep that branch synced with Silex and create a new working branch for your changes. Name the new branch whatever you'd like.

   ```bash
   git checkout -b <new-branch-name>
   ```

    You'll need to set the upstream branch so git knows where to point your new branch's pull and push commands. Below you set your local dev branch as the upstream branch to your new branch.

   ```bash
   git branch --set-upstream-to=dev <new-branch-name>
   ```

1. **Install the dependencies**

Be sure to have Node version >= 18.

   ```bash
   npm install
   ```

   This will install all the dependencies needed to run Silex.

1. **Run the project**

   ```bash
   npm run dev
   ```

   This will start the Silex server, Silex will be available on `http://localhost:6805`.

1. **Make your changes**
   Once changes are complete, use one of the following commands to stage the changes to be committed.

   ```bash
   git add <file-name>
   ```

   Once your changes are ready and all files you wish to commit have been added (step #5), you'll create your commit.

   ```bash
   git commit -m "This is a short message about the change made in this commit"
   ```

   **Note on commiting:** If you have multiple commits or wish to change your commit message, you can use [interactive rebase](https://help.github.com/articles/about-git-rebase) to clean up and consolidate your commits before making your pull request.

1. **Rebase the upstream branch** into your local branch(es)

   Do this from time to time to keep your local repository up to date with the latest changes in the upstream repository. This is especially important before you start making changes.

   This assumes that your local folder is "clean", that all your work is committed.

   ```bash
   git pull --rebase upstream main
   ```

9. **Push your local branch** up to your fork

   ```bash
   git push origin <branch-name>
   ```

10. **Create a pull request**

	 [Create your request](https://help.github.com/articles/creating-a-pull-request/), making sure the title is as clear and descriptive as possible.
