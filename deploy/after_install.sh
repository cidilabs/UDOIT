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

# enable scoped developer keys
echo -e "\n\$oauth2_enforce_scopes = true; // For scoped developer keys" >> /var/www/html/config/localConfig.php

# add unscannable files list
echo -e "\n\$unscannable_file_types = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'swf']; // unscannable file types" >> /var/www/html/config/localConfig.php

# add HTTPS server setting
echo -e "\n\$_SERVER['HTTPS'] = 'on';" >> /var/www/html/config/settings.php

# add UdoitMultiTentant::setupOauth() to settings.php
echo -e '\n// Setup MultiTenant oauth' >> /var/www/html/config/settings.php
echo -e 'UdoitMultiTenant::setupOauth();' >> /var/www/html/config/settings.php

# change all file and directory permissions to give apache sufficient access
sudo find /var/www/html -type f -exec chmod 664 {} + -o -type d -exec chmod 775 {} +

# change localConfig owner and perms
sudo chown -R ssm-user:apache /var/www/html/config/localConfig.php
sudo chmod 440 /var/www/html/config/localConfig.php

# copy UDOIT Cloud logo
rm /var/www/html/public/assets/img/udoit_cloud_icon.png
cp /var/www/html/deploy/udoit_cloud_icon.png /var/www/html/public/assets/img/udoit_cloud_icon.png

# make folders writeable by webserver
sudo chmod 775 /var/www/html/config
sudo chmod 775 /var/www/html/public/reports
sudo chmod -R 775 /var/www/html/vendor/mpdf

# add New Relic appname
if [ "$DEPLOYMENT_GROUP_NAME" == "UdoitProd" ]
then
    echo -e "\nnewrelic.appname = \"UDOIT Production\"" >> /etc/php.d/newrelic.ini
else
    echo -e "\nnewrelic.appname = \"UDOIT Staging\"" >> /etc/php.d/newrelic.ini
fi

sudo apachectl restart
