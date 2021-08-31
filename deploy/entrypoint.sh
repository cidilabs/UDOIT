#!/bin/bash
cd /var/www/html

# copy localConfig from S3 if you are not on local and clear cache
if [ "$ENVIRONMENT_TYPE" != "local" ]
then
    aws s3 cp s3://cidilabs-devops/udoit3/.env.local.$ENVIRONMENT_TYPE /var/www/html/.env.local
    php bin/console cache:clear --env=$ENVIRONMENT_TYPE
fi

# compile JS
yarn run encore dev

#run migrations
php bin/console doctrine:migrations:migrate -n

# start queue monitor
/usr/bin/supervisord

# Start Nginx
service nginx start

#Start PHP-FPM
php-fpm