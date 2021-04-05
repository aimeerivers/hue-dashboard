import * as t from "io-ts";

import * as HueAPI from "../hue_api";
import {TRANSITION_TIME_UNITS_PER_SECOND} from "../hue_api";
import {
    TIntervalSeconds,
    TIterations,
    TLightIds,
    TTransitionTimeSeconds,
    TXY
} from "./codec";
import {Base, TBaseConfig} from "./base";
import {deleteBackgroundTask} from "../background";

const TYPE = "cycle";

const TConfig = t.intersection([
    TBaseConfig,
    t.type({
        type: t.literal(TYPE),
        lightIds: TLightIds,
        transitionTimeSeconds: TTransitionTimeSeconds,
        intervalSeconds: TIntervalSeconds,
        maxIterations: TIterations,
    }),
]);

type Config = t.TypeOf<typeof TConfig>

const TPersistedState = t.type({
    iterationCount: t.number, // weak
    colours: t.array(t.type({ xy: TXY })),
});

type PersistedState = t.TypeOf<typeof TPersistedState>

type State = {
    timer?: NodeJS.Timeout;
} & PersistedState

class Task implements Base<Config, PersistedState> {

    public readonly taskId: string;
    public readonly config: Config;
    private readonly state: State;

    constructor(taskId: string, config: Config, restoreState?: PersistedState) {
        this.taskId = taskId;
        this.config = config;
        this.state = restoreState || this.initialState();
    }

    private initialState(): State {
        const state: State = {
            iterationCount: 0,
            colours: [],
        };

        HueAPI.getLights().then(lights => {
            state.colours = this.config.lightIds.map(lightId =>
                ({
                    xy: lights[lightId].state.xy || [0, 0],
                })
            );
        });

        return state;
    }

    public startTask() {
        this.state.timer ||= setInterval(
            () => this.tick(),
            this.config.intervalSeconds * 1000,
        );
    }

    public stopTask() {
        if (this.state.timer) {
            clearInterval(this.state.timer);
            this.state.timer = undefined;
        }
    }

    public persistedState() {
        return {
            colours: this.state.colours,
            iterationCount: this.state.iterationCount,
        };
    }

    private tick() {
        const taskId = this.taskId;
        const config = this.config;
        const state = this.state;

        const colours = state.colours;
        if (colours.length === 0) return;

        const colour = colours.shift();
        if (!colour) return;

        colours.push(colour);
        console.log({ taskId, colours: state.colours });

        Promise.all(
            config.lightIds.map((lightId, index) => {
                const lightState = {
                    xy: colours[index].xy,
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

export default {
    TYPE,
    TConfig,
    TPersistedState,
    Task,
}
