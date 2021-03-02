import http from 'http';
import {Groups, Light, Lights, Scene, Scenes} from './hue_api_types';
import * as Conversions from './conversions';

export const TRANSITION_TIME_UNITS_PER_SECOND = 10;
export const TRANSITION_TIME_SECONDS_DEFAULT = 0.4;

export const getGroups = () =>
  request('GET', '/groups', {}) as Promise<Groups>;

export const getScene = (sceneId: string) =>
  request('GET', `/scenes/${sceneId}`, {}) as Promise<Scene>;

export const getScenes = () =>
  request('GET', '/scenes', {}) as Promise<Scenes>;

export const getLight = (lightId: string) =>
  request('GET', `/lights/${lightId}`, {}) as Promise<Light>;

export const getLights = () =>
  request('GET', '/lights', {}) as Promise<Lights>;

export const request = (method, path, body) => new Promise((resolve, reject) => {
  const options = {
    host: process.env.HUE_BRIDGE_IP_ADDRESS,
    path: `/api/${process.env.HUE_USERNAME}${path}`,
    port: '80',
    method: method.toUpperCase()
  };

  const req = http.request(options, function(response) {
    console.log(`${method} ${path} => ${response.statusCode} ${response.statusMessage}`);

    if (response.statusCode !== 200) {
      reject(`HTTP response status is ${response.statusCode} ${response.statusMessage}`);
    }

    let str = ''
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

export const getRoomsFromGroups = (groups: Groups) => {
  const rooms = [];

  for(const groupId in groups) {
    const group = groups[groupId];
    if(group.type == 'Room' || group.type == 'Zone') {
      let colour = "";
      if(group.state.any_on) {
        if(group.action.xy && group.action.bri) {
          colour = Conversions.xyBriToHex(group.action.xy[0], group.action.xy[1], group.action.bri);
        } else if(group.action.colormode == 'ct') {
          colour = Conversions.ctToHex(group.action.ct);
        }
      } else colour = "#000000";
      rooms.push({
        id: groupId,
        name: group.name,
        state: group.state,
        colour: colour
      });
    }
  }

  return rooms;
};
