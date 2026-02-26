#!/bin/sh
set -e

BASE_URL="${BASE_URL:-/}"

# Rewrite <base href="/"> to the configured BASE_URL
sed -i "s|<base href=\"/\">|<base href=\"${BASE_URL}\">|g" /usr/share/nginx/html/index.html

echo "Base URL set to: ${BASE_URL}"
