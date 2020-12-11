import React, {useState, useEffect, useRef, forwardRef} from 'react';
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
import { FaInfoCircle, FaPlus, FaCogs, FaUserFriends } from 'react-icons/fa';
import Button from 'react-bootstrap/Button'

const ConversationList = forwardRef((props, ref) => {{
  
  const [conversations, setConversations] = useState([]);
  const [searchedConversations, setSearchConversations] = useState([]);
  let child = useRef(null);
  const [refs, setRefs] = useState({});

  useEffect(() => {
    getConversations();
  },[]);

  const getOrCreateRef = (id) => {
    if (!refs.hasOwnProperty(id)) {
        refs[id] = React.createRef();
    }
    return refs[id];
  }

 const getConversations = () => {
    axios.get('https://randomuser.me/api/?results=20').then(response => {
        let newConversations = response.data.results.map((result, index) => {
          return {
            id: index,
            photo: result.picture.large,
            name: `${result.name.first} ${result.name.last}`,
            text: 'Hello world! This is a long message that needs to be truncated.'
          };
        });
        setConversations([...conversations, ...newConversations])
        setSearchConversations([...searchedConversations, ...newConversations])
    });
  }
  
  const handleSearch = (search_data) => {
    if (search_data) {
      let load_more_btn = document.getElementById('load_more');
      load_more_btn.style.display = 'none';
      let result = searchedConversations.filter(item => {
        return item.name.toLowerCase().includes(search_data.toLowerCase())
      });
      setConversations(result);
    } else {
      setConversations(searchedConversations)
    }
  }

  const loadMore = () => {
    refs[0] && refs[0].current && refs[0].current.loadMoreConversations();
  }

  const handleOnSelectUser = (data) => {
    console.log(data);
    props.handleOnSelectUser(data);
  }

  const handleLoadMoreHideButton = () => {
      let load_more_btn = document.getElementById('load_more');
      load_more_btn.style.display = 'none';
  }

    return (
      <Row className="conversation-list-row">
        <Col style={{ paddingRight: '0%', paddingLeft: '0%' }} xs={12} sm={12} md={12} lg={12} xl={12}>
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
                    ><FaCogs className="settings"/></OverlayTrigger>
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
                    ><FaUserFriends className="new_group"/></OverlayTrigger>
              ]}
            />
        </Col>
        <Col style={{ paddingRight: '0%', paddingLeft: '0%' }} xs={12} sm={12} md={12} lg={12} xl={12}>
          <ConversationSearch onSearchInput={handleSearch}/>
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
            conversations.length > 0?
            conversations.map(conversation =>
              <ConversationListItem
                ref={getOrCreateRef(conversation.id)}
                key={conversation.name}
                data={conversation}
                onSelectUser={handleOnSelectUser}
                handleLoadMoreHide={handleLoadMoreHideButton}
              />
            ):
            <div className="text-center" style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '10%' }} >
              No Results found.
            </div>
          }
          {conversations.length > 0?<Button id="load_more" onClick={() => loadMore()} size="sm" style={{ marginLeft: '33%',  marginBottom: '5%' }} className="text-center align-items-center">Load More</Button>:""}
        </Col>
      </Row>
    );
}})

export default ConversationList