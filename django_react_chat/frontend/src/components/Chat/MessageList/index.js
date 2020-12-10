import React, {useEffect, useState} from 'react';
import Compose from '../Compose';
import Toolbar from '../Toolbar';
import ToolbarButton from '../ToolbarButton';
import Message from '../Message';
import moment from 'moment';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import './MessageList.css';
import Footer from '../../Footer'
import {FaPaperPlane, FaSmile, FaCamera, FaImage, FaMicrophone} from "react-icons/fa";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

const MY_USER_ID = 'apple';

export default function MessageList(props) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    getMessages();
  },[])

  
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

    return(
      <Row className="conversation-list-row">
          <Col xs={12} sm={12} md={12} lg={12} xl={12}>
          <Toolbar
            title="Conversation Title"
            rightItems={[
              <ToolbarButton key="info" icon="ion-ios-information-circle-outline" />,
              <ToolbarButton key="video" icon="ion-ios-videocam" />,
              <ToolbarButton key="phone" icon="ion-ios-call" />
            ]}
          />
          </Col>
        
          <Col xs={12} sm={12} md={12} lg={12} xl={12}>
              {renderMessages()}
          </Col>
          
          <Col xs={12} sm={12} md={12} lg={12} xl={12}>
            <Row className="compose" style={{ padding: '0px', margin: '0px' }}>
              <Col xs={7} sm={7} md={7} lg={7} xl={7}>
                <Form>
                  <Form.Group controlId="composeMsg" className="compose-input">
                    <Form.Control autoComplete="off" name="composeMsg" type="text"
                                  placeholder="Type a message. @name"
                    >
                    </Form.Control>
                  </Form.Group>
                </Form>
              </Col>
              <Col className="composeButtons" xs={4} sm={4} md={4} lg={4} xl={4}>
              <OverlayTrigger
                        key="bottom"
                        placement="top"
                        overlay={
                            <Tooltip id="send_msg_tooltip">
                                <span>Send</span>
                            </Tooltip>
                        }
                    ><FaPaperPlane style={{ color: '#0578FA', fontSize: '1.2rem', cursor: 'pointer' }}/></OverlayTrigger>
                  <OverlayTrigger
                        key="bottom"
                        placement="top"
                        overlay={
                            <Tooltip id="send_emoji_tooltip">
                                <span>Emoji</span>
                            </Tooltip>
                        }
                    ><FaSmile className="composeIcons" /></OverlayTrigger>
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