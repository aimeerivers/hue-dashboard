import * as t from "io-ts";
import {isLeft} from "fp-ts/Either";

import {Base, BaseFactory, TBaseConfig} from "./base";

const TYPE = "noop";

export const TConfig = t.intersection([
    TBaseConfig,
    t.type({
        type: t.literal(TYPE),
    }),
]);

export type Config = t.TypeOf<typeof TConfig>

export type State = Record<string, never>

export class Builder extends BaseFactory<Config, Task> {

    validate(config: any) {
        const maybeConfig = TConfig.decode(config);
        if (isLeft(maybeConfig)) return;

        const c = maybeConfig.right;

        return {
            build: (taskId: string, _state?: any) => new Task(taskId, c),
        };
    }

}

export class Task extends Base<Config> {

    public readonly taskId: string;
    public readonly config: Config;

    constructor(taskId: string, config: Config) {
        super(taskId);

        this.config = config;
    }

    public startTask() {
    }

    public stopTask() {
    }

    public save() {
        return null;
    }

}
