import * as React from 'react';
import {useEffect, useState} from 'react';

type Group = {
    id: string;
    name: string;
    lights: string[];
}

type Light = {
    id: string;
    name: string;
}

export default () => {
    const [lightsData, setLightsData] = useState<any>();
    const [groupsData, setGroupsData] = useState<any>();

    const readData = () => {
        fetch("/proxy/lights").then(response => response.json().then(setLightsData));
        fetch("/proxy/groups").then(response => response.json().then(setGroupsData));
    };

    useEffect(() => {
        readData();
        const timer = setInterval(readData, 60000);
        return () => clearInterval(timer);
    }, []);

    const g: {
        groups: Group[];
    } = groupsData;

    const l: {
        lights: Light[];
    } = lightsData;

    const render = () => {
        const lightsById: Map<string, Light> = new Map();
        l.lights.forEach(light => lightsById.set(light.id, light));

        const showGroup = (group: Group) => {
            const lightsInThisGroup: Light[] = group.lights.map(id => lightsById.get(id)).filter(t => t) as Light[];
            if (lightsInThisGroup.length === 0) return null;

            lightsInThisGroup.sort((a, b) => a.name.localeCompare(b.name));

            return <div>
                <h2>{group.name}</h2>
                <ol style={{listStyle: "none"}}>
                    {lightsInThisGroup.map(light =>
                        <li key={light.id}>{light.id} {light.name}</li>
                    )}
                </ol>
            </div>;
        };

        const lightsInNoGroups = new Map(lightsById);
        g.groups.forEach(group =>
            group.lights.forEach(id => lightsInNoGroups.delete(id))
        );

        return <>
            {g.groups.sort((a, b) => a.name.localeCompare(b.name))
                .map(group => <div key={group.id}>{showGroup(group)}</div>)}
            {lightsInNoGroups.size > 0 && showGroup({ id: "", name: "<no group>", lights: [...lightsInNoGroups.keys()] })}
        </>;
    };

    return <div>
        <h1>Lights + Groups</h1>
        {l && g && render()}
    </div>
};
