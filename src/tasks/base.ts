export abstract class Base<C> {
    public readonly taskId: string;
    public readonly config: C;

    constructor(taskId: string) {
        this.taskId = taskId;
    }

    public abstract stopTask();
    public abstract save(): any;
}

export abstract class BaseFactory<C, T extends Base<C>> {
    abstract validate(config: any): {
        build: (taskId: string, state?: any) => T;
    } | undefined;
}
