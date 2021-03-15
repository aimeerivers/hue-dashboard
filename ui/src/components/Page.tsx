import * as React from 'react';
import DebugGroups from "./DebugGroups";
import DebugLights from "./DebugLights";
import DebugScenes from "./DebugScenes";
import BackgroundTasks from "./BackgroundTasks";

export default () => {
    return <div>
        <BackgroundTasks/>
        <DebugGroups/>
        <DebugLights/>
        <DebugScenes/>
    </div>
};
