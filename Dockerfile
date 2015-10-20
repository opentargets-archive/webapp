FROM debian:jessie

MAINTAINER NGINX Docker Maintainers "docker-maint@nginx.com"

RUN apt-key adv --keyserver hkp://pgp.mit.edu:80 --recv-keys 573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62
RUN echo "deb http://nginx.org/packages/mainline/debian/ jessie nginx" >> /etc/apt/sources.list

ENV NGINX_VERSION 1.9.5-1~jessie

RUN apt-get update && \
    apt-get install -y ca-certificates nginx=${NGINX_VERSION} && \
    rm -rf /var/lib/apt/lists/*

# Install node
RUN apt-get install -y curl && \
curl --silent --location https://deb.nodesource.com/setup_0.12 | bash - && \
apt-get install --yes nodejs


# forward request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log
RUN ln -sf /dev/stderr /var/log/nginx/error.log

# Create directories
RUN mkdir -p /var/www/app /usr/share/nginx_auth /usr/share/nginx_crt

#copy code
COPY ../webapp /opt/share/webapp
RUN cd /opt/share/webapp && node install && node test && cp -r ./app /var/www/app

COPY ./nginx_conf/auth /usr/share/nginx_auth/
COPY ./nginx_conf/server.* /usr/share/nginx_crt/
COPY ./nginx_conf/nginx.conf /etc/nginx/nginx.conf

VOLUME ["/var/cache/nginx"]

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
