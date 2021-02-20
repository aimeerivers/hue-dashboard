#!/bin/bash

docker build -t hue-dashboard .

[ -f .env ] && source .env

exec docker run -it --init \
  -p 9000:9000 \
  -e "HUE_BRIDGE_IP_ADDRESS=$HUE_BRIDGE_IP_ADDRESS" \
  -e "HUE_USERNAME=$HUE_USERNAME" \
  -v $PWD/public:/usr/src/app/public \
  hue-dashboard
