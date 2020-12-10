import React, {useState, useEffect} from 'react';
import ConversationSearch from '../ConversationSearch';
import ConversationListItem from '../ConversationListItem';
import Toolbar from '../Toolbar';
import ToolbarButton from '../ToolbarButton';
import axios from 'axios';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import './ConversationList.css';
import { FaPlus } from 'react-icons/fa';

export default function ConversationList(props) {
  const [conversations, setConversations] = useState([]);
  useEffect(() => {
    getConversations()
  },[])

 const getConversations = () => {
    axios.get('https://randomuser.me/api/?results=20').then(response => {
        let newConversations = response.data.results.map(result => {
          return {
            photo: result.picture.large,
            name: `${result.name.first} ${result.name.last}`,
            text: 'Hello world! This is a long message that needs to be truncated.'
          };
        });
        setConversations([...conversations, ...newConversations])
    });
  }

    return (
      <Row className="conversation-list-row">
        <Col style={{ paddingRight: '0%', paddingLeft: '0%' }} xs={12} sm={12} md={12} lg={12} xl={12}>
          <Toolbar
              title="Messenger"
              leftItems={[
                <ToolbarButton key="cog" icon="ion-ios-cog" />
              ]}
              rightItems={[
                <ToolbarButton key="add" icon="ion-ios-add-circle-outline" />
              ]}
            />
        </Col>
        <Col style={{ paddingRight: '0%', paddingLeft: '0%' }} xs={12} sm={12} md={12} lg={12} xl={12}>
          <ConversationSearch />
        </Col>
        <Col style={{ paddingRight: '0%', paddingLeft: '0%' }} xs={12} sm={12} md={12} lg={12} xl={12}>
        <OverlayTrigger
                        key="bottom"
                        placement="top"
                        overlay={
                            <Tooltip id="add_conversation_tooltip">
                                <span>Add new conversation</span>
                            </Tooltip>
                        }
                    ><FaPlus className="add_conversation"/></OverlayTrigger>
        </Col>
        <Col style={{ paddingRight: '0%', paddingLeft: '0%' }} xs={12} sm={12} md={12} lg={12} xl={12}>
          {
            conversations.map(conversation =>
              <ConversationListItem
                key={conversation.name}
                data={conversation}
              />
            )
          }
        </Col>
      </Row>
    );
}