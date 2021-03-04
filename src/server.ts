import express from 'express';
import cors from 'cors';

import * as Conversions from './conversions';
import * as HueAPI from './hue_api';
import {Group, Scene} from "./hue_api_types";
import * as Dashboard from './dashboard';
import {drawSceneColours} from './pictures';
import * as BackgroundRoutes from "./background_routes";
import * as ProxyRoutes from "./proxy_routes";
import {TRANSITION_TIME_SECONDS_DEFAULT, TRANSITION_TIME_UNITS_PER_SECOND} from "./hue_api";

const STANDARD_SCENES = [
  'adfa9c3e-e9aa-4b65-b9d3-c5b2c0576715', // Blomstrende forår
  'b90c8900-a6b7-422c-a5d3-e170187dbf8c', // Koncentrer dig
  '7fd2ccc5-5749-4142-b7a5-66405a676f03', // Få ny energi
  'a1f7da49-d181-4328-abea-68c9dc4b5416', // Slap af
  'e101a77f-9984-4f61-aac8-15741983c656', // Læs
  '8c74b9ba-6e89-4083-a2a7-b10a1e566fed', // Dæmpet
  '732ff1d9-76a7-4630-aad0-c8acc499bb0b', // Klar
  '28bbfeff-1a0c-444e-bb4b-0b74b88e0c95', // Natlampe
  '4f2ed241-5aea-4c9d-8028-55d2b111e06f', // Solnedgang i Savannah
  'a6a03e6a-fe6e-45bc-b686-878137f3ba91', // Tropisk tusmørke
  '1e42b2e8-d02e-40d2-9c8d-b1fd8216c686', // Arktisk nordlys
  'd271d202-6856-4633-95ae-953ba73aee64', // Honolulu
  'cc716363-44c2-4d64-88be-152d74072ea0', // Fairfax
  '60f088f5-4224-4f01-bcb1-81ef46099f63', // Tokyo
  '63d50cd6-5909-4f7b-8810-137d08f57c54', // Chinatown
  '6799326d-e9cd-4b2a-9166-287509f841f3', // Gyldent efterår
];

const UNWANTED_SCENE_NAMES = [
  'Scene recoveryScene',
  'Scene previous',
  'Scene recoveryScene ',
  'Scene previous ',
]

// Constants
const PORT = 9000;
const HOST = '0.0.0.0';

// App
const app = express();
app.use(express.json());
app.use(cors());
app.options('*', cors());
app.set('view engine', 'pug');
app.set('views', './src/views');
app.use(express.static('public'));

app.get('/', (_req, res) => {
  res.redirect('/dashboard');
});

type DashboardScene = Pick<Scene, "id" | "name" | "imageUrl">

