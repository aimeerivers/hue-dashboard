import express from 'express';

import {deleteBackgroundTask, getBackgroundTasks, putBackgroundTask, setTaskEnabled} from "./background";

export const addTo = (app: express.Application) => {

    app.get('/background', (_req, res) => {
        const answer: any = {};
        for (const [taskId, config] of getBackgroundTasks()) {
            answer[taskId] = config;
        }
        res.status(200).send(answer);
    });

    app.post('/background', (req, res) => {
        const taskId = putBackgroundTask(req.body);
        if (!taskId) return res.sendStatus(400);

        const config = getBackgroundTasks().get(taskId);
        res.send({[taskId]: config});
    });

    // Not sure that this is a good interface
    app.post('/background/:taskId/enable', (req, res) => {
        const taskId = req.params.taskId;
        const config = setTaskEnabled(taskId, true);
        if (!config) return res.sendStatus(404);

        res.send({[taskId]: config});
    });

    // Not sure that this is a good interface
    app.post('/background/:taskId/disable', (req, res) => {
        const taskId = req.params.taskId;
        const config = setTaskEnabled(taskId, false);
        if (!config) return res.sendStatus(404);

        res.send({[taskId]: config});
    });

    app.delete('/background/:taskId', (req, res) => {
        const taskId = req.params.taskId;
        deleteBackgroundTask(taskId);
        res.sendStatus(204);
    });

    app.delete('/background', (_req, res) => {
        for (const task of getBackgroundTasks().keys()) {
            deleteBackgroundTask(task);
        }

        res.sendStatus(204);
    });

};
