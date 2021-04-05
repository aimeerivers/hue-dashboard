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

export interface BaseConstructor<C extends BaseConfig, S> {
    new (taskId: string, config: C, state?: S): Base<C, S>;
}

export interface Base<C extends BaseConfig, S> {
    readonly taskId: string;
    readonly config: C;
    readonly state: S;
    start(): void;
    stop(): void;
}

export type TaskSpec<T extends string, C extends BaseConfig & { type: T; }, S> = {
    TYPE: T;
    TConfig: t.Type<C>;
    TState: t.Type<S>;
    Task: BaseConstructor<C, S>;
}
