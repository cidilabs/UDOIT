FROM php:7.4-fpm
ARG ENV_TYPE
ARG NEW_RELIC_KEY
ARG NEW_RELIC_NAME
ENV ENVIORNMENT_TYPE=$ENVIORNMENT_TYPE
ENV NEW_RELIC_APP_NAME=${NEW_RELIC_NAME}
ENV NEW_RELIC_LICENSE_KEY=${NEW_RELIC_KEY}


#Install dependencies and php extensions
RUN apt-get update && apt-get install -y \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        unzip \
        wget \
        supervisor \
        nginx \
    && docker-php-ext-configure gd  \
    && docker-php-ext-install -j$(nproc) gd \
    && docker-php-ext-install pdo_mysql 

#Install AWS CLI v2
RUN if [ "$ENVIORNMENT_TYPE" != "local" ] ;then  \
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
        && unzip awscliv2.zip \
        && ./aws/install\
    ;fi

#Install node v14
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get update && apt-get install -y nodejs
# install yarn
RUN npm install --global yarn

COPY deploy/nginx/nginx-site.conf /etc/nginx/sites-enabled/default
COPY deploy/nginx/10-php.conf /etc/nginx/conf.d/10-php.conf

#Create user ssm-user
RUN useradd -ms /bin/bash ssm-user
RUN mkdir -p /var/www/html \
    && chown ssm-user:www-data /var/www/html

#install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

#Install symfony
RUN wget https://get.symfony.com/cli/installer -O - | bash && \
    mv /root/.symfony/bin/symfony /usr/local/bin/symfony

#Install New Relic
RUN \
  curl -L https://download.newrelic.com/php_agent/release/newrelic-php5-9.17.1.301-linux.tar.gz | tar -C /tmp -zx && \
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

#Copy over files
COPY --chown=ssm-user:www-data . /var/www/html/

WORKDIR /var/www/html

RUN composer install --no-dev --no-interaction --no-progress --optimize-autoloader

RUN yarn install

RUN find /var/www/html -type f -exec chmod 664 {} + -o -type d -exec chmod 775 {} +

RUN chmod -R 775 /var/www/html

# RUN chown -R ssm-user:www-data /var/www/html

ENTRYPOINT [ "sh" ,"deploy/entrypoint.sh"]