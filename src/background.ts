import * as fs from "fs";

import * as HueAPI from './hue_api';
import * as Conversions from './conversions';
import {TRANSITION_TIME_UNITS_PER_SECOND} from "./hue_api";

import * as Cycle from './tasks/cycle';
import * as RandomDifferent from './tasks/random_different';
import * as RandomSame from './tasks/random_same';

export type BackgroundTaskConfig = Cycle.Config | RandomDifferent.Config | RandomSame.Config;
export type PublicBackgroundTaskConfig = Omit<BackgroundTaskConfig, "details">;

let nextId = 0;

const backgroundTasks: Map<string, BackgroundTaskConfig> = new Map();

// export const TASK_TYPES = [
//     Cycle,
//     RandomDifferent,
//     RandomSame,
// ];

export const getBackgroundTasks = ():Map<string, PublicBackgroundTaskConfig> => {
    const map = new Map<string, PublicBackgroundTaskConfig>();

    for (const [taskId, config] of backgroundTasks.entries()) {
        const publicConfig = {...config};
        delete publicConfig.details;
        map.set(taskId, publicConfig);
    }

    return map;
};

export const putBackgroundTask = (config: PublicBackgroundTaskConfig): string | null => {
    // TODO: reject duplicate light IDs
    // TODO: reject invalid light IDs
    // TODO: reject zero light IDs
    if (config.lightIds.some(lightId => tasksByLight.has(lightId))) return null;

    let taskId: string;
    for (;;) {
        ++nextId;
        taskId = nextId.toString();
        if (!backgroundTasks.has(taskId)) break;
    }

    console.log("set task", { taskId, config });

    const details = createTask(taskId, config);
    backgroundTasks.set(taskId, details);
    config.lightIds.forEach(lightId => tasksByLight.set(lightId, taskId));

    return taskId;
};

const createTask = (taskId: string, config: BackgroundTaskConfig): BackgroundTaskDetails => {
};

export const deleteBackgroundTask = (taskId: string) => {
    const task = backgroundTasks.get(taskId);
    if (!task) return;

    console.log("delete task", { taskId, task });


    clearInterval(task.timer);
    task.config.lightIds.forEach(lightId => tasksByLight.delete(lightId));
    backgroundTasks.delete(taskId);

    persist();
};

