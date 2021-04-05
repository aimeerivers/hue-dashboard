import fs from "fs";
import {isLeft} from "fp-ts/Either";

import {Base, BaseConfig, TaskSpec} from "./tasks/base";
import Noop from './tasks/noop';
import Cycle from './tasks/cycle';
import RandomSame from './tasks/random_same';
import RandomDifferent from './tasks/random_different';

export const specs: TaskSpec<string, any, any>[] = [
    Noop,
    Cycle,
    RandomSame,
    RandomDifferent,
];

let nextId = 0;

const backgroundTasks: Map<string, Base<BaseConfig, any>> = new Map();

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

const createTask = (config: any): Base<BaseConfig, any> | undefined => {
    if (typeof config !== "object") return;

    const type = config.type;

    for (const spec of specs) {
        if (type === spec.TYPE) {
            const maybe = spec.TConfig.decode(config);
            if (isLeft(maybe)) return;

            return new spec.Task(getTaskId(), maybe.right);
        }
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
            state: task.persistedState(),
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
        if (backgroundTasks.has(taskId)) continue;

        const configAndState = data[taskId];
        if (typeof configAndState !== "object") continue;

        const task = tryRestore(taskId, configAndState.config, configAndState.state);
        if (task) {
            backgroundTasks.set(task.taskId, task);
            if (task.config.enabled) task.startTask();
        }
    }
};

const tryRestore = (taskId: string, config: any, state: any): Base<any, any> | undefined => {
    for (const spec of specs) {
        if (spec.TYPE === config.type) {
            const maybeConfig = spec.TConfig.decode(config);
            const maybeState = spec.TPersistedState.decode(state);

            if (isLeft(maybeConfig)) {
                console.error(`Failed to restore task ${taskId}`);
                console.debug(JSON.stringify(maybeConfig.left));
                return;
            }

            if (isLeft(maybeState)) {
                console.warn(`Failed to restore state of task ${taskId} - initial state will be used`);
                return new spec.Task(taskId, maybeConfig.right);
            } else {
                return new spec.Task(taskId, maybeConfig.right, maybeState.right);
            }
        }
    }
};

// TODO: maybe a mechanism for periodic saving
restoreAll();
setInterval(() => backgroundTasks.size > 0 && saveAll(), 1000);
