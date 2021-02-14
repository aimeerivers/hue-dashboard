# Hue Dashboard

## Build Hue Dashboard

    docker build -t hue .

## Find your Hue hub

    https://discovery.meethue.com/

## Authenticate

See step 3 on https://developers.meethue.com/develop/get-started-2/

## Run Hue Dashboard

    docker run -it --init \
      -p 9000:8080 \
      -v $PWD/src:/usr/src/app/src \
      -v $PWD/public:/usr/src/app/public \
      -v $PWD/server.js:/usr/src/app/server.js \
      -e "HUE_BRIDGE_IP_ADDRESS=<ipaddress>" \
      -e "HUE_USERNAME=<username>" \
      hue

visit http://localhost:9000/


