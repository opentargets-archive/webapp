Docker container: [![Docker Repository on Quay](https://quay.io/repository/opentargets/webapp/status "Docker Repository on Quay")](https://quay.io/repository/opentargets/webapp)


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
 

### Deploy using our docker image

A docker image with a compiled version of the webapp from a NGINX web server is available on quay.io [![Docker Repository on Quay](https://quay.io/repository/opentargets/webapp/status "Docker Repository on Quay")](https://quay.io/repository/opentargets/webapp)

To start a container locally using the image:
```sh
docker run -d -p 8443:443 -p 8080:80 quay.io/opentargets/webapp
```
Then visit https://localhost:8443

The standard image comes with self-signed certificates, so you will have click through a couple of security warnings to get to the app.
To add your own certificates, run something like this:

```sh
docker run -d -p 8443:443 -p 8080:80 \
 -v <my_ssl_dir>/server.crt:/usr/share/nginx/server.crt \
 -v <my_ssl_dir>/server.key:/usr/share/nginx/server.key \
 quay.io/opentargets/webapp
```

#### If you want to point to the docker container to an API server different than the production one:

You can specify the variables:
- `REST_API_SCHEME` (`http` or `https` are valid options, `https` is the default) 
- `REST_API_SERVER` (e.g. `rest_api` to point to a container
   named `rest_api` or `api.opentargets.io` to point to the production api; `platform-api.opentargets.io` is the default)
- `REST_API_PORT` (default is the HTTPS/443 port)

Example: 

```sh
docker run -d -p 8443:443 -p 8080:80 \
 -e "REST_API_SCHEME=https" \
 -e "REST_API_SERVER=devapi.appspot.com" \
 -e "REST_API_PORT=443" \
 quay.io/opentargets/webapp
```

By default, the webapp /proxy should redirect to the proxy that is built into the rest api container.
But it is also possible to specify a separate server for all /proxy calls (calls to external services and data resources used in some
pages). These are the variables:
- `PROXY_SCHEME` (`http` or `https` are valid options, `$REST_API_SCHEME` is the default)
- `PROXY_SERVER` (if not set, `$REST_API_SERVER` is the default)
- `PROXY_PORT` (if not set, `$REST_API_PORT` is the default)
- `PROXY_PATH` (if not set, `proxy` is the default)

:information_source: When using the rest api built-in proxy, additional domains can be included by adding them to the appropriate nginx
configuration file. See https://github.com/opentargets/rest_api/ documentation for more details.

Any other modifications, including changing the `custom.json` for the container,
cannot be made at runtime. You'd have to create your own fork/modifications.
Read on to the developing section.


## Developing (change and contribute to the code)

### Build environment

The script `build_webapp.sh` will install the various dependencies needed to build the web application from source, assuming you're on a Debian (or Debian-like) machine.

Note that you will need to set the `APIHOST` environment variable to point to your own REST API server if you're not using the default http://platform-api.opentargets.io

If you need to make any customisations to the web application code, you'll need to run `yarn setup` and `yarn build-all` after each change.

Once the build has completed, the code required for deployment will be in `app/`

### Running the app

You can test your build with Yarn's built-in web server via `yarn run server` from the `webapp` directory - this should not be used in production.

Any webserver that can serve the `/app` directory will do. 

**NOTE** to have a fully functional app, you also need to have your web server reverse proxy `/proxy` to a valid REST API server. See how the build and deployment is done for Nginx in the `Dockerfile` of this project.

### Building custom images using docker

#### Use our Nginx based Dockerfile 

You can run a nginx webserver using docker.
We have a `Dockerfile` that is derived from `nginx:alpine` which you can use.

To build:
```sh
docker build . -t webapp-image
```

To run: see section **"Deploy using our docker image"** above.

If you want to change the nginx configuration, you can change the [nginx_conf/nginx.template](nginx_conf/nginx.template)
before running the build step above.

### Branch images on quay

If you push some changes to a branch of the _main_ repo, a container with the tag of the branch
will be publicly available after a few minutes on quay.io
```sh
docker pull quay.io/opentargets/webapp:<yourbranchname>
```

## Further documentation

### [Plugins](/app/plugins/readme.md)
Read about how to create platform plugins [here](/app/plugins/readme.md).
