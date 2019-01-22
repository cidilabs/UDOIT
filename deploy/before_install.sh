#!/bin/bash

# change permissions to /var/www
#chown -R apache:apache /var/www
#chmod -R 775 /var/www

# remove all files in /var/www/html
rm -rf /var/www/html/*
