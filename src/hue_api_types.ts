export type Light = {
    state: {
        on: boolean;
        bri: number;
        hue: number;
        sat: number;
        effect: string;
        xy: [number, number];
        ct: number;
        alert: string;
        colormode: string;
        mode: string;
        reachable: boolean;
    };
    swupdate: any;
    type: string;
    name: string;
    modelid: string;
    manufacturername: string;
    productname: string;
    capabilities: any;
    config: any;
    uniqueid: string;
    swversion: string;
    swconfigid: string;
    productid: string;
}

export type Lights = Record<string, Light>

export type Group = {
    name: string;
    lights: string[];
    sensors: string[];
    type: string;
    state: {
        any_on: boolean;
        all_on: boolean;
    };
    recycle: boolean;
    class: string;
    action: {
        on: boolean;
        bri: number;
        hue: number;
        sat: number;
        effect: string;
        xy: [number, number];
        ct: number;
        alert: string;
        colormode: string;
    };
}

export type Groups = Record<string, Group>

export type Scene = {
    name: string;
    type: string;
    group: string;
    lights: string[];
    owner: string;
    recycle: boolean;
    locked: boolean;
    appdata: {
        version: number;
        data: string;
    };
    picture: string;
    image: string;
    lastupdated: string;
    version: number;
    lightstates: Record<string, {
        on: boolean;
        bri: number;
        xy: [number, number];
        hue: number;
        sat: number;
        effect: string;
        ct: number;
        alert: string;
        colormode: string;
    }>;
}

export type Scenes = Record<string, Scene>
