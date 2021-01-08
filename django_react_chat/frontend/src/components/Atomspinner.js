import React from "react";
import { withRouter } from "react-router-dom";
import "../index.css";

function AtomSpinner(props) {
  return (
    <div>
      <div className="circle"></div>
      <div className="circle" id="vertical"></div>
    </div>
  );
}

export default withRouter(AtomSpinner);
