FROM php:7.4-fpm
ARG ENVIORNMENT_TYPE

#Install dependencies and php extensions
RUN apt-get update && apt-get install -y \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        unzip \
        wget \
        supervisor \
        nginx \
    && docker-php-ext-configure gd  \
    && docker-php-ext-install -j$(nproc) gd \
    && docker-php-ext-install pdo_mysql 

#Install AWS CLI v2
RUN if [ "$ENVIORNMENT_TYPE" != "local" ] ;then  \
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
        && unzip awscliv2.zip \
        && ./aws/install\
    ;fi
#Install node v14
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get update && apt-get install -y nodejs
# install yarn
RUN npm install --global yarn

COPY deploy/nginx/nginx-site.conf /etc/nginx/sites-enabled/default
COPY deploy/nginx/10-php.conf /etc/nginx/conf.d/10-php.conf

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

RUN composer install --no-dev --no-interaction --no-progress --optimize-autoloader

RUN find /var/www/html -type f -exec chmod 664 {} + -o -type d -exec chmod 775 {} +

RUN yarn install

ENTRYPOINT [ "sh" ,"deploy/entrypoint.sh"]