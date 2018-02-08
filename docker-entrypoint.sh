#!/bin/sh


export REST_API_SCHEME=${REST_API_SCHEME:=https}
export REST_API_SERVER=${REST_API_SERVER:=api.opentargets.io}
export REST_API_PORT=${REST_API_PORT:=443}


# substitute the rest API address in the nginx configuration

# envsubst < /etc/nginx/conf.d/app_server.template > /etc/nginx/conf.d/app_server.conf
envsubst '$REST_API_SCHEME $REST_API_SERVER $REST_API_PORT' < /etc/nginx/nginx.template > /etc/nginx/nginx.conf

# /etc/nginx/conf.d/rest_api_scheme.template > /etc/nginx/conf.d/rest_api_scheme.conf

echo "======================================="
echo "INFO >>> /api is pointing to : ${REST_API_SCHEME}://${REST_API_SERVER}:${REST_API_PORT}"
echo "======================================="

# assume that user wants to run his own process,
# for example a `bash` shell to explore this image
exec "$@"
