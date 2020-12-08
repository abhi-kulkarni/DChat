import React, {Component} from "react";
import {Row, Col} from "react-bootstrap";
import {Switch, Route, Link} from "react-router-dom";
import Login from "./pages/Signin"
import SignUp from "./pages/Signup";
import Home from "./pages/Home";
import './index.css'
import {withRouter} from 'react-router-dom';
import Layout from './components/Layout'


function App(props) {

    return (
        <div className="App">
            <Switch>
                <Layout>
                    <Route exact path='/' component={Login}/>
                    <Route path="/signin" component={Login}/>
                    <Route path="/signup" component={SignUp}/>
                    <Route path="/home" component={Home}/>
                </Layout>
            </Switch>
        </div>
    )
}

export default withRouter(App)
