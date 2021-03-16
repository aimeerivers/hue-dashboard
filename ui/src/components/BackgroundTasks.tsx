import * as React from 'react';
import {useEffect, useState} from "react";

const url = "/background";

type Task = {
    id: string;
    enabled: boolean;
    name: string;
}

export default () => {
    const [data, setData] = useState<Task[]>();

    const readData = () => {
        fetch(url)
            .then(response => {
                const data = response.json().then(setData);
            });
    };

    const doEnable = (task: Task, enabled: boolean) => {
        fetch(
            `/background/${task.id}/${enabled ? 'enable' : 'disable'}`,
            { method: "POST" }
        )
            .then(() => {
                readData();
            })
    };

    useEffect(() => {
        readData();
        const timer = setInterval(readData, 5000);
        return () => clearInterval(timer);
    }, []);

    return <div>
        <h1>Tasks</h1>
        {data && <>
            <ul>
                {data.map((task, index) => <li key={index}>
                    #{task.id}{' '}
                    <input type={"checkbox"}
                           checked={task.enabled}
                           onChange={e => doEnable(task, e.target.checked)}
                           />
                    {' '}{task.name.trim() || "<unnamed task>"}
                </li>)}
            </ul>
        </>}
    </div>
};
