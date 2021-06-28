#!/bin/bash
cd /var/www/html

# copy localConfig from S3 if you are not on local
if [ "$ENVIORNMENT_TYPE" != "local" ]
then
    aws s3 cp s3://cidilabs-devops/udoit3/.env.local.$ENVIORNMENT_TYPE /var/www/html/.env.local
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

# Run Cache clear on prod
if [ "$ENVIORNMENT_TYPE" == "prod" ]
then
    php bin/console cache:clear --env=prod
fi