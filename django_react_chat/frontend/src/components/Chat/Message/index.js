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
            style={{ overflow: "hidden", padding: "0px", margin: "0px", height:JSON.parse(data.content)["msg"]?"250px":"200px", width: "250px"}}
          >
            <Col
              style={{ padding: "0px", height:"200px", width: "250px" }}
              xl={12}
              lg={12}
              md={12}
              sm={12}
              xs={12}
            >
              <img className="img-fluid" style={{ paddingRight: "10px", paddingBottom: '10px', display: "block", height:"200px", width: "250px", maxWidth: "250px", maxHeight: "200px" }}
                src={JSON.parse(data.content)["image_url"]}
              />
            </Col>
            <Col
              style={{ padding: "0px", overflowY: "auto", width: "250px", maxWidth: "250px"  }}
              xl={12}
              lg={12}
              md={12}
              sm={12}
              xs={12}
            >
              <div style={{ overflow: "auto", float: "left", height: "25px", width: "100%", wordWrap: "break-word", whiteSpace: "initial" }}>
                <span style={{ padding: "0px 5px 0px 5px", fontWeight:"normal" }}>
                  {JSON.parse(data.content)["msg"]}
                </span>
              </div>
            </Col>
            </Row>
        </div>
      )}
    </div>
  );
}
