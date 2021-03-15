import React from 'react';
import ReactDOM from 'react-dom';
import Page from "./components/Page";

document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(
        <Page/>,
        document.getElementById("react_container")
    );
});