app.get('/dashboard', (_req, res) => {
  const promiseRooms = HueAPI.getGroups().then(groups => {
    const rooms = Dashboard.getRoomsFromGroups(groups);
    return rooms.map(room => ({...room, scenes: [] as DashboardScene[]}));
  });

  Promise.all([promiseRooms, HueAPI.getScenes()]).then(([rooms, scenes]) => {
    for (const sceneId in scenes) {
      const scene = scenes[sceneId];
      if (scene.type == 'GroupScene' && scene.group && !UNWANTED_SCENE_NAMES.includes(scene.name)) {
        const room = rooms.find(e => e.id == scene.group);
        let sceneImage = `/scene/${sceneId}.png`;
        if(STANDARD_SCENES.includes(scene.image)) sceneImage = `/images/scenes/${scene.image}.png`
        if (room) {
          room.scenes.push({
            id: sceneId,
            name: scene.name,
            imageUrl: sceneImage,
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

app.get('/groups/state', (_req, res) => {
  HueAPI.getGroups().then(groups => {
    const rooms = Dashboard.getRoomsFromGroups(groups);
    res.send(rooms);
  });
});

app.put('/room/:roomId/on/:state', (req, res) =>
  HueAPI.request('PUT', `/groups/${req.params.roomId}/action`, {"on": req.params.state == 'true'})
    .then(str => {
      console.log(str);
      res.sendStatus(200);
    })
);

app.put('/room/:roomId/scene/:sceneId', (req, res) =>
  HueAPI.request('PUT', `/groups/${req.params.roomId}/action`, {"scene": req.params.sceneId})
    .then(str => {
      console.log(str);
      res.sendStatus(200);
    })
);

app.post('/light/:lightId/rgb/:r/:g/:b/:time?', (req, res) => {
  let transitionTimeSeconds = parseFloat(req.params.time);
  if (isNaN(transitionTimeSeconds)) transitionTimeSeconds = TRANSITION_TIME_SECONDS_DEFAULT;

  const lightId = parseInt(req.params.lightId);

  const xy = Conversions.rgbToXy(
    parseInt(req.params.r),
    parseInt(req.params.g),
    parseInt(req.params.b),
  );

  const state = {
    xy,
    transitiontime: transitionTimeSeconds * TRANSITION_TIME_UNITS_PER_SECOND,
  };

  HueAPI.request('PUT', `/lights/${lightId}/state`, state)
    .then(() => res.sendStatus(200));
});

app.post('/light/:lightId/random/:time?', (req, res) => {
  let transitionTimeSeconds = parseFloat(req.params.time);
  if (isNaN(transitionTimeSeconds)) transitionTimeSeconds = TRANSITION_TIME_SECONDS_DEFAULT;

  const lightId = parseInt(req.params.lightId);
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  const xy = Conversions.rgbToXy(r, g, b);

  const state = {
    xy,
    transitiontime: transitionTimeSeconds * TRANSITION_TIME_UNITS_PER_SECOND,
  };

  HueAPI.request('PUT', `/lights/${lightId}/state`, state)
    .then(() => res.sendStatus(200));
});

app.post('/group/:groupId/cycle/:time?', (req, res) =>
  Promise.all([
    HueAPI.request('GET', `/groups/${req.params.groupId}`, {}) as Promise<Group>,
    HueAPI.getLights(),
  ]).then(([group, allLights]) => {
    let transitionTimeSeconds = parseFloat(req.params.time);
    if (isNaN(transitionTimeSeconds)) transitionTimeSeconds = TRANSITION_TIME_SECONDS_DEFAULT;

    const colourLightIdsInThisGroup = group.lights
      .filter(id => allLights[id].state.reachable && allLights[id].state.on && allLights[id].state.xy)
      .sort();

    return Promise.all(
      colourLightIdsInThisGroup.map((lightId, index) => {
        const nextLightId = colourLightIdsInThisGroup[(index + 1) % colourLightIdsInThisGroup.length];
        const xy = allLights[nextLightId].state.xy;
        const state = {
          xy,
          "transitiontime": transitionTimeSeconds * TRANSITION_TIME_UNITS_PER_SECOND,
        };
        HueAPI.request('PUT', `/lights/${lightId}/state`, state);
      })
    );
  }).then(() => {
    res.sendStatus(200);
  })
);

app.put('/clock', (_req, res) => {
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

app.get('/scene/:sceneId.png', (req, res) => {
  HueAPI.getScene(req.params.sceneId)
    .then(scene => {
      const sceneColours: string[] = [];
      for(const index in scene.lightstates) {
        const lightState = scene.lightstates[index];
        if(lightState.on) {
          if(lightState.xy && lightState.bri) {
            sceneColours.push(Conversions.xyBriToHex(lightState.xy[0], lightState.xy[1], lightState.bri));
          } else if(lightState.ct) {
            sceneColours.push(Conversions.ctToHex(lightState.ct));
          }
        }
      }
      res.setHeader('Content-Type', 'image/png');
      drawSceneColours(sceneColours).createPNGStream().pipe(res);
    })
});

// function updateLight(id, value) {
//   const parse = /rgb\((\d+), (\d+), (\d+)\)/i.exec(value);
//   const red = parse[1];
//   const green = parse[2];
//   const blue = parse[3];
//   const xy = Conversions.rgbToXy(red, green, blue);
//
//   return HueAPI.request('PUT', `/lights/${id}/state`, {"xy": xy});
// }

BackgroundRoutes.addTo(app);
ProxyRoutes.addTo(app);

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
