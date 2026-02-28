#!/bin/sh
set -e

BASE_URL="${BASE_URL:-/}"
API_HOST="${API_HOST:-api}"
API_PORT="${API_PORT:-3000}"
CLIENT_HOST="${CLIENT_HOST:-client}"
CLIENT_PORT="${CLIENT_PORT:-80}"

export BASE_URL API_HOST API_PORT CLIENT_HOST CLIENT_PORT

# Select template based on SSL configuration
if [ -n "${SSL_CERT}" ] && [ -n "${SSL_KEY}" ] && [ -f "${SSL_CERT}" ] && [ -f "${SSL_KEY}" ]; then
    TEMPLATE="/etc/nginx/nginx-ssl.conf.template"
    export SSL_CERT SSL_KEY
    echo "SSL enabled: cert=${SSL_CERT}, key=${SSL_KEY}"
    envsubst '${BASE_URL} ${API_HOST} ${API_PORT} ${CLIENT_HOST} ${CLIENT_PORT} ${SSL_CERT} ${SSL_KEY}' < "${TEMPLATE}" > /etc/nginx/nginx.conf
else
    TEMPLATE="/etc/nginx/nginx.conf.template"
    echo "SSL disabled (no SSL_CERT/SSL_KEY provided), running HTTP only"
    envsubst '${BASE_URL} ${API_HOST} ${API_PORT} ${CLIENT_HOST} ${CLIENT_PORT}' < "${TEMPLATE}" > /etc/nginx/nginx.conf
fi

echo "Nginx configured with BASE_URL=${BASE_URL}, API=${API_HOST}:${API_PORT}, CLIENT=${CLIENT_HOST}:${CLIENT_PORT}"

exec nginx -g 'daemon off;'
