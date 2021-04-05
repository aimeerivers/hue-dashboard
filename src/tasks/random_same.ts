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

const TState = t.type({
    xy: TXY,
    nextGroupIndex: t.number, // weak
    iterationCount: t.number, // weak
});

type State = t.TypeOf<typeof TState>

class Task implements Base<Config, State> {

    public readonly taskId: string;
    public readonly config: Config;
    public readonly state: State;
    private timer?: NodeJS.Timeout;

    constructor(taskId: string, config: Config, restoreState?: State) {
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

    public start() {
        this.timer ||= setTimeout(
            () => this.tick(),
            0,
        );
    }

    public stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
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
    TState,
    Task,
}
