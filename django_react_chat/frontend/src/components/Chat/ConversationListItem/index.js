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

const ConversationListItem = forwardRef((props, ref) => {{

  const location = useLocation();
  const mounted = useRef();
  const history = useHistory();
  let selectedUserRef = useRef(null);
  const [isSelected, setIsSelected] = useState({});

  const { photo, name, text, id, chat_id } = props.data;

  useEffect(() => {
    if (!mounted.current) {
      shave('.conversation-snippet', 20); 
      $(".div_hover").slice(0, 5).show();
      // document.addEventListener('mousedown', handleClickOutside, false);
      mounted.current = true;
    } else {
      // Component Did update Logic
    }
  });

  useEffect(() => {
    if(location.state){
      setSelectedDiv(location.state.chat_id);
    }
  }, [location.pathname])

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
    
    let user_elements = document.getElementsByClassName("div_hover");
    let curr_id = location.state?location.state.chat_id:chat_id
    for (var i = 0; i < user_elements.length; i++) {
      if(user_elements[i].id == curr_id){
        setIsSelected(user_elements[i]);
        user_elements[i].style.backgroundColor = '#ececec';
      }else{
        user_elements[i].style.backgroundColor = 'white';
      }
    }
    props.data['name'] = props.data['name'].charAt(0).toUpperCase() + props.data['name'].slice(1);
    props.onSelectUser(props.data)
  }

  const handleChatDelete = () => {
    props.onChatDelete(props.data)
  }

    return (
      <Row id={chat_id} ref={selectedUserRef} className="div_hover" style={{ paddingRight: '0%', paddingLeft: '0%', margin: '4% 0% 4% 0%', cursor: 'pointer', borderTopRightRadius: '25px', borderBottomRightRadius: '25px'}}>
        <Col style={{ paddingRight: '0%' }} xs={12} sm={12} md={12} lg={12} xl={12}>
          <Row style={{ padding: '2% 0% 2% 0%', margin: '0px' }}>
            <Col onClick={onSelectUser} xs={5} sm={3} md={3} lg={3} xl={3}>
                <img width="45"
                    height="45" className="img-fluid conversation-photo" src={photo?photo:defaultImg} alt="conversation" />
                <div style={{position: 'absolute', backgroundColor: '#2dc12d', borderRadius: '100%', width: '0.59rem', height: '0.59rem', right: '18%', top: '0%', border: '1px solid darkgrey'}}></div>
            </Col>
            <Col onClick={onSelectUser} style={{ paddingTop: '1%', paddingLeft: '2%', paddingRight: '0%' }} xs={5} sm={8} md={8} lg={8} xl={8}>
              <h1 className="conversation-title">{ name }</h1>
              <p className="conversation-snippet">{ text }</p>
            </Col>
            <Col style={{ paddingTop: '1%', paddingLeft: '0%' }} xs={1} sm={1} md={1} lg={1} xl={1}>
              <OverlayTrigger
                        key="bottom"
                        placement="top"
                        overlay={
                            <Tooltip id="remove_chat_tooltip">
                                <span>Remove Chat</span>
                            </Tooltip>
                        }
                    ><FaCommentSlash onClick={handleChatDelete} style={{ color: '#EB3E37' }} />
              </OverlayTrigger>
            </Col>
          </Row>
        </Col>
      </Row>
    )

}})

export default ConversationListItem