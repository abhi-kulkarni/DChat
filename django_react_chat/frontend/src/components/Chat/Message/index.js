import React from "react";
import moment from "moment";
import "./Message.css";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { FaTimes } from "react-icons/fa";

export default function Message(props) {
  const { data, isMine, startsSequence, endsSequence, showTimestamp } = props;

  const friendlyTimestamp = moment(data.timestamp).format("LLLL");
  return (
    <div
      className={[
        "message",
        `${isMine ? "mine" : ""}`,
        `${startsSequence ? "start" : ""}`,
        `${endsSequence ? "end" : ""}`,
      ].join(" ")}
    >
      {showTimestamp && <div className="timestamp">{friendlyTimestamp}</div>}
      {data.message_type === "text" ? (
        <div className="bubble-container">
          <div className="bubble" title={friendlyTimestamp}>
            {data.content}
          </div>
        </div>
      ) : (
        <div style={{ marginLeft: isMine?'calc(100% - 160px)':'0px', marginTop: "1%", padding: '5px 5px 0px 5px', background: '#f4f4f8', maxWidth: '100%', width: '160px' }}>
          <Row
            className="img_msg"
            title={friendlyTimestamp}
            style={{ padding: "0px", margin: "0px"}}
          >
             <Col className="img_div" xl={12} lg={12} md={12} sm={12} xs={12}>
              <img className="img-fluid square" src={JSON.parse(data.content)["image_url"]} />
            </Col>
            <Col style={{ padding: '0px', margin: '0px' }}>
            J
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}
