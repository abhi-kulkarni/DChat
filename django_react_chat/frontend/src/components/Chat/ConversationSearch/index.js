import React from 'react';
import './ConversationSearch.css';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'

export default function ConversationSearch() {
    return (
      <Row style={{ padding: '0px', margin: '0px' }}>
        <Col xs={12} sm={12} md={12} lg={12} xl={12}>
          <Form style={{marginTop: "20px"}}>
            <Form.Group controlId="searchConversations" className="conversation-search-input">
                <Form.Control autoComplete="off" name="searchConversations" type="text"
                              placeholder="Search Conversations"
                >
                </Form.Control>
              </Form.Group>
            </Form>
        </Col>
      </Row>
    );
}