import * as React from 'react';
import {useState} from "react";

import { Tabs, TabList, Tab, TabPanel } from '@zendeskgarden/react-tabs';
import {DEFAULT_THEME, ThemeProvider} from '@zendeskgarden/react-theming'

import BackgroundTasks from "./tasks";
import Debug from "./debug";

export default () => {
    const [selectedTab, setSelectedTab] = useState('tasks');

    return (
        <ThemeProvider theme={DEFAULT_THEME}>
            <Tabs selectedItem={selectedTab} onChange={setSelectedTab}>
                <TabList>
                    <Tab item="tasks">Tasks</Tab>
                    <Tab item="debug">Debug</Tab>
                </TabList>
                <TabPanel item="tasks">
                    {selectedTab === 'tasks' && <BackgroundTasks/>}
                </TabPanel>
                <TabPanel item="debug">
                    {selectedTab === 'debug' && <Debug/>}
                </TabPanel>
            </Tabs>
        </ThemeProvider>
    );
};
