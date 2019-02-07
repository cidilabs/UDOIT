#!/bin/bash

# change to the new file location
cd /var/www/html

# run composer install
composer install --no-dev --no-interaction --no-progress --optimize-autoloader

# copy localConfig
if [ "$DEPLOYMENT_GROUP_NAME" == "UdoitProd" ]
then
    cp /var/www/deploy/udoit/localConfig.prod.php /var/www/html/config/localConfig.php
else
    cp /var/www/deploy/udoit/localConfig.stage.php /var/www/html/config/localConfig.php
fi

# change all file and directory permissions to give apache sufficient access
find /var/www/html -type f -exec chmod 664 {} + -o -type d -exec chmod 775 {} +

# change localConfig owner and perms
chown -R webchuck:apache /var/www/html/config/localConfig.php
chmod 440 /var/www/html/config/localConfig.php
