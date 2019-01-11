#!/bin/bash

# change permissions to /var/www
sudo chown -R apache:apache /var/www
sudo chmod -R 775 /var/www

# remove all files in /var/www/html
sudo rm -rf /var/www/html/*
