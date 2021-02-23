import http from 'http';
import {Groups, Lights, Scenes, Scene} from './hue_api_types';

export const getGroups = () =>
  request('GET', '/groups', {}) as Promise<Groups>;

export const getScenes = () =>
  request('GET', '/scenes', {}) as Promise<Scenes>;

export const getScene = (sceneId: string) =>
  request('GET', `/scenes/${sceneId}`, {}) as Promise<Scene>;

export const getLights = () =>
  request('GET', '/lights', {}) as Promise<Lights>;

export const request = (method, path, body) => new Promise((resolve, reject) => {
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
