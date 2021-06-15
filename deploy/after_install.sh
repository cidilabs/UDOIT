#!/bin/bash

# change to the new file location
cd /var/www/html

# copy localConfig
if [ "$DEPLOYMENT_GROUP_NAME" == "Udoit3Prod" ]
then
    cp /var/www/deploy/udoit3/.env.local.prod /var/www/html/.env.local
else
    cp /var/www/deploy/udoit3/.env.local.stage /var/www/html/.env.local
fi

# run composer install
composer install --no-dev --no-interaction --no-progress --optimize-autoloader

# change all file and directory permissions to give apache sufficient access
sudo find /var/www/html -type f -exec chmod 664 {} + -o -type d -exec chmod 775 {} +

# create .user.ini file for New Relic (PHP-FPM only)
touch /var/www/html/public/.user.ini

# add New Relic appname
if [ "$DEPLOYMENT_GROUP_NAME" == "Udoit3Prod" ]
then    
    echo -e "\nnewrelic.appname = \"UDOIT 3 Production\"" >> /var/www/html/public/.user.ini
else
    echo -e "\nnewrelic.appname = \"UDOIT 3 Staging\"" >> /var/www/html/public/.user.ini
fi

# compile JS
yarn install
yarn run encore dev


# start queue monitor
sudo /bin/supervisord

# restart apaches
sudo apachectl restart
