import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import decode from "jwt-decode";
import {
  friend_requests,
  sign_in,
  user_data,
  chat_requests,
  notifications,
  chat_status,
  conversation_modal_data,
  conversation_delete
} from "../redux";
import axiosInstance from "../components/axiosInstance";
import WebSocketInstance from "../websocket";

class AuthRoute extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuth: false,
      curr_user_data: {},
    };
  }

  async componentDidMount() {
    let { history, auth, location, session } = this.props;
    let isLoggedIn = this.props.session.isLoggedIn;
    if (
      location.pathname.includes('signin') || location.pathname.includes('signup')) {
      this.setState({ isAuth: true });
    } else {
      if (auth) {
        const token = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        if (!token || !refreshToken) {
          history.push("/signin");
        }
        try {
          const { exp } = decode(refreshToken);
          const curr_time = new Date().getTime() / 1000;
          let token_response = exp >= curr_time;
          if (isLoggedIn) {
            if (!(isLoggedIn && token_response)) {
              history.push("/signin");
            } else {
              this.setState({ isAuth: true, curr_user_data: this.props.session.user_data });
            }
          } else {
            const resp = await axiosInstance.get("is_authenticated/");
            const user = await resp.data.user;
            this.setState({ curr_user_data: user });
            // const friend_requests_data = await resp.data.friend_requests;
            // const chat_requests_data = await resp.data.chat_requests;
            const notification_data = await resp.data.notifications;
            // const modal_data = await resp.data.conversation_modal_data;
            // const conversation_delete_dict = await resp.data.conversation_delete_dict;
            const ok = await resp.data.ok;
            if (ok) {
              this.props.dispatch(sign_in());
              this.props.dispatch(user_data(user));
              // this.props.dispatch(friend_requests(friend_requests_data));
              // this.props.dispatch(chat_requests(chat_requests_data));
              this.props.dispatch(notifications(notification_data));
              // this.props.dispatch(conversation_modal_data(modal_data));
              // this.props.dispatch(conversation_delete(conversation_delete_dict.remove, "remove"))
              this.setState({ isAuth: true });
            } else {
              history.push("/signin");
            }
          }
        } catch (error) {
          // console.log(location);
          // console.log(history);
          // console.log(error);
          console.log("TOKEN Error");
          history.push("/signin");
        }
      } else {
        this.setState({ isAuth: true });
      }
    }
    let user = this.props.session.user_data;
    let self = this;
    // console.log("Intercept before route jump", this.props);
    if (!this.props.path.includes("messenger")) {
      WebSocketInstance.conversationRequestNotificationCallbacks(
        () => {},
        (data) => self.setConversationStatusData(data)
      )
      this.initializeConversationStatus(user.id, "offline", "sender")
    }
  }

  initializeConversationStatus = (uId, status, type) => {
    this.waitForSocketConnection(() => {
      WebSocketInstance.setConversationStatus(uId, status, type);
    });
  };

  setConversationStatusData(data) {
    this.props.dispatch(chat_status(data));
  }

  waitForSocketConnection = (callback) => {
    let self = this;
    setTimeout(function () {
      if (WebSocketInstance.state() === 1) {
        console.log("Connection is secure");
        callback();
      } else {
        console.log("wait for connection...");
        self.waitForSocketConnection(callback);
      }
    }, 100);
  };

  render() {
    return (
      <div style={{ padding: "0px", margin: "0px" }}>
        {this.state.isAuth
          ? this.props.layout
            ? React.createElement(
                this.props.layout,
                { style: { marginTop: "0px" } },
                React.createElement(this.props.component)
              )
            : React.createElement(this.props.component)
          : ""}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  session: state.session,
});

export default withRouter(connect(mapStateToProps)(AuthRoute));
