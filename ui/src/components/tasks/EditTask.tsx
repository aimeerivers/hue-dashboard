import * as React from 'react';
import {useEffect, useState} from "react";
import AddTask from "./AddTask";

type Props = {
    id: string;
    onDone: () => void;
}

export default (props: Props) => {

    const [data, setData] = useState<any>();

    useEffect(() => {
        fetch(`/background/${props.id}`)
            .then(r => {
                if (r.status !== 200) props.onDone();

                return r.json();
            })
            .then(setData);
    }, [props.id]);

    if (!data) return null;

    return (
        <AddTask
            onDone={props.onDone}
            taskId={data.id}
            name={data.name}
            enabled={data.enabled}
            type={data.type}
            lightIds={data.lightIds}
            transitionTimeSeconds={data.transitionTimeSeconds}
            intervalSeconds={data.intervalSeconds}
            phaseDelaySeconds={data.phaseDelaySeconds}
            maxIterations={data.maxIterations}
        />
    );
};
