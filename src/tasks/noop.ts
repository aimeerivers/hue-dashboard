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

const TPersistedState = t.type({});

type PersistedState = t.TypeOf<typeof TPersistedState>

class Task implements Base<Config, PersistedState> {

    public readonly taskId: string;
    public readonly config: Config;
    public readonly state: PersistedState;

    constructor(taskId: string, config: Config, persistedState?: PersistedState) {
        this.taskId = taskId;
        this.config = config;
        this.state = persistedState || {};
    }

    public startTask() {
    }

    public stopTask() {
    }

    public persistedState() {
        return {};
    }

}

export default {
    TYPE,
    TConfig,
    TPersistedState,
    Task,
}
