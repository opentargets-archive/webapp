#!/bin/sh


export REST_API_SCHEME=${REST_API_SCHEME:=https}
export REST_API_SERVER=${REST_API_SERVER:=api.targetvalidation.org:443}
export ENSEMBL_API_KEY=${ENSEMBL_API_KEY:=YOUR_KEY_HERE}

# substitute the rest API address in the nginx configuration

envsubst < /etc/nginx/conf.d/app_server.template > /etc/nginx/conf.d/app_server.conf
envsubst '$REST_API_SCHEME:$ENSEMBL_API_KEY' < /etc/nginx/conf.d/rest_api_scheme.template > /etc/nginx/conf.d/rest_api_scheme.conf

# read custom.json and merge it to default.json at _runtime_
gulp build-config

echo "======================================="
echo "POINTING TO REST API"
echo at ${REST_API_SCHEME}://${REST_API_SERVER}
echo "======================================="

# assume that user wants to run his own process,
# for example a `bash` shell to explore this image
exec "$@"
