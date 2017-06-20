### Overview

To contribute code (features, bug fixes, design changes etc.) to the Silex code base, you'll need to complete a few steps to get a local working copy of our repository. Below are the steps you'll need to fork, clone, branch, and create a pull request. 

Please be sure to conform to the coding standards used throughout our project and bear in mind that, by contributing to this project, you agree to our [Code of Conduct](https://github.com/silexlabs/Silex/wiki/Silex-Code-of-Conduct). 

### Steps

   If you don't have a GitHub account, start [here](https://github.com/join).  
   
1. **Fork the project**

	 Open the [Silex Project](https://github.com/silexlabs/Silex/) in GitHub. Click `Fork` in the upper right corner of the window. This adds a copy of the Silex repository to your GitHub account.

2. **Clone the fork**

   Now you'll make a local copy of the repository. From the command line:

   ```bash
   # Open command line terminal
   # Navigate to your desired working directory 
   cd <your-desired-working-directory>
   git clone https://github.com/<your-username>/Silex.git
    ```

3. **Set the upstream repository**

   Assign Silex as the upstream repository. Setting the upstream repository tells Git where to pull from when you use the pull command (which you'll do in the next step).  
   
	 ```bash
	 cd Silex
	 git remote add upstream https://github.com/silexlabs/Silex.git
	 ```
      
4. **Pull the latest upstream changes**

   ```bash
   git pull upstream develop
   ```

5. **Create a new branch** (Recommended)

	 Though you can work directly in the default develop branch, it is best practice to keep that branch synced with Silex and create a new working branch for your changes. Name the new branch whatever you'd like.

   ```bash
   git checkout -b <new-branch-name>
   ```
      
    You'll need to set the upstream branch so git knows where to point your new branch's pull and push commands. Below you set your local develop branch as the upstream branch to your new branch.

   ```bash
   git branch --set-upstream-to=develop <new-branch-name>
   ```

   **Notes on branch management:**  
   You can easily see a list of all of the branches in the local repository. The branch with [*] is the current working branch. 

   ```bash
   git branch
   ```
   You can switch between local branches using this command:

   ```bash
   git checkout <branch to which you wish to switch>
   ```
  
6. **Make your changes**  
   Once changes are complete, use one of the following commands to stage the changes to be committed.

   ```bash
   # Add all changes to commit
   git add .
   
   # Add changes from one file to commit
   git add <file-name>
   ```

   **Note on change management:**  
   You can always use this command to see which changes are staged for commit and which aren't. 
  
   ```bash
   git status
   ```

7. **Prepare to commit your changes**  
   Once your changes are ready and all files you wish to commit have been added (step #5), you'll create your commit.

   ```bash
   git commit -m "This is a short message about the change made in this commit"
   ```

   **Note on commiting:** If you have multiple commits or wish to change your commit message, you can use [interactive rebase](https://help.github.com/articles/about-git-rebase) to clean up and consolidate your commits before making your pull request.

8. **Rebase the upstream branch** into your local branch(es)

   ```bash
   git pull [--rebase] upstream develop
   ```

9. **Push your local branch** up to your fork

   ```bash
   git push origin <branch-name>
   ```

10. **Create a pull request** 	

	 [Create your request](https://help.github.com/articles/creating-a-pull-request/), making sure the title is as clear and descriptive as possible. 
