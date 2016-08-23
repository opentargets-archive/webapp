FROM debian:jessie

MAINTAINER NGINX Docker Maintainers "docker-maint@nginx.com"

RUN apt-key adv --keyserver hkp://pgp.mit.edu:80 --recv-keys 573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62
RUN echo "deb http://nginx.org/packages/mainline/debian/ jessie nginx" >> /etc/apt/sources.list

ENV NGINX_VERSION 1.9.6-1~jessie

RUN apt-get update && \
    apt-get install -y ca-certificates nginx=${NGINX_VERSION} openssh-server gettext-base curl && \
    curl --silent --location https://deb.nodesource.com/setup_0.12 | bash - && \
    apt-get install --yes nodejs git tar bzip2 && \
    rm -rf /var/lib/apt/lists/*

# forward request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

# Create directories
RUN mkdir -p /var/www/app /usr/share/nginx_auth /usr/share/nginx_crt /opt/share/webapp

#copy code and install node & bower deps
COPY . /opt/share/webapp/
RUN cd /opt/share/webapp && \
    echo 'unsafe-perm = true' > .npmrc && \
    npm install && \
    cp -r ./app /var/www && \
    rm -rf /opt/share/webapp 

COPY ./nginx_conf/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx_conf/app_server.template /etc/nginx/conf.d/app_server.template
COPY ./nginx_conf/rest_api_scheme.template /etc/nginx/conf.d/rest_api_scheme.template
COPY ./docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

VOLUME ["/var/cache/nginx"]

ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
