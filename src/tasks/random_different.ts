import * as HueAPI from "../hue_api";
import {TRANSITION_TIME_UNITS_PER_SECOND} from "../hue_api";
import {
    validateIntervalSeconds,
    validateIterations,
    validateLightGroupIds,
    validateTransitionTimeSeconds
} from "./common";
import {Base, BaseFactory} from "./base";
import {randomXY} from "./colour_tools";
import {deleteBackgroundTask} from "../background";

const TYPE = "random-different";

export type Config = {
    type: typeof TYPE;
    lightIds: (string | string[])[];
    transitionTimeSeconds: number;
    intervalSeconds: number;
    phaseDelaySeconds?: number;
    maxIterations: number | null;
};

export type State = {
    timer?: NodeJS.Timeout;
    nextGroupIndex: number;
    iterationCount: number;
}

export class Builder extends BaseFactory<Config, Task> {

    validate(config: any) {
        if (config.type !== TYPE) return;

        const lightIds = validateLightGroupIds(config.lightIds);
        if (!lightIds) return;

        const transitionTimeSeconds = validateTransitionTimeSeconds(config.transitionTimeSeconds);
        if (transitionTimeSeconds === undefined) return;

        const intervalSeconds = validateIntervalSeconds(config.intervalSeconds);
        if (intervalSeconds === undefined) return;

        const phaseDelaySeconds = validateIntervalSeconds(config.phaseDelaySeconds);

        const maxIterations = validateIterations(config.maxIterations);
        if (maxIterations === undefined) return;

        const c: Config = {
            type: TYPE,
            lightIds,
            transitionTimeSeconds,
            intervalSeconds,
            phaseDelaySeconds,
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
            nextGroupIndex: 0,
            iterationCount: 0,
        };
    }

    private restoreState(restore: any): State | undefined {
        const iterationCount = validateIterations(restore.iterationCount);
        if (iterationCount === undefined || iterationCount === null) return;

        const nextGroupIndex = restore.nextGroupIndex;
        if (typeof nextGroupIndex !== 'number') return;

        return {
            nextGroupIndex,
            iterationCount,
        };
    }

    public startTask() {
        this.state.timer ||= setTimeout(
            () => this.tick(),
            0,
        );
    }

    public stopTask() {
        if (this.state.timer) {
            clearTimeout(this.state.timer);
            this.state.timer = undefined;
        }
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

        const lightIdOrIds = config.lightIds[state.nextGroupIndex];
        ++state.nextGroupIndex;
        if (state.nextGroupIndex >= config.lightIds.length) state.nextGroupIndex = 0;

        const lightIds = Array.isArray(lightIdOrIds) ? lightIdOrIds : [lightIdOrIds];

        const lightState = {
            xy: randomXY(),
            transitiontime: config.transitionTimeSeconds * TRANSITION_TIME_UNITS_PER_SECOND,
        };

        Promise.all(
            lightIds.map(lightId =>
                HueAPI.request('PUT', `/lights/${lightId}/state`, lightState)
            )
        ).catch(e => console.log({ task: "failed", taskId, e }));

        if (state.nextGroupIndex === 0) {
            state.timer = setTimeout(
                () => this.tick(),
                config.intervalSeconds * 1000,
            );

            ++state.iterationCount;
            if (config.maxIterations && state.iterationCount >= config.maxIterations) {
                deleteBackgroundTask(this.taskId);
            }
        } else {
            state.timer = setTimeout(
                () => this.tick(),
                (config.phaseDelaySeconds || 0) * 1000,
            );
        }
    }

}
