import fs from "fs";
import {Either, isLeft, right} from "fp-ts/Either";

import {Base, Task, TaskSpec} from "./tasks/base";
import Noop from './tasks/noop';
import Cycle from './tasks/cycle';
import RandomSame from './tasks/random_same';
import RandomDifferent from './tasks/random_different';
import {validator} from "io-ts-validator";

export const specs: TaskSpec<string, any, any>[] = [
    Noop,
    Cycle,
    RandomSame,
    RandomDifferent,
];

(() => {
    const seenTypes = new Set<string>();
    for (const spec of specs) {
        if (seenTypes.has(spec.TYPE)) throw `Duplicate task type '${spec.TYPE}'`;

        seenTypes.add(spec.TYPE);
    }
})();

let nextId = 0;

const backgroundTasks: Map<string, Task> = new Map();

export const getBackgroundTasks = () => backgroundTasks;

export const putBackgroundTask = (config: any): Either<string[], Task> | null => {
    const maybeTask = createTask(config);
    if (!maybeTask) return null;
    if (isLeft(maybeTask)) return maybeTask;

    const task = maybeTask.right;
    backgroundTasks.set(task.taskId, task);
    if (task.config.enabled) task.start();
    saveAll();
    return right(task);
};

const createTask = (config: any): Either<string[], Task> | undefined => {
    if (typeof config !== "object") return undefined;

    const type = config?.type;

    for (const spec of specs) {
        if (type === spec.TYPE) {
            const maybe = validator(spec.TConfig).decodeEither(config);
            if (isLeft(maybe)) return maybe;

            return right(new spec.Task(getTaskId(), maybe.right));
        }
    }

    return undefined;
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

export const setTaskEnabled = (taskId: string, enabled: boolean): Task | undefined => {
    const task = backgroundTasks.get(taskId);
    if (!task) return;

    task.config.enabled = enabled;
    saveAll();

    if (enabled) task.start();
    else task.stop();

    return task;
};

export const deleteBackgroundTask = (taskId: string) => {
    const task = backgroundTasks.get(taskId);
    if (!task) return;

    task.stop();
    backgroundTasks.delete(taskId);
    saveAll();
};

const SAVE_FILE = "var/tasks.json";

const saveAll = () => {
    const data: any = {};

    for (const task of backgroundTasks.values()) {
        data[task.taskId] = {
            config: task.config,
            state: task.state,
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
            if (task.config.enabled) task.start();
        }
    }
};

const tryRestore = (taskId: string, config: any, state: any): Base<any, any> | undefined => {
    for (const spec of specs) {
        if (spec.TYPE === config.type) {
            const maybeConfig = spec.TConfig.decode(config);
            const maybeState = spec.TState.decode(state);

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
