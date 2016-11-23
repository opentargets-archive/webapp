FROM debian:jessie

MAINTAINER OpenTargets ops team "ops@opentargets.org"

ENV NGINX_VERSION 1.9.6-1~jessie

RUN apt-key adv --keyserver hkp://pgp.mit.edu:80 --recv-keys 573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62 \
    && echo "deb http://nginx.org/packages/mainline/debian/ jessie nginx" >> /etc/apt/sources.list \
    && apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y \
        ca-certificates \
        nginx=${NGINX_VERSION} \
        openssh-server \
        gettext-base \
        curl \
        git \
        tar \
        bzip2 \
    && curl --silent --location https://deb.nodesource.com/setup_0.12 | bash - \
    && apt-get install --no-install-recommends --no-install-suggests -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# forward request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

# Create directories
RUN mkdir -p /var/www/app /usr/share/nginx_auth /usr/share/nginx_crt /opt/share/webapp

# Trying to exploit docker container layers:
# If the package.json file changes then Docker will re-run the npm install sequence...
# otherwise our modules are cached so we aren't rebuilding them every time we change our apps source code!
COPY package.json /tmp/package.json

RUN cd /tmp \
    && echo 'unsafe-perm = true' > .npmrc \
    && echo 'progress=false' >> .npmrc \
    && npm install \
    && mkdir -p /opt/share/webapp \
    && cp -a /tmp/node_modules /opt/share/webapp/

# From here we load our application's code in, therefore the previous docker
# "layer" thats been cached will be used if possible
WORKDIR /opt/share/webapp

#copy code and run postinstall script & bower deps
COPY . /opt/share/webapp/
RUN /opt/share/webapp/node_modules/.bin/bower install --allow-root \
    && /opt/share/webapp/node_modules/.bin/jspm install \
    && /opt/share/webapp/node_modules/.bin/gulp build-all \
    && cp -r ./app /var/www \
    && rm -rf /opt/share/webapp

COPY ./nginx_conf/server.* /usr/share/nginx_crt/
COPY ./nginx_conf/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx_conf/app_server.template /etc/nginx/conf.d/app_server.template
COPY ./nginx_conf/rest_api_scheme.template /etc/nginx/conf.d/rest_api_scheme.template
COPY ./docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

VOLUME ["/var/cache/nginx"]

ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 80 443 8090

CMD ["nginx", "-g", "daemon off;"]
