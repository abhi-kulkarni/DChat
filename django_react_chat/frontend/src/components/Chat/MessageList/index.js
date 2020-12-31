import React, {useEffect, useState, useRef, forwardRef, useImperativeHandle} from 'react';
import Toolbar from '../Toolbar';
import Message from '../Message';
import moment from 'moment';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Picker, { SKIN_TONE_MEDIUM_DARK } from 'emoji-picker-react';
import './MessageList.css';
import {FaPaperPlane, FaSmile, FaCamera, FaInfoCircle, FaMicrophone, FaTrash, FaArrowUp} from "react-icons/fa";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Dialog from 'react-bootstrap-dialog'
import {useDispatch, useSelector} from "react-redux";
import WebSocketInstance from '../../../websocket'
import {useHistory, useLocation} from 'react-router-dom'
import {chat_messages, is_typing} from '../../../redux'
import axiosInstance from '../../axiosInstance'
import { css } from "@emotion/core";
import PulseLoader from "react-spinners/PulseLoader";


const MessageList = forwardRef((props, ref) => {{

  const [messages, setMessages] = useState([]);
  let CustomDialog = useRef(null);
  let messagesEnd = useRef(null);
  let messagesStart = useRef(null);
  let emojiInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inputMsg, setInputMsg] = useState('')
  const [chosenEmoji, setChosenEmoji] = useState(null)
  const mounted = useRef();
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();
  const curr_user_data = useSelector(state => state.session.user_data);
  const curr_chat_messages = useSelector(state => state.session.chat_messages);
  const [currUserData, setCurrUserData] = useState({});
  const [messageData, setMessageData] = useState([]);
  const [chatId, setChatId] = useState('');
  const [currChatMsgs, setCurrChatMsgs] = useState([]);
  const childRef = useRef(null);
  const [msgLoading, setMsgLoading] = useState(true);
  const session_is_typing = useSelector(state => state.session.is_typing);
  const [isTypingMsg, setIsTypingMsg] = useState({})

  useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside, false);
      mounted.current = true;
  }, []);

  useEffect(() => {
    let params = location.pathname.split('/');
    let chatId = params.length > 3?params[params.length - 2]: null;
    if(location.state){
      setCurrUserData(location.state);
      let disconnect = false;
      let curr_chat_path = '/chat/'+location.state.chat_id+'/';
      let prev_path = location.state.prevPath;
      let curr_ws_instance = WebSocketInstance.getCurrentSocketInstance();
      if(prev_path === '/chat/' || prev_path === '/chat'){
        disconnect = false;
      }
      else if(curr_chat_path !== prev_path){
        disconnect = true;
      }
      setChatId(chatId);
      initializeChat(chatId, disconnect); 
    }
  }, [location.pathname]);

  useEffect(() => {
    let ele = document.getElementById('messagesBottom');
    ele.scrollIntoView({behavior: "smooth"});
  }, [currChatMsgs])

  useEffect(() => {
    if(WebSocketInstance.state() === 1){
      let params = location.pathname.split('/');
      let chatId = params.length > 3?params[params.length - 2]: null;
      let data = curr_chat_messages && curr_chat_messages.hasOwnProperty('messages') && curr_chat_messages['messages'].filter(item => {
        return item.chatId === chatId;
      });
      data && data.sort((a, b) => (new Date(a.timestamp) < new Date(b.timestamp)) ? -1 : ((new Date(a.timestamp) > new Date(b.timestamp)) ? 1 : 0));
      setCurrChatMsgs(data);
    }
  }, [curr_chat_messages]);


  const override = css`
    display: flex; 
    justify-content: center; 
    align-items: center; 
    height: 55vh
    `;
  
  const typingcss = css`
    padding-top: 2px;
    float:right
  `;

  const waitForSocketConnection = (callback) => {
    setTimeout(function() {
      if (WebSocketInstance.state() === 1) {
        console.log("Connection is secure");
        setMsgLoading(false);
        callback();
      } else {
        console.log("wait for connection...");
        waitForSocketConnection(callback);
      }
    }, 100);
  }

  const initializeChat = (chatId, disconnect) => {
    if(disconnect){
      WebSocketInstance.disconnect();
      waitForSocketConnection(() => {
        WebSocketInstance.fetchMessages(
          curr_user_data.id, chatId
        );
      });
      WebSocketInstance.connect('chat', chatId);
    }else{
      waitForSocketConnection(() => {
        WebSocketInstance.addCallbacks(
          (data) => setMessagesCallback(data), 
          (data) => addMessageCallback(data),
          (data) => setIsTyping(data)
        )
        WebSocketInstance.fetchMessages(
          curr_user_data.id, chatId
        );
      });
      WebSocketInstance.connect('chat', chatId);
    }
  }


  const handleClickOutside = (e) => {
    if (emojiInputRef && e.target && emojiInputRef.current && !emojiInputRef.current.contains(e.target)) {
        setShowEmojiPicker(false)
    }
  };
  
  const scrollToBottom = () => {
    document.getElementById('messagesBottom').scrollIntoView({behavior: "smooth"})
  };

  const scrollToTop = () => {
    messagesStart.scrollIntoView({ behavior: "smooth" });
  }

  const getCurrentChatMsgs = (chatId) => {
    axiosInstance.get('get_chat/'+chatId+'/').then(res => {
      if(res.data.ok) {
          setCurrChatMsgs(res.data.chat_data)
      }else{
          console.log('Error')
      }
  }).catch(err => {
      console.log(err)
  });
  }

  const clearChatRef = (chat_id) => {
    CustomDialog.show({
        body: 'Are you sure you want to clear this chat ?',
        actions: [
            Dialog.DefaultAction(
                'Delete',
                () => {
                  clearChat(chat_id);
                },
                'btn-danger'
            ),
            Dialog.Action(
                'Cancel',
                () => {
                  CustomDialog.hide();
                },
                'btn-primary'
            ),
        ]
    });
  };

  const clearChat = (chatId) => {
    alert('Chat Cleared')
  }

  const addMessageCallback = (message) => {
    dispatch(chat_messages(message, "new_message"));
  }

  const setMessagesCallback = (messages) => {
    dispatch(chat_messages(messages, "fetch_messages"));
  }

  const setIsTyping = (data) => {
    let temp = {...session_is_typing[data.chat_id]};
    temp[data.user_id] = data.status;
    setIsTypingMsg(temp);
    scrollToBottom();
    data.user_id !== curr_user_data.id?dispatch(is_typing(data)):'';
  }

  const renderMessages = () => {

    let curr_username = curr_user_data?curr_user_data['username']:'';
    let messageCount = currChatMsgs?currChatMsgs.length:0;
    let tempMessages = [];
    let msgs = currChatMsgs?currChatMsgs:[];
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
        let previousDuration = moment.duration(currentMoment.diff(previousMoment));
        prevBySameAuthor = previous.author === current.author;
        
        if (prevBySameAuthor && previousDuration.as('hours') < 1) {
          startsSequence = false;
        }

        if (previousDuration.as('hours') < 1) {
          showTimestamp = false;
        }
      }

      if (next) {
        let nextMoment = moment(next.timestamp);
        let nextDuration = moment.duration(nextMoment.diff(currentMoment));
        nextBySameAuthor = next.author === current.author;

        if (nextBySameAuthor && nextDuration.as('hours') < 1) {
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
  }

  const onEmojiClick = (event, emoji) => {
    let input_msg = document.getElementById('composeMsg').value;
    input_msg += String.fromCodePoint(parseInt(emoji.unified, 16))
    setInputMsg(input_msg)
    setChosenEmoji(emoji)
  }

  const handleEmojiPicker = () => {
    let showEmojiPicker = !showEmojiPicker
    setShowEmojiPicker(showEmojiPicker)
  }

  const handleChange = (e) => {
    e.preventDefault();
    setInputMsg(e.target.value);
    if(e.target.value.length > 0){
      setIsTypingData(true);
    }else{
      setIsTypingData(false);
    }
  }

  const handleKeyDown = (e) => {
    if(e.key === 'Enter'){
      sendNewMessage(e.target.value);
      e.target.value = '';
      setInputMsg('');
      handleMsgSeen();
      setIsTypingData(false);
    }
  }

  const handleMessageInput = () => {
    let input_msg = document.getElementById('composeMsg').value;
    sendNewMessage(input_msg);
    handleMsgSeen();
    setIsTypingData(false);
    document.getElementById('composeMsg').value = '';
    setInputMsg('');
  }

  const sendNewMessage = (message) => {
    if(message.length > 0){
      scrollToBottom();
      let params = location.pathname.split('/');
      let chatId = params.length > 3?params[params.length - 2]: null;
      let data = {'from': curr_user_data.id, 'content': message, 'chatId': chatId}
      WebSocketInstance.newChatMessage(data);
    }
  }

  const setIsTypingData = (status) => {
    let params = location.pathname.split('/');
    let chatId = params.length > 3?params[params.length - 2]: null;
    WebSocketInstance.setIsTypingStatus(curr_user_data.id, status, chatId, '');
  }

  const handleMsgSeen = () => {
    let temp = {};
    temp[location.state.chat_id] = true
    temp['recipient_id'] = currUserData.user_id;
    props.onHandleSeen(temp);
  }

  return(
    <Row className="conversation-list-row">
        <div style={{display: 'none'}}>
          <Dialog ref={(el) => {
              CustomDialog = el
          }}/>
        </div>
        <Col className="message_toolbar" ref={(el) => { messagesStart = el }} xs={12} sm={12} md={12} lg={12} xl={12}>
        <Toolbar
          title={currUserData.name?currUserData.name:'Begin Conversation'}
          leftItems={[
            <OverlayTrigger
                      key="bottom"
                      placement="top"
                      overlay={
                          <Tooltip id="info_tooltip">
                              <span>Info</span>
                          </Tooltip>
                      }
                  ><FaInfoCircle className="info"/></OverlayTrigger>
          ]}
          rightItems={[
            <OverlayTrigger
                      key="bottom"
                      placement="top"
                      overlay={
                          <Tooltip id="clear_chat_tooltip">
                              <span>Clear Chat</span>
                          </Tooltip>
                      }
                  ><FaTrash onClick={() => clearChatRef('1')} className="clear_chat"/></OverlayTrigger>
          ]}
        />
        </Col>
      
        <Col style={{ marginBottom: 'calc(1.5em + 3rem + 2px)' }} xs={12} sm={12} md={12} lg={12} xl={12}>
            {msgLoading?
            <div className="container">
              <PulseLoader
                css={override}
                size={30}
                color={"#0A73F0"}
                loading={msgLoading}
              />
            </div>:''}
              {renderMessages()}
              {isTypingMsg && isTypingMsg.hasOwnProperty(currUserData.user_id) && isTypingMsg[currUserData.user_id]?
              <Row style={{ padding: '0px', margin: '15px 0px 0px 0px' }}>
                <Col xs={4} sm={3} md={2} lg={1} xl={1}>
                  <PulseLoader
                  size={8}
                  css={typingcss}
                  color={"#0A73F0"}
                  loading={isTypingMsg && isTypingMsg.hasOwnProperty(currUserData.user_id)?isTypingMsg[currUserData.user_id]:false}
                  />
                </Col>
                <Col style={{ padding: '0px' }} xs={7} sm={7} md={7} lg={11} xl={11}>
                  <span style={{ fontSize: '0.8rem', color: '#0A73F0' }}>{currUserData.name} is typing ...</span>
                </Col>
              </Row>:''}
            {showEmojiPicker?<div ref={emojiInputRef} style={{ bottom: '15%', left: '66%', position: 'fixed' }}>
              <Picker onEmojiClick={onEmojiClick} />
            </div>:""}
        </Col>
        <Col id="messagesBottom" ref={(el) => { messagesEnd = el }} xs={12} sm={12} md={12} lg={12} xl={12}>
          <Row className="compose" style={{ padding: '0px', margin: '0px' }}>
            <Col style={{ paddingLeft: '0px' }} xs={6} sm={6} md={7} lg={7} xl={7}>
              <Form onSubmit={(e) => e.preventDefault()}>
                <Form.Group controlId="composeMsg" className="compose-input">
                  <Form.Control onClick={() => handleMsgSeen()} onKeyDown={(e) => handleKeyDown(e)}
            onChange={e => handleChange(e)} autoComplete="off" name="inputMsg" type="text"
                                value={inputMsg} placeholder="Type a message. @name"
                  >
                  </Form.Control>
                </Form.Group>
              </Form>
            </Col>
            <Col className="composeButtons" xs={12} sm={12} md={12} lg={4} xl={4}>
                <OverlayTrigger
                      key="bottom"
                      placement="top"
                      overlay={<Tooltip style={{ display: inputMsg.length > 0? 'block': 'none' }} id="send_msg_tooltip">
                              <span>Send</span>
                          </Tooltip>}
                  ><FaPaperPlane onClick={() => handleMessageInput()} className={inputMsg.length>0?"enable_send_btn":"disable_send_btn"}/></OverlayTrigger>
                <OverlayTrigger
                      key="bottom"
                      placement="top"
                      overlay={
                          <Tooltip id="send_emoji_tooltip">
                              <span>Emoji</span>
                          </Tooltip>
                      }
                  ><FaSmile onClick={() => handleEmojiPicker()} className="composeIcons"/>
                  </OverlayTrigger>
                <OverlayTrigger
                      key="bottom"
                      placement="top"
                      overlay={
                          <Tooltip id="send_img_tooltip">
                              <span>Upload an Image</span>
                          </Tooltip>
                      }
                  ><FaCamera className="composeIcons"/></OverlayTrigger>
                <OverlayTrigger
                      key="bottom"
                      placement="top"
                      overlay={
                          <Tooltip id="send_audio_tooltip">
                              <span>Upload Audio</span>
                          </Tooltip>
                      }
                  ><FaMicrophone className="composeIcons"/></OverlayTrigger>
            </Col>
          </Row>
        </Col>
    </Row>
    
  );
}})

export default MessageList