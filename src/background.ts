import * as HueAPI from './hue_api';
import * as Conversions from './conversions';
import {Light} from "./hue_api_types";

export type BackgroundTaskConfig = {
    type: "random-different" | "random-same";
    lightIds: string[];
    transitiontime: number;
    interval: number;
};

let nextId = 0;

const tasksByLight: Map<string, string> = new Map();

const backgroundTasks: Map<string, {
    timer: NodeJS.Timeout;
    initialLight?: Light;
    config: BackgroundTaskConfig;
}> = new Map();

export const getBackgroundTasks = ():Map<string, BackgroundTaskConfig> => {
    const map = new Map();

    for (const [taskId, {config}] of backgroundTasks.entries()) {
        map.set(taskId, config);
    }

    return map;
};

export const putBackgroundTask = (config: BackgroundTaskConfig): string | null => {
    // TODO: reject duplicate light IDs
    // TODO: reject invalid light IDs
    // TODO: reject zero light IDs
    if (config.lightIds.some(lightId => tasksByLight.has(lightId))) return null;

    ++nextId;
    const taskId = nextId.toString();

    console.log("set task", { taskId, config });

    backgroundTasks.set(taskId, {
        timer: setInterval(tick, config.interval, taskId),
        config: config
    });

    config.lightIds.forEach(lightId => tasksByLight.set(lightId, taskId));

    return taskId;
};

export const deleteBackgroundTask = (taskId: string) => {
    const task = backgroundTasks.get(taskId);
    if (!task) return;

    console.log("delete task", { taskId, config: task.config });

    clearInterval(task.timer);
    task.config.lightIds.forEach(lightId => tasksByLight.delete(lightId));
    backgroundTasks.delete(taskId);
};

const tick = (taskId: string) => {
    const task = backgroundTasks.get(taskId);
    if (!task) return;

    if (task.config.type == "random-different" || task.config.type == "random-same") {
        var xy = null;

        Promise.all(
            task.config.lightIds.map(lightId => {
                let thisXY: [number, number] | null;
                if (task.config.type == "random-different") thisXY = randomXY();
                if (task.config.type == "random-same") thisXY = (xy ||= randomXY());

                const state = {
                    xy: thisXY,
                    transitiontime: task.config.transitiontime,
                };

                return HueAPI.request('PUT', `/lights/${lightId}/state`, state);
            })
        ).catch(e => console.log({ task: "failed", taskId, e }));
    }
};

const randomXY = () => {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return Conversions.rgbToXy(r, g, b);
};
