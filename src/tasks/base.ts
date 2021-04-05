import * as t from "io-ts";

export const TName = new t.Type<string>(
    "name",
    (u): u is string => typeof u === "string",
    (u, c) => {
        if (u === undefined) return t.success("");
        else if (typeof u === "string") return t.success(u);
        else return t.failure(u, c);
    },
    v => v,
);

export const TEnabled = new t.Type<boolean>(
    "enabled",
    (u): u is boolean => u === true || u === false,
    (u, c) => {
        if (u === undefined) return t.success(true);
        else if (u === true || u === false) return t.success(u);
        else return t.failure(u, c);
    },
    v => v,
);

export const TBaseConfig = t.type({
    name: TName,
    enabled: TEnabled,
});

export type BaseConfig = t.TypeOf<typeof TBaseConfig>

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
