import * as t from "io-ts";

import {Base, TBaseConfig} from "./base";

const TYPE = "noop";

const TConfig = t.intersection([
    TBaseConfig,
    t.type({
        type: t.literal(TYPE),
    }),
]);

type Config = t.TypeOf<typeof TConfig>

const TState = t.type({});

type State = t.TypeOf<typeof TState>

class Task implements Base<Config, State> {

    public readonly taskId: string;
    public readonly config: Config;
    public readonly state: State;

    constructor(taskId: string, config: Config, state?: State) {
        this.taskId = taskId;
        this.config = config;
        this.state = state || {};
    }

    public start() {
    }

    public stop() {
    }

}

export default {
    TYPE,
    TConfig,
    TState,
    Task,
}
