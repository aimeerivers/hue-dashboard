import * as t from "io-ts";
import {isLeft} from "fp-ts/Either";

import {BaseConfig} from "./base";

export const validateBaseConfig = (data: any): BaseConfig | undefined => {
    let name = data.name;
    if (name === undefined) name = "";
    if (typeof name !== 'string') return;

    let enabled = data.enabled;
    if (enabled === undefined) enabled = true;
    if (enabled !== false && enabled !== true) return;

    return { name, enabled };
};

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

export const validateLightIds = (data: any): string[] | undefined => {
    if (!Array.isArray(data)) return;

    const dataArray: any[] = data;
    if (!dataArray.every(item => couldBeLightId(item))) return;

    return dataArray;
};

export const validateLightGroupIds = (data: any): (string | string[])[] | undefined => {
    if (!Array.isArray(data)) return;

    if (data.every(item => couldBeLightId(item) || validateLightIds(item))) return data;

    return;
};

const couldBeLightId = (data: any): boolean =>
    (typeof data === 'string') && !!data.match(/^[0-9]{1,6}$/);

export const TLightId = new t.Type<string, string, unknown>(
    "LightId",
    (u): u is string => typeof u === "string" && !!u.match(/^[0-9]{1,6}$/) !== null,
    (u, c) => {
        const r = t.string.validate(u, c);
        if (isLeft(r)) return r;

        if (!r.right.match(/^[0-9]{1,6}$/)) return t.failure(u, c, "light IDs must be numeric");

        return t.success(r.right);
    },
    (a) => a,
);

export const TLightIds = t.array(TLightId);
export const TLightGroupIds = t.array(t.union([TLightId, t.array(TLightId)]));

export const validateTransitionTimeSeconds = (data: any) => validateNumber(data, { min: 0, max: 60 });

export const TTransitionTimeSeconds = new t.Type<number, number, unknown>(
    "TransitionTimeSeconds",
    (u): u is number => typeof u === "number" && !isNaN(u) && isFinite(u) && u >= 0 && u <= 60,
    (u, c) => {
        if (u === undefined) return t.success(0.4);
        if (typeof u === "number" && !isNaN(u) && isFinite(u) && u >= 0 && u <= 60) {
            return t.success(u);
        } else {
            return t.failure(u, c);
        }
    },
    a => a,
);

export const validateIntervalSeconds = (data: any) => validateNumber(data, { min: 0, max: 60 });

export const TIntervalSeconds = new t.Type<number, number, unknown>(
    "IntervalSeconds",
    (u): u is number => typeof u === "number" && !isNaN(u) && isFinite(u) && u >= 0.1 && u <= 60,
    (u, c) => {
        if (u === undefined) return t.success(1);
        if (typeof u === "number" && !isNaN(u) && isFinite(u) && u >= 0.1 && u <= 60) {
            return t.success(u);
        } else {
            return t.failure(u, c);
        }
    },
    a => a,
);

export const TPhaseDelaySeconds = new t.Type<number, number, unknown>(
    "PhaseDelaySeconds",
    (u): u is number => typeof u === "number" && !isNaN(u) && isFinite(u) && u >= 0 && u <= 60,
    (u, c) => {
        if (u === undefined) return t.success(0);
        if (typeof u === "number" && !isNaN(u) && isFinite(u) && u >= 0 && u <= 60) {
            return t.success(u);
        } else {
            return t.failure(u, c);
        }
    },
    a => a,
);

export const validateIterations = (data: any): number | null | undefined => {
    if (data === undefined) return null;
    if (data === null) return null;

    return validateNumber(data, { min: 0, max: undefined });
};

export const TIterations = new t.Type<number | null>(
    "Iterations",
    (u): u is (number | null) => typeof u === "number" || u === null || u === undefined,
    (u, c) => {
        if (u === null) return t.success(null);
        if (typeof u === "number" && !isNaN(u) && isFinite(u) && u > 0) {
            return t.success(Math.floor(u));
        } else {
            return t.failure(u, c);
        }
    },
    a => a,
);

const validateNumber = (data: any, opts: { min?: number; max?: number }): number | undefined => {
    if (typeof data !== 'number') return;
    if (isNaN(data) || !isFinite(data)) return;

    if (opts.min !== undefined && data < opts.min) return;
    if (opts.max !== undefined && data > opts.max) return;

    return data;
};

export const TXY = new t.Type<[number, number]>(
    "XY",
    (u): u is [number, number] => Array.isArray(u) && u.length === 2
        && typeof u[0] === "number"
        && typeof u[1] === "number",
    (u, c) => {
        if (
            Array.isArray(u) && u.length === 2
            && typeof u[0] === "number"
            && typeof u[1] === "number"
        ) {
            return t.success([ u[0], u[1] ]);
        } else {
            return t.failure(u, c);
        }
    },
    a => a,
);
