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
      location.pathname === "/signin/" ||
      location.pathname === "/signin" ||
      location.pathname === "/signup/" ||
      location.pathname === "/signup"
    ) {
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
              this.setState({ isAuth: true });
            }
          } else {
            const resp = await axiosInstance.get("is_authenticated/");
            const user = await resp.data.user;
            this.setState({ curr_user_data: user });
            const friend_requests_data = await resp.data.friend_requests;
            const chat_requests_data = await resp.data.chat_requests;
            const notification_data = await resp.data.notifications;
            const ok = await resp.data.ok;
            if (ok) {
              this.props.dispatch(sign_in());
              this.props.dispatch(user_data(user));
              this.props.dispatch(friend_requests(friend_requests_data));
              this.props.dispatch(chat_requests(chat_requests_data));
              this.props.dispatch(notifications(notification_data));
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
    let user = this.state.curr_user_data;
    // console.log("Intercept before route jump", this.props);
    if (!this.props.path.includes("chat")) {
      let self = this;
      WebSocketInstance.connect("chat_requests", "");
      WebSocketInstance.chatRequestNotificationCallbacks(
        () => {},
        (data) => self.setChatStatus(data),
        () => {},
        () => {}
      );
      this.waitForSocketConnection(() => {
        WebSocketInstance.setChatStatus(user.id, "offline", "sender");
      });
    } else if (this.props.path == "/chat" || this.props.path == "/chat/") {
      //pass
    }
  }

  setChatStatus(data) {
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
                null,
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
