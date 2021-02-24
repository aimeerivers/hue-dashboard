import * as HueAPI from './hue_api';
import * as Conversions from './conversions';
import {TRANSITION_TIME_UNITS_PER_SECOND} from "./hue_api";

type BackgroundTaskConfigCycle = {
    type: "cycle";
    lightIds: string[];
    transitionTimeSeconds: number;
    intervalSeconds: number;
};

type BackgroundTaskConfigRandom = {
    type: "random-different" | "random-same";
    lightIds: string[];
    transitionTimeSeconds: number;
    intervalSeconds: number;
};

type BackgroundTaskDetailsCycle = {
    type: "cycle";
    timer: NodeJS.Timeout;
    config: BackgroundTaskConfigCycle;
    colours?: { xy: [number, number] }[];
    executionCount: number;
};

type BackgroundTaskDetailsRandom = {
    type: "random-different" | "random-same";
    timer: NodeJS.Timeout;
    config: BackgroundTaskConfigRandom;
};

export type BackgroundTaskConfig = BackgroundTaskConfigCycle | BackgroundTaskConfigRandom;

type BackgroundTaskDetails = BackgroundTaskDetailsCycle | BackgroundTaskDetailsRandom;

let nextId = 0;

const tasksByLight: Map<string, string> = new Map();

const backgroundTasks: Map<string, BackgroundTaskDetails> = new Map();

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

    const details = createTask(taskId, config);
    backgroundTasks.set(taskId, details);
    config.lightIds.forEach(lightId => tasksByLight.set(lightId, taskId));

    return taskId;
};

const createTask = (taskId: string, config: BackgroundTaskConfig): BackgroundTaskDetails => {
    if (config.type === 'random-different' || config.type === 'random-same') {
        return {
            type: config.type,
            timer: setInterval(tick, config.intervalSeconds * 1000, taskId),
            config,
        };
    } else if (config.type === 'cycle') {
        const details: BackgroundTaskDetailsCycle = {
            type: config.type,
            timer: setInterval(tick, config.intervalSeconds * 1000, taskId),
            config,
            executionCount: 0,
        };

        HueAPI.getLights().then(lights => {
            details.colours = config.lightIds.map(lightId =>
                ({
                    xy: lights[lightId].state.xy || [0, 0],
                })
            );
        });

        return details;
    }
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

    if (task.type == "random-different" || task.type == "random-same") {
        let xy = null;

        Promise.all(
            task.config.lightIds.map(lightId => {
                let thisXY: [number, number] | null;
                if (task.config.type == "random-different") thisXY = randomXY();
                if (task.config.type == "random-same") thisXY = (xy ||= randomXY());

                const state = {
                    xy: thisXY,
                    transitiontime: task.config.transitionTimeSeconds * TRANSITION_TIME_UNITS_PER_SECOND,
                };

                return HueAPI.request('PUT', `/lights/${lightId}/state`, state);
            })
        ).catch(e => console.log({ task: "failed", taskId, e }));
    } else if (task.type === 'cycle') {
        if (!task.colours) return;

        task.colours.push(task.colours.shift());
        task.executionCount++;

        console.log({ taskId, executionCount: task.executionCount, colours: task.colours });

        Promise.all(
            task.config.lightIds.map((lightId, index) => {
                const state = {
                    xy: task.colours[index].xy,
                    transitiontime: task.config.transitionTimeSeconds * TRANSITION_TIME_UNITS_PER_SECOND,
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
