import React from "react";
import jQuery from "jquery";

const getCookie = (name) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    let cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      var cookie = jQuery.trim(cookies[i]);
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

let csrf_token = getCookie("csrftoken");

const CSRFToken = () => {
  return (
    <input
      type="hidden"
      name="csrf_middleware_token"
      value={csrf_token ? csrf_token : ""}
    />
  );
};
export default CSRFToken;
