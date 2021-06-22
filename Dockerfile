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

#Install New Relic
RUN echo 'deb http://apt.newrelic.com/debian/ newrelic non-free' | sudo tee /etc/apt/sources.list.d/newrelic.list && \
    wget -O- https://download.newrelic.com/548C16BF.gpg | sudo apt-key add -

RUN apt-get update -y

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y newrelic-php5

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
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

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