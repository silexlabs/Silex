### why

Silex, is a free and open source website builder in the cloud. Create websites directly in the browser without writing code. And it is suitable for professional designers to produce great websites without constraints. Silex is also known as the HTML5 editor.And we want to leverage the Cloud Foundry to host our own site of Silex, so you are here ! ;)

### Prerequisite
You need to have an Cloud Foundry account, whatever Bluemix or PCF, both are the instance of Cloud Foundry Stack. For detail about them , pls referral to the link below and what you need to know is the follwing commands

* `cf login`
* `cf push`
* `cf set env`
* `cf start`
* (Optional) Activate github service you need to define the env vars *`GITHUB_CLIENT_ID`* and *`GITHUB_CLIENT_SECRET`* ([Create a github app here](https://github.com/settings/applications/new))

### Host an instance of Silex in Cloud Foundry

1. Launch the "Git Shell"
2. Clone this repository, and do not forget the sub modules (cloud-explorer and unifile)
```
$ git clone --recursive -b cf-integration https://github.com/yacloud-io/yadesigner.git
```
3. Go to Silex's Directory.
```
$ cd yadesigner
```
4. Login to the Bluemix

```
$ cf login -a api.ng.bluemix.net -u <you username here>
and input the password in the interactive Shell

$ cf push -m 512m <your add name here> --no-start
$ wait...
$ ...
$ cf set-env <your add name here> GITHUB_CLIENT_ID <GITHUB_CLIENT_ID value here>
$ cf set-env <your add name here> GITHUB_CLIENT_SECRET <GITHUB_CLIENT_SECRET value here>
$ cf start <your add name here>
```
After deploy you could vist your own silex site

### Links
* [Bluemix official website](https://www.ng.bluemix.net)
