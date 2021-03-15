import express from 'express';

import * as HueAPI from './hue_api';

export const addTo = (app: express.Application) => {

    app.get('/proxy/lights', (_req, res) => {
        HueAPI.getLights().then(lights => {
            res.header("Cache-Control", "max-age=2");
            res.send({
                lights: Object.keys(lights).sort().map(lightId =>
                    ({ ...lights[lightId], id: lightId })
                )
            });
        });
    });

    app.get('/proxy/scenes', (_req, res) => {
        HueAPI.getScenes().then(scenes => {
            res.header("Cache-Control", "max-age=2");
            res.send({
                scenes: Object.keys(scenes).sort().map(sceneId =>
                    ({ ...scenes[sceneId], id: sceneId })
                )
            });
        });
    });

    app.get('/proxy/groups', (_req, res) => {
        HueAPI.getGroups().then(groups => {
            res.header("Cache-Control", "max-age=2");
            res.send({
                groups: Object.keys(groups).sort().map(groupId =>
                    ({ ...groups[groupId], id: groupId })
                )
            });
        });
    });

};
