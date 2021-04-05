import * as t from "io-ts";
import {isLeft} from "fp-ts/Either";

import * as HueAPI from "../hue_api";
import {TRANSITION_TIME_UNITS_PER_SECOND} from "../hue_api";
import {
    TIntervalSeconds,
    TIterations,
    TLightIds,
    TTransitionTimeSeconds,
    TXY
} from "./codec";
import {Base, BaseFactory, TBaseConfig} from "./base";
import {deleteBackgroundTask} from "../background";

const TYPE = "cycle";

export const TConfig = t.intersection([
    TBaseConfig,
    t.type({
        type: t.literal(TYPE),
        lightIds: TLightIds,
        transitionTimeSeconds: TTransitionTimeSeconds,
        intervalSeconds: TIntervalSeconds,
        maxIterations: TIterations,
    }),
]);

export type Config = t.TypeOf<typeof TConfig>

const TPersistedState = t.type({
    iterationCount: t.number, // weak
    colours: t.array(t.type({ xy: TXY })),
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

    private restoreState(restore: any): State | undefined {
        const maybeState = TPersistedState.decode(restore);
        if (isLeft(maybeState)) return;

        return maybeState.right;
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

    public save() {
        return {
        iterationCount: this.state.iterationCount,
            colours: this.state.colours,
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
