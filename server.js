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
  const promiseRooms = getGroups().then(groups => {
    let rooms = [];

    for(let groupId in groups) {
      let group = groups[groupId];
      if(group.type == 'Room' || group.type == 'Zone') {
        let colour = "";
        if(group.state.any_on) {
          if(group.action.xy && group.action.bri) {
            colour = xyBriToHex(group.action.xy[0], group.action.xy[1], group.action.bri);
          } else if(group.action.colormode == 'ct') {
            colour = ctToHex(group.action.ct);
          }
        }
        rooms.push({
          id: groupId,
          name: group.name,
          state: group.state,
          colour: colour,
          scenes: []
        });
      }
    }

    return rooms;
  });

  Promise.all([promiseRooms, getScenes()]).then(([rooms, scenes]) => {
    for (let sceneId in scenes) {
      let scene = scenes[sceneId];
      if (scene.type == 'GroupScene' && scene.group) {
        let room = rooms.find(e => e.id == scene.group);
        if (room) {
          room.scenes.push({
            id: sceneId,
            name: scene.name,
            image: scene.image,
            imageUrl: `/images/scenes/${scene.image}.png`,
            colour: COLOURS[scene.image]
          })
        }
      }
    }

    res.render('dashboard', {
      title: 'Hue Dashboard',
      rooms: rooms
    });
  });
});

app.put('/room/:roomId/on/:state', (req, res) =>
  hueRequest('PUT', `/groups/${req.params.roomId}/action`, {"on": req.params.state == 'true'})
    .then(str => {
      console.log(str);
      res.sendStatus(200);
    })
);

app.put('/room/:roomId/scene/:sceneId', (req, res) =>
  hueRequest('PUT', `/groups/${req.params.roomId}/action`, {"scene": req.params.sceneId})
    .then(str => {
      console.log(str);
      res.sendStatus(200);
    })
);

app.post('/light/:lightId/rgb/:r/:g/:b/:time?', (req, res) => {
  let transitionTime;
  if (req.params.time) transitionTime = parseInt(req.params.time);
  if (transitionTime === NaN) transitionTime = 4;

  const lightId = parseInt(req.params.lightId);

  const xy = rgbToXy(
    parseInt(req.params.r),
    parseInt(req.params.g),
    parseInt(req.params.b),
  );

  hueRequest('PUT', `/lights/${lightId}/state`, {"xy": xy, "transitiontime": transitionTime})
    .then(() => res.sendStatus(200));
});

app.post('/light/:lightId/random/:time?', (req, res) => {
  let transitionTime;
  if (req.params.time) transitionTime = parseInt(req.params.time);
  if (transitionTime === NaN) transitionTime = 4;

  const lightId = parseInt(req.params.lightId);
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  const xy = rgbToXy(r, g, b);

  hueRequest('PUT', `/lights/${lightId}/state`, {"xy": xy, "transitiontime": transitionTime})
    .then(() => res.sendStatus(200));
});

app.post('/group/:groupId/cycle/:time?', (req, res) =>
  Promise.all([
    hueRequest('GET', `/groups/${req.params.groupId}`, {}),
    getLights(),
  ]).then(([group, allLights]) => {
    let transitionTime;
    if(req.params.time) transitionTime = parseInt(req.params.time);
    if(transitionTime === NaN) transitionTime = 4;
    const colourLightIdsInThisGroup = group.lights
      .filter(id => allLights[id].state.reachable && allLights[id].state.on && allLights[id].state.xy)
      .sort();

    return Promise.all(
      colourLightIdsInThisGroup.map((lightId, index) => {
        const nextLightId = colourLightIdsInThisGroup[(index + 1) % colourLightIdsInThisGroup.length];
        const xy = allLights[nextLightId].state.xy;
        hueRequest('PUT', `/lights/${lightId}/state`, {"xy": xy, "transitiontime": transitionTime});
      })
    );
  }).then(() => {
    res.sendStatus(200);
  })
);

