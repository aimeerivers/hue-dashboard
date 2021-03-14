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

    curl -X POST http://localhost:9000/light/14/rgb/0/255/0/3

## Background tasks

Instead of calling CURL commands on a timer, we can set up a background task. This is very much work-in-progress and is likely to change in the future.

### Random colours

Set light 1 to a random colour, every second, immediately

    curl -X POST -H \
      "Content-Type: application/json" \
      -d '{"type": "random-same", "lightIds": ["1"], "intervalSeconds": 1, "transitionTimeSeconds": 0}' \
      http://localhost:9000/background

Set lights 1 and 2 to (the same) random colour, every 5 seconds, taking 3 seconds to change

    curl -X POST -H \
      "Content-Type: application/json" \
      -d '{"type": "random-same", "lightIds": ["1", "2"], "intervalSeconds": 5, "transitionTimeSeconds": 3}' \
      http://localhost:9000/background

Set lights 1 and 2 to (probably) different random colours, every second, immediately

    curl -X POST -H \
      "Content-Type: application/json" \
      -d '{"type": "random-different", "lightIds": ["1", "2"], "intervalSeconds": 1, "transitionTimeSeconds": 0}' \
      http://localhost:9000/background

### Cycle colours

Cycle the colours of lights 1, 2, and 3 (to each other), every second, immediately

    curl -X POST -H \
      "Content-Type: application/json" \
      -d '{"type": "cycle", "lightIds": ["1", "2", "3"], "intervalSeconds": 1, "transitionTimeSeconds": 0}' \
      http://localhost:9000/background

Cycle the colours of lights 1, 2, and 3 (to each other), every 30 seconds, with a long, continuous fade

    curl -X POST -H \
      "Content-Type: application/json" \
      -d '{"type": "cycle", "lightIds": ["1", "2", "3"], "intervalSeconds": 30, "transitionTimeSeconds": 30}' \
      http://localhost:9000/background

### Stop after N iterations

By default, the tasks repeat forever. However you can get a task to
delete itself after a given number of iterations with "maxIterations":

    curl -X POST -H \
      "Content-Type: application/json" \
      -d '{"type": "cycle", "lightIds": ["1", "2", "3"], "intervalSeconds": 1, "transitionTimeSeconds": 0, "maxIterations": 5}' \
      http://localhost:9000/background

### The "random-same" and "random-different" tasks

Use these tasks to set the lights to random colours.

 * type: "random-same" or "random-different"
 * lightIds: an array of light IDs / light-ID-groups
 * intervalSeconds: the interval in seconds between updates
 * transitionTimeSeconds: how long to take to transition from one colour to the next
 * phaseDelaySeconds: (optional) How long to wait between updating one light and the next
 * maxIterations: (optional) delete the task after this many iterations

The difference between "random-same" and "random-different" is that
with "random-same", on each iteration of the task, all lights get the
same random colour; whereas with "random-different", each light gets a
_(potentially) different_ random colour.

Use "phaseDelaySeconds" to add a delay between updating one light and the next.
For example,
```
   {
     "type": "random-same",
     "lightIds": ["1", "2", "3"],
     "intervalSeconds": 5,
     "transitionTimeSeconds": 0,
     "phaseDelaySeconds": 1,
   }
```
would pick a random colour, then update light #1 to it; then wait 1 second,
and update light #2; then wait 1 second again, and update light #3; then wait
5 seconds, before starting again.

A "light-ID-group" is simply an array of light IDs which always get updated
together. For example,
```
   {
     "type": "random-same",
     "lightIds": ["1", "2", ["3", "4", "5"]],
     "intervalSeconds": 5,
     "transitionTimeSeconds": 0,
     "phaseDelaySeconds": 1,
   }
```
would pick a random colour, then update light #1 to it; then wait 1 second,
and update light #2; then wait 1 second again, and update lights #3, #4 and #5
together; then wait 5 seconds, before starting again.

### List background tasks

Get a list of background tasks that are currently running

    curl -X GET http://localhost:9000/background

### Stop background tasks

Stop the background task with id 1

    curl -X DELETE http://localhost:9000/background/1

Stop all background tasks

    curl -X DELETE http://localhost:9000/background
