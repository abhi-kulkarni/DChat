import React, { useState } from "react";
import moment from "moment";
import "./Message.css";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { FaTimes } from "react-icons/fa";
import PulseLoader from "react-spinners/PulseLoader";
import { css } from "@emotion/core";
import { useSelector } from "react-redux";
import { defaultProfilePictureImageDataUri } from "../../../constants";
import Viewer from 'react-viewer';

export default function Message(props) {

  const { data, isMine, startsSequence, endsSequence, showTimestamp } = props;
  const curr_user_data = useSelector(state => state.session.user_data);
  const [ Imgvisible, setImgVisible ] = useState(false);

  const typingLoaderCss = css`
        justify-content: center;
        align-items: center;
        padding-top: 1px;
        float: left;
        margin-top:-7px;
  `;
  const friendlyTimestamp = moment(data.timestamp).format("LLLL");

  const manageImage = (status) => {
    setImgVisible(status)
  }

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
      {
      data.message_type === 'group_changes'?
      (<div className="timestamp">
        {data.author_id != curr_user_data.id?(data.content).replace("You have ", data.author+ " has "): data.content}
        </div>):  
      data.message_type === 'loading'?
      (<div className="bubble-container">
          <div className="bubble loading_bubble" title={friendlyTimestamp}>
            <Row style={{ padding: '0px', margin: '0px' }}>
              <Col
                  className="typing_loader"
                  style={{ padding: '2px 0px 0px 6px' }}
                  xs={12}
                  sm={9}
                  md={9}
                  lg={10}
                  xl={10}
                >
                  <PulseLoader
                  css={typingLoaderCss}
                  size={5}
                  color={"#0A73F0"}
                  loading={true}
                  />
              </Col>
            </Row>
          </div>
        </div>):
        <div>
          <Row style={{ padding: '0px', margin: '1% 0% 0% 0.5%'}}>
            <Col xs={12} sm={12} md={12} lg={12} xl={12} style={{ padding: '0px', margin: '0px'}}>
              <div className="message-author" style={{ float: isMine?'right': 'left'}}>
              {isMine?"You":data.author}
            </div>
            </Col>
          </Row>
          {data.message_type === "text" ? 
          (
            <div className="bubble-container">
                <div className="bubble" title={friendlyTimestamp}>
                  {data.content}
                </div>
            </div>
          ) : 
          (
          <div className="img_msg_container" style={{ cursor: 'pointer', float: isMine?'right':'left', marginLeft: '0px', padding: data.content && JSON.parse(data.content) && JSON.parse(data.content).hasOwnProperty('msg') && JSON.parse(data.content)["msg"]?'5px 5px 0px 5px':'5px', background: '#f4f4f8', maxWidth: '100%', width: '310px' }}>
            <Row
              className="img_msg"
              title={friendlyTimestamp}
              style={{ padding: "0px", margin: "0px"}}
            >
              <Col className="img_div" xl={12} lg={12} md={12} sm={12} xs={12}>
              <div>
                <img onClick={() => manageImage(true)} className="img-fluid square" src={data.content && JSON.parse(data.content).hasOwnProperty('image_url')?JSON.parse(data.content)["image_url"]:""} />
                <Viewer
                  downloadable={true}
                  downloadInNewWindow={true}
                  attribute={false}
                  visible={Imgvisible}
                  onClose={() => manageImage(false) }
                  images={[{src: data.content && JSON.parse(data.content).hasOwnProperty('image_url') && JSON.parse(data.content) && JSON.parse(data.content)["image_url"]?JSON.parse(data.content)["image_url"]:"", alt: '', 
                  downloadUrl: data.content && JSON.parse(data.content).hasOwnProperty('image_url') && JSON.parse(data.content) && JSON.parse(data.content)["image_url"]?JSON.parse(data.content)["image_url"]:"" }]}
                /></div>
              </Col>
              {data.content && JSON.parse(data.content) && JSON.parse(data.content).hasOwnProperty('msg') && JSON.parse(data.content)["msg"]?<Col className="content_div">
                <div className="content_img">{JSON.parse(data.content)["msg"]}</div>
              </Col>:""}
            </Row>
          </div>
          )}
      </div>
      }
    </div>
  );
}
