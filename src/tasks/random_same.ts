import * as t from "io-ts";

import * as HueAPI from "../hue_api";
import {TRANSITION_TIME_UNITS_PER_SECOND} from "../hue_api";
import {
    TIntervalSeconds, TIterations, TLightGroupIds, TPhaseDelaySeconds, TTransitionTimeSeconds, TXY
} from "./codec";
import {Base, TBaseConfig} from "./base";
import {randomXY} from "./colour_tools";
import {deleteBackgroundTask} from "../background";

const TYPE = "random-same";

const TConfig = t.intersection([
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

type Config = t.TypeOf<typeof TConfig>

const TPersistedState = t.type({
    xy: TXY,
    nextGroupIndex: t.number, // weak
    iterationCount: t.number, // weak
});

type PersistedState = t.TypeOf<typeof TPersistedState>

class Task implements Base<Config, PersistedState> {

    public readonly taskId: string;
    public readonly config: Config;
    public readonly state: PersistedState;
    private timer?: NodeJS.Timeout;

    constructor(taskId: string, config: Config, restoreState?: PersistedState) {
        this.taskId = taskId;
        this.config = config;
        this.state = restoreState || this.initialState();
    }

    private initialState() {
        return {
            xy: randomXY(),
            nextGroupIndex: 0,
            iterationCount: 0,
        };
    }

    public startTask() {
        this.timer ||= setTimeout(
            () => this.tick(),
            0,
        );
    }

    public stopTask() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    public persistedState() {
        return {
            iterationCount: this.state.iterationCount,
            nextGroupIndex: this.state.nextGroupIndex,
            xy: this.state.xy,
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
            this.timer = setTimeout(
                () => this.tick(),
                config.intervalSeconds * 1000,
            );

            state.xy = randomXY();

            ++state.iterationCount;
            if (config.maxIterations && state.iterationCount >= config.maxIterations) {
                deleteBackgroundTask(this.taskId);
            }
        } else {
            this.timer = setTimeout(
                () => this.tick(),
                (config.phaseDelaySeconds || 0) * 1000,
            );
        }
    }

}

export default {
    TYPE,
    TConfig,
    TPersistedState,
    Task,
}
