import React, { useState, useEffect, useRef } from "react";
import { withRouter } from "react-router-dom";
import axiosInstance from "../components/axiosInstance";
import { useHistory } from "react-router-dom";
import {
  spinner_overlay,
  user_data,
  friend_requests,
  notifications,
  manage_request_count
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
  FaUserFriends
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
  const session_manage_requests_count = useSelector(state => state.session.manage_request_count);
  const curr_user_data = useSelector((state) => state.session.user_data);
  const [friendRequestModalData, setFriendRequestModalData] = useState([]);
  const [friendReqNotificationCount, setFriendReqNotificationCount] = useState(0);
  const [friendRequestModalErrors, setFriendModalErrors] = useState({});
  const [friendReqNotification, setFriendReqLastSeen] = useState("");
  const [friendsUserDataDict, setFriendsUserDataDict] = useState({});

  useEffect(() => {
    getFriendRequestModalData();
    initSocket();
  }, []);

  const initSocket = () => {
    WebSocketInstance.friendRequestNotificationCallbacks((data) =>
      setSocketFriendRequestData1(data)
    );
  }

  const setSocketFriendRequestData1 = (data) => {
    if(data.user_id !== curr_user_data.id){
      console.log(data);
      console.log('FRIENDS SOCKET');
      if(data.action === 'accept' || data.action === 'add'){
        dispatch(notifications(data.notification_data, "new"));
      }
      getFriendRequestModalData();
    }
  }

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

  const getFriendRequestCount = (data) => {
    let req_count = 0;
    data?data.map(item => {
        if(new Date(curr_user_data.friend_request_last_seen) < new Date(item.friend_request_created_on)){
            req_count += 1;
        }
    }):""
    return req_count
  }

  const getFriendRequestModalData = () => {
    axiosInstance
        .get("get_friends_modal_data/")
        .then((res) => {
            if (res.data.ok) {
              let user_data_dict = res.data.user_data_dict;
              let modal_data = {
                  modal_users: res.data.modal_users,
                  modal_friends: res.data.modal_friends, 
                  modal_friend_requests: res.data.modal_friend_requests, 
                  modal_sent_friend_requests: res.data.modal_sent_friend_requests, 
                  friend_request_last_seen: res.data.friend_request_last_seen, 
              };
              let req_count = getFriendRequestCount(modal_data.modal_friend_requests);
              setFriendReqNotificationCount(req_count);
              dispatch(manage_request_count(req_count, "friends"));
              setFriendRequestModalData(modal_data);
              setFriendsUserDataDict(user_data_dict);
            } else {
                //pass
            }
        })
        .catch((err) => {
            // spinnerStop("");
            console.log(err);
        });

  }


  const setErrorsFriendsModal = (recipient_user, res, action, type) => {
    let err_dict = {...friendRequestModalErrors};
    let temp = {};
    if(action === "add"){
        temp[parseInt(recipient_user.id)] = res.data.error;
        err_dict['modal_users'] = temp;
    }else if(action === "accept"){
        if(type === 'custom'){
            temp[parseInt(recipient_user.id)] = 'Some error occured. Please refresh.';
        }else{
            temp[parseInt(recipient_user.id)] = res.data.error;
        }
        err_dict['modal_friend_req'] = temp;
    }else if(action === "reject"){
        temp[parseInt(recipient_user.id)] = res.data.error;
        err_dict['modal_friend_req'] = temp;
    }else if(action === "cancel"){
        temp[parseInt(recipient_user.id)] = res.data.error;
        err_dict['modal_sent_friend_req'] = temp;
    }else if(action === "remove"){
        temp[parseInt(recipient_user.id)] = res.data.error;
        err_dict['modal_friends'] = temp;
    }else{
        //pass
    }
    setFriendModalErrors(err_dict);
    // setTimeout(function(){
    //     setConversationModalErrors("");
    // }, 5000)
  }

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

  const setTabKey = (k) => {
    setKey(k);
    if(k === "friend_requests"){
        updateFriendReqLastSeen();
    }
}

const updateFriendReqLastSeen = () => {
  let post_data = {};
  post_data["request_type"] = "friends";
  post_data["last_seen"] = new Date();
  setFriendReqLastSeen(post_data["last_seen"]);
  setFriendReqNotificationCount(0);
  dispatch(manage_request_count(0, "friends"));
  axiosInstance
    .post("manage_requests_last_seen/", post_data)
    .then((res) => {
      if (res.data.ok) {
        // dispatch(manage_requests_last_seen(new Date(), "friends"));
      } else {
        console.log("Error");
      }
  }).catch((err) => {
      console.log(err);
  });
}

  const manageFriends = (action, recipient_user) => {
    spinner(true);
    let post_data = {};
    post_data["action"] = action;
    post_data["recipient_user_id"] = recipient_user.id;
    axiosInstance
      .post("manage_friends/", post_data)
      .then((res) => {
        spinnerStop();
        if (res.data.ok) {
          let notification_data = res.data.notification;
          let sender_notification = {};
          let recipient_notification = {};
          if(notification_data.hasOwnProperty(curr_user_data.id)){
            sender_notification = [notification_data[curr_user_data.id]]
          }
          if(notification_data.hasOwnProperty(recipient_user.id)){
              recipient_notification = [notification_data[recipient_user.id]]
          }
          if(action === "accept"){
            dispatch(notifications(sender_notification, "new"));
          }
          setFriendRequestModalDataMethod(action, recipient_user)
          initializeSocket(
            curr_user_data.id,
            recipient_user.id,
            action,
            recipient_notification
          );
          spinner();
        } else {
          console.log("Error");
          setErrorsFriendsModal(recipient_user, res, action, "");
        }
      })
      .catch((err) => {
        spinnerStop();
        console.log(err);
      });
  };

  const setFriendRequestModalDataMethod = (action, recipient_user) => {
    let updated_modal_friends = [];
    let updated_modal_friend_requests = [];
    let updated_modal_users = [];
    let sent_friend_requests = [...friendRequestModalData.modal_sent_friend_requests];
    if(action === "add"){
        updated_modal_users = friendRequestModalData.modal_users.map(item => {
            if(item.id === parseInt(recipient_user.id)){
                item.sent_friend_request = true;
                sent_friend_requests.push(item);
            }
            return item
        })
        setFriendRequestModalData({...friendRequestModalData, modal_users: updated_modal_users, modal_sent_friend_requests: sent_friend_requests})
    }else if(action === "accept"){
        updated_modal_friend_requests = friendRequestModalData.modal_friend_requests.filter(item => {
            return item.id !== parseInt(recipient_user.id)
        })
        updated_modal_users = friendRequestModalData.modal_users.map(item => {
            if(item.id === parseInt(recipient_user.id)){
                item.is_friend = true;
            }
            return item
        });
        setFriendRequestModalData({...friendRequestModalData, modal_users: updated_modal_users, modal_friend_requests: updated_modal_friend_requests})
    }else if(action === "remove"){
        updated_modal_friends = friendRequestModalData.modal_friends.filter(item => {               
            return item.id !== parseInt(recipient_user.id)
        })
        updated_modal_users = friendRequestModalData.modal_users.map(item => {
            if(item.id === parseInt(recipient_user.id)){
                item.is_friend = false;
            }
            return item
        })
        setFriendRequestModalData({...friendRequestModalData, modal_friends: updated_modal_friends, modal_users: updated_modal_users})
    }else if(action === "reject"){
        updated_modal_friend_requests = friendRequestModalData.modal_friend_requests.filter(item => {
            return item.id !== parseInt(recipient_user.id)
        })
        setFriendRequestModalData({...friendRequestModalData, modal_friend_requests: updated_modal_friend_requests})
    }else if(action === "cancel"){
        updated_modal_users = friendRequestModalData.modal_users.map(item => {
            if(item.id === parseInt(recipient_user.id)){
                item.sent_friend_request = false;
            }
            return item
        })
        sent_friend_requests = friendRequestModalData.modal_sent_friend_requests.filter(item => {
            return item.id !== parseInt(recipient_user.id)
        })
        setFriendRequestModalData({...friendRequestModalData, modal_users: updated_modal_users, modal_sent_friend_requests: sent_friend_requests})
    }
  }

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
            onSelect={(k) => setTabKey(k)}
          >
            <Tab eventKey="users" title={<span  style={{ fontSize: '0.9rem' }}>Users</span>}>
              <div
                style={{
                  margin: "0px",
                  padding: "0px",
                  height: "400px",
                  overflowY: "scroll",
                }}
              >
                {friendRequestModalData &&
                friendRequestModalData.hasOwnProperty("modal_users") &&
                friendRequestModalData.modal_users && friendRequestModalData.modal_users.length > 0 ? (
                  friendRequestModalData.modal_users.map((user, index) => {
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
                        <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                          <p style={{ paddingTop: "5%" }}>{user.username}</p>
                        </Col>
                        <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                        {user.is_friend?
                                (<OverlayTrigger
                                key="is_friend"
                                placement="top"
                                overlay={
                                    <Tooltip id="is_friend_tooltip">
                                    <span>You are friends.</span>
                                    </Tooltip>
                                }
                                >
                                <FaUserFriends className="is_friend" />
                                </OverlayTrigger>):
                                (user.sent_friend_request ? (
                            <OverlayTrigger
                              key="sent_friend_request"
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
                              key="send_friend_request"
                              placement="top"
                              overlay={
                                <Tooltip id="send_friend_tooltip">
                                  <span>Send Friend Request</span>
                                </Tooltip>
                              }
                            >
                              <FaUserPlus
                                className="add_friend"
                                onClick={() => manageFriends("add", user)}
                              />
                            </OverlayTrigger>
                          ))}
                        </Col>
                        <Col style={{ padding: '0px' }} xs={3} sm={3} md={3} lg={3} xl={3}>
                          <div className="text-center friend_modal_errors">{friendRequestModalErrors.modal_users?friendRequestModalErrors.modal_users[user.id]: ''}</div>
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
                        No Users found.
                      </p>
                    </Col>
                  </Row>
                )}
              </div>
            </Tab>
            <Tab eventKey="friends" title={<span  style={{ fontSize: '0.9rem' }}>Friends</span>}>
              <div
                style={{
                  margin: "0px",
                  padding: "0px",
                  height: "400px",
                  overflowY: "scroll",
                }}
              >
                {friendRequestModalData &&
                friendRequestModalData.hasOwnProperty("modal_friends") &&
                friendRequestModalData.modal_friends && friendRequestModalData.modal_friends.length > 0 ? (
                  friendRequestModalData.modal_friends.map((friend, index) => {
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
                        <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                          <p style={{ paddingTop: "5%" }}>{friend.username}</p>
                        </Col>
                        <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                          <OverlayTrigger
                            key="remove_friend"
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
                        <Col style={{ padding: '0px' }} xs={3} sm={3} md={3} lg={3} xl={3}>
                          <div className="text-center friend_modal_errors">{friendRequestModalErrors.modal_friends?friendRequestModalErrors.modal_friends[friend.id]: ''}</div>
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
            <Tab eventKey="friend_requests" title={
              <Row style={{ padding: '0px', margin: '0px'}}>
              <Col xl={12} lg={12} md={12} sm={12} xs={12}>
              <span style={{ fontSize: '0.9rem' }}>Friend Requests</span>
              {friendReqNotificationCount > 0?
              <div style={{  float: 'right',  backgroundColor: 'red', height: '6px', width: '6px', borderRadius: '100%'}}>
              </div>:""}
              </Col>
              </Row>
            }>
              <div
                style={{
                  margin: "0px",
                  padding: "0px",
                  height: "400px",
                  overflowY: "scroll",
                }}
              >
                {friendRequestModalData &&
                friendRequestModalData.hasOwnProperty("modal_friend_requests") &&
                friendRequestModalData.modal_friend_requests && friendRequestModalData.modal_friend_requests.length > 0 ? (
                  friendRequestModalData.modal_friend_requests.map((friendReq, index) => {
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
                        <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                          <p style={{ paddingTop: "5%" }}>
                            {friendReq.username}
                          </p>
                        </Col>
                        <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                          <OverlayTrigger
                            key="accept_fr"
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
                            key="reject_fr"
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
                        <Col style={{ padding: '0px' }} xs={3} sm={3} md={3} lg={3} xl={3}>
                          <div className="text-center friend_modal_errors">{friendRequestModalErrors.modal_friend_requests?friendRequestModalErrors.modal_friend_requests[friendReq.id]: ''}</div>
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
            <Tab eventKey="sent_friend_requests" title={<span  style={{ fontSize: '0.9rem' }}>Sent Friend Requests</span>}>
              <div
                style={{
                  margin: "0px",
                  padding: "0px",
                  height: "400px",
                  overflowY: "scroll",
                }}
              >
                {friendRequestModalData &&
                friendRequestModalData.hasOwnProperty("modal_sent_friend_requests") &&
                friendRequestModalData.modal_sent_friend_requests && friendRequestModalData.modal_sent_friend_requests.length > 0 ? (
                  friendRequestModalData.modal_sent_friend_requests.map(
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
                          <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                            <p style={{ paddingTop: "5%" }}>
                              {friendReq.username}
                            </p>
                          </Col>
                          <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                            <OverlayTrigger
                              key="cancel_fr"
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
                          <Col style={{ padding: '0px' }} xs={3} sm={3} md={3} lg={3} xl={3}>
                          <div className="text-center friend_modal_errors">{friendRequestModalErrors.modal_friend_requests?friendRequestModalErrors.modal_friend_requests[friendReq.id]: ''}</div>
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
