import * as HueAPI from "../hue_api";
import {TRANSITION_TIME_UNITS_PER_SECOND} from "../hue_api";
import {validateIntervalSeconds, validateIterations, validateLightIds, validateTransitionTimeSeconds} from "./common";
import {Base, BaseFactory} from "./base";
import {randomXY} from "./colour_tools";
import {deleteBackgroundTask} from "../background";

const TYPE = "random-different";

export type Config = {
    type: typeof TYPE;
    lightIds: string[];
    transitionTimeSeconds: number;
    intervalSeconds: number;
    maxIterations: number | null;
};

export type State = {
    timer: NodeJS.Timeout;
    iterationCount: number;
}

export class Builder extends BaseFactory<Config, Task> {

    validate(config: any) {
        if (config.type !== TYPE) return;

        const lightIds = validateLightIds(config.lightIds);
        if (!lightIds) return;

        const transitionTimeSeconds = validateTransitionTimeSeconds(config.transitionTimeSeconds);
        if (transitionTimeSeconds === undefined) return;

        const intervalSeconds = validateIntervalSeconds(config.intervalSeconds);
        if (intervalSeconds === undefined) return;

        const maxIterations = validateIterations(config.maxIterations);
        if (maxIterations === undefined) return;

        const c: Config = {
            type: TYPE,
            lightIds,
            transitionTimeSeconds,
            intervalSeconds,
            maxIterations,
        };

        return {
            build: (taskId: string, state?: any) => new Task(taskId, c, state)
        };
    }

    build(taskId: string, config: Config): Task {
        return new Task(taskId, config);
    }

}

export class Task extends Base<Config> {

    public readonly taskId: string;
    public readonly config: Config;
    private readonly state: State;

    constructor(taskId: string, config: Config, restoreState?: any) {
        super(taskId);

        this.config = config;
        let state: State | undefined;
        if (restoreState) state = this.restoreState(restoreState);
        this.state = state || this.initialState();
    }

    private initialState(): State {
        return {
            timer: setInterval(
                () => this.tick(),
                this.config.intervalSeconds * 1000,
            ),
            iterationCount: 0,
        };
    }

    private restoreState(restore: any): State | undefined {
        const iterationCount = validateIterations(restore.iterationCount);
        if (iterationCount === undefined || iterationCount === null) return;

        return {
            timer: setInterval(
                () => this.tick(),
                this.config.intervalSeconds * 1000,
            ),
            iterationCount,
        };
    }

    public stopTask() {
        clearInterval(this.state.timer);
    }

    public save() {
        return {
            iterationCount: this.state.iterationCount,
        };
    }

    private tick() {
        const taskId = this.taskId;
        const config = this.config;
        const state = this.state;

        Promise.all(
            config.lightIds.map(lightId => {
                const lightState = {
                    xy: randomXY(),
                    transitiontime: config.transitionTimeSeconds * TRANSITION_TIME_UNITS_PER_SECOND,
                };
                return HueAPI.request('PUT', `/lights/${lightId}/state`, lightState);
            })
        ).catch(e => console.log({ task: "failed", taskId, e }));

        ++state.iterationCount;
        if (config.maxIterations && state.iterationCount >= config.maxIterations) {
            deleteBackgroundTask(this.taskId);
        }
    }

}
