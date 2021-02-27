export abstract class Base<C> {
    public readonly taskId: string;
    public readonly config: C;

    constructor(taskId: string) {
        this.taskId = taskId;
    }

    public abstract stopTask();
}

export abstract class BaseFactory<C, T extends Base<C>> {
    abstract validate(config: any): {
        build: (taskId: string) => T;
    } | undefined;
}
