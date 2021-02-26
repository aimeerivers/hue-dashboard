import {validateIntervalSeconds, validateLightIds, validateTransitionTimeSeconds} from "./common";
import * as HueAPI from "../hue_api";
import {TRANSITION_TIME_UNITS_PER_SECOND} from "../hue_api";
import {randomXY} from "./colour_tools";

const TYPE = "random-different";

export type Config = {
    type: typeof TYPE;
    lightIds: string[];
    transitionTimeSeconds: number;
    intervalSeconds: number;

    details: {
        timer: NodeJS.Timeout;
    };
};

export const validatePublic = (config: any): Omit<Config, "details"> | undefined => {
    if (config.type !== TYPE) return;

    const lightIds = validateLightIds(config.lightIds);
    if (!lightIds) return;

    const transitionTimeSeconds = validateTransitionTimeSeconds(config.transitionTimeSeconds);
    if (transitionTimeSeconds === undefined) return;

    const intervalSeconds = validateIntervalSeconds(config.intervalSeconds);
    if (intervalSeconds === undefined) return;

    return {
        type: TYPE,
        lightIds,
        transitionTimeSeconds,
        intervalSeconds,
    };
};

export const createTask = (taskId: string, config: Omit<Config, "details">): [Config, () => void] => {
    const task: Config = {
        ...config,
        details: {
            timer: setInterval(tick, config.intervalSeconds * 1000, taskId),
        },
    };

    return [task, () => deleteTask(taskId, task)];
};

const deleteTask = (taskId: string, config: Config) => {
    clearInterval(config.details.timer);
};

const tick = (taskId: string, task: Config) => {
    Promise.all(
        task.lightIds.map((lightId, index) => {
            const state = {
                xy: randomXY(),
                transitiontime: task.transitionTimeSeconds * TRANSITION_TIME_UNITS_PER_SECOND,
            };

            return HueAPI.request('PUT', `/lights/${lightId}/state`, state);
        })
    ).catch(e => console.log({ task: "failed", taskId, e }));
};
