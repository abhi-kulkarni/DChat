import React, {useState, useEffect, useRef} from 'react';
import ConversationList from '../ConversationList';
import MessageList from '../MessageList';
import './Messenger.css';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

export default function Messenger(props) {


  const [selectedUserData, setSelectedUserData] = useState({});


    const getSelectedUserData = (data) => {
      setSelectedUserData(data)
    }

    return (
      <Row style={{ padding: '0px', margin: '0px', minHeight: '0px' }}>
        <Col className="conversation_list" xs={5} sm={5} md={4} lg={3} xl={3}>
          <ConversationList handleOnSelectUser={getSelectedUserData} />
        </Col>
        <Col className="msg_list" xs={6} sm={6} md={8} lg={9} xl={9}>
          <MessageList userData={selectedUserData} />
        </Col>
      </Row>
    );
}