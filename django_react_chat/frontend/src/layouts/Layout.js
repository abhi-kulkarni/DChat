import React from "react";
import { withRouter } from "react-router-dom";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";

function Layout(props) {
  return (
    <div>
      <Header />
      {props.children}
      <Footer />
    </div>
  );
}

export default withRouter(Layout);
