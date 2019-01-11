#!/bin/bash

# change to the new file location
cd /var/www/html

# run composer install
composer install

# copy localConfig
if [ "$DEPLOYMENT_GROUP_NAME" == "UdoitProd" ]
then
    cp /home/ec2-user/config/udoit/localConfig.prod.php /var/www/html/config/localConfig.php
else
    cp /home/ec2-user/config/udoit/localConfig.stage.php /var/www/html/config/localConfig.php
fi

# change localconfig owner
chown ec2-user:apache /var/www/html/config/localConfig.php

# run database setup scripts
composer run migrate