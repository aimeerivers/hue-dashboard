import * as HueAPI from './hue_api';
import * as Conversions from './conversions';
import {Light} from "./hue_api_types";

export type BackgroundTask = {
    lightId: string;
    transitiontime: number;
    interval: number;
};

const backgroundTasks: Map<string, {
    timer: NodeJS.Timeout;
    initialLight?: Light;
    task: BackgroundTask;
}> = new Map();

export const getBackgroundTasks = (): BackgroundTask[] =>
    [...backgroundTasks.values()].map(v => v.task);

export const putBackgroundTask = (task: BackgroundTask) => {
    deleteBackgroundTask(task.lightId);

    console.log("set task", { lightId: task.lightId, task });

    backgroundTasks.set(task.lightId, {
        timer: setInterval(tick, task.interval, task.lightId),
        task
    });
};

export const deleteBackgroundTask = (lightId: string) => {
    const existingTask = backgroundTasks.get(lightId);
    if (!existingTask) return;

    clearInterval(existingTask.timer);
    backgroundTasks.delete(lightId);
};

const tick = (lightId: string) => {
    const task = backgroundTasks.get(lightId);
    if (!task) return;

    Promise.resolve().then(() => {
        if (!task.initialLight) {
            return HueAPI.getLight(lightId).then(light => {
                task.initialLight = light;
            });
        }
    }).then(() => {
        if (!task.initialLight) return;

        // console.log({ tick: true, task });

        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        const xy = Conversions.rgbToXy(r, g, b);

        const state = {
            xy,
            transitiontime: task.task.transitiontime,
        };

        HueAPI.request('PUT', `/lights/${lightId}/state`, state)
            .catch(e => console.log({ task: "failed", lightId, e }));
    });
};
