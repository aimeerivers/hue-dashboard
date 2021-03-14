export type BaseConfig = {
    name: string;
    enabled: boolean;
}

export abstract class Base<C extends BaseConfig> {
    public readonly taskId: string;
    public readonly config: C;

    constructor(taskId: string) {
        this.taskId = taskId;
    }

    public abstract startTask(): void;
    public abstract stopTask(): void;
    public abstract save(): any;
}

export abstract class BaseFactory<C extends BaseConfig, T extends Base<C>> {
    abstract validate(config: any): {
        build: (taskId: string, state?: any) => T;
    } | undefined;
}
