import React from "react";
import {withRouter} from 'react-router-dom';
import '../index.css'

function AtomSpinner(props) {

    return (
        <div>
            <div class="circle"></div>
            <div class="circle" id="vertical"></div>
        </div>
    )
}

export default withRouter(AtomSpinner)
