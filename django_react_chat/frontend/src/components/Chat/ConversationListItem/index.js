import React, {useEffect} from 'react';
import shave from 'shave';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import './ConversationListItem.css';

export default function ConversationListItem(props) {
  useEffect(() => {
    shave('.conversation-snippet', 20); 
  })

    const { photo, name, text } = props.data;

    return (
      <Row style={{ paddingRight: '0%', paddingLeft: '0%', margin: '4% 0% 4% 0%', cursor: 'pointer' }}>
        <Col style={{ paddingRight: '0%' }} xs={12} sm={12} md={12} lg={12} xl={12}>
          <Row style={{ padding: '0px', margin: '0px' }}>
            <Col xs={6} sm={3} md={3} lg={3} xl={3}>
                <img width="45"
                    height="45" className="img-fluid conversation-photo" src={photo} alt="conversation" />
            </Col>
            <Col style={{ paddingTop: '1%', paddingLeft: '2%' }} xs={6} sm={9} md={9} lg={9} xl={9}>
              <h1 className="conversation-title">{ name }</h1>
              <p className="conversation-snippet">{ text }</p>
            </Col>
          </Row>
        </Col>
      </Row>
    );
}