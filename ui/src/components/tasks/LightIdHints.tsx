import * as React from "react";
import {useEffect, useState} from "react";

const styles = require('./LightIdHints.css');

export default (props: {lightIds: (string | string[])[]}) => {
    const [lights, setLights] = useState<{lights: {id: string; name: string;}[]}>();

    const readLights = () => {
        fetch("/proxy/lights").then(response => response.json().then(setLights));
    };

    useEffect(readLights, []);

    if (!lights) return null;

    const describeLight = (id: string) => {
        const light = lights.lights.find(l => l.id === id);
        if (!light) return <span style={{color: "red"}}>{id}: no such light</span>;

        return <span>{id}: {light.name}</span>;
    };

    return <div className={styles.List}>
        {props.lightIds.map((idOrIds, index0) =>
            typeof idOrIds === "string"
                ? <span key={index0} className={styles.LightItemSingle}>{describeLight(idOrIds)}</span>
                : <span key={index0} className={styles.LightItemGroup}>
                    {idOrIds.map((id, index1) =>
                        <span key={index1} className={styles.LightItemGroupItem}>{describeLight(id)}</span>
                    )}
                </span>
        )}
    </div>;
};
