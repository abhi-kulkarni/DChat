import React, {useEffect, useState, useRef, useImperativeHandle, forwardRef} from 'react';
import shave from 'shave';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import $ from 'jquery'
import './ConversationListItem.css';
import Button from 'react-bootstrap/Button'

const ConversationListItem = forwardRef((props, ref) => {{

  const mounted = useRef();
  let selectedUserRef = useRef(null);
  const [isSelected, setIsSelected] = useState({});

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

  useImperativeHandle(ref, () => ({
    loadMoreConversations(){
      loadMore();
    }
  }));

  const handleClickOutside = (e) => {
    if (selectedUserRef && e.target && selectedUserRef.current && !selectedUserRef.current.contains(e.target)) {
      let user_elements = document.getElementsByClassName("div_hover");
      for (var i = 0; i < user_elements.length; i++) {
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
    setIsSelected(user_elements[id])
    for (var i = 0; i < user_elements.length; i++) {
      if(i == id){
        user_elements[i].style.backgroundColor = '#ececec';
      }else{
        user_elements[i].style.backgroundColor = 'white';
      }
    }
    props.onSelectUser(props.data)
  }

    const { photo, name, text, id } = props.data;

    return (
      <Row ref={selectedUserRef} className="div_hover" onClick={onSelectUser} style={{ paddingRight: '0%', paddingLeft: '0%', margin: '4% 0% 4% 0%', cursor: 'pointer', borderTopRightRadius: '25px', borderBottomRightRadius: '25px'}}>
        <Col style={{ paddingRight: '0%' }} xs={12} sm={12} md={12} lg={12} xl={12}>
          <Row style={{ padding: '2% 0% 2% 0%', margin: '0px' }}>
            <Col xs={6} sm={3} md={3} lg={3} xl={3}>
                <img width="45"
                    height="45" className="img-fluid conversation-photo" src={photo} alt="conversation" />
                <div style={{position: 'absolute', backgroundColor: '#2dc12d', borderRadius: '100%', width: '0.59rem', height: '0.59rem', right: '18%', top: '0%', border: '1px solid darkgrey'}}></div>
            </Col>
            <Col style={{ paddingTop: '1%', paddingLeft: '2%' }} xs={6} sm={9} md={9} lg={9} xl={9}>
              <h1 className="conversation-title">{ name }</h1>
              <p className="conversation-snippet">{ text }</p>
            </Col>
          </Row>
        </Col>
      </Row>
    )

}})

export default ConversationListItem