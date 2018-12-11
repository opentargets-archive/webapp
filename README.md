Docker container: [![Docker Repository on Quay](https://quay.io/repository/opentargets/webapp/status "Docker Repository on Quay")](https://quay.io/repository/opentargets/webapp)

CircleCI build: [![CircleCI](https://circleci.com/gh/opentargets/webapp.svg?style=svg)](https://circleci.com/gh/opentargets/webapp)

# OpenTargets Web App

This is the web app for the Open Targets Platform, based on the Open Targets REST API.
The app is based on Angular, while D3 is used for visualization and graphs.

## Usage (run your own copy of the webapp)
Depending on how you deploy, you might want to do two things:
- change the API the webapp points to
- apply a `custom.json` config that overrides the value in
  `app/config/<general,dictionary,datatypes,datasources>/default.json`, 

for example to change `evidence_sources` displayed

**NB**: In general, you shouldn't use `custom.json` to override the `{"api":}`
variable of the app, otherwise the deploy steps described below will fail.

### Deploy on netlify
1. Fork the webapp (unless you are a member of the Open Targets team who deploys to production :smile: )
2. (optional) add a `custom.json` to `/app/config/**/` to change your fork's
   configuration. When deploying with netlify, the `custom.json` cannot be
   changed without first commiting it to the code.
2. Set up netlify/github integration, including specifying the build steps
   (`yarn run full-setup`) and the directory served (`app`).
3. Change the `netlify.toml` to point to your API. The app will point to the API
   specified with `APIHOST` in the `netlify.toml` file.
 

### Deploy using our docker container

A docker container with a compiled version of the webapp from a NGINX web server is available on quay.io [![Docker Repository on Quay](https://quay.io/repository/opentargets/webapp/status "Docker Repository on Quay")](https://quay.io/repository/opentargets/webapp)

To run the app locally using the container:
```sh
docker run -d -p 8443:443 -p 8080:80 quay.io/opentargets/webapp
```
Then visit https://localhost:8443

The standard container comes with self-signed certificates, so you will have click through a couple of security warnings to get to the app.


#### If you want to point to the docker container to an API different than the production one:

You can specify the variables:
- `"REST_API_SCHEME=http"` (`http` or `https` are valid option, `https` is the default) 
- `"REST_API_SERVER=server.example.com"` (eg. `rest_api` to point to a container
  named `rest_api` or `api.opentargets.io` to point to the production api.
  production api is the default)
- `"REST_API_PORT=80"` (default is the HTTPS/443 port)

The default value is used for each variable if it's not specified.

```sh
docker run -d -p 8443:443 -p 8080:80 -e "REST_API_SCHEME=https" -e "REST_API_SERVER=devapi.appspot.com" -e "REST_API_PORT=443" quay.io/opentargets/webapp
```

Any other modifications, including changing the `custom.json` for the container,
cannot be made at runtime. You'd have to create your own fork/modifications.
Read on to the developing section.


## Developing (change and contribute to the code)

### Prerequisites

Installation and tests need some node.js tools: you must have `node.js` and its
package manager `npm` installed.  You can get them from
[http://nodejs.org/](http://nodejs.org/)

Installing gulp globally also helps
```
npm install -g gulp
```

### Install
Clone the repository and install the dependencies. Tools are installed via NPM (and yarn)
```sh
git clone https://github.com/opentargets/webapp.git
cd webapp
npm run full-install
## or use yarn directly
yarn run full-install
```


This installs the required node modules and calls `jspm install` which takes
care of all Angular dependencies and 3rd party widgets. So these commands create
three directories:
* `node_modules` - npm packages for the needed tools (http-server and modules
  for testing); also all Angular code.
* `app/jspm_packages` - some of the packages needed for loading widgets on
  demand (deferred loading)

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
2. (optional) add a `custom.json` with your configurations to override the ones
   contained in `default.json`
3. run `yarn run setup` or `gulp build-all`
4. all the code you need for deployment will be contained in `/app`.
5. to point to a different API (or update your `custom.json`) and not have to
   rebuild the whole app, you can change the `APIHOST` env var (or
   `custom.json`) and then run only `gulp build-config` 


### Running the app

Any webserver that can serve the `/app` directory will do. 

**NOTE** to have a fully functional app, you also need to have your web server
to reverse proxy `/proxy` to `https://proxy.opentargets.io`. In nginx this is
achieved with the following change to `nginx.conf`:
```conf
location /proxy/ {
            proxy_pass https://proxy.opentargets.io/;
        }
```

#### Use a local server

TODO

#### Use our nginx container 

You can run a nginx webserver using docker and mount the app folder as a volume.
We have a container that is derived from `nginx:alpine` which you can use
```sh
docker run -d --name webapp -p 7899:80 -p 7443:443 -v $PWD/webapp/app:/var/www/app quay.io/opentargets/webapp
```

Notice that any change to the code will require you to rebuild the content of
the app and possibly restart the nginx container. 

**NB** if you do this with the standard `nginx` container you have to take care
to redirect `/proxy` to https://proxy.opentargets.io


You can also build your own container, if you want to change the nginx configuration.
**NB** before building the container you should have built the app at least once,for eg. with `gulp build-all`

```sh
docker build -t mywebapp .

# wait for the build to finish

docker run -d -p 7899:80 -p 7443:443 mywebapp
# or if you want to keep changing the code, mount the volume:
docker run -d -p 7899:80 -p 7443:443 -v $PWD/webapp/app:/var/www/app mywebapp
```

#### Branch containers

If you push some changes to the branch, a container with the tag of the branch
will be publicly available after a few minutes on quay.io
```sh
docker pull quay.io/opentargets/webapp:<yourbranchname>
```

## Further documentation

### [Plugins](/app/plugins/readme.md)
Read about how to create platform plugins [here](/app/plugins/readme.md).
