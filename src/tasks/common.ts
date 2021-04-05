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

