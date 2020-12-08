import React from "react";
import {withRouter} from 'react-router-dom';
import Header from './Header.js'
import Footer from './Footer.js'


function Layout(props) {

    return (
        <div>
            <Header/>
            {props.children}
            <Footer/>
        </div>
    )
}

export default withRouter(Layout)
