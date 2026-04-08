#!/bin/sh
set -e

PRESET_API=/etc/nginx/presets/nginx-docker.conf
PRESET_BFF=/etc/nginx/presets/nginx-docker-bff.conf
FRAG=/etc/nginx/snippets/aura-fragment-telemetry.conf
EMPTY=/etc/nginx/presets/nginx-fragment-telemetry-empty.conf
TEMPLATE=/etc/nginx/presets/nginx-fragment-telemetry.conf.template

mkdir -p "$(dirname "$FRAG")"

STACK="${AURA_NGINX_STACK:-api}"
case "$STACK" in
bff)
    cp "$PRESET_BFF" /etc/nginx/conf.d/default.conf
    ;;
*)
    cp "$PRESET_API" /etc/nginx/conf.d/default.conf
    ;;
esac

if [ -n "$AURA_TELEMETRY_PROXY_TARGET" ]; then
    export AURA_TELEMETRY_PROXY_TARGET
    envsubst '${AURA_TELEMETRY_PROXY_TARGET}' <"$TEMPLATE" >"$FRAG"
else
    cp "$EMPTY" "$FRAG"
fi
