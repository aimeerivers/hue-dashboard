import express from 'express';

import {deleteBackgroundTask, getBackgroundTasks, putBackgroundTask, setTaskEnabled} from "./background";
import {isLeft} from "fp-ts/Either";

export const addTo = (app: express.Application) => {

    app.get('/background', (_req, res) => {
        const answer: unknown[] = [];
        for (const [taskId, task] of getBackgroundTasks()) {
            answer.push({ id: taskId, ...task.config });
        }
        res.status(200).send(answer);
    });

    app.get('/background/:taskId', (req, res) => {
        for (const [taskId, task] of getBackgroundTasks()) {
            if (taskId === req.params.taskId) return res.send({ id: taskId, ...task.config });
        }
        res.status(404);
    });

    app.post('/background', (req, res) => {
        const maybeTask = putBackgroundTask(req.body);
        if (!maybeTask) return res.status(400).send({});

        if (isLeft(maybeTask)) {
            return res.status(400).send({ errors: maybeTask.left });
        }

        res.send({ id: maybeTask.right.taskId, ...maybeTask.right.config });
    });

    // Not sure that this is a good interface
    app.post('/background/:taskId/enable', (req, res) => {
        const taskId = req.params.taskId;
        const task = setTaskEnabled(taskId, true);
        if (!task) return res.sendStatus(404);

        res.send({ id: task.taskId, ...task.config });
    });

    // Not sure that this is a good interface
    app.post('/background/:taskId/disable', (req, res) => {
        const taskId = req.params.taskId;
        const task = setTaskEnabled(taskId, false);
        if (!task) return res.sendStatus(404);

        res.send({ id: task.taskId, ...task.config });
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
