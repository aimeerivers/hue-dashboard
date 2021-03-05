import * as HueAPI from "../hue_api";
import {TRANSITION_TIME_UNITS_PER_SECOND} from "../hue_api";
import {validateIntervalSeconds, validateIterations, validateLightIds, validateTransitionTimeSeconds} from "./common";
import {Base, BaseFactory} from "./base";
import {deleteBackgroundTask} from "../background";

const TYPE = "cycle";

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
    colours?: { xy: [number, number] }[];
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
        const state: State = {
            timer: setInterval(
                () => this.tick(),
                this.config.intervalSeconds * 1000,
            ),
            iterationCount: 0,
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
        if (!Array.isArray(restore.colours)) return;
        if (restore.colours.length !== this.config.lightIds.length) return;

        const iterationCount = validateIterations(restore.iterationCount);
        if (iterationCount === undefined || iterationCount === null) return;

        return {
            timer: setInterval(
                () => this.tick(),
                this.config.intervalSeconds * 1000,
            ),
            iterationCount,
            colours: restore.colours,
        };
    }

    public stopTask() {
        clearInterval(this.state.timer);
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
        if (!colours) return;

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
