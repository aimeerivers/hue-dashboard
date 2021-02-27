import * as Noop from './tasks/noop';
import * as Cycle from './tasks/cycle';
import * as RandomSame from './tasks/random_same';
import * as RandomDifferent from './tasks/random_different';
import {Base} from "./tasks/base";

let nextId = 0;

const backgroundTasks: Map<string, Base<unknown>> = new Map();

export const getBackgroundTasks = ():Map<string, any> => {
    const map = new Map<string, any>();

    for (const task of backgroundTasks.values()) {
        map.set(task.taskId, task.config);
    }

    return map;
};

export const putBackgroundTask = (config: any): string | null => {
    const task = createTask(config);
    if (!task) return;

    backgroundTasks.set(task.taskId, task);
    return task.taskId;
};

const createTask = (config: any): Base<unknown> | undefined => {
    const handlers = [
        new Noop.Builder(),
        new Cycle.Builder(),
        new RandomSame.Builder(),
        new RandomDifferent.Builder(),
    ];

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

export const deleteBackgroundTask = (taskId: string) => {
    const task = backgroundTasks.get(taskId);
    if (!task) return;

    task.stopTask();
    backgroundTasks.delete(taskId);
};
