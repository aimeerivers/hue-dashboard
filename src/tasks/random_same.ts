import * as t from "io-ts";
import {isLeft} from "fp-ts/Either";

import * as HueAPI from "../hue_api";
import {TRANSITION_TIME_UNITS_PER_SECOND} from "../hue_api";
import {
    TIntervalSeconds, TIterations, TLightGroupIds, TPhaseDelaySeconds, TTransitionTimeSeconds, TXY
} from "./codec";
import {Base, BaseFactory, TBaseConfig} from "./base";
import {randomXY} from "./colour_tools";
import {deleteBackgroundTask} from "../background";

const TYPE = "random-same";

export const TConfig = t.intersection([
    TBaseConfig,
    t.type({
        type: t.literal(TYPE),
        lightIds: TLightGroupIds,
        transitionTimeSeconds: TTransitionTimeSeconds,
        intervalSeconds: TIntervalSeconds,
        phaseDelaySeconds: TPhaseDelaySeconds,
        maxIterations: TIterations,
    }),
]);

export type Config = t.TypeOf<typeof TConfig>

const TPersistedState = t.type({
    xy: TXY,
    nextGroupIndex: t.number, // weak
    iterationCount: t.number, // weak
});

export type State = {
    timer?: NodeJS.Timeout;
} & t.TypeOf<typeof TPersistedState>

export class Builder extends BaseFactory<Config, Task> {

    validate(config: any) {
        const maybeConfig = TConfig.decode(config);
        if (isLeft(maybeConfig)) return;

        const c = maybeConfig.right;

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
            xy: randomXY(),
            nextGroupIndex: 0,
            iterationCount: 0,
        };
    }

    private restoreState(restore: any): State | undefined {
        const maybeState = TPersistedState.decode(restore);
        if (isLeft(maybeState)) return;

        return maybeState.right;
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
            xy: state.xy,
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

            state.xy = randomXY();

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
