Docker container: [![Docker Repository on Quay](https://quay.io/repository/opentargets/webapp/status "Docker Repository on Quay")](https://quay.io/repository/opentargets/webapp)

CircleCI build: [![CircleCI](https://circleci.com/gh/opentargets/webapp.svg?style=svg)](https://circleci.com/gh/opentargets/webapp)

# OpenTargets Web App

This is the web app for the Open Targets Platform, based on the Open Targets REST API.
The app is based on Angular, while D3 is used for visualization and graphs.

## Usage
Depending on how you deploy, you might want to do two things:
- change the API the webapp points to
- apply a `custom.json` config that overrides the value in `app/config/default.json`, 
for example to change evidence_sources displayed

### Deploy on netlify
1. Fork the webapp (unless you are deploying production for the Open Targets team)
2. (optional) add a `custom.json` to `/app/config` to change your fork's configuration
2. Set up netlify/github integration
3. Change the `netlify.toml` to point to your API. The app will point to the API specified with `APIHOST` in the `netlify.toml` file.

When deploying with netlify, the `custom.json` cannot be changed without first commiting it to the code.
**NB**: In this scenarion, don't override the `{"api":}` variable in `custom.json` otherwise the APIHOST logic will fail. 


### Deploy using our docker container

A docker container with a compiled version of the webapp from a NGINX web server is available on quay.io [![Docker Repository on Quay](https://quay.io/repository/opentargets/webapp/status "Docker Repository on Quay")](https://quay.io/repository/opentargets/webapp)

To run the app locally using the container:
```sh
docker run -d -p 8443:443 -p 8080:80 quay.io/opentargets/webapp
```
Then visit https://localhost:8443

The standard container comes with self-signed certificates, so you will have click through a couple of security warnings to get to the app.


#### If you want to point to an API different than the production one:

you can specify the variables
`REST_API_SCHEME="http"` (`http` or `https` are valid option) and `REST_API_SERVER="server:port"` (eg `rest_api:8080` to point to a container named `rest_api` or `api.opentargets.io:443` to point to the production api on the default 80/443 ports)



## Developing
Clone the repository and install the dependencies.


### Prerequisites

Installation and tests need some node.js tools:
you must have `node.js` and its package manager `npm` installed.  You can get them from [http://nodejs.org/](http://nodejs.org/)

Installing gulp globally also helps
```
npm install -g gulp
```

### Install
Tools are installed via NPM. To run the installer run
```
npm install
npm run setup
```

This installs the required node modules and calls `jspm install` which takes care of all Angular dependencies and 3rd party widgets.
So these commands create three directories:
* `node_modules` - npm packages for the needed tools (http-server and modules for testing); also all Angular code.
* `app/jspm_packages` - some of the packages needed for loading widgets on demand (deferred loading)

Angular code is installed via Bower includes:
* UI Bootstrap (Angular directives)
* Bootstrap (css)
* FontAwesome (css)
* D3


### Build

After you make your changes you will want to build and run the application:

1. set the `APIHOST` env variable to point to a fully functional rest_api. 
Notice that `APIHOST` can be of the form `"https://somesite.com:1234/api/"` (recommended)
 or a simple prefix `/api/` if you are taking care of reverse-proxying the 
 API there (for eg if you are serving the app locally in nginx)
2. (optional) add a `custom.json` with your configurations to override the ones contained in `default.json`
3. run `npm run setup` or `gulp build-all`
4. all the code you need for deployment will be contained in `/app`.
5. to point to a different API (or update your `custom.json`) and not have to rebuild the whole app, you can change the `APIHOST` env var (or `custom.json`) and then run only `gulp build-config` 


### Running the app

Any webserver that can serve the `/app` directory will do.

#### Use a local server

TODO

#### Use an nginx container 

You can run a nginx webserver using docker and mount the app folder as a volume.
We have a container that is derived from `nginx:alpine` which you can use
```sh
docker run -d --name webapp -p 7899:80 -p 7443:443 -v $PWD/webapp/app:/var/www/app quay.io/opentargets/webapp
```
Notice that any change to the code will require you to rebuild the content of the app and possibly restart the nginx container. 
**NB** if you do this with the standard `nginx` container you have to take care to redirect `/proxy` to https://proxy.opentargets.io


You can also build your own container, if you want to change the nginx configuration.

```sh
docker build -t mywebapp .

# wait for the build to finish

docker run -d -p 7899:80 -p 7443:443 mywebapp
# or if you want to keep changing the code, mount the volume:
docker run -d -p 7899:80 -p 7443:443 -v $PWD/webapp/app:/var/www/app mywebapp
```


## Further documentation

### [Plugins](/app/plugins/readme.md)
Read about how to create platform plugins [here](/app/plugins/readme.md).
