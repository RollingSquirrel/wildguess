#!/bin/sh
set -e

BASE_URL="${BASE_URL:-/}"
export BASE_URL

# Select template based on SSL configuration
if [ -n "${SSL_CERT}" ] && [ -n "${SSL_KEY}" ] && [ -f "${SSL_CERT}" ] && [ -f "${SSL_KEY}" ]; then
    TEMPLATE="/etc/nginx/nginx-ssl.conf.template"
    export SSL_CERT SSL_KEY
    echo "SSL enabled: cert=${SSL_CERT}, key=${SSL_KEY}"
    envsubst '${BASE_URL} ${SSL_CERT} ${SSL_KEY}' < "${TEMPLATE}" > /etc/nginx/nginx.conf
else
    TEMPLATE="/etc/nginx/nginx.conf.template"
    echo "SSL disabled (no SSL_CERT/SSL_KEY provided), running HTTP only"
    envsubst '${BASE_URL}' < "${TEMPLATE}" > /etc/nginx/nginx.conf
fi

echo "Nginx configured with BASE_URL=${BASE_URL}"

exec nginx -g 'daemon off;'
