import * as HueAPI from "../hue_api";
import {TRANSITION_TIME_UNITS_PER_SECOND} from "../hue_api";
import {validateIntervalSeconds, validateLightIds, validateTransitionTimeSeconds} from "./common";
import {Base, BaseFactory} from "./base";

const TYPE = "cycle";

export type Config = {
    type: typeof TYPE;
    lightIds: string[];
    transitionTimeSeconds: number;
    intervalSeconds: number;

    details: {
        timer: NodeJS.Timeout;
        colours?: { xy: [number, number] }[];
    };
};

export class Builder extends BaseFactory<Config, Task> {

    validate(config: any): Omit<Config, "details"> | undefined {
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
    }

    build(taskId: string, config: Omit<Config, "details">): Task {
        return new Task(taskId, config);
    }

}

export class Task extends Base<Config> {

    public readonly taskId: string;
    public readonly config: Config;

    constructor(taskId: string, config: Omit<Config, "details">) {
        super();

        const task: Config = {
            ...config,
            details: {
                timer: setInterval(
                    () => this.tick(),
                    config.intervalSeconds * 1000, taskId,
                ),
            },
        };

        HueAPI.getLights().then(lights => {
            task.details.colours = config.lightIds.map(lightId =>
                ({
                    xy: lights[lightId].state.xy || [0, 0],
                })
            );
        });

        this.taskId = taskId;
        this.config = task;
    }

    stopTask() {
        clearInterval(this.config.details.timer);
    }

    private tick() {
        const taskId = this.taskId;
        const task = this.config;
        if (!task.details.colours) return;

        task.details.colours.push(task.details.colours.shift());
        console.log({ taskId, colours: task.details.colours });

        Promise.all(
            task.lightIds.map((lightId, index) => {
                const state = {
                    xy: task.details.colours[index].xy,
                    transitiontime: task.transitionTimeSeconds * TRANSITION_TIME_UNITS_PER_SECOND,
                };
                return HueAPI.request('PUT', `/lights/${lightId}/state`, state);
            })
        ).catch(e => console.log({ task: "failed", taskId, e }));
    }

}
