[![Docker Repository on Quay](https://quay.io/repository/opentargets/webapp/status "Docker Repository on Quay")](https://quay.io/repository/opentargets/webapp)

[![wercker status](https://app.wercker.com/status/11b0582ab0336ded75ef289929e9b83d/s/master "wercker status")](https://app.wercker.com/project/byKey/11b0582ab0336ded75ef289929e9b83d)

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

After building with `npm install` and `npm run setup`, all the code you need for deployment will be contained in `/app`.

A docker container with a compiled version of the webapp from a NGINX web server is available.
To run the app locally using the container:
```sh
docker run -d -p 8443:443 -p 8080:80 quay.io/opentargets/webapp
```
Then visit https://localhost:8443

The standard container comes with self-signed certificates, so you will have click through a couple of security warnings to get to the app.
