FROM nginx:alpine-slim

# Remove default config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy template and entrypoint
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY nginx-ssl.conf.template /etc/nginx/nginx-ssl.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV BASE_URL=/

EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
