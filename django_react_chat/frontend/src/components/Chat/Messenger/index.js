import React, {useState, useEffect, useRef, forwardRef, useImperativeHandle} from 'react';
import ConversationList from '../ConversationList';
import MessageList from '../MessageList';
import './Messenger.css';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import {useHistory, useLocation} from 'react-router-dom'

const Messenger = forwardRef((props, ref) => {{

    const history = useHistory();
    const location = useLocation();

    return (
      <Row style={{ padding: '0px', margin: '0px', minHeight: '0px' }}>
        <Col className="conversation_list" xs={5} sm={5} md={5} lg={3} xl={3}>
          <ConversationList/>
        </Col>
        <Col className="msg_list" xs={7} sm={7} md={7} lg={9} xl={9}>
          {location.state?<MessageList/>:""}
        </Col>
      </Row>
    );

}})

export default Messenger