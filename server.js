'use strict';

const express = require('express');
const http = require('http');
const cors = require('cors');
const pug = require('pug');

const { callbackify } = require('util');
const { group } = require('console');
const { SCHED_NONE } = require('cluster');

const COLOURS = {
  'adfa9c3e-e9aa-4b65-b9d3-c5b2c0576715': '#fbbbcd', // Blomstrende forår
  'b90c8900-a6b7-422c-a5d3-e170187dbf8c': '#fdefc4', // Koncentrer dig
  '7fd2ccc5-5749-4142-b7a5-66405a676f03': '#fcfbfa', // Få ny energi
  'a1f7da49-d181-4328-abea-68c9dc4b5416': '#ffbb58', // Slap af
  'e101a77f-9984-4f61-aac8-15741983c656': '#fbd181', // Læs
  '8c74b9ba-6e89-4083-a2a7-b10a1e566fed': '#f4c574', // Dæmpet
  '732ff1d9-76a7-4630-aad0-c8acc499bb0b': '#f1c272', // Klar
  '28bbfeff-1a0c-444e-bb4b-0b74b88e0c95': '#fd9d2f', // Natlampe
  '4f2ed241-5aea-4c9d-8028-55d2b111e06f': '#fc8d5a', // Solnedgang i Savannah
  'a6a03e6a-fe6e-45bc-b686-878137f3ba91': '#f08e61', // Tropisk tusmørke
  '1e42b2e8-d02e-40d2-9c8d-b1fd8216c686': '#6de2e0', // Arktisk nordlys
  'd271d202-6856-4633-95ae-953ba73aee64': '#fc6737', // Honolulu
  'cc716363-44c2-4d64-88be-152d74072ea0': '#fb3d54', // Fairfax
  '60f088f5-4224-4f01-bcb1-81ef46099f63': '#8c5fca', // Tokyo
  '63d50cd6-5909-4f7b-8810-137d08f57c54': '#fd4d14', // Chinatown
  '6799326d-e9cd-4b2a-9166-287509f841f3': '#fbd27d', // Gyldent efterår
}

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.use(express.json());
app.use(cors());
app.options('*', cors());
app.set('view engine', 'pug');
app.set('views', './src/views');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  let rooms = [];

  hueRequest('GET', '/groups', {}, function(groupsResponse) {
    let groups = JSON.parse(groupsResponse);
    for(let groupId in groups) {
      let group = groups[groupId];
      if(group.type == 'Room' || group.type == 'Zone') {
        rooms.push({
          id: groupId,
          name: group.name,
          state: group.state,
          scenes: []
        });
      }
    }

    hueRequest('GET', '/scenes', {}, function(scenesResponse) {
      let scenes = JSON.parse(scenesResponse);
      for(let sceneId in scenes) {
        let scene = scenes[sceneId];
        if(scene.type == 'GroupScene' && scene.group && scene.image && COLOURS[scene.image]) {
          console.log(scene.group, scene.type, scene.name, scene.image);
          let room = rooms.find(e => e.id == scene.group);
          room.scenes.push({
            id: sceneId,
            name: scene.name,
            image: scene.image,
            imageUrl: `/images/scenes/${scene.image}.png`,
            colour: COLOURS[scene.image]
          })
        }
      }

      res.render('dashboard', {
        title: 'Dashboard',
        rooms: rooms
      });

    });
  });
});

app.put('/room/:roomId/on/:state', (req, res) => {
  hueRequest('PUT', `/groups/${req.params.roomId}/action`, {"on": req.params.state == 'true'}, function(str) {
    console.log(str);
    res.sendStatus(200);
  });
});

app.put('/room/:roomId/scene/:sceneId', (req, res) => {
  hueRequest('PUT', `/groups/${req.params.roomId}/action`, {"scene": req.params.sceneId}, function(str) {
    console.log(str);
    res.sendStatus(200);
  });
});

app.put('/clock', (req, res) => {
  if(req.body.years) { updateLight(13, req.body.years.rgb); }
  if(req.body.months) { updateLight(12, req.body.months.rgb); }
  if(req.body.days) { updateLight(11, req.body.days.rgb); }
  if(req.body.hours) { updateLight(17, req.body.hours.rgb); }
  if(req.body.minutes) { updateLight(15, req.body.minutes.rgb); }
  // if(req.body.seconds) { updateLight(14, req.body.seconds.rgb); }

  // DEMO
  // if(req.body.years) { updateLight(16, req.body.years.rgb); }
  // if(req.body.months) { updateLight(7, req.body.months.rgb); }
  // if(req.body.days) { updateLight(14, req.body.days.rgb); }
  // if(req.body.hours) { updateLight(13, req.body.hours.rgb); }
  // if(req.body.minutes) { updateLight(12, req.body.minutes.rgb); }
  // if(req.body.seconds) { updateLight(11, req.body.seconds.rgb); }
  
  
  res.sendStatus(200);
});

function hueRequest(method, path, body, callback) {
  var options = {
    host: process.env.HUE_BRIDGE_IP_ADDRESS,
    path: `/api/${process.env.HUE_USERNAME}${path}`,
    port: '80',
    method: method.toUpperCase()
  };

  var req = http.request(options, function(response) {
    var str = ''
    response.on('data', function(chunk) {
      str += chunk;
    });
  
    response.on('end', function() {
      callback(str);
    });
  });
  req.write(JSON.stringify(body));
  req.end();
}

function updateLight(id, value) {
  let parse = /rgb\((\d+), (\d+), (\d+)\)/i.exec(value);
  let red = parse[1];
  let green = parse[2];
  let blue = parse[3];
  let xy = rgbToXy(red, green, blue);

  hueRequest('PUT', `/lights/${id}/state`, {"xy": xy}, function(str) {
    console.log(str);
  });
}

function rgbToXy(red, green, blue) {
  if (red > 0.04045) {
    red = Math.pow((red + 0.055) / (1.0 + 0.055), 2.4);
  }
  else red = (red / 12.92);

  if (green > 0.04045) {
    green = Math.pow((green + 0.055) / (1.0 + 0.055), 2.4);
  }
  else green = (green / 12.92);

  if (blue > 0.04045) {
    blue = Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4);
  }
  else blue = (blue / 12.92);
  
  var X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
  var Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
  var Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;
  var x = X / (X + Y + Z);
  var y = Y / (X + Y + Z);
  return new Array(x,y);
}

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
