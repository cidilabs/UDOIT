FROM php:7.4-fpm
ARG ENVIRONMENT_TYPE

#Install dependencies and php extensions
RUN apt-get update && apt-get install -y \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        unzip \
        wget \
        supervisor \
        nano \
        less \
        nginx \
    && docker-php-ext-configure gd  \
    && docker-php-ext-install -j$(nproc) gd \
    && docker-php-ext-install pdo_mysql 

#Install node v14
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get update && apt-get install -y nodejs
# install yarn
RUN npm install --global yarn

COPY deploy/nginx/nginx-site.local.conf /etc/nginx/sites-enabled/defaults
COPY deploy/ssl /etc/nginx/conf.d/

#Create user ssm-user
RUN useradd -ms /bin/bash ssm-user
RUN mkdir -p /var/www/html \
    && chown ssm-user:www-data /var/www/html

#install composer
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

#Install symfony
RUN wget https://get.symfony.com/cli/installer -O - | bash && \
    mv /root/.symfony/bin/symfony /usr/local/bin/symfony

#Copy over files
COPY --chown=ssm-user:www-data . /var/www/html/

WORKDIR /var/www/html

ENTRYPOINT [ "sh" ,"deploy/entrypoint.sh"]