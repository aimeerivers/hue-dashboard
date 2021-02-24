import express from 'express';

import * as HueAPI from './hue_api';
import {deleteBackgroundTask, getBackgroundTasks, putBackgroundTask} from "./background";

export const addTo = (app: express.Application) => {

    app.get('/background', (_req, res) => {
        const answer = {};
        for (const [taskId, config] of getBackgroundTasks()) {
            answer[taskId] = config;
        }
        res.status(200).send(answer);
    });

    app.post('/background', (req, res) => {
        const body = req.body;

        const type = body.type;
        if (type !== 'random-different' && type !== 'random-same') return res.sendStatus(400);

        const lightIds = body.lightIds;
        if (!Array.isArray(lightIds)) return res.sendStatus(400);

        HueAPI.getLights().then(lights => {
            if (!lightIds.every(lightId => lights[lightId])) return res.sendStatus(400);

            const taskId = putBackgroundTask({
                type,
                lightIds,
                transitiontime: body['transitiontime'] || 0,
                interval: body['interval'] || 1000,
            });

            const config = getBackgroundTasks().get(taskId);

            res.send({[taskId]: config});
        });
    });

    app.delete('/background/:taskId', (req, res) => {
        const taskId = req.params.taskId;
        deleteBackgroundTask(taskId);
        res.sendStatus(204);
    });

    app.delete('/background', (req, res) => {
        for (const task of getBackgroundTasks().keys()) {
            deleteBackgroundTask(task);
        }

        res.sendStatus(204);
    });

};
