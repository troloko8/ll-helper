#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
config_path="${script_dir}/nginx/nginx.conf"

# Keep this digest in sync with the Nginx version used by the eventual release image.
nginx_image='nginx@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94'

docker run --rm \
  --network none \
  --read-only \
  --tmpfs /run \
  --tmpfs /var/cache/nginx \
  --mount "type=bind,src=${config_path},dst=/etc/nginx/nginx.conf,readonly" \
  --entrypoint nginx \
  "${nginx_image}" \
  -t -c /etc/nginx/nginx.conf
