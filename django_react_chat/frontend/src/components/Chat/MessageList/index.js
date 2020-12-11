import React, {useEffect, useState, useRef} from 'react';
import Toolbar from '../Toolbar';
import Message from '../Message';
import moment from 'moment';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Picker, { SKIN_TONE_MEDIUM_DARK } from 'emoji-picker-react';
import './MessageList.css';
import {FaPaperPlane, FaSmile, FaCamera, FaInfoCircle, FaMicrophone, FaTrash} from "react-icons/fa";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Dialog from 'react-bootstrap-dialog'

const MY_USER_ID = 'apple';

export default function MessageList(props) {
  const [messages, setMessages] = useState([])
  let CustomDialog = useRef(null);
  let messagesEnd = useRef(null)
  let emojiInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inputMsg, setInputMsg] = useState('')
  const [chosenEmoji, setChosenEmoji] = useState(null)
  const mounted = useRef();


  useEffect(() => {
    if (!mounted.current) {
      getMessages();
      document.addEventListener('mousedown', handleClickOutside, false);
      scrollToBottom();
      mounted.current = true;
    } else {
      scrollToBottom();
    }
  });

  const handleClickOutside = (e) => {
    if (emojiInputRef && e.target && emojiInputRef.current && !emojiInputRef.current.contains(e.target)) {
        setShowEmojiPicker(false)
    }
  };
  
  const scrollToBottom = () => {
    messagesEnd.scrollIntoView({ behavior: "smooth" });
  };

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

  
  const getMessages = () => {
     var tempMessages = [
        {
          id: 1,
          author: 'apple',
          message: 'Hello world! This is a long message that will hopefully get wrapped by our message bubble component! We will see how well it works.',
          timestamp: new Date().getTime()
        },
        {
          id: 2,
          author: 'orange',
          message: 'It looks like it wraps exactly as it is supposed to. Lets see what a reply looks like!',
          timestamp: new Date().getTime()
        },
        {
          id: 3,
          author: 'orange',
          message: 'Hello world! This is a long message that will hopefully get wrapped by our message bubble component! We will see how well it works.',
          timestamp: new Date().getTime()
        },
        {
          id: 4,
          author: 'apple',
          message: 'It looks like it wraps exactly as it is supposed to. Lets see what a reply looks like!',
          timestamp: new Date().getTime()
        },
        {
          id: 5,
          author: 'apple',
          message: 'Hello world! This is a long message that will hopefully get wrapped by our message bubble component! We will see how well it works.',
          timestamp: new Date().getTime()
        },
        {
          id: 6,
          author: 'apple',
          message: 'It looks like it wraps exactly as it is supposed to. Lets see what a reply looks like!',
          timestamp: new Date().getTime()
        },
        {
          id: 7,
          author: 'orange',
          message: 'Hello world! This is a long message that will hopefully get wrapped by our message bubble component! We will see how well it works.',
          timestamp: new Date().getTime()
        },
        {
          id: 8,
          author: 'orange',
          message: 'It looks like it wraps exactly as it is supposed to. Lets see what a reply looks like!',
          timestamp: new Date().getTime()
        },
        {
          id: 9,
          author: 'apple',
          message: 'Hello world! This is a long message that will hopefully get wrapped by our message bubble component! We will see how well it works.',
          timestamp: new Date().getTime()
        },
        {
          id: 10,
          author: 'orange',
          message: 'It looks like it wraps exactly as it is supposed to. Lets see what a reply looks like!',
          timestamp: new Date().getTime()
        },
        {
          id: 11,
          author: 'orange',
          message: 'It looks like it wraps exactly as it is supposed to. Lets see what a reply looks like!',
          timestamp: new Date().getTime()
        },
        {
          id: 12,
          author: 'orange',
          message: 'It looks like it wraps exactly as it is supposed to. Lets see what a reply looks like!',
          timestamp: new Date().getTime()
        },
        {
          id: 13,
          author: 'orange',
          message: 'It looks like it wraps exactly as it is supposed to. Lets see what a reply looks like!',
          timestamp: new Date().getTime()
        },
        {
          id: 14,
          author: 'orange',
          message: 'It looks like it wraps exactly as it is supposed to. Lets see what a reply looks like!',
          timestamp: new Date().getTime()
        }

      ]
      setMessages([...messages, ...tempMessages])
  }

  const renderMessages = () => {
    let i = 0;
    let messageCount = messages.length;
    let tempMessages = [];

    while (i < messageCount) {
      let previous = messages[i - 1];
      let current = messages[i];
      let next = messages[i + 1];
      let isMine = current.author === MY_USER_ID;
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

      // Proceed to the next message.
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
    setInputMsg(e.target.value)
  }

  const handleKeyDown = (e) => {
    if(e.key === 'Enter'){
      sendNewMessage(e.target.value);
      e.target.value = '';
      setInputMsg('')
    }
  }

  const handleMessageInput = () => {
    let input_msg = document.getElementById('composeMsg').value;
    this.sendNewMessage(input_msg);
    document.getElementById('composeMsg').value = '';
    setInputMsg(input_msg)
  }

  const sendNewMessage = (message) => {
    alert(message)
  }

  return(
    <Row className="conversation-list-row">
        <div style={{display: 'none'}}>
          <Dialog ref={(el) => {
              CustomDialog = el
          }}/>
        </div>
        <Col xs={12} sm={12} md={12} lg={12} xl={12}>
        <Toolbar
          title={props.userData.name?props.userData.name:'Begin Conversation'}
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
            {renderMessages()}
            {showEmojiPicker?<div ref={emojiInputRef} style={{ bottom: '15%', left: '66%', position: 'fixed' }}>
              <Picker onEmojiClick={onEmojiClick} />
            </div>:""}
        </Col>

        
        <Col ref={(el) => { messagesEnd = el }} xs={12} sm={12} md={12} lg={12} xl={12}>
          <Row className="compose" style={{ padding: '0px', margin: '0px' }}>
            <Col style={{ paddingLeft: '0px' }} xs={6} sm={6} md={7} lg={7} xl={7}>
              <Form onSubmit={(e) => e.preventDefault()}>
                <Form.Group controlId="composeMsg" className="compose-input">
                  <Form.Control onKeyDown={(e) => handleKeyDown(e)}
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
}