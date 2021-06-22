#!/bin/bash

# copy localConfig from S3 if you are not on local
if [ "$ENVIORNMENT_TYPE" != "local" ]
then
    aws s3 cp s3://cidilabs-devops/udoit3/.env.local.$ENVIORNMENT_TYPE /var/www/html/.env.local
fi

# only setup newrelic if not on local.
if [ "$ENVIORNMENT_TYPE" != "local" ]
then
    # create .user.ini file for New Relic (PHP-FPM only)
    curl -L https://download.newrelic.com/php_agent/release/newrelic-php5-9.17.1.301-linux.tar.gz | tar -C /tmp -zx && \
    export NR_INSTALL_USE_CP_NOT_LN=1 && \
    export NR_INSTALL_SILENT=1 && \
    /tmp/newrelic-php5-*/newrelic-install install && \
    rm -rf /tmp/newrelic-php5-* /tmp/nrinstall* && \
    sed -i \
      -e 's/"$NEW_RELIC_LICENSE_KEY"/"YOUR_LICENSE_KEY"/' \
      -e 's/newrelic.appname = "PHP Application"/newrelic.appname = "$NEW_RELIC_APP_NAME"/' \
      -e 's/;newrelic.daemon.app_connect_timeout =.*/newrelic.daemon.app_connect_timeout=15s/' \
      -e 's/;newrelic.daemon.start_timeout =.*/newrelic.daemon.start_timeout=5s/' \
      /usr/local/etc/php/conf.d/newrelic.ini
fi

# compile JS
yarn run encore dev

#run migrations
php bin/console --no-interaction doctrine:migrations:migrate

# start queue monitor
/usr/bin/supervisord

# Start Nginx
service nginx start

#Start PHP-FPM
php-fpm

#change owner of all files.
chown -R ssm-user:www-data /var/www/html