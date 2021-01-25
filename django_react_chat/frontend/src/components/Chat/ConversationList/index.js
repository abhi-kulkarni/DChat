import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import ConversationSearch from "../ConversationSearch";
import ConversationListItem from "../ConversationListItem";
import Toolbar from "../Toolbar";
import ToolbarButton from "../ToolbarButton";
import axios from "axios";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Form from "react-bootstrap/Form";
import Tooltip from "react-bootstrap/Tooltip";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import "./ConversationList.css";
import {
  FaComment,
  FaCommentSlash,
  FaCheck,
  FaPlus,
  FaRegPaperPlane,
  FaCogs,
  FaUserFriends,
  FaTrash,
  FaTimes,
  FaCheckCircle,
  FaShare,
  FaTasks,
  FaUserPlus,
} from "react-icons/fa";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import axiosInstance from "../../axiosInstance";
import { useDispatch, useSelector } from "react-redux";
import WebSocketInstance from "../../../websocket";
import {
  chat_status,
  last_seen_time,
  is_typing,
  chat_requests,
  msg_count,
  notifications,
  chat_messages,
  has_read,
} from "../../../redux";
import Dialog from "react-bootstrap-dialog";
import { useHistory, useLocation } from "react-router-dom";
import shave from "shave";
import Moment from "react-moment";
import "moment-timezone";
import CustomBadge from "../../CustomBadge/badge";
import $ from "jquery";
import { css } from "@emotion/core";
import PulseLoader from "react-spinners/PulseLoader";
import { defaultProfilePictureImageDataUri } from "../../../constants";
import { defaultGroupProfilePictureImageDataUri } from "../../../constants";

