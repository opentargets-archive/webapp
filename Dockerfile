FROM nginx:alpine

# use jq to update custom.json at runtime
RUN apk update && apk add jq

# copy built app - npm install && npm run setup need to have happened
COPY ./app /var/www/app/

#move self-signed certificates in the right place
COPY ./nginx_conf/server.crt /usr/share/nginx/
COPY ./nginx_conf/server.key /usr/share/nginx/

#move nginx.template in the right place
COPY ./nginx_conf/nginx.template /etc/nginx/nginx.template

VOLUME /var/cache/nginx

COPY ./docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 80 443
WORKDIR /var/www/app
CMD ["nginx", "-g", "daemon off;"]
