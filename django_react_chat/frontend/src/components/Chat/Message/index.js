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
        <div className="bubble-container" style={{ margin: "1% 0%" }}>
          <Row
            className="bubble img_msg"
            title={friendlyTimestamp}
            style={{ padding: "0px", margin: "0px" }}
          >
            <Col
              style={{ padding: "0px" }}
              xl={12}
              lg={12}
              md={12}
              sm={12}
              xs={12}
            >
              <img
                style={{ float: isMine ? "right" : "left", width: "100%" }}
                className="img-fluid"
                src={JSON.parse(data.content)["image_url"]}
                height="200"
                width="200"
              />
            </Col>
            <Col
              style={{ padding: "0px" }}
              xl={12}
              lg={12}
              md={12}
              sm={12}
              xs={12}
            >
              <div style={{ float: "left" }}>
                {JSON.parse(data.content)["msg"]}
              </div>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}
