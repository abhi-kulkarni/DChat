import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import brandImg from '../static/images/brand_img.png'

function Header(props) {

    return (
        <div className="fixed-top" style={{padding: '0%', margin: '0%'}}>
            <Navbar collapseOnSelect expand="lg" bg="light">
                <Navbar.Brand href="/">
                <img
                    alt="Brand Image"
                    src={brandImg}
                    width="40"
                    height="35"
                    className="img-fluid d-inline-block align-top"
                />{' '}
                <span style={{ 'padding': '5%', fontSize: '1.2rem', color: 'gray' }}>Neutrino.io</span>
                </Navbar.Brand>
                    <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                        <Navbar.Collapse id="responsive-navbar-nav">
                            <Nav className="ml-auto">
                                <Nav.Link href="/signin">Sign In</Nav.Link>
                                <Nav.Link  href="/signup">Sign Up</Nav.Link>
                            </Nav>
                    </Navbar.Collapse>
                </Navbar>
        </div>
    );
}

export default Header
