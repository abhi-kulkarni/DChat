import React, {useEffect, useState, useRef, useImperativeHandle, forwardRef} from 'react';
import shave from 'shave';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import $ from 'jquery'
import './ConversationListItem.css';
import Button from 'react-bootstrap/Button'
import { FaComment, FaCommentSlash } from 'react-icons/fa';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import defaultImg from '../../../static/images/default_profile_picture.jpg'
import {useHistory, useLocation} from 'react-router-dom'
import WebSocketInstance from '../../../websocket'
import {useDispatch, useSelector} from "react-redux";
import axiosInstance from '../../axiosInstance'
import {chat_messages, ws_list, has_read, last_seen_time} from '../../../redux'
import Moment from 'react-moment';
import 'moment-timezone';
import CustomBadge from '../../CustomBadge/badge';

const ConversationListItem = forwardRef((props, ref) => {{

  const location = useLocation();
  const dispatch = useDispatch();
  const mounted = useRef();
  const history = useHistory();
  let selectedUserRef = useRef(null);
  const [isSelected, setIsSelected] = useState({});
  const curr_user_data = useSelector(state => state.session.user_data);
  const session_has_read = useSelector(state => state.session.has_read);
  const [recent_msg, setRecentMsg] = useState('');
  const chat_status = useSelector(state => state.session.chat_status);
  const session_chat_messages = useSelector(state => state.session.chat_messages);
  const [wsList, setWsList] = useState([]);
  const session_last_seen = useSelector(state => state.session.last_seen);
  const { photo, name, text, id, chat_id, user_id, author_id, last_seen } = props.data;
  const [hasRead, setHasRead] = useState(false);
  const [author, setAuthor] = useState('');
  const [lastSeenData, setLastSeenData] = useState('');
  const [recentMsgCount, setRecentMsgCount] = useState({});

  useEffect(() => {
    if (!mounted.current) {
      !lastSeenData?shave('.conversation-snippet', 20):''; 
      $(".div_hover").slice(0, 5).show();
      // document.addEventListener('mousedown', handleClickOutside, false);
      mounted.current = true;
    } else {
      // console.log('RE RENDER')
        if(session_last_seen && session_last_seen.hasOwnProperty(chat_id) && session_last_seen[chat_id].hasOwnProperty(curr_user_data.id)){
          setLastSeenData(session_last_seen[chat_id][user_id])
        }
      }
  });

  const initializeChat = (chatId) => {
    waitForSocketConnection(() => {
      WebSocketInstance.addCallbacks(
        (data) => setMessagesCallback(data), 
        (data) => addMessageCallback(data)
      )
      WebSocketInstance.fetchMessages(
        curr_user_data.id, chatId
      );
    });
    dispatch(ws_list(props.data.chat_id))
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

  useEffect(() => {
      console.log('1');
      last_seen && typeof(last_seen) === 'string'?setLastSeenData(last_seen): '';
      if(session_chat_messages && session_chat_messages.hasOwnProperty('recent_msg_data') && session_chat_messages['recent_msg_data']){
        let recent_msg_data = session_chat_messages['recent_msg_data'].hasOwnProperty(chat_id)?session_chat_messages['recent_msg_data'][chat_id]['content']:'';
        if(recent_msg_data){
          if(session_chat_messages['recent_msg_data'][chat_id].author_id === curr_user_data.id){
            recent_msg_data = 'You: ' + recent_msg_data
          }
          let temp = {};
          temp[chat_id] = false;
          setHasRead(temp);
          setRecentMsg(recent_msg_data);          
        }else{
          let msg = text;
          if(author_id === curr_user_data.id){
            msg = 'You: '+ text;
          }
          setRecentMsg(msg);
        }
        setMessageCount();
      }
  }, [session_chat_messages]);

  useEffect(() => {
    if(location.state){
      setSelectedDiv(location.state.chat_id);
    }
  }, [location.pathname]);

  useEffect(() => {
    if(session_last_seen && session_last_seen.hasOwnProperty(chat_id)){
      setLastSeenData(session_last_seen[chat_id][curr_user_data.id])
    }
  }, [session_last_seen]);

  useEffect(() => {
    session_has_read && session_has_read.hasOwnProperty(chat_id) && session_has_read[chat_id].hasOwnProperty(curr_user_data.id)?console.log(session_has_read[chat_id][curr_user_data.id]['has_read']):'';
  }, [session_has_read]);


  const setMessageCount = () => {
    let messages = session_chat_messages && session_chat_messages.hasOwnProperty('messages')?session_chat_messages['messages']:[];
    let count_dict = {};
    let last_seen_time = session_last_seen && session_last_seen.hasOwnProperty(chat_id) && session_last_seen[chat_id].hasOwnProperty(curr_user_data.id)?new Date(session_last_seen[chat_id][curr_user_data.id]['last_seen']):last_seen?new Date(last_seen):'';
    messages.map(item => {
        if(item.author_id !== curr_user_data.id){
          let uid = item.chatId;
          let message_time = new Date(item.timestamp);
          if(last_seen_time && message_time > last_seen_time){
              if(count_dict.hasOwnProperty(uid)){
                count_dict[uid]['count'] += 1
              }else{
                count_dict[uid] = {'sender': item.author_id, 'count': 1}
              }
          }
        } 
    });
    if(count_dict && count_dict.hasOwnProperty(chat_id) && count_dict[chat_id]['sender'] != curr_user_data.id){
      let temp = {};
      temp[chat_id] = count_dict[chat_id]['count'];
      setRecentMsgCount(temp); 
    }
  }

  const addMessageCallback = (message) => {
    dispatch(chat_messages(message, "new_message"));
  }

  const setMessagesCallback = (messages) => {
    dispatch(chat_messages(messages, "fetch_messages"));
  }

  const handleClickOutside = (e) => {
    if (selectedUserRef && e.target && selectedUserRef.current && !selectedUserRef.current.contains(e.target)) {
      let user_elements = document.getElementsByClassName("div_hover");
      for (var i = 0; i < user_elements.length; i++) {
          user_elements[i].style.backgroundColor = 'white';
        }
      }
  }

  const useImperativeHandle = (ref, (data) => ({
    loadMoreConversations(){
      loadMore();
    }
  }));

  const setSelectedDiv = (data) => {
    let user_elements = document.getElementsByClassName("div_hover");
    for (var i = 0; i < user_elements.length; i++) {
      if(user_elements[i].id == data){
        setIsSelected(user_elements[i]);
        user_elements[i].style.backgroundColor = '#ececec';
      }else{
        user_elements[i].style.backgroundColor = 'white';
      }
    }
  }

  const loadMore = () => {
    $(".div_hover:hidden").slice(0, 6).slideDown();
    if($(".div_hover:hidden").length == 0) {
      props.handleLoadMoreHide();
    }
  }

  const onSelectUser = () => {
    
    console.log('2');
    console.log(new Date());
    let user_elements = document.getElementsByClassName("div_hover");
    let curr_id = location.state?location.state.chat_id:chat_id;
    let last_seen_dict = {};
    let has_read_dict = {};
    last_seen_dict['chat_id'] = curr_id;
    last_seen_dict['last_seen'] = new Date();
    last_seen_dict['recipient_id'] = user_id;
    last_seen_dict['user_id'] = curr_user_data.id;
    has_read_dict['chat_id'] = curr_id;
    has_read_dict['has_read'] = true;
    has_read_dict['recipient_id'] = user_id;
    has_read_dict['user_id'] = curr_user_data.id;
    // dispatch(last_seen_time(last_seen_dict))
    // dispatch(has_read(has_read_dict))
    for (var i = 0; i < user_elements.length; i++) {
      if(user_elements[i].id == curr_id){
        setIsSelected(user_elements[i]);
        user_elements[i].style.backgroundColor = '#ececec';
      }else{
        user_elements[i].style.backgroundColor = 'white';
      }
    }
    props.data['name'] = props.data['name'].charAt(0).toUpperCase() + props.data['name'].slice(1);
    props.data['last_seen'] = last_seen_dict;
    props.data['has_read'] = has_read_dict
    props.onSelectUser(props.data)
  }

  const handleChatDelete = () => {
    props.onChatDelete(props.data)
  }

    return (
      <Row id={chat_id} ref={selectedUserRef} className="div_hover" style={{ paddingRight: '0%', paddingLeft: '0%', margin: '4% 0% 4% 0%', cursor: 'pointer', borderTopRightRadius: '25px', borderBottomRightRadius: '25px'}}>
        <Col style={{ paddingRight: '0%' }} xs={12} sm={12} md={12} lg={12} xl={12}>
          <Row style={{ padding: '2% 0% 2% 0%', margin: '0px' }}>
            <Col onClick={onSelectUser} xs={4} sm={3} md={3} lg={3} xl={3}>
                <img width="45"
                    height="45" className="img-fluid conversation-photo" src={photo?photo:defaultImg} alt="conversation" />
                <div style={{position: 'absolute', backgroundColor: chat_status && chat_status.hasOwnProperty(user_id) && chat_status[user_id] === 'online'?'#58A847':'#efefef', borderRadius: '100%', width: '0.59rem', height: '0.59rem', right: '18%', top: '0%', border: '1px solid darkgrey'}}></div>
            </Col>
            <Col onClick={onSelectUser} style={{ paddingTop: '1%', paddingLeft: '2%', paddingRight: '0%' }} xs={4} sm={7} md={7} lg={7} xl={7}>
              <Row style={{ padding: '0px', margin: '0px' }}>
                <Col style={{ paddingLeft: '0px' }} xs={{ span: 12 }} sm={{ span: 7 }} md={{ span: 7 }} lg={{ span: 7 }} xl={{ span: 7 }}>
                  <h1 className='conversation-title'>{ name }</h1>
                  <p className="conversation-snippet"> { recent_msg?recent_msg : '' } </p>
                </Col>
                <Col style={{ paddingLeft: '0px', paddingRight: '0px' }} xs={12} sm={5} md={5} lg={5} xl={5}>
                  <p style={{ float: 'left', marginBottom: '0px', paddingTop: '1%', paddingLeft: '0%', fontSize: '0.5rem', color: '#0578FA' }}>{lastSeenData? <Moment fromNow>{lastSeenData}</Moment>:last_seen && typeof(last_seen) === 'string'?<Moment fromNow>{last_seen}</Moment>:''}</p>
                </Col>
              </Row>
            </Col>
            <Col style={{ paddingTop: '1%', paddingLeft: '0%' }} xs={4} sm={2} md={2} lg={2} xl={2}>
            <CustomBadge message_count={true} count={recentMsgCount[chat_id]}/>
              {/* <OverlayTrigger
                        key="bottom"
                        placement="top"
                        overlay={
                            <Tooltip id="remove_chat_tooltip">
                                <span>Remove Chat</span>
                            </Tooltip>
                        }
                    ><FaCommentSlash onClick={handleChatDelete} style={{ color: '#EB3E37' }} />
              </OverlayTrigger> */}
            </Col>
          </Row>
        </Col>
      </Row>
    )

}})

export default ConversationListItem