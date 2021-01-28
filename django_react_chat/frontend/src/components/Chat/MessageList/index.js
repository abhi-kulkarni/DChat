import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {isMobile, isIOS, isMobileOnly, isTablet} from 'react-device-detect';
import Toolbar from "../Toolbar";
import Message from "../Message";
import moment from "moment";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Picker, { SKIN_TONE_MEDIUM_DARK } from "emoji-picker-react";
import "./MessageList.css";
import {
  FaPaperPlane,
  FaTimes,
  FaSmile,
  FaCamera,
  FaInfoCircle,
  FaMicrophone,
  FaTrash,
  FaShare,
  FaCommentSlash,
} from "react-icons/fa";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Dialog from "react-bootstrap-dialog";
import { useDispatch, useSelector } from "react-redux";
import WebSocketInstance from "../../../websocket";
import { useHistory, useLocation } from "react-router-dom";
import { chat_messages, is_typing } from "../../../redux";
import axiosInstance from "../../axiosInstance";
import { css } from "@emotion/core";
import PulseLoader from "react-spinners/PulseLoader";
import dImg from "../../../static/images/chat_background.png";
import { Orientation } from "../../Orientation";

const MessageList = forwardRef((props, ref) => {
  {
    const [messages, setMessages] = useState([]);
    let CustomDialog = useRef(null);
    let messagesEnd = useRef(null);
    let messagesStart = useRef(null);
    let emojiInputRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [inputMsg, setInputMsg] = useState("");
    const [chosenEmoji, setChosenEmoji] = useState(null);
    const mounted = useRef();
    const location = useLocation();
    const history = useHistory();
    const dispatch = useDispatch();
    const curr_user_data = useSelector((state) => state.session.user_data);
    const curr_chat_messages = useSelector(
      (state) => state.session.chat_messages
    );
    const [currUserData, setCurrUserData] = useState({});
    const [messageData, setMessageData] = useState([]);
    const [chatId, setChatId] = useState("");
    const [currChatMsgs, setCurrChatMsgs] = useState([]);
    const childRef = useRef(null);
    const [msgLoading, setMsgLoading] = useState(true);
    const session_is_typing = useSelector((state) => state.session.is_typing);
    const [isTypingMsg, setIsTypingMsg] = useState({});
    const [uploadImgSrc, setUploadImgSrc] = useState("");
    const [imgExt, setImgExt] = useState("")
    const [uploadedFileName, setUploadedFileName] = useState("")
    const [uploadedImage, setUploadedImage] = useState("")
    const [uploadingImg, setUploadingImg] = useState(false)
    const Compress = require('compress.js')
    const compress = new Compress()
    const [formData, setFormData] = useState([]);
    const [orientation, setOrientation] = useState("default");
    const [orientationCss, setOrientationCss] = useState();

    useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside, false);
      mounted.current = true;
    }, []);

    useEffect(() => {
      let css = {};
      console.log(orientation);
      if(isMobileOnly){
        if(orientation === 'portrait'){
          if(isIOS){
            css = { height: 'calc(100% - 92px)', minHeight: '0%' };
          }else{
            css = { height: '94%', minHeight: '0%' };
          }
        }else if(orientation === 'landscape'){
          if(isIOS){
            css = { height: '99%', minHeight: '0%' };
          }else{
            css = { height: '86%', minHeight: '0%' };
          }
        }else{
          css = { height: '100%', minHeight: '100%' };
        }
      }else{
        css = { height: '100%', minHeight: '100%' };
      }
      setOrientationCss(css);
    }, [orientation])

    useEffect(() => {
      let params = location.pathname.split("/");
      let chatId = params.length > 3 ? params[params.length - 2] : null;
      if (location.state) {
        setCurrUserData(location.state);
        let disconnect = false;
        let curr_chat_path = "/chat/" + location.state.chat_id + "/";
        let prev_path = location.state.prevPath;
        let curr_ws_instance = WebSocketInstance.getCurrentSocketInstance();
        if (prev_path === "/chat/" || prev_path === "/chat") {
          disconnect = false;
        } else if (curr_chat_path !== prev_path) {
          disconnect = true;
        }
        setChatId(chatId);
        initializeChat(chatId, disconnect);
      }
    }, [location.pathname]);

    useEffect(() => {
      let ele = document.getElementById("messagesBottom");
      if (ele) {
        ele.scrollIntoView({ behavior: "smooth" });
      }
    }, [currChatMsgs]);

    useEffect(() => {
      if (WebSocketInstance.state() === 1) {
        let params = location.pathname.split("/");
        let chatId = params.length > 3 ? params[params.length - 2] : null;
        let data =
          curr_chat_messages &&
          curr_chat_messages.hasOwnProperty("messages") &&
          curr_chat_messages["messages"].filter((item) => {
            return item.chatId === chatId;
          });
        data &&
          data.sort((a, b) =>
            new Date(a.timestamp) < new Date(b.timestamp)
              ? -1
              : new Date(a.timestamp) > new Date(b.timestamp)
              ? 1
              : 0
          );
        setCurrChatMsgs(data);
      }
    }, [curr_chat_messages]);

    const override = css`
      display: flex;
      justify-content: center;
      align-items: center;
      height: 55vh;
    `;

    const uploadImgLoadingCss = css`
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    `;

    const typingcss = css`
      padding-top: 2px;
      float: right;
    `;

    const waitForSocketConnection = (callback) => {
      setTimeout(function () {
        if (WebSocketInstance.state() === 1) {
          console.log("Connection is secure");
          setMsgLoading(false);
          callback();
        } else {
          console.log("wait for connection...");
          waitForSocketConnection(callback);
        }
      }, 100);
    };

    const initializeChat = (chatId, disconnect) => {
      if (disconnect) {
        WebSocketInstance.disconnect();
        waitForSocketConnection(() => {
          WebSocketInstance.fetchMessages(curr_user_data.id, chatId);
        });
        WebSocketInstance.connect("chat", chatId);
      } else {
        waitForSocketConnection(() => {
          WebSocketInstance.addCallbacks(
            (data) => setMessagesCallback(data),
            (data) => addMessageCallback(data),
            (data) => setIsTyping(data)
          );
          WebSocketInstance.fetchMessages(curr_user_data.id, chatId);
        });
        WebSocketInstance.connect("chat", chatId);
      }
    };

    const handleClickOutside = (e) => {
      if (
        emojiInputRef &&
        e.target &&
        emojiInputRef.current &&
        !emojiInputRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    const scrollToBottom = () => {
      let ele = document.getElementById("messagesBottom");
      if (ele) {
        ele.scrollIntoView({ behavior: "smooth" });
      }
    };

    const scrollToTop = () => {
      messagesStart.scrollIntoView({ behavior: "smooth" });
    };

    const getCurrentChatMsgs = (chatId) => {
      axiosInstance
        .get("get_chat/" + chatId + "/")
        .then((res) => {
          if (res.data.ok) {
            props.onClearChat(chatId);
            setCurrChatMsgs(res.data.chat_data);
          } else {
            console.log("Error");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    };

    const clearChatRef = () => {
      CustomDialog.show({
        body: "Are you sure you want to clear this chat ?",
        actions: [
          Dialog.DefaultAction(
            "Clear",
            () => {
              clearChat();
            },
            "btn-danger"
          ),
          Dialog.Action(
            "Cancel",
            () => {
              CustomDialog.hide();
            },
            "btn-primary"
          ),
        ],
      });
    };
    
    const deleteChatRef = () => {
      CustomDialog.show({
        body: "Are you sure you want to delete this chat ?",
        actions: [
          Dialog.DefaultAction(
            "Delete",
            () => {
              props.onDeleteChat(currUserData);
            },
            "btn-danger"
          ),
          Dialog.Action(
            "Cancel",
            () => {
              CustomDialog.hide();
            },
            "btn-primary"
          ),
        ],
      });
    };

    const handleUploadImageChangeMethod = (e) => {
      setUploadingImg(true);
      let uploaded_img = e.target.files[0]
      let params = location.pathname.split("/");
      let chatId = params.length > 3 ? params[params.length - 2] : null;
      let form_data = new FormData();
      form_data.append("image", uploaded_img);
      form_data.append("name", uploaded_img['name']);
      form_data.append("type", uploaded_img['type']);
      form_data.append("chatId", chatId);
      setUploadedImage(uploaded_img)
      axiosInstance.post("upload_chat_image/", form_data, {
          headers: {
            'content-type': 'multipart/form-data'
          }
        }).then(res => {
            console.log(res.data);
            setUploadingImg(true);
            setUploadImgSrc(res.data.image_url);
        }).catch(err => {
          setUploadingImg(true);
          console.log(err)
        })
    };

    const clearChat = () => {
      let post_data = {};
      post_data['chat_id'] = currUserData.chat_id;
      post_data['user_id'] = curr_user_data.id;
      axiosInstance
        .post("clear_chat/", post_data)
        .then((res) => {
          if (res.data.ok) {
            getCurrentChatMsgs(currUserData.chat_id);
          } else {
            console.log("Error");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    };

    const addMessageCallback = (message) => {
      dispatch(chat_messages(message, "new_message"));
    };

    const setMessagesCallback = (messages) => {
      dispatch(chat_messages(messages, "fetch_messages"));
    };

    const setIsTyping = (data) => {
      let temp = { ...session_is_typing[data.chat_id] };
      temp[data.user_id] = data.status;
      setIsTypingMsg(temp);
      scrollToBottom();
      data.user_id !== curr_user_data.id ? dispatch(is_typing(data)) : "";
    };

    const renderMessages = () => {
      let curr_username = curr_user_data ? curr_user_data["username"] : "";
      let messageCount = currChatMsgs ? currChatMsgs.length : 0;
      let tempMessages = [];
      let msgs = currChatMsgs ? currChatMsgs : [];
      let i = 0;

      while (i < messageCount) {
        let previous = msgs[i - 1];
        let current = msgs[i];
        let next = msgs[i + 1];
        let isMine = current.author === curr_username;
        let currentMoment = moment(current.timestamp);
        let prevBySameAuthor = false;
        let nextBySameAuthor = false;
        let startsSequence = true;
        let endsSequence = true;
        let showTimestamp = true;

        if (previous) {
          let previousMoment = moment(previous.timestamp);
          let previousDuration = moment.duration(
            currentMoment.diff(previousMoment)
          );
          prevBySameAuthor = previous.author === current.author;

          if (prevBySameAuthor && previousDuration.as("hours") < 1) {
            startsSequence = false;
          }

          if (previousDuration.as("hours") < 1) {
            showTimestamp = false;
          }
        }

        if (next) {
          let nextMoment = moment(next.timestamp);
          let nextDuration = moment.duration(nextMoment.diff(currentMoment));
          nextBySameAuthor = next.author === current.author;

          if (nextBySameAuthor && nextDuration.as("hours") < 1) {
            endsSequence = false;
          }
        }

        tempMessages.push(
          <Message
            key={i}
            isMine={isMine}
            startsSequence={startsSequence}
            endsSequence={endsSequence}
            showTimestamp={showTimestamp}
            data={current}
          />
        );
        i += 1;
      }

      return tempMessages;
    };

    const onEmojiClick = (event, emoji) => {
      let input_msg = document.getElementById("composeMsg").value;
      input_msg += String.fromCodePoint(parseInt(emoji.unified, 16));
      setInputMsg(input_msg);
      setChosenEmoji(emoji);
    };

    const handleEmojiPicker = () => {
      let showEmojiPicker_obj = !showEmojiPicker;
      setShowEmojiPicker(showEmojiPicker_obj);
    };

    const handleChange = (e) => {
      e.preventDefault();
      setInputMsg(e.target.value);
      if (e.target.value.length > 0) {
        setIsTypingData(true);
      } else {
        setIsTypingData(false);
      }
    };

    const handleKeyDown = (e) => {
      let temp = {};
      if (e.key === "Enter") {
        temp["content"] = e.target.value;
        if (uploadImgSrc) {
          temp["img_url"] = uploadImgSrc;
          temp["type"] = "image";
          sendNewMessage(temp);
        } else if(e.target.value.length > 0) {
          temp["type"] = "text";
          sendNewMessage(temp);
        }
        e.target.value = "";
        setUploadImgSrc("");
        setUploadingImg(false);
        handleMsgSeen();
        setIsTypingData(false);
        setInputMsg("");
      }
    };

    const handleMessageInput = () => {
      let temp = {};
      let input_msg = document.getElementById("composeMsg").value;
      temp["content"] = input_msg;
      if (uploadImgSrc) {
        temp["img_url"] = uploadImgSrc;
        temp["type"] = "image";
        sendNewMessage(temp);
      } else {
        temp["type"] = "text";
        sendNewMessage(temp);
      }
      handleMsgSeen();
      setUploadImgSrc("");
      setUploadingImg(false);
      setIsTypingData(false);
      document.getElementById("composeMsg").value = "";
      setInputMsg("");
    };

    const handleUploadImageChange = (e) => {
      e.preventDefault();
      let reader = new FileReader();
      let file = e.target.files[0];
      const files = [...e.target.files]
      compress.compress(files, {
        size: 4, // the max size in MB, defaults to 2MB
        quality: .40, // the quality of the image, max is 1,
        maxWidth: 1920, // the max width of the output image, defaults to 1920px
        maxHeight: 1920, // the max height of the output image, defaults to 1920px
        resize: true, // defaults to true, set false if you do not want to resize the image width and height
      }).then((data) => {
        console.log(data)
        let compressedImg = data[0]
        let prefix = compressedImg.prefix;
        let base64str = compressedImg.data
        let img_ext = compressedImg.ext
        let file = Compress.convertBase64ToFile(base64str, img_ext);
        let output_img_src = prefix+base64str;
        if(file.size > 1048576){
          alert("File is too big!");
        }else{
          setImgExt(img_ext);
          setUploadedFileName(data[0].alt);
          setUploadImgSrc(output_img_src);
          scrollToBottom();
        }
      })
    };

    const sendNewMessage = (message) => {
      scrollToBottom();
      let data = {};
      let params = location.pathname.split("/");
      let chatId = params.length > 3 ? params[params.length - 2] : null;
      if (message.type === "text") {
        if (message.content.length > 0) {
          data = {
            from: curr_user_data.id,
            content: { msg: message.content, image_url: "" },
            chatId: chatId,
            type: message.type,
          };
        }
      } else {
        data = {
          from: curr_user_data.id,
          content: { msg: message.content, image_url: message.img_url, type: message.img_type, file_name: message.file_name },
          chatId: chatId,
          type: message.type,
        };
      }
      WebSocketInstance.newChatMessage(data);
    };

    const setIsTypingData = (status) => {
      let params = location.pathname.split("/");
      let chatId = params.length > 3 ? params[params.length - 2] : null;
      WebSocketInstance.setIsTypingStatus(
        curr_user_data.id,
        status,
        chatId,
        ""
      );
    };

    const handleMsgSeen = () => {
      let temp = {};
      temp[location.state.chat_id] = true;
      temp["recipient_id"] = currUserData.user_id;
      props.onHandleSeen(temp);
    };

    const cancelImgMsg = () => {
      setUploadingImg(false)
      setUploadImgSrc("");
    };

    return (
      <div style={orientationCss} className="wrapper_msg_list">
        <Orientation getData={setOrientation} />
        <div style={{ display: "none" }}>
        <Dialog
          ref={(el) => {
            CustomDialog = el;
          }}
        />
        </div>
        <div className="header_msg_list">
          <Row styl={{padding: '0px', margin: '0px'}}>
            <Col
            className="message_toolbar"
            ref={(el) => {
              messagesStart = el;
            }}
            xs={12}
            sm={12}
            md={12}
            lg={12}
            xl={12}
          >
            <Toolbar
              title={currUserData.name ? currUserData.name : "Begin Conversation"}
              leftItems={[
                <OverlayTrigger
                  key="info"
                  placement="top"
                  overlay={
                    <Tooltip id="info_tooltip">
                      <span>Info</span>
                    </Tooltip>
                  }
                >
                  <FaInfoCircle className="info" />
                </OverlayTrigger>,
              ]}
              rightItems={[
                <OverlayTrigger
                key="delete_chat"
                placement="top"
                overlay={
                  <Tooltip id="delete_chat_tooltip">
                    <span>Delete Chat</span>
                  </Tooltip>
                }
              >
                <FaTrash
                  onClick={() => deleteChatRef()}
                  className="delete_chat"
                />
              </OverlayTrigger>,
               <OverlayTrigger
               key="clear_chat"
               placement="top"
               overlay={
                 <Tooltip id="clear_chat_tooltip">
                   <span>Clear Chat</span>
                 </Tooltip>
               }
             >
               <FaCommentSlash
                 onClick={() => clearChatRef()}
                 className="clear_chat"
               />
             </OverlayTrigger>
              ]}
            />
          </Col>
          </Row>
        </div>
        <div className="content_msg_list">
          <div style={{ overFlowY: 'scroll', height: '1px' }}>
          {msgLoading ? (
            <div className="container">
              <PulseLoader
                css={override}
                size={30}
                color={"#0A73F0"}
                loading={msgLoading}
              />
            </div>
          ) : (
            ""
          )}
            {renderMessages()}
            <div id="messagesBottom"
              ref={(el) => {
              messagesEnd = el;
            }}>
            </div>
            {isTypingMsg &&
            isTypingMsg.hasOwnProperty(currUserData.user_id) &&
            isTypingMsg[currUserData.user_id] ? (
              <Row style={{ padding: "0px", margin: "15px 0px 0px 0px" }}>
                <Col xs={4} sm={3} md={2} lg={1} xl={1}>
                  <PulseLoader
                    size={8}
                    css={typingcss}
                    color={"#0A73F0"}
                    loading={
                      isTypingMsg &&
                      isTypingMsg.hasOwnProperty(currUserData.user_id)
                        ? isTypingMsg[currUserData.user_id]
                        : false
                    }
                  />
                </Col>
                <Col
                  style={{ padding: "0px" }}
                  xs={7}
                  sm={7}
                  md={7}
                  lg={11}
                  xl={11}
                >
                  <span style={{ fontSize: "0.8rem", color: "#0A73F0" }}>
                    {currUserData.name} is typing ...
                  </span>
                </Col>
              </Row>
            ) : (
              ""
            )}
            {showEmojiPicker && !isMobile && !isTablet? (
              <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                <Row style={{ padding: "0px", margin: "0px" }}>
                  <Col xl={4} lg={4} md={4} sm={4} xs={4} style={{ padding: '0px' }}>
                    <Picker ref={emojiInputRef}
                      style={{
                      padding: "0px",
                      position: "fixed",
                    }} onEmojiClick={onEmojiClick} />
                  </Col>
                </Row>
              </Col>
            ) : (
              ""
            )}
          </div>
        </div>
        <div className="footer_msg_list">
        <Col
          xs={12}
          sm={12}
          md={12}
          lg={12}
          xl={12}
        >
        {uploadingImg ? 
          <Row style={{padding: '0px', height: '100%' ,backgroundColor: '#f4f5f7', borderRadius: '10px'}}>
            <Col className="img_div_msg_list" xl={2} lg={2} md={6} sm={11} xs={10}>
              {uploadImgSrc ? <img className="img-fluid square_msg_list" style={{ position: 'relative', padding: '15px' }} src={uploadImgSrc} />:
                <div className="container">
                  <PulseLoader
                    css={uploadImgLoadingCss}
                    size={15}
                    color={"#0A73F0"}
                    loading={!uploadImgSrc}
                  />
              </div>
              }
              {uploadImgSrc ?<OverlayTrigger
                key="bottom"
                placement="top"
                overlay={
                  <Tooltip id="cancel_img_msg_tooltip">
                    <span>Cancel</span>
                  </Tooltip>
                }
              ><FaTimes onClick={() => cancelImgMsg()} style={{ position:'absolute', borderRadius: '50%',  border: '1px solid gray', backgroundColor: 'white', cursor: 'pointer', color: 'gray' }} />
              </OverlayTrigger>:""}
            </Col>
          </Row>: ""}
          <Row style={{padding: '0px', margin: '0px'}}>
            <Col
              style={{ padding: "0px" }}
              xs={12}
              sm={12}
              md={7}
              lg={9}
              xl={10}
            >
              <Form onSubmit={(e) => e.preventDefault()}>
                <Form.Group controlId="composeMsg" className="compose-input">
                  <Form.Control
                    onClick={() => handleMsgSeen()}
                    onKeyDown={(e) => handleKeyDown(e)}
                    onChange={(e) => handleChange(e)}
                    autoComplete="off"
                    name="inputMsg"
                    type="text"
                    value={inputMsg}
                    placeholder={
                      uploadImgSrc
                        ? "Add some caption to your image."
                        : "Type a message. @name"
                    }
                  ></Form.Control>
                </Form.Group>
              </Form>
            </Col>
            <Col
              className="composeButtons"
              xs={12}
              sm={12}
              md={5}
              lg={3}
              xl={2}
            >
              <Row style={{ margin: "0px", padding: "0px" }}>
                <Col xl={1} lg={1} md={1} sm={1} xs={1}>
                  <OverlayTrigger
                    key="bottom"
                    placement="top"
                    overlay={
                      <Tooltip
                        style={{
                          display: inputMsg.length > 0 || uploadImgSrc ? "block" : "none",
                        }}
                        id="send_msg_tooltip"
                      >
                        <span>Send</span>
                      </Tooltip>
                    }
                  >
                    <FaPaperPlane
                      onClick={() => handleMessageInput()}
                      className={
                        inputMsg.length > 0 || uploadImgSrc
                          ? "enable_send_btn"
                          : "disable_send_btn"
                      }
                    />
                  </OverlayTrigger>
                </Col>
                <Col xl={1} lg={1} md={1} sm={1} xs={1}>
                  <OverlayTrigger
                    key="bottom"
                    placement="top"
                    overlay={
                      <Tooltip id="send_emoji_tooltip">
                        <span>Emoji</span>
                      </Tooltip>
                    }
                  >
                    <FaSmile
                      onClick={() => handleEmojiPicker()}
                      className="composeIcons"
                    />
                  </OverlayTrigger>
                </Col>
                <Col xl={1} lg={1} md={1} sm={1} xs={1}>
                  <OverlayTrigger
                    key="bottom"
                    placement="top"
                    overlay={
                      <Tooltip id="send_img_tooltip">
                        <span>Upload an Image</span>
                      </Tooltip>
                    }
                  >
                    <div className="message_image_upload">
                      <label htmlFor="upload_img_msg">
                        <FaCamera className="composeIcons" />
                      </label>
                      <input
                        accept="image/*"
                        onChange={handleUploadImageChangeMethod}
                        id="upload_img_msg"
                        type="file"
                      />
                    </div>
                  </OverlayTrigger>
                </Col>
                <Col xl={1} lg={1} md={1} sm={1} xs={1}>
                  <OverlayTrigger
                    key="bottom"
                    placement="top"
                    overlay={
                      <Tooltip id="send_audio_tooltip">
                        <span>Upload Audio</span>
                      </Tooltip>
                    }
                  >
                    <FaMicrophone className="composeIcons" />
                  </OverlayTrigger>
                </Col>
              </Row>
            </Col>
            </Row>
            </Col>
        </div>
      </div>
    );
  }
});

export default MessageList;