const ConversationList = (props) => {
  let CustomDialog = useRef(null);
  const dispatch = useDispatch();
  const history = useHistory();
  const [key, setKey] = useState("friends");
  const [conversations, setConversations] = useState([]);
  const [modalConversations, setModalConversations] = useState([]);
  const [showManageChatsModal, setShowManageChatsModal] = useState(false);
  const [searchedConversations, setSearchConversations] = useState([]);
  let child = useRef(null);
  const [refs, setRefs] = useState({});
  const [
    modalConversationSearchInput,
    setModalConversationSearchInput,
  ] = useState("");
  const session_chat_requests = useSelector(
    (state) => state.session.chat_requests
  );
  const [chats, setChats] = useState([]);
  const [searchChatData, setSearchChats] = useState([]);
  const [c1, setC1] = useState([]);
  const curr_user_data = useSelector((state) => state.session.user_data);
  const location = useLocation();
  const [recent_msg, setRecentMsg] = useState({});
  const [last_seen_state, setLastSeenState] = useState({});
  const session_chat_status = useSelector((state) => state.session.chat_status);
  const session_chat_messages = useSelector(
    (state) => state.session.chat_messages
  );
  const session_msg_count = useSelector((state) => state.session.msg_count);
  const session_last_seen = useSelector((state) => state.session.last_seen);
  const session_is_typing = useSelector((state) => state.session.is_typing);
  const [isSelected, setIsSelected] = useState({});
  const [recentMsgCount, setRecentMsgCount] = useState({});
  const [seenMsg, setSeenMsg] = useState(false);
  const mounted = useRef();
  const [isTypingMsg, setIsTypingMsg] = useState({});

  useEffect(() => {
    getRecentMsgData();
    if (WebSocketInstance.getCurrentSocketInstance()) {
      WebSocketInstance.disconnect();
    }
    WebSocketInstance.connect("chat_requests", "");
    WebSocketInstance.chatRequestNotificationCallbacks(
      (data) => setSocketChatRequestData(data),
      (data) => setChatStatus(data),
      (data) => setRecentMsgData(data),
      (data) => setLastSeenData(data),
      (data) => setIsTyping(data)
    );
    initializeChatStatus(curr_user_data.id, "online", "sender");
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      shave(".conversation-snippet", 5);
      $(".div_hover").slice(0, 5).show();
      mounted.current = true;
    } else {
      //pass
    }
  });

  useEffect(() => {
    let c = [];
    let temp = {};
    if (
      session_chat_requests &&
      session_chat_requests.hasOwnProperty("reqd_chat_data")
    ) {
      session_chat_requests["reqd_chat_data"].map((item) => {
        if (item.chat.isFriend) {
          temp[item.chat.chat_id] = item.chat.author_id
            ? item.chat.author_id === curr_user_data.id
              ? "You: " + item.chat.text
              : item.chat.text
            : "Start your conversation ...";
          c.push(item);
        }
      });
    }

    if (
      session_chat_requests &&
      session_chat_requests.hasOwnProperty("last_seen")
    ) {
      setLastSeenState(session_chat_requests["last_seen"]);
    }
    if (
      session_chat_requests &&
      session_chat_requests.hasOwnProperty("is_typing")
    ) {
      setIsTypingMsg(session_chat_requests["is_typing"]);
    }
    setRecentMsg(temp);
    setChats(c);
    setSearchChats(c);
    if (session_chat_requests && session_chat_requests.action == "accept") {
      if (location.state && location.state.rerender) {
        //pass
      } else {
        dispatch(notifications([session_chat_requests.notification]));
      }
      let data = session_chat_requests.curr_chat_data;
      data["prevPath"] = location.pathname;
      data["rerender"] = true;
      data["name"] =
        data["name"].charAt(0).toUpperCase() + data["name"].slice(1);
      history.push({
        pathname: "/chat/" + session_chat_requests.chat_id + "/",
        state: data,
      });
    } else if (
      session_chat_requests &&
      session_chat_requests.action === "remove"
    ) {
      history.push("/chat/");
    }
  }, [session_chat_requests]);

  useEffect(() => {
    if (
      session_chat_messages &&
      session_chat_messages.hasOwnProperty("recent_msg_data") &&
      session_chat_messages["recent_msg_data"]
    ) {
      if (location.state) {
        if (WebSocketInstance.state() === 1) {
          let temp = { ...recent_msg };
          let count_dict = { ...recentMsgCount };
          let chat_id = location.state.chat_id;
          let curr_recent_msg =
            session_chat_messages["recent_msg_data"].hasOwnProperty(chat_id) &&
            session_chat_messages["recent_msg_data"][chat_id].author_id !==
              curr_user_data.id
              ? session_chat_messages["recent_msg_data"][chat_id]
              : {};
          let recent_msg_data = session_chat_messages[
            "recent_msg_data"
          ].hasOwnProperty(chat_id)
            ? session_chat_messages["recent_msg_data"][chat_id]["content"]
            : "";
          let msg_time = curr_recent_msg
            ? new Date(curr_recent_msg.timestamp)
            : "";
          let curr_last_seen =
            curr_recent_msg.last_seen &&
            curr_recent_msg.last_seen.hasOwnProperty(curr_user_data.id)
              ? curr_recent_msg.last_seen[curr_user_data.id]
              : "";
          let curr_last_seen_time = curr_last_seen
            ? new Date(curr_last_seen)
            : "";
          if (msg_time > curr_last_seen_time) {
            if (count_dict.hasOwnProperty(chat_id)) {
              count_dict[chat_id] += 1;
            } else {
              count_dict[chat_id] = 1;
            }
          }
          if (recent_msg_data) {
            if (session_chat_messages["recent_msg_data"][chat_id].author_id) {
              if (
                session_chat_messages["recent_msg_data"][chat_id].author_id ===
                curr_user_data.id
              ) {
                recent_msg_data = "You: " + recent_msg_data;
              }
              temp[chat_id] = recent_msg_data;
            } else {
              temp[chat_id] = "Start your conversation ...";
            }
            setRecentMsg(temp);
            dispatch(msg_count(count_dict));
            setRecentMsgCount(count_dict);
          }
        }
      } else {
        if (Object.keys(recent_msg).length > 0) {
          let temp = { ...recent_msg };
          let count_dict = { ...recentMsgCount };
          Object.keys(recent_msg).map((item) => {
            Object.keys(session_chat_messages["recent_msg_data"]).map(
              (innerItem) => {
                let msg_data =
                  session_chat_messages["recent_msg_data"][innerItem]
                    .author_id !== curr_user_data.id
                    ? session_chat_messages["recent_msg_data"][innerItem]
                    : {};
                let msg_time = msg_data ? new Date(msg_data.timestamp) : "";
                let curr_last_seen =
                  msg_data.last_seen &&
                  msg_data.last_seen.hasOwnProperty(curr_user_data.id)
                    ? msg_data.last_seen[curr_user_data.id]
                    : "";
                let curr_last_seen_time = curr_last_seen
                  ? new Date(curr_last_seen)
                  : "";
                if (item == innerItem) {
                  if (msg_time > curr_last_seen_time) {
                    if (count_dict.hasOwnProperty(item)) {
                      count_dict[item] += 1;
                    } else {
                      count_dict[item] = 1;
                    }
                  }
                  temp[item] = msg_data.content;
                } else {
                  temp[item] = recent_msg[item];
                  count_dict[item] = recentMsgCount.hasOwnProperty(item)
                    ? recentMsgCount[item]
                    : 0;
                }
              }
            );
          });
          setRecentMsgCount(count_dict);
          dispatch(msg_count(count_dict));
          setRecentMsg(temp);
        }
      }
    }
  }, [session_chat_messages]);

  const initializeChatStatus = (uId, status, type) => {
    waitForSocketConnection(() => {
      WebSocketInstance.setChatStatus(uId, status, type);
    });
  };

  useEffect(() => {
    let chat_id = Object.keys(props.hasSeen)[0];
    let recipient_id = Object.keys(props.hasSeen)[1];
    if (chat_id) {
      let temp = {};
      let last_seen_dict = {};
      last_seen_dict["user_id"] = curr_user_data.id;
      last_seen_dict["chat_id"] = chat_id;
      last_seen_dict["last_seen"] = new Date();
      last_seen_dict["recipient_id"] = recipient_id ? recipient_id : "";
      Object.keys(session_msg_count).map((item) => {
        if (item === chat_id) {
          temp[item] = 0;
        } else {
          temp[item] = session_msg_count[item];
        }
      });
      dispatch(last_seen_time(last_seen_dict));
      dispatch(msg_count(temp));
      setRecentMsgCount(temp);
    }
  }, [props.hasSeen]);

  const setRecentMsgData = (data) => {
    let recent_msg_chat_id = Object.keys(data["recent_msg_data"])[0];
    let recent_msg_content = "";
    if (data["recent_msg_data"][recent_msg_chat_id]["message_type"] == "text") {
      recent_msg_content = data["recent_msg_data"][recent_msg_chat_id].content;
    } else {
      recent_msg_content = "Image";
    }
    let temp = {};
    temp["chat_id"] = recent_msg_chat_id;
    temp["content"] = recent_msg_content;
    if (data) {
      dispatch(chat_messages(data, "new_message"));
      dispatch(chat_requests(temp, "recent_msg"));
    }
  };

  const getRecentMsgData = () => {
    axiosInstance
      .get("get_recent_msg_data/")
      .then((res) => {
        if (res.data.ok) {
          if (res.data && res.data.hasOwnProperty("chats")) {
            let chats = res.data.chats;
            let recent_msg_d = {};
            chats.map((item) => {
              if (item.chat.isFriend) {
                recent_msg_d[item.chat.chat_id] = item.chat.author_id
                  ? item.chat.author_id === curr_user_data.id
                    ? "You: " + item.chat.text
                    : item.chat.text
                  : "Start your conversation ...";
              }
            });
            setRecentMsg(recent_msg_d);
            setChats(res.data.chats);
          }
          if (res.data && res.data.hasOwnProperty("last_seen")) {
            setLastSeenState(res.data.last_seen);
          }
        } else {
          console.log("Error");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const setLastSeenData = (data) => {
    if (data["last_seen_data"].hasOwnProperty(curr_user_data.id)) {
      dispatch(last_seen_time(data["last_seen_data"][curr_user_data.id]));
      setLastSeenState(data["last_seen_data"][curr_user_data.id]);
      dispatch(
        chat_requests(data["last_seen_data"][curr_user_data.id], "last_seen")
      );
    }
  };

  const setChatStatus = (data) => {
    data.user_id !== curr_user_data.id ? dispatch(chat_status(data)) : "";
    if (data.type !== "reciever") {
      initializeChatStatus(curr_user_data.id, "online", "reciever");
    }
  };

  const setIsTyping = (data) => {
    data["curr_user_id"] = curr_user_data.id;
    if (data.user_id !== curr_user_data.id) {
      dispatch(is_typing(data));
      dispatch(chat_requests(data, "is_typing"));
    }
  };

  const setSocketChatRequestData = (data) => {
    if (Object.keys(data).indexOf(curr_user_data.id.toString()) > -1) {
      dispatch(chat_requests(data[curr_user_data.id]));
    }
  };

  const getAllChats = () => {
    axiosInstance
      .get("get_all_chats/")
      .then((res) => {
        if (res.data.ok) {
          let c = [];
          res.data.chats.map((item) => {
            if (item.chat.isFriend) {
              c.push(item.chat);
            }
          });
          setC1([...c1, ...c]);
        } else {
          console.log("Error");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const initializeSocket = (uId, rId, action, chatId, notificationData) => {
    waitForSocketConnection(() => {
      WebSocketInstance.fetchChatRequests(
        uId,
        rId,
        action,
        chatId,
        notificationData,
        ""
      );
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

  const manageChats = (action, recipient_user, chat_id) => {
    let post_data = {};
    post_data["action"] = action;
    post_data["recipient_user_id"] = recipient_user.id;
    post_data["chat_id"] = chat_id;
    axiosInstance
      .post("manage_chats/", post_data)
      .then((res) => {
        if (res.data.ok) {
          let chat_id = res.data.chat_id;
          let notification_data = res.data.notification;
          initializeSocket(
            curr_user_data.id,
            recipient_user.id,
            action,
            chat_id,
            notification_data
          );
        } else {
          console.log("Error");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getAllFriends = () => {
    axiosInstance
      .get("get_all_friends/")
      .then((res) => {
        if (res.data.ok) {
          let newConversations =
            res.data &&
            res.data.hasOwnProperty("users") &&
            res.data.users.map((user, index) => {
              let profile_picture = user.profile_picture
                ? user.profile_picture
                : defaultProfilePictureImageDataUri;
              return {
                id: index,
                user_id: user.id,
                photo: profile_picture,
                name: user.username,
                text:
                  "Hello world! This is a long message that needs to be truncated.",
              };
            });
          setConversations([...conversations, ...newConversations]);
          setModalConversations([...conversations, ...newConversations]);
          setSearchConversations([
            ...searchedConversations,
            ...newConversations,
          ]);
        } else {
          console.log("Error");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getOrCreateRef = (id) => {
    if (!refs.hasOwnProperty(id)) {
      refs[id] = React.createRef();
    }
    return refs[id];
  };

  const getConversations = () => {
    axios.get("https://randomuser.me/api/?results=20").then((response) => {
      let newConversations = response.data.results.map((result, index) => {
        return {
          id: index,
          photo: result.picture.large,
          name: `${result.name.first} ${result.name.last}`,
          text:
            "Hello world! This is a long message that needs to be truncated.",
        };
      });
      setConversations([...conversations, ...newConversations]);

      setSearchConversations([...searchedConversations, ...newConversations]);
    });
  };

  const handleConversationModalSearch = (search_data) => {
    setModalConversationSearchInput(search_data);
    if (search_data) {
      let result = searchedConversations.filter((item) => {
        return item.name.toLowerCase().includes(search_data.toLowerCase());
      });
      setModalConversations(result);
    } else {
      setModalConversations(searchedConversations);
    }
  };

  const handleSearch = (search_data) => {
    if (search_data) {
      let load_more_btn = document.getElementById("load_more");
      if (load_more_btn) {
        load_more_btn.style.display = "none";
      }
      let result =
        searchChatData &&
        searchChatData.filter((item) => {
          return item.chat.name
            .toLowerCase()
            .includes(search_data.toLowerCase());
        });
      setChats(result);
    } else {
      setChats(searchChatData);
    }
  };

  const manageCancelChatRequestRef = (action, recipient_user, chat_id) => {
    CustomDialog.show({
      body: "Are you sure you want to cancel this request ?",
      actions: [
        Dialog.DefaultAction(
          "Cancel Request",
          () => {
            manageChats(action, recipient_user, chat_id);
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

  const manageRemoveChatRequestRef = (action, recipient_user, chat_id) => {
    CustomDialog.show({
      body:
        "Are you sure you want to remove " +
        recipient_user.username +
        " from your chats ?",
      actions: [
        Dialog.DefaultAction(
          "Remove",
          () => {
            manageChats(action, recipient_user, chat_id);
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

  const loadMore = () => {
    $(".div_hover:hidden").slice(0, 6).slideDown();
    if ($(".div_hover:hidden").length == 0) {
      handleLoadMoreHide();
    }
  };

  // const loadMore = () => {
  //   refs[0] && refs[0].current && refs[0].current.loadMoreConversations();
  // }

  const handleOnSelectUser = (data) => {
    let username = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    data["username"] = username;
    props.handleOnSelectUser(data);
  };

  const handleChatDelete = (data) => {
    let username = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    let user = { username: username, id: data.user_id };
    manageRemoveChatRequestRef("remove", user, data.chat_id);
  };

  const handleLoadMoreHideButton = () => {
    let load_more_btn = document.getElementById("load_more");
    load_more_btn.style.display = "none";
  };

  const openManageChatsModal = () => {
    setShowManageChatsModal(true);
  };

  const closeManageChatsModal = () => {
    setShowManageChatsModal(false);
  };

  const onSelectUser = (data) => {
    // setLastSeenMethod(data);
    let temp = {};
    temp["user_id"] = curr_user_data.id;
    temp["last_seen"] = new Date();
    temp["chat_id"] = data["chat_id"];
    temp["recipient_id"] = data["user_id"];
    if (WebSocketInstance.getCurrentSocketInstance()) {
      WebSocketInstance.setLastSeen(temp);
    }
    let count_dict = {};
    Object.keys(recentMsgCount).map((item) => {
      if (item == data["chat_id"]) {
        count_dict[item] = 0;
      } else {
        count_dict[item] = recentMsgCount[item];
      }
    });
    setRecentMsgCount(count_dict);
    dispatch(msg_count(count_dict));
    // dispatch(last_seen_time(temp));
    data["prevPath"] = location.pathname;
    data["rerender"] = true;
    data["name"] = data["name"].charAt(0).toUpperCase() + data["name"].slice(1);
    history.push({
      pathname: "/chat/" + data.chat_id + "/",
      state: data,
    });
  };

  const setLastSeenMethod = (data) => {
    let post_data = data;
    post_data["curr_user_id"] = curr_user_data.id;
    post_data["last_seen"] = new Date();
    axiosInstance
      .post("set_last_seen/", post_data)
      .then((res) => {
        if (res.data.ok) {
          // console.log(res.data.last_seen)
        } else {
          console.log("Error");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleSelectUser = (data) => {
    if (WebSocketInstance.getCurrentSocketInstance()) {
      WebSocketInstance.setLastSeen(data);
    }
    data["prevPath"] = location.pathname;
    data["rerender"] = true;
    data["name"] = data["name"].charAt(0).toUpperCase() + data["name"].slice(1);
    history.push({
      pathname: "/chat/" + data.chat_id + "/",
      state: data,
    });
  };

  const override = css`
    justify-content: center;
    align-items: center;
    padding-top: 1px;
  `;

  return (
    <Row className="conversation-list-row">
      <Col
        style={{ paddingRight: "0%", paddingLeft: "0%" }}
        xs={12}
        sm={12}
        md={12}
        lg={12}
        xl={12}
      >
        <Toolbar
          title="Messenger"
          leftItems={[
            <OverlayTrigger
              key="bottom"
              placement="top"
              overlay={
                <Tooltip id="settings_tooltip">
                  <span>Settings</span>
                </Tooltip>
              }
            >
              <FaCogs className="settings" />
            </OverlayTrigger>,
          ]}
          rightItems={[
            <OverlayTrigger
              key="bottom"
              placement="top"
              overlay={
                <Tooltip id="new_group_tooltip">
                  <span>Add new group.</span>
                </Tooltip>
              }
            >
              <FaUserFriends className="new_group" />
            </OverlayTrigger>,
          ]}
        />
      </Col>
      <Col
        style={{ paddingRight: "0%", paddingLeft: "0%" }}
        xs={12}
        sm={12}
        md={12}
        lg={12}
        xl={12}
      >
        <ConversationSearch onSearchInput={handleSearch} />
      </Col>
      <Col
        style={{ paddingRight: "0%", paddingLeft: "0%" }}
        xs={12}
        sm={12}
        md={12}
        lg={12}
        xl={12}
      >
        <OverlayTrigger
          key="bottom"
          placement="top"
          overlay={
            <Tooltip id="manage_chats_tooltip">
              <span>Manage Conversations</span>
            </Tooltip>
          }
        >
          <FaTasks onClick={openManageChatsModal} className="manage_chats" />
        </OverlayTrigger>
      </Col>
      <Col
        style={{ paddingRight: "0%", paddingLeft: "0%" }}
        xs={12}
        sm={12}
        md={12}
        lg={12}
        xl={12}
      >
        {chats && chats.length > 0 ? (
          chats.map((item, index) => {
            return (
              <Row
                key={index}
                id={item.chat.chat_id}
                ref={getOrCreateRef(item.chat.id)}
                className="div_hover"
                style={{
                  paddingRight: "0%",
                  paddingLeft: "0%",
                  margin: "4% 0% 4% 0%",
                  cursor: "pointer",
                  borderTopRightRadius: "25px",
                  borderBottomRightRadius: "25px",
                  backgroundColor:
                    location.state &&
                    location.state.chat_id === item.chat.chat_id
                      ? "#ececec"
                      : "white",
                }}
              >
                <Col
                  style={{ paddingRight: "0%" }}
                  xs={12}
                  sm={12}
                  md={12}
                  lg={12}
                  xl={12}
                >
                  <Row style={{ padding: "2% 0% 2% 0%", margin: "0px" }}>
                    <Col
                      style={{ paddingLeft: "0px" }}
                      onClick={() => onSelectUser(item.chat)}
                      xs={6}
                      sm={3}
                      md={3}
                      lg={3}
                      xl={3}
                    >
                      <img
                        width="45"
                        height="45"
                        className="img-fluid conversation-photo"
                        src={
                          item.chat.photo
                            ? item.chat.photo
                            : defaultProfilePictureImageDataUri
                        }
                        alt="conversation"
                      />
                      <div
                        style={{
                          position: "absolute",
                          backgroundColor:
                            session_chat_status &&
                            session_chat_status.hasOwnProperty(
                              item.chat.user_id
                            ) &&
                            session_chat_status[item.chat.user_id] === "online"
                              ? "#58A847"
                              : "#efefef",
                          borderRadius: "100%",
                          width: "0.59rem",
                          height: "0.59rem",
                          right: "0px",
                          left: "35px",
                          top: "0px",
                          border: "1px solid darkgrey",
                        }}
                      ></div>
                    </Col>
                    <Col
                      onClick={() => onSelectUser(item.chat)}
                      style={{
                        paddingTop: "1%",
                        paddingLeft: "2%",
                        paddingRight: "0%",
                      }}
                      xs={4}
                      sm={7}
                      md={7}
                      lg={7}
                      xl={7}
                    >
                      <Row style={{ padding: "0px", margin: "0px" }}>
                        <Col
                          style={{ paddingLeft: "0px" }}
                          xs={{ span: 12 }}
                          sm={{ span: 7 }}
                          md={{ span: 7 }}
                          lg={{ span: 7 }}
                          xl={{ span: 7 }}
                        >
                          <h1 className="conversation-title">
                            {item.chat.name}
                          </h1>
                          {isTypingMsg &&
                          isTypingMsg.hasOwnProperty(item.chat.chat_id) &&
                          isTypingMsg[item.chat.chat_id] ? (
                            <Row>
                              <Col xs={12} sm={12} md={4} lg={4} xl={4}>
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#0A73F0",
                                    fontStyle: "italic",
                                  }}
                                >
                                  typing
                                </span>
                              </Col>
                              <Col
                                style={{ paddingLeft: "18px" }}
                                xs={12}
                                sm={12}
                                md={8}
                                lg={8}
                                xl={8}
                              >
                                <PulseLoader
                                  css={override}
                                  size={3}
                                  color={"#0A73F0"}
                                  loading={
                                    isTypingMsg &&
                                    isTypingMsg.hasOwnProperty(
                                      item.chat.chat_id
                                    )
                                      ? isTypingMsg[item.chat.chat_id]
                                      : false
                                  }
                                />
                              </Col>
                            </Row>
                          ) : (
                            <p className="conversation-snippet">
                              {" "}
                              {recent_msg &&
                              recent_msg.hasOwnProperty(item.chat.chat_id)
                                ? recent_msg[item.chat.chat_id]
                                : ""}{" "}
                            </p>
                          )}
                        </Col>
                        <Col
                          style={{ paddingLeft: "0px", paddingRight: "0px" }}
                          xs={12}
                          sm={5}
                          md={5}
                          lg={5}
                          xl={5}
                        >
                          <p
                            style={{
                              float: "left",
                              marginBottom: "0px",
                              paddingTop: "1%",
                              paddingLeft: "0%",
                              fontSize: "0.5rem",
                              color: "#0578FA",
                            }}
                          >
                            {last_seen_state &&
                            last_seen_state.hasOwnProperty(item.chat.chat_id) &&
                            last_seen_state[item.chat.chat_id].hasOwnProperty(
                              item.chat.user_id
                            ) ? (
                              <Moment fromNow>
                                {
                                  last_seen_state[item.chat.chat_id][
                                    item.chat.user_id
                                  ]
                                }
                              </Moment>
                            ) : (
                              ""
                            )}
                          </p>
                        </Col>
                      </Row>
                    </Col>
                    <Col
                      style={{ paddingTop: "1%", paddingLeft: "0%" }}
                      xs={4}
                      sm={2}
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <CustomBadge
                        message_count={true}
                        count={recentMsgCount[item.chat.chat_id]}
                      />
                      {/* <OverlayTrigger
                              key="bottom"
                              placement="top"
                              overlay={
                                  <Tooltip id="remove_chat_tooltip">
                                      <span>Remove Chat</span>
                                  </Tooltip>
                              }
                          ><FaCommentSlash onClick={handleChatDelete} style={{ color: '#EB3E37' }} />
                    </OverlayTrigger> */}
                    </Col>
                  </Row>
                </Col>
              </Row>
            );
          })
        ) : (
          <Row
            className="text-center"
            style={{ fontSize: "0.8rem", fontWeight: "bold", marginTop: "10%" }}
          >
            <Col>No Results found.</Col>
          </Row>
        )}
        {chats && chats.length > 0 && chats.length > 5 ? (
          <Button
            id="load_more"
            onClick={() => handleLoadMoreHideButton()}
            size="sm"
            className="text-center align-items-center"
          >
            Load More
          </Button>
        ) : (
          ""
        )}
      </Col>
      <div style={{ display: "none" }}>
        <Dialog
          ref={(el) => {
            CustomDialog = el;
          }}
        />
      </div>
      <Modal
        show={showManageChatsModal}
        onHide={closeManageChatsModal}
        size="lg"
        backdrop="static"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header style={{ padding: "2%" }}>
          <Modal.Title id="contained-modal-title-vcenter">
            <span style={{ fontSize: "1.2rem" }}>Manage Conversations</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{ paddingTop: "0px", paddingLeft: "0px", paddingRight: "0px" }}
        >
          <Tabs
            className="nav-justified"
            id="manage_chats_tab"
            activeKey={key}
            onSelect={(k) => setKey(k)}
          >
            <Tab eventKey="friends" title="Friends">
              <div
                style={{
                  margin: "0px",
                  padding: "0px",
                  height: "400px",
                  overflowY: "scroll",
                }}
              >
                {session_chat_requests &&
                session_chat_requests.hasOwnProperty("friends") &&
                session_chat_requests.friends.length > 0 ? (
                  session_chat_requests.friends.map((friend, index) => {
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
                        <Col xs={4} sm={3} md={3} lg={3} xl={3}>
                          <p style={{ paddingTop: "5%" }}>{friend.username}</p>
                        </Col>
                        <Col xs={4} sm={4} md={4} lg={4} xl={4}>
                          {friend.sent_chat_request ? (
                            <OverlayTrigger
                              key="bottom"
                              placement="top"
                              overlay={
                                <Tooltip id="sent_chat_request_tooltip">
                                  <span>Chat Request Sent</span>
                                </Tooltip>
                              }
                            >
                              <FaCheckCircle className="sent_chat_request" />
                            </OverlayTrigger>
                          ) : (
                            <OverlayTrigger
                              key="bottom"
                              placement="top"
                              overlay={
                                <Tooltip id="add_friend_tooltip">
                                  <span>Send Chat Request</span>
                                </Tooltip>
                              }
                            >
                              <FaRegPaperPlane
                                className="add_chat"
                                onClick={() => manageChats("add", friend, "")}
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
                        No Friends yet.
                      </p>
                    </Col>
                  </Row>
                )}
              </div>
            </Tab>
            <Tab eventKey="chats" title="Chats">
              <div
                style={{
                  margin: "0px",
                  padding: "0px",
                  height: "400px",
                  overflowY: "scroll",
                }}
              >
                {session_chat_requests &&
                session_chat_requests.hasOwnProperty("chats") &&
                session_chat_requests.chats.length > 0 ? (
                  session_chat_requests.chats.map((chat, index) => {
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
                              chat.profile_picture
                                ? chat.profile_picture
                                : defaultProfilePictureImageDataUri
                            }
                            alt="profile_img"
                          />
                        </Col>
                        <Col xs={4} sm={3} md={3} lg={2} xl={2}>
                          <p style={{ paddingTop: "5%" }}>{chat.username}</p>
                        </Col>
                        <Col xs={4} sm={4} md={4} lg={4} xl={4}>
                          <OverlayTrigger
                            key="bottom"
                            placement="top"
                            overlay={
                              <Tooltip id="remove_chat_tooltip">
                                <span>Remove Chat</span>
                              </Tooltip>
                            }
                          >
                            <FaCommentSlash
                              className="remove_chat"
                              onClick={() =>
                                manageRemoveChatRequestRef("remove", chat)
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
                        No Chats yet.
                      </p>
                    </Col>
                  </Row>
                )}
              </div>
            </Tab>
            <Tab eventKey="chat_requests" title="Chat Requests">
              <div
                style={{
                  margin: "0px",
                  padding: "0px",
                  height: "400px",
                  overflowY: "scroll",
                }}
              >
                {session_chat_requests &&
                session_chat_requests.hasOwnProperty("chat_requests") &&
                session_chat_requests.chat_requests.length > 0 ? (
                  session_chat_requests.chat_requests.map((chatReq, index) => {
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
                              chatReq.profile_picture
                                ? chatReq.profile_picture
                                : defaultProfilePictureImageDataUri
                            }
                            alt="profile_img"
                          />
                        </Col>
                        <Col xs={4} sm={3} md={3} lg={2} xl={2}>
                          <p style={{ paddingTop: "5%" }}>{chatReq.username}</p>
                        </Col>
                        <Col xs={4} sm={4} md={4} lg={4} xl={4}>
                          <OverlayTrigger
                            key="bottom"
                            placement="top"
                            overlay={
                              <Tooltip id="accept_cr_tooltip">
                                <span>Accept</span>
                              </Tooltip>
                            }
                          >
                            <FaCheck
                              className="accept_chat_request"
                              onClick={() => manageChats("accept", chatReq, "")}
                            />
                          </OverlayTrigger>
                          <OverlayTrigger
                            key="bottom"
                            placement="top"
                            overlay={
                              <Tooltip id="reject_cr_tooltip">
                                <span>Reject</span>
                              </Tooltip>
                            }
                          >
                            <FaTimes
                              className="reject_chat_request"
                              onClick={() => manageChats("reject", chatReq, "")}
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
                        No Chat Requests yet.
                      </p>
                    </Col>
                  </Row>
                )}
              </div>
            </Tab>
            <Tab eventKey="sent_chat_requests" title="Sent Chat Requests">
              <div
                style={{
                  margin: "0px",
                  padding: "0px",
                  height: "400px",
                  overflowY: "scroll",
                }}
              >
                {session_chat_requests &&
                session_chat_requests.hasOwnProperty("sent_chat_requests") &&
                session_chat_requests.sent_chat_requests.length > 0 ? (
                  session_chat_requests.sent_chat_requests.map(
                    (chatReq, index) => {
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
                                chatReq.profile_picture
                                  ? chatReq.profile_picture
                                  : defaultProfilePictureImageDataUri
                              }
                              alt="profile_img"
                            />
                          </Col>
                          <Col xs={4} sm={3} md={3} lg={2} xl={2}>
                            <p style={{ paddingTop: "5%" }}>
                              {chatReq.username}
                            </p>
                          </Col>
                          <Col xs={4} sm={4} md={4} lg={4} xl={4}>
                            <OverlayTrigger
                              key="bottom"
                              placement="top"
                              overlay={
                                <Tooltip id="cancel_cr_tooltip">
                                  <span>Cancel Chat Request</span>
                                </Tooltip>
                              }
                            >
                              <FaTimes
                                className="cancel_chat_request"
                                onClick={() =>
                                  manageCancelChatRequestRef("cancel", chatReq)
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
                        No Sent Chat Requests yet.
                      </p>
                    </Col>
                  </Row>
                )}
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Row style={{ padding: "0px", margin: "0px" }}>
            <Col xs={12} sm={12} md={12} lg={12} xl={12}>
              <Button
                className="float-right"
                size="sm"
                variant="danger"
                onClick={() => closeManageChatsModal()}
              >
                Close
              </Button>
            </Col>
          </Row>
        </Modal.Footer>
      </Modal>
    </Row>
  );
};

export default ConversationList;
