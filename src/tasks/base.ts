export abstract class Base<C> {
    public readonly taskId: string;
    public readonly config: C;
    // abstract constructor(taskId: string, config: Omit<C, "details">);
    abstract stopTask();
}

export abstract class BaseFactory<C, T extends Base<C>> {
    abstract validate(config: any): Omit<C, "details"> | undefined;
    abstract build(taskId: string, config: Omit<C, "details">): T;
}
