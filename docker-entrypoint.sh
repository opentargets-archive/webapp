#!/bin/bash

set -e

: ${REST_API_SCHEME:=https}
: ${REST_API_SERVER:=www.targetvalidation.org:443}

envsubst < /etc/nginx/conf.d/app_server.template > /etc/nginx/conf.d/app_server.conf
envsubst '$REST_API_SCHEME' < /etc/nginx/conf.d/rest_api_scheme.template > /etc/nginx/conf.d/rest_api_scheme.conf

# As argument is not related to elasticsearch,
# then assume that user wants to run his own process,
# for example a `bash` shell to explore this image
exec "$@"