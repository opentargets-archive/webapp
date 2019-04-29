#!/bin/sh

#setup defaults for environment variables
export REST_API_SCHEME=${REST_API_SCHEME:=https}
export REST_API_SERVER=${REST_API_SERVER:=platform-api.opentargets.io}
export REST_API_PORT=${REST_API_PORT:=443}
export PROXY_SCHEME=${PROXY_SCHEME:=$REST_API_SCHEME}
export PROXY_SERVER=${PROXY_SERVER:=$REST_API_SERVER}
export PROXY_PORT=${PROXY_PORT:=$REST_API_PORT}
export PROXY_PATH=${PROXY_PATH:=proxy}


# substitute the rest API address in the nginx configuration

envsubst '$REST_API_SCHEME $REST_API_SERVER $REST_API_PORT $PROXY_SCHEME $PROXY_SERVER $PROXY_PORT $PROXY_PATH' < /etc/nginx/nginx.template > /etc/nginx/nginx.conf

echo "======================================="
echo "INFO >>> /api is pointing to : ${REST_API_SCHEME}://${REST_API_SERVER}:${REST_API_PORT}"
echo "INFO >>> /proxy is pointing to : ${PROXY_SCHEME}://${PROXY_SERVER}:${PROXY_PORT}/${PROXY_PATH}"
echo "======================================="

# assume that user wants to run his own process,
# for example a `bash` shell to explore this image
exec "$@"
