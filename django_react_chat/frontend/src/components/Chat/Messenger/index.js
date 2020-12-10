import React from 'react';
import ConversationList from '../ConversationList';
import MessageList from '../MessageList';
import './Messenger.css';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

export default function Messenger(props) {
    return (
      <Row style={{ padding: '0px', margin: '0px', minHeight: '0px' }}>
        <Col className="conversation_list" xs={5} sm={5} md={5} lg={5} xl={3}>
          <ConversationList />
        </Col>
        <Col className="msg_list" xs={6} sm={6} md={6} lg={6} xl={9}>
          <MessageList />
        </Col>
      </Row>
    );
}