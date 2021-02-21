# Hue Dashboard

## Build Hue Dashboard

    docker build -t hue-dashboard .

## Find your Hue hub

Find an IP address here https://discovery.meethue.com/

## Authenticate

See step 3 on https://developers.meethue.com/develop/get-started-2/

## Run Hue Dashboard

    docker run -it --init \
      -p 9000:9000 \
      -v $PWD/src:/usr/src/app/src \
      -v $PWD/public:/usr/src/app/public \
      -e "HUE_BRIDGE_IP_ADDRESS=<ipaddress>" \
      -e "HUE_USERNAME=<username>" \
      hue-dashboard

visit http://localhost:9000/


