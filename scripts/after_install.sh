#!/bin/bash

# change to the new file location
cd /var/www/html

# run composer install
composer install

# copy localConfig
if [ "$DEPLOYMENT_GROUP_NAME" == "UdoitProd" ]
then
    cp /home/ec2-user/config/udoit/localConfig.prod.php scripts/localConfig.php
else
    cp /home/ec2-user/config/udoit/localConfig.stage.php scripts/localConfig.php
fi

# change localconfig owner
chown ec2-user:apache scripts/localConfig.php
