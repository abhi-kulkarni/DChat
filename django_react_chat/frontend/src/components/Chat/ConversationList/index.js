import React, {useState, useEffect, useRef, forwardRef, useImperativeHandle} from 'react';
import ConversationSearch from '../ConversationSearch';
import ConversationListItem from '../ConversationListItem';
import Toolbar from '../Toolbar';
import ToolbarButton from '../ToolbarButton';
import axios from 'axios';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Form from 'react-bootstrap/Form'
import Tooltip from 'react-bootstrap/Tooltip'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import './ConversationList.css';
import { FaComment, FaCommentSlash, FaCheck, FaPlus, FaCogs, FaUserFriends, FaTrash, FaTimes, FaCheckCircle, FaShare, FaTasks, FaUserPlus } from 'react-icons/fa';
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import defaultImg from '../../../static/images/default_profile_picture.jpg'
import axiosInstance from '../../axiosInstance'
import {useDispatch, useSelector} from "react-redux";
import WebSocketInstance from '../../../websocket'
import {chat_status, last_seen_time, chat_requests, notifications, chat_messages, has_read} from '../../../redux'
import Dialog from 'react-bootstrap-dialog'
import moment from 'moment'
import {useHistory, useLocation} from 'react-router-dom'

const ConversationList = (props) => {

  let CustomDialog = useRef(null);
  const dispatch = useDispatch();
  const history = useHistory();
  const [key, setKey] = useState('friends');
  const [conversations, setConversations] = useState([]);
  const [modalConversations, setModalConversations]= useState([]);
  const [showManageChatsModal, setShowManageChatsModal] = useState(false);
  const [searchedConversations, setSearchConversations] = useState([]);
  let child = useRef(null);
  const [refs, setRefs] = useState({});
  const [modalConversationSearchInput, setModalConversationSearchInput] = useState('');
  const session_chat_requests = useSelector(state => state.session.chat_requests);
  const [chats, setChats] = useState([]);
  const [searchChatData, setSearchChats] = useState([]);
  const [c1, setC1] = useState([]);
  const curr_user_data = useSelector(state => state.session.user_data);
  const location = useLocation();
  const [recent_msg, setRecentMsg] = useState({});

  useEffect(() => {
    getRecentMsgData();
    if(WebSocketInstance.getCurrentSocketInstance()){
      WebSocketInstance.disconnect();
    }
    WebSocketInstance.connect('chat_requests', '');
    WebSocketInstance.chatRequestNotificationCallbacks(
      (data) => setSocketChatRequestData(data),
      (data) => setChatStatus(data),
      (data) => setRecentMsgData(data),
      (data) => setLastSeenData(data)
    )
    initializeChatStatus(curr_user_data.id, "online", "sender");
  },[]);

  useEffect(() => {
    session_chat_requests?setChats(session_chat_requests['reqd_chat_data']):setChats([]);
    session_chat_requests?setSearchChats(session_chat_requests['reqd_chat_data']):setChats([])
    if(session_chat_requests && session_chat_requests.action == 'accept'){
      if(location.state && location.state.rerender){
        //pass
      }else{
        dispatch(notifications([session_chat_requests.notification]));
      }
      let data = session_chat_requests.curr_chat_data;
      data['prevPath'] = location.pathname;
      data['rerender'] = true;
      history.push({
        pathname: '/chat/'+session_chat_requests.chat_id+'/',
        state: data,
      });
    }else if(session_chat_requests && session_chat_requests.action === 'remove'){
      history.push('/chat/')
    }
  }, [session_chat_requests]);

  const initializeChatStatus = (uId, status, type) => {
    waitForSocketConnection(() => {
      WebSocketInstance.setChatStatus(
        uId, status, type
      );
    });
  }

  const setRecentMsgData = (data) => {
    if(data){
      dispatch(chat_messages(data, "new_message"));
    }
  }

  const getRecentMsgData = () => {
    axiosInstance.get('get_recent_msg_data/').then(res => {
      if(res.data.ok) {
        let c = [];
        res.data && res.data.hasOwnProperty('chats')?setChats(res.data.chats):''
      }else{
          console.log('Error')
      }
  }).catch(err => {
      console.log(err)
  });
  }

  const setLastSeenData = (data) => {
    if(data['user_id'] !== curr_user_data.id){
      dispatch(last_seen_time(data));
    }
  }

  const setChatStatus = (data) => {
    data.user_id !== curr_user_data.id?dispatch(chat_status(data)):'';
    if(data.type !== 'reciever'){
      initializeChatStatus(curr_user_data.id, "online", "reciever")
    }
  }

  const setSocketChatRequestData = (data) => {
    console.log(data)
    if(Object.keys(data).indexOf((curr_user_data.id).toString()) > -1){
        dispatch(chat_requests(data[curr_user_data.id]))
    }
}

const getAllChats = () => {
  axiosInstance.get('get_all_chats/').then(res => {
      if(res.data.ok) {
        let c = [];
        res.data.chats.map(item => {
            if(item.chat.isFriend){
              c.push(item.chat)
            }
        });
        console.log(c)
        setC1([...c1, ...c]);
      }else{
          console.log('Error')
      }
  }).catch(err => {
      console.log(err)
  });
}

const initializeSocket = (uId, rId, action, chatId, notificationData) => {
    waitForSocketConnection(() => {
      WebSocketInstance.fetchChatRequests(
        uId, rId, action, chatId, notificationData, ""
      );
    });
}

const waitForSocketConnection = (callback) => {
    setTimeout(function() {
      if (WebSocketInstance.state() === 1) {
        console.log("Connection is secure");
        callback();
      } else {
        console.log("wait for connection...");
        waitForSocketConnection(callback);
      }
    }, 100);
}

const manageChats = (action, recipient_user, chat_id) => {
        
  let post_data = {};
  post_data['action'] = action;
  post_data['recipient_user_id'] = recipient_user.id;
  post_data['chat_id'] = chat_id;
  axiosInstance.post('manage_chats/', post_data).then(res => {
      if(res.data.ok) {
          let chat_id = res.data.chat_id;
          let notification_data = res.data.notification;
          initializeSocket(curr_user_data.id, recipient_user.id, action, chat_id, notification_data);
      }else{
          console.log('Error')
      }
  }).catch(err => {
      console.log(err)
  });
}

  const getAllFriends = () => {
    axiosInstance.get('get_all_friends/').then(res => {
        if(res.data.ok) {
          let newConversations = res.data && res.data.hasOwnProperty('users') && res.data.users.map((user, index) => {
          let profile_picture = user.profile_picture?user.profile_picture:defaultImg;
            return {
              id: index,
              user_id: user.id,
              photo: profile_picture,
              name: user.username,
              text: 'Hello world! This is a long message that needs to be truncated.'
          };
          });
          setConversations([...conversations, ...newConversations])
          setModalConversations([...conversations, ...newConversations])
          setSearchConversations([...searchedConversations, ...newConversations])
        }else{
            console.log('Error')
        }
    }).catch(err => {
        console.log(err)
    });
};

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

  const handleConversationModalSearch = (search_data) => {
    setModalConversationSearchInput(search_data)
    if (search_data) {
      let result = searchedConversations.filter(item => {
        return item.name.toLowerCase().includes(search_data.toLowerCase())
      });
      setModalConversations(result);
    } else {
      setModalConversations(searchedConversations)
    }
  }
  
  const handleSearch = (search_data) => {
    if (search_data) {
      let load_more_btn = document.getElementById('load_more');
      if(load_more_btn){
        load_more_btn.style.display = 'none';
      }
      let result = searchChatData && searchChatData.filter(item => {
        return item.chat.name.toLowerCase().includes(search_data.toLowerCase())
      });
      setChats(result);
    } else {
      setChats(searchChatData)
    }
  }

  const manageCancelChatRequestRef = (action, recipient_user, chat_id) => {
    CustomDialog.show({
        body: 'Are you sure you want to cancel this request ?',
        actions: [
            Dialog.DefaultAction(
                'Cancel Request',
                () => {
                  manageChats(action, recipient_user, chat_id);
                },
                'btn-danger'
            ),
            Dialog.Action(
                'Close',
                () => {
                  CustomDialog.hide();
                },
                'btn-primary'
            ),
        ]
    });
  };

  const manageRemoveChatRequestRef = (action, recipient_user, chat_id) => {
    CustomDialog.show({
        body: 'Are you sure you want to remove ' + recipient_user.username + ' from your chats ?',
        actions: [
            Dialog.DefaultAction(
                'Remove',
                () => {
                  manageChats(action, recipient_user, chat_id);
                },
                'btn-danger'
            ),
            Dialog.Action(
                'Close',
                () => {
                  CustomDialog.hide();
                },
                'btn-primary'
            ),
        ]
    });
  };


  const loadMore = () => {
    refs[0] && refs[0].current && refs[0].current.loadMoreConversations();
  }

  const handleOnSelectUser = (data) => {
    let username = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    data['username'] = username;
    props.handleOnSelectUser(data);
  }

  const handleChatDelete = (data) => {
    let username = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    let user = {'username': username, 'id': data.user_id};
    manageRemoveChatRequestRef('remove', user, data.chat_id)
  }

  const handleLoadMoreHideButton = () => {
      let load_more_btn = document.getElementById('load_more');
      load_more_btn.style.display = 'none';
  }

  const openManageChatsModal = () => {
    setShowManageChatsModal(true)
  }

  const closeManageChatsModal = () => {
    setShowManageChatsModal(false)
  }

  const handleSelectUser = (data) => {
    if(WebSocketInstance.getCurrentSocketInstance()){
      WebSocketInstance.setLastSeen(data);
    }
    dispatch(last_seen_time(data['last_seen']));
    dispatch(has_read(data['has_read']));
    data['prevPath'] = location.pathname;
    data['rerender'] = true;
    history.push({
      pathname: '/chat/'+data.chat_id+'/',
      state: data,
    });
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
                            <Tooltip id="manage_chats_tooltip">
                                <span>Manage Conversations</span>
                            </Tooltip>
                        }
                    ><FaTasks onClick={openManageChatsModal} className="manage_chats"/></OverlayTrigger>
        </Col>
        <Col style={{ paddingRight: '0%', paddingLeft: '0%' }} xs={12} sm={12} md={12} lg={12} xl={12}>
          {
            chats && chats.length > 0?
            chats.map(item =>
              item.chat.isFriend?<ConversationListItem
                ref={getOrCreateRef(item.chat.id)}
                key={item.chat.name}
                data={item.chat}
                onChatDelete={handleChatDelete}
                onSelectUser={handleSelectUser}
                handleLoadMoreHide={handleLoadMoreHideButton}
              />:""
            ):
            <div className="text-center" style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '10%' }} >
              No Results found.
            </div>
          }
          {chats && chats.length > 0 && chats.length > 5?<Button id="load_more" onClick={() => loadMore()} size="sm" className="text-center align-items-center">Load More</Button>:""}
        </Col>
        <div style={{display: 'none'}}>
                <Dialog ref={(el) => {
                    CustomDialog = el
                }}/>
        </div>
        <Modal
                show={showManageChatsModal} onHide={closeManageChatsModal}
                size="lg"
                backdrop="static"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header style={{padding: "2%"}}>
                    <Modal.Title id="contained-modal-title-vcenter">
                      <span style={{fontSize: "1.2rem"}}>Manage Conversations</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{paddingTop: '0px', paddingLeft: '0px', paddingRight: '0px'}}>
                  <Tabs
                    className="nav-justified"
                    id="manage_chats_tab"
                    activeKey={key}
                    onSelect={(k) => setKey(k)}>
                        <Tab eventKey="friends" title="Friends">
                            <div style={{ margin:'0px', padding: '0px', height: '400px', overflowY: 'scroll' }}>
                                {session_chat_requests && session_chat_requests.hasOwnProperty('friends') && session_chat_requests.friends.length > 0?session_chat_requests.friends.map((friend, index) => {
                                return (<Row style={{ padding: index == 0?'5% 0% 0% 0%':'0% 0% 0% 0%', margin: '0% 0% 1% 0%' }}>
                                    <Col xs={4} sm={{span:2, offset: 3}} md={{span:2, offset: 3}} lg={{span:2, offset: 3}} xl={{span:2, offset: 3}}>
                                    <img style={{margin: "0% 25%", width: "40px", height: "40px", borderRadius: "50%"}}
                                        src={friend.profile_picture ? friend.profile_picture : defaultImg}
                                        alt="profile_img"/>
                                    </Col>
                                    <Col xs={4} sm={3} md={3} lg={3} xl={3}>
                                        <p style={{ paddingTop: '5%' }}>{friend.username}</p>
                                    </Col>
                                    <Col xs={4} sm={4} md={4} lg={4} xl={4}>
                                    {friend.sent_chat_request?
                                    <OverlayTrigger
                                    key="bottom"
                                    placement="top"
                                    overlay={
                                        <Tooltip id="sent_chat_request_tooltip">
                                            <span>Chat Request Sent</span>
                                        </Tooltip>
                                    }>
                                    <FaCheckCircle className="sent_chat_request"/>
                                    </OverlayTrigger>
                                    :<OverlayTrigger
                                    key="bottom"
                                    placement="top"
                                    overlay={
                                        <Tooltip id="add_friend_tooltip">
                                            <span>Send Chat Request</span>
                                        </Tooltip>
                                    }>
                                    <FaComment className="add_chat" onClick={() => manageChats('add', friend, '')}/>
                                    </OverlayTrigger>}
                                    </Col>
                                </Row>)
                                }): <Row style={{padding: '0px', margin: '15%'}}>
                                        <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                                            <p className="text-center" style={{ fontSize: '1rem', fontWeight: 'bold' }}>No Friends yet.</p>
                                        </Col>
                                    </Row>}
                            </div>
                        </Tab>
                        <Tab eventKey="chats" title="Chats">
                            <div style={{ margin:'0px', padding: '0px', height: '400px', overflowY: 'scroll' }}>
                                {session_chat_requests && session_chat_requests.hasOwnProperty('chats') && session_chat_requests.chats.length > 0?session_chat_requests.chats.map((chat, index) => {
                                    return (<Row style={{ padding: index == 0?'5% 0% 0% 0%':'0% 0% 0% 0%', margin: '0% 0% 1% 0%' }}>
                                        <Col xs={4} sm={{span:2, offset: 3}} md={{span:2, offset: 3}} lg={{span:2, offset: 3}} xl={{span:2, offset: 3}}>
                                        <img style={{margin: "0% 25%", width: "40px", height: "40px", borderRadius: "50%"}}
                                            src={chat.profile_picture ? chat.profile_picture : defaultImg}
                                            alt="profile_img"/>
                                        </Col>
                                        <Col xs={4} sm={3} md={3} lg={2} xl={2}>
                                        <p style={{ paddingTop: '5%' }}>{chat.username}</p>
                                        </Col>
                                        <Col xs={4} sm={4} md={4} lg={4} xl={4}>
                                        <OverlayTrigger
                                        key="bottom"
                                        placement="top"
                                        overlay={
                                            <Tooltip id="remove_chat_tooltip">
                                                <span>Remove Chat</span>
                                            </Tooltip>
                                        }>
                                        <FaCommentSlash className="remove_chat" onClick={() => manageRemoveChatRequestRef('remove', chat)}/>
                                        </OverlayTrigger>
                                        </Col>
                                    </Row>)
                                    }): <Row style={{padding: '0px', margin: '15%'}}>
                                            <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                                                <p className="text-center" style={{ fontSize: '1rem', fontWeight: 'bold' }}>No Chats yet.</p>
                                            </Col>
                                        </Row>}
                            </div>
                        </Tab>
                        <Tab eventKey="chat_requests" title="Chat Requests">
                            <div style={{ margin:'0px', padding: '0px', height: '400px', overflowY: 'scroll' }}>
                                {session_chat_requests && session_chat_requests.hasOwnProperty('chat_requests') && session_chat_requests.chat_requests.length > 0?session_chat_requests.chat_requests.map((chatReq, index) => {
                                    return (<Row style={{ padding: index == 0?'5% 0% 0% 0%':'0% 0% 0% 0%', margin: '0% 0% 1% 0%' }}>
                                        <Col xs={4} sm={{span:2, offset: 3}} md={{span:2, offset: 3}} lg={{span:2, offset: 3}} xl={{span:2, offset: 3}}>
                                        <img style={{margin: "0% 25%", width: "40px", height: "40px", borderRadius: "50%"}}
                                            src={chatReq.profile_picture ? chatReq.profile_picture : defaultImg}
                                            alt="profile_img"/>
                                        </Col>
                                        <Col xs={4} sm={3} md={3} lg={2} xl={2}>
                                        <p style={{ paddingTop: '5%' }}>{chatReq.username}</p>
                                        </Col>
                                        <Col xs={4} sm={4} md={4} lg={4} xl={4}>
                                        <OverlayTrigger
                                        key="bottom"
                                        placement="top"
                                        overlay={
                                            <Tooltip id="accept_cr_tooltip">
                                                <span>Accept</span>
                                            </Tooltip>
                                        }>
                                        <FaCheck className="accept_chat_request" onClick={() => manageChats('accept', chatReq, '')}/>
                                        </OverlayTrigger>
                                        <OverlayTrigger
                                        key="bottom"
                                        placement="top"
                                        overlay={
                                            <Tooltip id="reject_cr_tooltip">
                                                <span>Reject</span>
                                            </Tooltip>
                                        }>
                                        <FaTimes className="reject_chat_request" onClick={() => manageChats('reject', chatReq, '')}/>
                                        </OverlayTrigger>
                                        </Col>
                                    </Row>)
                                    }): <Row style={{padding: '0px', margin: '15%'}}>
                                            <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                                                <p className="text-center" style={{ fontSize: '1rem', fontWeight: 'bold' }}>No Chat Requests yet.</p>
                                            </Col>
                                        </Row>}
                            </div>
                        </Tab>
                        <Tab eventKey="sent_chat_requests" title="Sent Chat Requests">
                            <div style={{ margin:'0px', padding: '0px', height: '400px', overflowY: 'scroll' }}>
                                {session_chat_requests && session_chat_requests.hasOwnProperty('sent_chat_requests') && session_chat_requests.sent_chat_requests.length > 0?session_chat_requests.sent_chat_requests.map((chatReq, index) => {
                                    return (<Row style={{ padding: index == 0?'5% 0% 0% 0%':'0% 0% 0% 0%', margin: '0% 0% 1% 0%' }}>
                                        <Col xs={4} sm={{span:2, offset: 3}} md={{span:2, offset: 3}} lg={{span:2, offset: 3}} xl={{span:2, offset: 3}}>
                                        <img style={{margin: "0% 25%", width: "40px", height: "40px", borderRadius: "50%"}}
                                            src={chatReq.profile_picture ? chatReq.profile_picture : defaultImg}
                                            alt="profile_img"/>
                                        </Col>
                                        <Col xs={4} sm={3} md={3} lg={2} xl={2}>
                                        <p style={{ paddingTop: '5%' }}>{chatReq.username}</p>
                                        </Col>
                                        <Col xs={4} sm={4} md={4} lg={4} xl={4}>
                                        <OverlayTrigger
                                        key="bottom"
                                        placement="top"
                                        overlay={
                                            <Tooltip id="cancel_cr_tooltip">
                                                <span>Cancel Chat Request</span>
                                            </Tooltip>
                                        }>
                                        <FaTimes className="cancel_chat_request" onClick={() => manageCancelChatRequestRef('cancel', chatReq)}/>
                                        </OverlayTrigger>
                                        </Col>
                                    </Row>)
                                    }): <Row style={{padding: '0px', margin: '15%'}}>
                                            <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                                                <p className="text-center" style={{ fontSize: '1rem', fontWeight: 'bold' }}>No Sent Chat Requests yet.</p>
                                            </Col>
                                        </Row>}
                                </div>
                        </Tab>
                    </Tabs>
                </Modal.Body>
                <Modal.Footer>
                    <Row style={{padding: "0px", margin: "0px"}}>
                        <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                            <Button className="float-right" size="sm" variant="danger" onClick={() => closeManageChatsModal()}>Close</Button>
                        </Col>
                    </Row>
                </Modal.Footer>
            </Modal>
      </Row>
    );
}

export default ConversationList