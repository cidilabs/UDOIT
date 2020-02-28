#!/bin/bash

# change to the new file location
cd /var/www/html

# run composer install
# composer install --no-dev --no-interaction --no-progress --optimize-autoloader

# copy localConfig
if [ "$DEPLOYMENT_GROUP_NAME" == "UdoitProd" ]
then
    cp /var/www/deploy/udoit/localConfig.prod.php /var/www/html/config/localConfig.php
else
    cp /var/www/deploy/udoit/localConfig.stage.php /var/www/html/config/localConfig.php
fi

# copy Cidi Labs copy of UdoitMultiTenant.php
rm /var/www/html/lib/UdoitMultiTenant.php
cp /var/www/html/deploy/UdoitMultiTenant.php /var/www/html/lib/UdoitMultiTenant.php

# copy Cidi Labs copy of udoit.xml.php 
cp /var/www/html/deploy/udoit.xml.php /var/www/html/public/udoit.xml.php

# add HTTPS server setting
echo -e "\n\$_SERVER['HTTPS'] = 'on';" >> /var/www/html/config/settings.php

# add UdoitMultiTentant::setupOauth() to settings.php
echo -e '\n// Setup MultiTenant oauth' >> /var/www/html/config/settings.php
echo -e 'UdoitMultiTenant::setupOauth();' >> /var/www/html/config/settings.php

# change all file and directory permissions to give apache sufficient access
sudo find /var/www/html -type f -exec chmod 664 {} + -o -type d -exec chmod 775 {} +

# change localConfig owner and perms
sudo chown -R webchuck:apache /var/www/html/config/localConfig.php
sudo chmod 440 /var/www/html/config/localConfig.php
