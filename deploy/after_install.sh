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

# change localConfig owner
chown webchuck:apache /var/www/html/config/localConfig.php
chmod 440 /var/www/html/config/localConfig.php

# Cleanup: delete global config folder
#rm -rf /var/www/deploy
