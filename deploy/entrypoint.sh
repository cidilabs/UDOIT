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
    touch /var/www/html/public/.user.ini
    # add New Relic appname 
    echo -e "\nnewrelic.appname = \"$NEW_RELIC_APP_NAME\"" >> /var/www/html/public/.user.ini
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