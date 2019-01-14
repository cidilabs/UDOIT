#!/bin/bash

# change to the new file location
cd /var/www/html

# run composer install
composer install

# copy localConfig
if [ "$DEPLOYMENT_GROUP_NAME" == "UdoitProd" ]
then
    cp /var/www/deploy/udoit/localConfig.prod.php /var/www/html/config/localConfig.php
else
    cp /var/www/deploy/udoit/localConfig.stage.php /var/www/html/config/localConfig.php
fi

# change localConfig owner
chown ec2-user:apache /var/www/html/config/localConfig.php