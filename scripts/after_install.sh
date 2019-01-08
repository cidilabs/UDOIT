#!/bin/bash

# run composer install
composer install

# add ec2-user to apache group (if needed)

# copy localConfig
if [ "$DEPLOYMENT_GROUP_NAME" == "UdoitProd" ]
then
    cp scripts/localConfig.prod.php scripts/localConfig.php
else
    cp scripts/localConfig.stage.php scripts/localConfig.php
fi