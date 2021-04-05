import * as React from 'react';
import {useEffect, useState} from "react";

const url = "/background";

type Props = {
    onEdit: (id: string) => void;
}

type Task = {
    id: string;
    enabled: boolean;
    name: string;
}

const compareTasks = (a: Task, b: Task) => {
    let r = a.name.localeCompare(b.name);
    if (r === 0) r = a.id.localeCompare(b.id);
    return r;
};

export default (props: Props) => {
    const [data, setData] = useState<Task[]>();

    const readData = () => {
        fetch(url)
            .then(response =>
                response.json()
                    .then((list: Task[]) => list.sort(compareTasks))
                    .then(setData)
            )
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
        {data && data.length === 0 && <p><em>No tasks defined</em></p>}
        {data && <>
            <ul>
                {data.map((task, index) => <li key={index}>
                    <input type={"checkbox"}
                           checked={task.enabled}
                           onChange={e => doEnable(task, e.target.checked)}
                           />
                    {' '}{task.name.trim() || "<unnamed task>"}
                    <button onClick={() => props.onEdit(task.id)}>Edit</button>
                </li>)}
            </ul>
        </>}
    </div>
};
