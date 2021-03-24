import * as React from 'react';
import {useState} from "react";

import { Tabs, TabList, Tab, TabPanel } from '@zendeskgarden/react-tabs';

import DebugLights from "./DebugLights";
import DebugGroups from "./DebugGroups";
import DebugScenes from "./DebugScenes";
import DebugLightsGroups from "./DebugLightsGroups";

export default () => {
    const [selectedTab, setSelectedTab] = useState('lights');

    return (
        <Tabs selectedItem={selectedTab} onChange={setSelectedTab}>
            <TabList>
                <Tab item="lights">Lights</Tab>
                <Tab item="groups">Groups</Tab>
                <Tab item="scenes">Scenes</Tab>
                <Tab item="lights-groups">Lights + Groups</Tab>
            </TabList>
            <TabPanel item="lights">
                {selectedTab === 'lights' && <DebugLights/>}
            </TabPanel>
            <TabPanel item="groups">
                {selectedTab === 'groups' && <DebugGroups/>}
            </TabPanel>
            <TabPanel item="scenes">
                {selectedTab === 'scenes' && <DebugScenes/>}
            </TabPanel>
            <TabPanel item="lights-groups">
                {selectedTab === 'lights-groups' && <DebugLightsGroups/>}
            </TabPanel>
        </Tabs>
    );
};
