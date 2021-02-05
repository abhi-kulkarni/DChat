import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import ConversationList from "../ConversationList";
import MessageList from "../MessageList";
import "./Messenger.css";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useHistory, useLocation } from "react-router-dom";

const Messenger = (props) => {
  {
    const history = useHistory();
    const location = useLocation();
    const [seen, setSeen] = useState({});
    const conversationListRef = useRef(null);
    const messageListRef = useRef(null);
    
    const handleSeen = (data) => {
      setSeen(data);
    };

    const deleteChat = (data) => {
      conversationListRef.current.deleteChatFromMessageList(data);
    }

    const clearChat = (data) => {
      conversationListRef.current.clearChatFromMessageList(data);
    }

    return (
      <Row style={{ padding: "0px", margin: "0px", minHeight: "0px" }}>
        <Col className="conversation_list" xs={5} sm={5} md={4} lg={3} xl={3}>
          <ConversationList ref={conversationListRef} hasSeen={seen} />
        </Col>
        <Col xs={7} sm={7} md={8} lg={9} xl={9}>
          {location.state && location.state.chat_id ? <MessageList onClearChat={clearChat} onDeleteChat={deleteChat} ref={messageListRef} onHandleSeen={handleSeen} /> : ""}
        </Col>
      </Row>
    );
  }
};

export default Messenger;
