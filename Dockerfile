FROM: nginx-alpine

# use jq to update custom.json at runtime
RUN apk update && apk add jq

# copy built app - npm install && npm run setup need to have happened
COPY ./app /var/www/

#move self-signed certificates in the right place
COPY ./nginx_conf/server.crt /usr/share/nginx/
COPY ./nginx_conf/server.key /usr/share/nginx/

#move nginx.conf and template in the right place
COPY ./nginx_conf/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx_conf/app_server.template /etc/nginx/conf.d/app_server.template
COPY ./nginx_conf/rest_api_scheme.template /etc/nginx/conf.d/rest_api_scheme.template

VOLUME /var/cache/nginx

COPY ./docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 80 443
WORKDIR /var/www/app
CMD ["nginx", "-g", "daemon off;"]
