import * as HueAPI from "../hue_api";
import {TRANSITION_TIME_UNITS_PER_SECOND} from "../hue_api";
import {validateIntervalSeconds, validateLightIds, validateTransitionTimeSeconds} from "./common";
import {Base, BaseFactory} from "./base";
import {randomXY} from "./colour_tools";

const TYPE = "random-same";

export type Config = {
    type: typeof TYPE;
    lightIds: string[];
    transitionTimeSeconds: number;
    intervalSeconds: number;
};

export type State = {
    timer: NodeJS.Timeout;
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

        const c: Config = {
            type: TYPE,
            lightIds,
            transitionTimeSeconds,
            intervalSeconds,
        };

        return {
            build: (taskId: string) => new Task(taskId, c),
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

    constructor(taskId: string, config: Config) {
        super(taskId);

        this.config = config;
        const state = this.initialState();
        this.state = state;
    }

    private initialState(): State {
        return {
            timer: setInterval(
                () => this.tick(),
                this.config.intervalSeconds * 1000,
            ),
        };
    }

    public stopTask() {
        clearInterval(this.state.timer);
    }

    private tick() {
        const taskId = this.taskId;
        const config = this.config;

        const lightState = {
            xy: randomXY(),
            transitiontime: config.transitionTimeSeconds * TRANSITION_TIME_UNITS_PER_SECOND,
        };

        Promise.all(
            config.lightIds.map(lightId =>
                HueAPI.request('PUT', `/lights/${lightId}/state`, lightState)
            )
        ).catch(e => console.log({ task: "failed", taskId, e }));
    }

}
