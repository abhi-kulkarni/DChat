import React, { Component, useEffect } from "react";
import { withRouter } from "react-router-dom";
import CustomRouter from "./router";
import WebSocketInstance from "./websocket";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { notifications } from "./redux";

function App(props) {

  const dispatch = useDispatch();
  const history = useHistory();
  const curr_user_data = useSelector((state) => state.session.user_data);

  useEffect(() => {
    initializeSocket();
    WebSocketInstance.conversationRequestNotificationCallbacks(
      (data) => setSocketConversationRequestData(data),
      (data) => setConversationStatusData(data))
    WebSocketInstance.friendRequestNotificationCallbacks((data) =>
      setSocketFriendRequestData(data)
    );
  }, []);


  const initializeSocket = () => {
    WebSocketInstance.connect("rm_sock");
    // waitForSocketConnection(() => {
    //   WebSocketInstance.fetchSocketData(curr_user_data.id);
    // });
  };

  const waitForSocketConnection = (callback) => {
    setTimeout(function () {
      if (WebSocketInstance.state() === 1) {
        console.log("Connection is secure");
        callback();
      } else {
        console.log("wait for connection...");
        waitForSocketConnection(callback);
      }
    }, 100);
  };


  const setSocketFriendRequestData = (data) => {
    if(data.action === 'add'){
      dispatch(notifications(data.notification_data, "new"));
    }
  }

  const setSocketConversationRequestData = (data) => {
    if(data.action === 'add'){
      dispatch(notifications(data.notification_data, "new"));
    }
  }

  const setConversationStatusData = (data) => {
    // console.log(data);
  }

return (
  <div className="App">
    <CustomRouter />
  </div>
);
}

export default withRouter(App);
