
docker run -it --init \
  -p 9000:8080 \
  -v $PWD/src:/usr/src/app/src \
  -v $PWD/public:/usr/src/app/public \
  -v $PWD/server.js:/usr/src/app/server.js \
  -e "HUE_BRIDGE_IP_ADDRESS=<ipaddress>" \
  -e "HUE_USERNAME=<username>" \
  hue

http://localhost:9000/

PUT http://localhost:9000/clock

