import * as React from 'react';
import TaskList from "./TaskList";
import { Button } from '@zendeskgarden/react-buttons';
import {useState} from "react";
import AddTask from "./AddTask";

export default () => {
    const [isAdding, setIsAdding] = useState<boolean>(false);

    return <div>
        {!isAdding && <>
            <h1>Tasks</h1>
            <TaskList/>
            <Button isPrimary onClick={() => setIsAdding(true)}>
                Add task
            </Button>
        </>}
        {isAdding && <AddTask onDone={() => setIsAdding(false)}/>}
    </div>
};
