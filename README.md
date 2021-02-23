# Hue Dashboard

## Find your Hue hub

Find an IP address here https://discovery.meethue.com/

## Authenticate

See step 3 on https://developers.meethue.com/develop/get-started-2/

## Configure

    cp .env.example .env

then fill in the IP address and Hue username.

## Run Hue Dashboard

You can either build and run the dashboard in Docker:

    ./run-docker

Or, if you prefer, locally:

    ./run-local

Either way, then go to http://localhost:9000/

## Special commands

There are lots of cool little tricks that you can use, currently only through CURL commands. Here are some examples.

### Specific colours (using r/g/b values)

Set light 1 to red

    curl -X POST http://localhost:9000/light/1/rgb/255/0/0

Set light 1 to yellow, immediately

    curl -X POST http://localhost:9000/light/14/rgb/255/255/115/0

Set light 1 to green, taking 3 seconds to change

    curl -X POST http://localhost:9000/light/14/rgb/0/255/0/30

### Random colours

Set light 1 to a random colour

    curl -X POST http://localhost:9000/light/1/random

Set light 1 to a random colour, immediately

    curl -X POST http://localhost:9000/light/1/random/0

Set light 1 to a random colour, taking 3 seconds to change

    curl -X POST http://localhost:9000/light/1/random/30

### Cycle colours around a room/zone

Cycle colours in group 1

    curl -X POST http://localhost:9000/group/1/cycle

Cycle colours in group 1, immediately

    curl -X POST http://localhost:9000/group/1/cycle/0

Cycle colours in group 1, taking 5 seconds to change

    curl -X POST http://localhost:9000/group/1/cycle/50