app.put('/clock', (req, res) => {
  // if(req.body.years) { updateLight(13, req.body.years.rgb); }
  // if(req.body.months) { updateLight(12, req.body.months.rgb); }
  // if(req.body.days) { updateLight(11, req.body.days.rgb); }
  // if(req.body.hours) { updateLight(17, req.body.hours.rgb); }
  // if(req.body.minutes) { updateLight(15, req.body.minutes.rgb); }
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

const getGroups = () =>
  hueRequest('GET', '/groups', {});

const getScenes = () =>
  hueRequest('GET', '/scenes', {});

const getLights = () =>
  hueRequest('GET', '/lights', {});

const hueRequest = (method, path, body) => new Promise((resolve, reject) => {
  var options = {
    host: process.env.HUE_BRIDGE_IP_ADDRESS,
    path: `/api/${process.env.HUE_USERNAME}${path}`,
    port: '80',
    method: method.toUpperCase()
  };

  var req = http.request(options, function(response) {
    console.log(`${method} ${path} => ${response.statusCode} ${response.statusMessage}`);

    if (response.statusCode !== 200) {
      reject(`HTTP response status is ${response.statusCode} ${response.statusMessage}`);
    }

    var str = ''
    response.on('data', function(chunk) {
      str += chunk;
    });

    response.on('end', function() {
      resolve(JSON.parse(str));
    });
  });

  req.write(JSON.stringify(body));
  req.end();
});

function updateLight(id, value) {
  let parse = /rgb\((\d+), (\d+), (\d+)\)/i.exec(value);
  let red = parse[1];
  let green = parse[2];
  let blue = parse[3];
  let xy = rgbToXy(red, green, blue);

  return hueRequest('PUT', `/lights/${id}/state`, {"xy": xy});
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

function rgbToHex(red, green, blue) {
  let r = Math.round(red).toString(16);
  let g = Math.round(green).toString(16);
  let b = Math.round(blue).toString(16);

  if (r.length < 2) r = "0" + r;
  if (g.length < 2) g = "0" + g;
  if (b.length < 2) b = "0" + b;
  return `#${r}${g}${b}`;
}

function xyBriToHex(x, y, bri) {
  let rgb = xyBriToRgb(x, y, bri);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function xyBriToRgb(x, y, bri) {
  let z = 1.0 - x - y;
  let Y = bri / 255.0; // Brightness of lamp
  let X = (Y / y) * x;
  let Z = (Y / y) * z;
  let r = X * 1.612 - Y * 0.203 - Z * 0.302;
  let g = -X * 0.509 + Y * 1.412 + Z * 0.066;
  let b = X * 0.026 - Y * 0.072 + Z * 0.962;
  r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
  g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
  b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
  let maxValue = Math.max(r,g,b);
  r /= maxValue;
  g /= maxValue;
  b /= maxValue;

  r = Math.round(r * 255); if(r < 0) r = 0; if(r > 255) r = 255;
  g = Math.round(g * 255); if(g < 0) g = 0; if(g > 255) g = 255;
  b = Math.round(b * 255); if(b < 0) b = 0; if(b > 255) b = 255;

  return {r: r, g: g, b: b};
}

function ctToHex(ct) {
  let rgb = ctToRgb(ct);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function ctToRgb(ct) {
  let kelvin = (10 ** 6) / ct / 100;
  let r, g, b;

  // Red
  if(kelvin <= 66) {
    r = 255;
  } else {
    r = kelvin - 60;
    r = 329.698727446 * (r ** -0.1332047592);
  }

  // Green
  if(kelvin <= 66) {
    g = kelvin;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
  } else {
    g = kelvin - 60;
    g = 288.1221695283 * (g ** -0.0755148492);
  }

  // Blue
  if(kelvin >= 66) {
    b = 255;
  } else {
    if(kelvin <= 19) {
      b = 0;
    } else {
      b = kelvin - 10;
      b = 138.5177312231 * Math.log(b) - 305.0447927307;
    }
  }

  r = Math.round(r); if(r < 0) r = 0; if(r > 255) r = 255;
  g = Math.round(g); if(g < 0) g = 0; if(g > 255) g = 255;
  b = Math.round(b); if(b < 0) b = 0; if(b > 255) b = 255;

  return {r: r, g: g, b: b};
}

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
