#!/bin/sh
set -eu

mkdir -p \
    /tmp/community-garden/bootstrap \
    "${LARAVEL_STORAGE_PATH}/framework/cache/data" \
    "${LARAVEL_STORAGE_PATH}/framework/sessions" \
    "${LARAVEL_STORAGE_PATH}/framework/views" \
    "${LARAVEL_STORAGE_PATH}/logs"

php artisan config:cache --no-ansi
php artisan route:cache --no-ansi
php artisan view:cache --no-ansi

exec "$@"
