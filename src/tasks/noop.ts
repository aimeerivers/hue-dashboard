import {Base, BaseConfig, BaseFactory} from "./base";
import {validateBaseConfig} from "./common";

const TYPE = "noop";

export type Config = BaseConfig & {
    type: typeof TYPE;
};

export type State = {
}

export class Builder extends BaseFactory<Config, Task> {

    validate(config: any) {
        if (config.type !== TYPE) return;

        const base = validateBaseConfig(config);
        if (!base) return;

        const typedConfig: Config = {
            ...base,
            type: TYPE,
        };

        return {
            build: (taskId: string, _state?: any) => new Task(taskId, typedConfig),
        };
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
        return {};
    }

    public startTask() {
    }

    public stopTask() {
    }

    public save() {
        return null;
    }

}
