ARG BASE_IMAGE
FROM ${BASE_IMAGE}
# FROM 269504728572.dkr.ecr.us-east-1.amazonaws.com/base-image:php-7.4-base-image-v0.0.1
ARG NEW_RELIC_KEY
ARG NEW_RELIC_NAME
ENV NEW_RELIC_APP_NAME=${NEW_RELIC_NAME}
ENV NEW_RELIC_LICENSE_KEY=${NEW_RELIC_KEY}

#Configure Nginx
COPY deploy/nginx/nginx-site.conf /etc/nginx/sites-enabled/default

# Copy PHP .ini
COPY deploy/php-config/custom_php.ini /usr/local/etc/php/conf.d/custom_php.ini
RUN sed -i 's/pm.max_children\s*=.*/pm.max_children = 25/g' /usr/local/etc/php-fpm.d/www.conf

COPY deploy/supervisor/messenger-worker.conf /etc/supervisor/conf.d/messenger-worker.conf
#Install New Relic
RUN \
  curl -L https://download.newrelic.com/php_agent/release/newrelic-php5-9.18.1.303-linux.tar.gz | tar -C /tmp -zx && \
    export NR_INSTALL_USE_CP_NOT_LN=1 && \
    export NR_INSTALL_SILENT=1 && \
    /tmp/newrelic-php5-*/newrelic-install install && \
    rm -rf /tmp/newrelic-php5-* /tmp/nrinstall* && \
    sed -i \
      -e 's/"REPLACE_WITH_REAL_KEY"/'"$NEW_RELIC_LICENSE_KEY"'/' \
      -e 's/newrelic.appname = "PHP Application"/newrelic.appname = '"$NEW_RELIC_APP_NAME"'/' \
      -e 's/;newrelic.daemon.app_connect_timeout =.*/newrelic.daemon.app_connect_timeout=15s/' \
      -e 's/;newrelic.daemon.start_timeout =.*/newrelic.daemon.start_timeout=5s/' \
      /usr/local/etc/php/conf.d/newrelic.ini
      
COPY --chown=ssm-user:www-data . /var/www/html/

WORKDIR /var/www/html

RUN composer install --no-dev --no-interaction --no-progress --optimize-autoloader

RUN yarn install

COPY deploy/entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT [ "sh" ,"/usr/local/bin/entrypoint.sh"]