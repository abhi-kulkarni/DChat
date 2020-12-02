import React, { Component } from "react";
import { Row, Col } from "react-bootstrap";


class App extends Component {

    constructor() {
        super();
    }

    render() {
        return ( 
            <div>
                <Row>
                    <Col xs={12} sm={12} md={12} lg={12}>
                        Hello
                    </Col>
                </Row>
            </div>
        )
    }

}

export default App;