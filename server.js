'use strict';

const express = require('express');
const http = require('http');
const cors = require('cors');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.use(express.json());
app.use(cors());
app.options('*', cors());

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.put('/clock', (req, res) => {
  // if(req.body.years) { updateLight(11, req.body.years.rgb); }
  // if(req.body.months) { updateLight(12, req.body.months.rgb); }
  // if(req.body.days) { updateLight(13, req.body.days.rgb); }
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

function updateLight(id, value) {
  let parse = /rgb\((\d+), (\d+), (\d+)\)/i.exec(value);
  let red = parse[1];
  let green = parse[2];
  let blue = parse[3];
  let xy = rgbToXy(red, green, blue);

  var options = {
    host: process.env.HUE_BRIDGE_IP_ADDRESS,
    path: `/api/${process.env.HUE_USERNAME}/lights/${id}/state`,
    port: '80',
    method: 'PUT'
  };

  var hueRequest = http.request(options, callback);
  hueRequest.write(JSON.stringify({"xy": xy}));
  hueRequest.end();
}

function callback(response) {
  var str = ''
  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
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
