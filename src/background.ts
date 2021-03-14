import fs from "fs";

import {Base, BaseConfig} from "./tasks/base";
import * as Cycle from './tasks/cycle';
import * as Noop from './tasks/noop';
import * as RandomDifferent from './tasks/random_different';
import * as RandomSame from './tasks/random_same';

export const handlers = [
    new Noop.Builder(),
    new Cycle.Builder(),
    new RandomSame.Builder(),
    new RandomDifferent.Builder(),
];

let nextId = 0;

const backgroundTasks: Map<string, Base<BaseConfig>> = new Map();

export const getBackgroundTasks = ():Map<string, any> => {
    const map = new Map<string, any>();

    for (const task of backgroundTasks.values()) {
        map.set(task.taskId, task.config);
    }

    return map;
};

export const putBackgroundTask = (config: any): string | null => {
    const task = createTask(config);
    if (!task) return null;

    backgroundTasks.set(task.taskId, task);
    if (task.config.enabled) task.startTask();
    saveAll();
    return task.taskId;
};

const createTask = (config: any): Base<BaseConfig> | undefined => {
    for (const handler of handlers) {
        const validated = handler.validate(config);

        if (validated) return validated.build(getTaskId());
    }
};

const getTaskId = (): string => {
    let taskId: string;

    for (;;) {
        ++nextId;
        taskId = nextId.toString();
        if (!backgroundTasks.has(taskId)) break;
    }

    return taskId;
};

export const setTaskEnabled = (taskId: string, enabled: boolean): any | undefined => {
    const task = backgroundTasks.get(taskId);
    if (!task) return;

    task.config.enabled = enabled;
    saveAll();

    if (enabled) task.startTask();
    else task.stopTask();

    return task.config;
};

export const deleteBackgroundTask = (taskId: string) => {
    const task = backgroundTasks.get(taskId);
    if (!task) return;

    task.stopTask();
    backgroundTasks.delete(taskId);
    saveAll();
};

const SAVE_FILE = "var/tasks.json";

const saveAll = () => {
    const data: any = {};

    for (const task of backgroundTasks.values()) {
        data[task.taskId] = {
            config: task.config,
            state: task.save(),
        };
    }

    const tmpFile = SAVE_FILE + ".tmp";
    fs.writeFileSync(tmpFile, JSON.stringify(data), {encoding: "utf-8"});
    fs.renameSync(tmpFile, SAVE_FILE);
};

const restoreAll = () => {
    let data: any = undefined;

    try {
        const text = fs.readFileSync(SAVE_FILE, {encoding: "utf-8"});
        data = JSON.parse(text);
    } catch (e) {
        if (e.code !== 'ENOENT') throw e;
    }

    if (data === undefined) return;

    for (const taskId of Object.keys(data)) {
        const task = tryRestore(taskId, data[taskId].config, data[taskId].state);
        if (task) {
            backgroundTasks.set(task.taskId, task);
            if (task.config.enabled) task.startTask();
        }
    }
};

const tryRestore = (taskId: string, config: any, state: any): Base<any> | undefined => {
    if (backgroundTasks.has(taskId)) return;

    for (const handler of handlers) {
        const validated = handler.validate(config);

        if (validated) return validated.build(taskId, state);
    }

    return undefined;
};

// TODO: maybe a mechanism for periodic saving
restoreAll();
setInterval(() => backgroundTasks.size > 0 && saveAll(), 1000);
