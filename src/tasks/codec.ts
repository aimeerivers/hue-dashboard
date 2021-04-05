import * as t from "io-ts";
import {isLeft} from "fp-ts/Either";

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
