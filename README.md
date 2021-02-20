# Hue Dashboard

## Build Hue Dashboard

    docker build -t hue-dashboard .

## Find your Hue hub

Find an IP address here https://discovery.meethue.com/

## Authenticate

See step 3 on https://developers.meethue.com/develop/get-started-2/

## Configure

    cp .env.example .env
    
Then edit `.env` and fill in the values.

## Run Hue Dashboard

    ./run.sh

visit http://localhost:9000/
