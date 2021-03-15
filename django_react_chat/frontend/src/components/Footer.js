import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import NavbarBrand from "react-bootstrap/NavbarBrand";
import Container from "react-bootstrap/Container";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, Link } from "react-router-dom";

function Footer(props) {

  const isLoggedIn = useSelector((state) => state.session.isLoggedIn);
  const history = useHistory();

  const redirectPage = (page) => {
    let uri = page;
    uri = isLoggedIn ? "/home" : "/"
    history.push(uri);
  }

  return (
    <div className="fixed-bottom">
      <Navbar bg="light">
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="ml-auto">
            <Nav.Link onClick={() => redirectPage('/')} style={{ fontSize: "0.8rem" }}>
              Rolling Matrix
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </div>
  );
}

export default Footer;
