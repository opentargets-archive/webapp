Docker container: [![Docker Repository on Quay](https://quay.io/repository/opentargets/webapp/status "Docker Repository on Quay")](https://quay.io/repository/opentargets/webapp)

CircleCI build: [![CircleCI](https://circleci.com/gh/opentargets/webapp.svg?style=svg)](https://circleci.com/gh/opentargets/webapp)

# OpenTargets Web App

This is the web app for the Open Targets Platform, based on the Open Targets REST API.
The app is based on Angular, while D3 is used for visualization and graphs.


## Getting started
Clone the repository and install the dependencies.


### Prerequisites
You'll obviously need `git` to clone the repository.

Installation and tests need some node.js tools:
you must have `node.js` and its package manager `npm` installed.  You can get them from [http://nodejs.org/](http://nodejs.org/)

Installing bower and gulp globally also helps
```
npm install -g bower
npm install -g gulp
```

### Install
Tools are installed via NPM. To run the installer run
```
npm install
npm run setup
```

This installs the required node modules and calls `bower install`  and `jspm install` which takes care of all Angular dependencies and 3rd party widgets.
So these commands create three directories:
* `node_modules` - npm packages for the needed tools (bower, http-server and modules for testing)
* `app/bower_components` - all Angular code. Note that the `bower_components` folder would normally be installed in the root folder but we change this location through the `.bowerrc` for neater deployment.
* `app/jspm_packages` - some of the packages needed for loading widgets on demand (deferred loading)

Angular code is installed via Bower includes:
* UI Bootstrap (Angular directives)
* Bootstrap (css)
* FontAwesome (css)
* D3

## Running and deploying the app

Depending on how you deploy, you might want to do two things:
- change the API the webapp points to
- apply a `custom.json` config that overrides the value in `app/config/default.json`, 
for example to change evidence_sources displayed

### Locally
1. Pull the repo
2. `npm install`
3. set the `API_HOST` env variable to point to a fully functional rest_api. 
Notice that `API_HOST` can be of the form `"https://somesite.com:1234/api/"` (recommended)
 or a simple prefix `/api/` if you are taking care of reverse-proxying the 
 API there (for eg if you are serving the app locally in nginx)
4. `npm run setup`, 
5. all the code you need for deployment will be contained in `/app`.

to point to a different API, change the `API_HOST` env var and run `gulp build-config` 

### Deploy on netlify

The app will point to the API specified with `API_HOST` in the `netlify.toml` file.

When deploying with netlify, the `custom.json` cannot be changed without commiting it to the branch code.


### Docker container

A docker container with a compiled version of the webapp from a NGINX web server is available.
To run the app locally using the container:
```sh
docker run -d -p 8443:443 -p 8080:80 quay.io/opentargets/webapp
```
Then visit https://localhost:8443

The standard container comes with self-signed certificates, so you will have click through a couple of security warnings to get to the app.

If you want to point to an API different than the production one, you can specify the variables

REST_API_SCHEME="http" (`http` or `https` are valid option)
REST_API_SERVER="server:port" (eg `rest_api:8080` to point to a container named `rest_api` or `api.targetvalidation.org` to point to the production api on the default 80/443 ports)

To mount a `custom.json` on the container at runtime:

```sh
docker run -d -v "$PWD/mycustomtest.json:/var/www/app/config/custom.json" -p 8443:443 -p 8080:80 quay.io/opentargets/webapp
```

This can be useful to toggle data sources on/off in private instances and fork of the webapp.
