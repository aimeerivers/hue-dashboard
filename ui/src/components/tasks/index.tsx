import * as React from 'react';
import TaskList from "./TaskList";
import { Button } from '@zendeskgarden/react-buttons';
import {useState} from "react";
import AddTask from "./AddTask";
import EditTask from "./EditTask";

export default () => {
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<string>();

    return <div>
        {!isAdding && !isEditing && <>
            <h1>Tasks</h1>
            <TaskList onEdit={setIsEditing}/>
            <Button isPrimary onClick={() => setIsAdding(true)}>
                Add task
            </Button>
        </>}
        {isAdding && <AddTask onDone={() => setIsAdding(false)}/>}
        {isEditing && <EditTask id={isEditing} onDone={() => setIsEditing(undefined)}/> }
    </div>
};
