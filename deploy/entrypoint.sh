#!/bin/bash

find /var/www/html -type f -exec chmod 664 {} + -o -type d -exec chmod 775 {} +

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


#change owner of all files.
chown -R ssm-user:www-data /var/www/html