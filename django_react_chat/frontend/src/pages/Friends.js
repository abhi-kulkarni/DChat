import React, { useState, useEffect, useRef } from "react";
import { withRouter } from "react-router-dom";
import axiosInstance from "../components/axiosInstance";
import { useHistory } from "react-router-dom";
import {
  spinner_overlay,
  user_data,
  friend_requests,
  notifications,
} from "../redux";
import { useDispatch, useSelector } from "react-redux";
import "../index.css";
import AtomSpinner from "../components/Atomspinner";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Tooltip from "react-bootstrap/Tooltip";
import {
  FaUserPlus,
  FaCheck,
  FaTimes,
  FaCheckCircle,
  FaUserTimes,
} from "react-icons/fa";
import Dialog from "react-bootstrap-dialog";
import WebSocketInstance from "../websocket";
import moment from "moment";
import { defaultProfilePictureImageDataUri } from "../constants";

function Friends(props) {
  let CustomDialog = useRef(null);
  const [key, setKey] = useState("users");
  const history = useHistory();
  const dispatch = useDispatch();
  const store_overlay = useSelector((state) => state.session.spinner_overlay);
  const curr_user_data = useSelector((state) => state.session.user_data);
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentFriendRequests, setSentFriendRequests] = useState([]);
  const session_friend_requests = useSelector(
    (state) => state.session.friend_requests
  );
  const [friendRequestData, setFriendRequestData] = useState({});
  const mounted = useRef();

  useEffect(() => {
    WebSocketInstance.connect("friend_requests", "");
    WebSocketInstance.friendRequestNotificationCallbacks((data) =>
      setSocketFriendRequestData(data)
    );
  }, []);

  useEffect(() => {
    session_friend_requests
      ? setFriendRequestData(session_friend_requests)
      : setFriendRequestData({});
    if (session_friend_requests && session_friend_requests.action == "accept") {
      dispatch(notifications([session_friend_requests.notification]));
    }
  }, [session_friend_requests]);

  const setSocketFriendRequestData = (data) => {
    spinnerStop();
    if (Object.keys(data).indexOf(curr_user_data.id.toString()) > -1) {
      dispatch(friend_requests(data[curr_user_data.id]));
    }
  };

  const manageNotifications = (notification_data) => {
    let post_data = notification_data[0];
    post_data["type"] = "add";
    axiosInstance
      .post("manage_notifications/", post_data)
      .then((res) => {
        if (res.data.ok) {
          console.log(res.data.notification);
        } else {
          console.log("Error");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const initializeSocket = (uId, rId, action, notificationData) => {
    waitForSocketConnection(() => {
      WebSocketInstance.fetchFriendRequests(uId, rId, action, notificationData);
    });
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

  const getManageFriendsData = () => {
    axiosInstance
      .get("get_manage_friends_data/")
      .then((res) => {
        if (res.data.ok) {
          let friend_id_list = res.data.data_dict["friend_id_list"];
          let sent_friend_requests_id_list =
            res.data.data_dict["sent_friend_requests_id_list"];
          let friend_requests_id_list =
            res.data.data_dict["friend_requests_id_list"];
          setUsers(res.data.users);
          setFriends(res.data.friends);
          setFriendRequests(res.data.friend_requests);
          setSentFriendRequests(res.data.sent_friend_requests);
        } else {
          console.log("Error");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const manageFriends = (action, recipient_user) => {
    let post_data = {};
    post_data["action"] = action;
    post_data["recipient_user_id"] = recipient_user.id;
    axiosInstance
      .post("manage_friends/", post_data)
      .then((res) => {
        if (res.data.ok) {
          let notification_data = res.data.notification;
          initializeSocket(
            curr_user_data.id,
            recipient_user.id,
            action,
            notification_data
          );
          spinner();
        } else {
          console.log("Error");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const manageCancelFriendRequestRef = (action, recipient_user) => {
    CustomDialog.show({
      body: "Are you sure you want to cancel this friend request ?",
      actions: [
        Dialog.DefaultAction(
          "Cancel Request",
          () => {
            manageFriends(action, recipient_user);
          },
          "btn-danger"
        ),
        Dialog.Action(
          "Close",
          () => {
            CustomDialog.hide();
          },
          "btn-primary"
        ),
      ],
    });
  };

  const manageRemoveFriendRequestRef = (action, recipient_user) => {
    CustomDialog.show({
      body:
        "Are you sure you want to unfriend " + recipient_user.username + " ?",
      actions: [
        Dialog.DefaultAction(
          "Unfriend",
          () => {
            manageFriends(action, recipient_user);
          },
          "btn-danger"
        ),
        Dialog.Action(
          "Close",
          () => {
            CustomDialog.hide();
          },
          "btn-primary"
        ),
      ],
    });
  };

  const spinner = (display) => {
    display
      ? (document.getElementById("overlay").style.display = "block")
      : (document.getElementById("overlay").style.display = "none");
  };

  const spinnerStop = () => {
    dispatch(spinner_overlay(false));
    spinner(false);
  };

  return (
    <div>
      <div id="overlay">
        <AtomSpinner />
      </div>
      <div style={{ display: "none" }}>
        <Dialog
          ref={(el) => {
            CustomDialog = el;
          }}
        />
      </div>
      <Row style={{ padding: "0%", margin: "0%" }}>
        <Col
          xs={12}
          sm={12}
          md={12}
          lg={{ span: 8, offset: 2 }}
          xl={{ span: 8, offset: 2 }}
        >
          <Tabs
            className="nav-justified"
            id="manage_friends_tab"
            activeKey={key}
            onSelect={(k) => setKey(k)}
          >
            <Tab eventKey="users" title="Users">
              <div
                style={{
                  margin: "0px",
                  padding: "0px",
                  height: "400px",
                  overflowY: "scroll",
                }}
              >
                {friendRequestData &&
                friendRequestData.hasOwnProperty("users") &&
                friendRequestData.users.length > 0 ? (
                  friendRequestData.users.map((user, index) => {
                    return (
                      <Row
                        key={index}
                        style={{
                          padding: index == 0 ? "5% 0% 0% 0%" : "0% 0% 0% 0%",
                          margin: "0% 0% 1% 0%",
                        }}
                      >
                        <Col
                          xs={4}
                          sm={{ span: 2, offset: 3 }}
                          md={{ span: 2, offset: 3 }}
                          lg={{ span: 2, offset: 3 }}
                          xl={{ span: 2, offset: 3 }}
                        >
                          <img
                            style={{
                              margin: "0% 25%",
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                            }}
                            src={
                              user.profile_picture
                                ? user.profile_picture
                                : defaultProfilePictureImageDataUri
                            }
                            alt="profile_img"
                          />
                        </Col>
                        <Col xs={4} sm={3} md={3} lg={3} xl={3}>
                          <p style={{ paddingTop: "5%" }}>{user.username}</p>
                        </Col>
                        <Col xs={4} sm={4} md={4} lg={4} xl={4}>
                          {user.sent_friend_request ? (
                            <OverlayTrigger
                              key="bottom"
                              placement="top"
                              overlay={
                                <Tooltip id="sent_friend_request_tooltip">
                                  <span>Friend Request Sent</span>
                                </Tooltip>
                              }
                            >
                              <FaCheckCircle className="sent_friend_request" />
                            </OverlayTrigger>
                          ) : (
                            <OverlayTrigger
                              key="bottom"
                              placement="top"
                              overlay={
                                <Tooltip id="add_friend_tooltip">
                                  <span>Send Friend Request</span>
                                </Tooltip>
                              }
                            >
                              <FaUserPlus
                                className="add_friend"
                                onClick={() => manageFriends("add", user)}
                              />
                            </OverlayTrigger>
                          )}
                        </Col>
                      </Row>
                    );
                  })
                ) : (
                  <Row style={{ padding: "0px", margin: "15%" }}>
                    <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                      <p
                        className="text-center"
                        style={{ fontSize: "1rem", fontWeight: "bold" }}
                      >
                        No users found.
                      </p>
                    </Col>
                  </Row>
                )}
              </div>
            </Tab>
            <Tab eventKey="friends" title="Friends">
              <div
                style={{
                  margin: "0px",
                  padding: "0px",
                  height: "400px",
                  overflowY: "scroll",
                }}
              >
                {friendRequestData &&
                friendRequestData.hasOwnProperty("friends") &&
                friendRequestData.friends.length > 0 ? (
                  friendRequestData.friends.map((friend, index) => {
                    return (
                      <Row
                        key={index}
                        style={{
                          padding: index == 0 ? "5% 0% 0% 0%" : "0% 0% 0% 0%",
                          margin: "0% 0% 1% 0%",
                        }}
                      >
                        <Col
                          xs={4}
                          sm={{ span: 2, offset: 3 }}
                          md={{ span: 2, offset: 3 }}
                          lg={{ span: 2, offset: 3 }}
                          xl={{ span: 2, offset: 3 }}
                        >
                          <img
                            style={{
                              margin: "0% 25%",
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                            }}
                            src={
                              friend.profile_picture
                                ? friend.profile_picture
                                : defaultProfilePictureImageDataUri
                            }
                            alt="profile_img"
                          />
                        </Col>
                        <Col xs={4} sm={3} md={3} lg={2} xl={2}>
                          <p style={{ paddingTop: "5%" }}>{friend.username}</p>
                        </Col>
                        <Col xs={4} sm={4} md={4} lg={4} xl={4}>
                          <OverlayTrigger
                            key="bottom"
                            placement="top"
                            overlay={
                              <Tooltip id="remove_friend_tooltip">
                                <span>Remove Friend</span>
                              </Tooltip>
                            }
                          >
                            <FaUserTimes
                              className="remove_friend"
                              onClick={() =>
                                manageRemoveFriendRequestRef("remove", friend)
                              }
                            />
                          </OverlayTrigger>
                        </Col>
                      </Row>
                    );
                  })
                ) : (
                  <Row style={{ padding: "0px", margin: "15%" }}>
                    <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                      <p
                        className="text-center"
                        style={{ fontSize: "1rem", fontWeight: "bold" }}
                      >
                        No Friends yet.
                      </p>
                    </Col>
                  </Row>
                )}
              </div>
            </Tab>
            <Tab eventKey="friend_requests" title="Friend Requests">
              <div
                style={{
                  margin: "0px",
                  padding: "0px",
                  height: "400px",
                  overflowY: "scroll",
                }}
              >
                {friendRequestData &&
                friendRequestData.hasOwnProperty("friend_requests") &&
                friendRequestData.friend_requests.length > 0 ? (
                  friendRequestData.friend_requests.map((friendReq, index) => {
                    return (
                      <Row
                        key={index}
                        style={{
                          padding: index == 0 ? "5% 0% 0% 0%" : "0% 0% 0% 0%",
                          margin: "0% 0% 1% 0%",
                        }}
                      >
                        <Col
                          xs={4}
                          sm={{ span: 2, offset: 3 }}
                          md={{ span: 2, offset: 3 }}
                          lg={{ span: 2, offset: 3 }}
                          xl={{ span: 2, offset: 3 }}
                        >
                          <img
                            style={{
                              margin: "0% 25%",
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                            }}
                            src={
                              friendReq.profile_picture
                                ? friendReq.profile_picture
                                : defaultProfilePictureImageDataUri
                            }
                            alt="profile_img"
                          />
                        </Col>
                        <Col xs={4} sm={3} md={3} lg={2} xl={2}>
                          <p style={{ paddingTop: "5%" }}>
                            {friendReq.username}
                          </p>
                        </Col>
                        <Col xs={4} sm={4} md={4} lg={4} xl={4}>
                          <OverlayTrigger
                            key="bottom"
                            placement="top"
                            overlay={
                              <Tooltip id="accept_fr_tooltip">
                                <span>Accept</span>
                              </Tooltip>
                            }
                          >
                            <FaCheck
                              className="accept_friend_request"
                              onClick={() => manageFriends("accept", friendReq)}
                            />
                          </OverlayTrigger>
                          <OverlayTrigger
                            key="bottom"
                            placement="top"
                            overlay={
                              <Tooltip id="reject_fr_tooltip">
                                <span>Reject</span>
                              </Tooltip>
                            }
                          >
                            <FaTimes
                              className="reject_friend_request"
                              onClick={() => manageFriends("reject", friendReq)}
                            />
                          </OverlayTrigger>
                        </Col>
                      </Row>
                    );
                  })
                ) : (
                  <Row style={{ padding: "0px", margin: "15%" }}>
                    <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                      <p
                        className="text-center"
                        style={{ fontSize: "1rem", fontWeight: "bold" }}
                      >
                        No Friend Requests yet.
                      </p>
                    </Col>
                  </Row>
                )}
              </div>
            </Tab>
            <Tab eventKey="sent_friend_requests" title="Sent Friend Requests">
              <div
                style={{
                  margin: "0px",
                  padding: "0px",
                  height: "400px",
                  overflowY: "scroll",
                }}
              >
                {friendRequestData &&
                friendRequestData.hasOwnProperty("sent_friend_requests") &&
                friendRequestData.sent_friend_requests.length > 0 ? (
                  friendRequestData.sent_friend_requests.map(
                    (friendReq, index) => {
                      return (
                        <Row
                          key={index}
                          style={{
                            padding: index == 0 ? "5% 0% 0% 0%" : "0% 0% 0% 0%",
                            margin: "0% 0% 1% 0%",
                          }}
                        >
                          <Col
                            xs={4}
                            sm={{ span: 2, offset: 3 }}
                            md={{ span: 2, offset: 3 }}
                            lg={{ span: 2, offset: 3 }}
                            xl={{ span: 2, offset: 3 }}
                          >
                            <img
                              style={{
                                margin: "0% 25%",
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                              }}
                              src={
                                friendReq.profile_picture
                                  ? friendReq.profile_picture
                                  : defaultProfilePictureImageDataUri
                              }
                              alt="profile_img"
                            />
                          </Col>
                          <Col xs={4} sm={3} md={3} lg={2} xl={2}>
                            <p style={{ paddingTop: "5%" }}>
                              {friendReq.username}
                            </p>
                          </Col>
                          <Col xs={4} sm={4} md={4} lg={4} xl={4}>
                            <OverlayTrigger
                              key="bottom"
                              placement="top"
                              overlay={
                                <Tooltip id="cancel_fr_tooltip">
                                  <span>Cancel Friend Request</span>
                                </Tooltip>
                              }
                            >
                              <FaTimes
                                className="cancel_friend_request"
                                onClick={() =>
                                  manageCancelFriendRequestRef(
                                    "cancel",
                                    friendReq
                                  )
                                }
                              />
                            </OverlayTrigger>
                          </Col>
                        </Row>
                      );
                    }
                  )
                ) : (
                  <Row style={{ padding: "0px", margin: "15%" }}>
                    <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                      <p
                        className="text-center"
                        style={{ fontSize: "1rem", fontWeight: "bold" }}
                      >
                        No Sent Friend Requests yet.
                      </p>
                    </Col>
                  </Row>
                )}
              </div>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </div>
  );
}

export default withRouter(Friends);
