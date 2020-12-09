import React, {useEffect} from "react";
import renderRoutesMap from './renderRoutesMap'
import {BrowserRouter as Router, Redirect, Route, Switch, useHistory} from 'react-router-dom'

const renderRoutes = ({routes, extraProps = {}, switchProps = {}}) => (
    <Router>
        <Switch>
            {renderRoutesMap(routes)}
        </Switch>
    </Router>
);

export default renderRoutes

