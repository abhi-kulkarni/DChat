import React, {
    useEffect,
    useState,
    useRef,
    forwardRef,
    useImperativeHandle,
} from "react";import { withRouter } from "react-router-dom";
import $ from "jquery";
import axiosInstance from "../components/axiosInstance";
import { useHistory } from "react-router-dom";
import { user_created_success, spinner_overlay, user_data } from "../redux";
import { useDispatch, useSelector } from "react-redux";
import "../index.css";
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Overlay from "react-bootstrap/Overlay";
import Tooltip from "react-bootstrap/Tooltip";
import { defaultGroupProfilePictureImageDataUri, defaultProfilePictureImageDataUri } from "../constants";
import {
    FaTimes,
    FaUserCog,
    FaCamera,
    FaCogs,
    FaLongArrowAltRight,
    FaUsers,
    FaLongArrowAltDown
} from "react-icons/fa";
import { Multiselect } from 'multiselect-react-dropdown';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Modal from "react-bootstrap/Modal";
import AtomSpinner from "../components/Atomspinner";
import Popover from "react-bootstrap/Popover";

const GroupForm = forwardRef((props, ref) => {

    const [groupFormDataErrors, setGroupFormDataErrors] = useState({"group_name": "", "group_description": "", "group_image": "", "group_members": []});
    const [groupFormData, setGroupFormData] = useState({"group_name": "", "group_description": "", "group_image": "", "group_members": []});
    const [crop, setCrop] = useState({ aspect: 16 / 9 });
    const [isDefaultGroupImg, setIsDefaultGroupImg] = useState(true);
    const [groupUserOptions, setGroupUserOptions] = useState([]);
    const [showAddGroupModal, setShowAddGroupModal] = useState(false);
    const curr_user_data = useSelector(state => state.session.user_data);
    const [groupErrMsg, setGroupErrMsg] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [participantList, setParticipantList] = useState([]);
    const [previousGroupData, setPreviousGroupData] = useState({});
    const [addedParticipantsList, setAddedParticipantsList] = useState([]);
    const [removedParticipantsList, setRemovedParticipantsList] = useState([]);
    const [admin, setAdmin] = useState([]);
    const [adminToolTip, setShowAdminToolTip] = useState(false);
    const [updatedAdminList, setUpdatedAdminList] = useState([]);
    const [previousAdminList, setPreviousAdminList] = useState([]);
    const [conversationUserDataDict, setConversationUserDataDict] = useState({})

    useImperativeHandle(ref, (data) => ({
        openAddGroupModalChild(data) {
            openAddGroupModal(data);
            
        },
        editGroupModalChild(data) {
            editGroupModal(data);
        }
    }));

    // ADMIN AND ADMIN LIST TO BE CHECKED 
    const openAddGroupModal = (data) => {
        setEditMode(false);
        setGroupUserOptions(data.user_options);
        setAdmin(data.admin_users);
        let curr_group_members = [{'name': data.curr_user.username, 'id': data.curr_user.id}];
        setGroupFormData({...groupFormData, group_members: curr_group_members})
        setPreviousGroupData(data);
        setPreviousAdminList(data.admin);
        setUpdatedAdminList(data.admin);
        setShowAddGroupModal(true);
        setConversationUserDataDict(data.conversation_user_data_dict);
    };

    const editGroupModal = (data) => {
        setEditMode(true);
        setIsAdmin(data.is_admin);
        setAdmin(data.admin_users);
        console.log(data);
        setGroupUserOptions(data.user_options);
        setConversationUserDataDict(data.conversation_user_data_dict);
        let temp = data.group_members;
        let temp_list = temp.map(item => {
            return item.id;
        })
        setParticipantList(temp_list);
        setPreviousGroupData(data);
        setPreviousAdminList(data.admin);
        setUpdatedAdminList(data.admin);
        setGroupFormData(data);
        setShowAddGroupModal(true);
    }

    const closeAddGroupModal = () => {
        setShowAddGroupModal(false);
        setGroupFormDataErrors({"group_name": "", "group_description": "", "group_image": "", "group_members": []});
        setGroupFormData({"group_name": "", "group_description": "", "group_image": "", "group_members": []});
        setIsDefaultGroupImg(true);
        setPreviousAdminList([]);
        setUpdatedAdminList([]);
        setAdmin([]);
        setAddedParticipantsList([]);
        setRemovedParticipantsList([]);
        setIsAdmin(false);
    };

    const groupFormValid = (groupFormDataErrors, groupFormData) => {
        let valid = true;
    
        // validate form errors being empty
        Object.values(groupFormDataErrors).forEach((val) => {
          val.length > 0 && (valid = false);
        });
    
        // validate the form was filled out
        Object.values(groupFormData).forEach((val) => {
          val === null && (valid = false);
        });
    
        return valid;
    };

    const handleSubmit = (e, edit) => {
        let valid = false;
        e.preventDefault();
        if (groupFormValid(groupFormDataErrors, groupFormData)) {
          valid = true;
        } else {
          valid = false;
          setGroupErrMsg("Some of your fields are empty or incorrect");
          setTimeout(function () {
            setGroupErrMsg("");
          }, 10000);
          console.error("FORM INVALID - DISPLAY ERROR MESSAGE");
        }
        if (valid) {
          closeAddGroupModal();
          if(edit){
            let temp = {};
            let temp_admin = {};
            temp['before'] = participantList;
            temp_admin['before'] = previousAdminList;
            let after_list = [...groupFormData.group_members].map(item => {
                return item.id;
            })
            temp['after'] = after_list;
            temp_admin['after'] = updatedAdminList;
            let data = {...groupFormData, admin: updatedAdminList, admin_change: temp_admin, is_admin: isAdmin, participant_change: temp, removed_participants: removedParticipantsList, added_participants: addedParticipantsList, previous_group_data: previousGroupData}; 
            props.handleEditGroup(data);
          }else{
            let data = {...groupFormData, admin: updatedAdminList}
            props.handleAddGroup(data);
          }
        }
    };

    const onSelectGroupUser = (selectedList, selectedItem) => {
        let curr_admin_data_list = [...previousGroupData.user_options_data];
        let curr_admin_data_list_ids = curr_admin_data_list.map(item => {
            return item.id;
        })
        if(curr_admin_data_list_ids.indexOf(selectedItem.id) < 0){
            let selected_user = conversationUserDataDict[selectedItem.id];
            selected_user['is_admin'] = false;
            curr_admin_data_list.push(selected_user);
        }
        setPreviousGroupData({...previousGroupData, user_options_data: curr_admin_data_list});
        setGroupFormData({...groupFormData, group_members: selectedList});
        validate("group_members", selectedList);
        let temp = addedParticipantsList?[...addedParticipantsList]:[];
        let removed_p_list = [...removedParticipantsList];
        removed_p_list = removed_p_list.filter(item => {
            return item != selectedItem.id;
        })
        setRemovedParticipantsList(removed_p_list);
        if(temp.indexOf(selectedItem.id) < 0){
            temp.push(parseInt(selectedItem.id));
        }
        setAddedParticipantsList(temp);
    }
    
    const onRemoveGroupUser = (selectedList, selectedItem) => {
        if(selectedItem.id === previousGroupData.curr_user.id){
            validate("removing_self");
        }else{
            let curr_admin_data_list = [...previousGroupData.user_options_data];
            let curr_admin_group_list = [...admin];
            let curr_updated_admin_group_list = [...updatedAdminList];
            curr_admin_group_list = curr_admin_group_list.filter(item => {
                return item.id !== selectedItem.id;
            });
            curr_updated_admin_group_list = curr_updated_admin_group_list.filter(item => {
                return item !== selectedItem.id;
            });
            curr_admin_data_list = curr_admin_data_list.filter(item => {
                return item.id !== selectedItem.id;
            });
            setUpdatedAdminList(curr_updated_admin_group_list);
            setAdmin(curr_admin_group_list);
            setPreviousGroupData({...previousGroupData, user_options_data: curr_admin_data_list});
            setGroupFormData({...groupFormData, group_members: selectedList});
            validate("group_members", selectedList);
            let temp = removedParticipantsList?[...removedParticipantsList]:[];
            let added_p_list = [...addedParticipantsList];
            added_p_list = added_p_list.filter(item => {
                return item != selectedItem.id;
            })
            setAddedParticipantsList(added_p_list);
            if(temp.indexOf(selectedItem.id) < 0){
                temp.push(parseInt(selectedItem.id));
            }
            setRemovedParticipantsList(temp);
        }
    }

    const handleGroupDataChange = (e) => {
        e.preventDefault();
        const { name, value } = e.target;
        validate(name, value);
    }

    const handleGroupImageChangeMethod = (e) => {
        let uploaded_img = e.target.files[0];
        setIsDefaultGroupImg(false);
        if(uploaded_img){
            var reader = new FileReader();
            var baseString;
            reader.onloadend = function () {
                baseString = reader.result;
                setGroupFormData({...groupFormData, group_image: baseString})
            };
            reader.readAsDataURL(uploaded_img);
        }
    }

    const manageAdminList = (data, action) => {
        let adminList = [...updatedAdminList];
        let currentAdminList = [...previousGroupData.user_options_data];
        let updatedAdminListData = [...admin];
        if(action === "add"){
            if(adminList.indexOf(data.id) < 0){
                adminList.push(data.id);
                currentAdminList = currentAdminList.map(item => {
                    if(item.id === data.id){
                        updatedAdminListData.push(item);
                        item['is_admin'] = true;
                    }
                    return item
                })
            }
        }else{
            let i = adminList.indexOf(data.id);
            if(i > -1){
                adminList.splice(i, 1);
                currentAdminList = currentAdminList.map(item => {
                    if(item.id === data.id){
                        item['is_admin'] = false;
                    }
                    return item
                })
            }
            updatedAdminListData = updatedAdminListData.filter(item => {
                return item.id !== data.id;
            })
        }
        let updated_group_data = {...previousGroupData, user_options_data: currentAdminList};
        setPreviousGroupData(updated_group_data);
        setAdmin(updatedAdminListData);
        setUpdatedAdminList(adminList);
    }

    const validate = (name, value) => {
        switch (name) {
            case "group_name":
                setGroupFormData({ ...groupFormData, group_name: value });
                if (value.length > 20) {
                    setGroupFormDataErrors({ ...groupFormDataErrors, group_name: "Group name should not be more than 20 characters." });
                }else if(value.length <= 0){
                    setGroupFormDataErrors({ ...groupFormDataErrors, group_name: "Group should have a name !" });
                }else{
                    setGroupFormDataErrors({ ...groupFormDataErrors, group_name: "" });
                } 
                break;
            case "group_description":
                setGroupFormData({ ...groupFormData, group_description: value });
                if (value.length > 150) {
                    setGroupFormDataErrors({ ...groupFormDataErrors, group_description: "Group name should not be more than 150 characters." });
                }else{
                    setGroupFormDataErrors({ ...groupFormDataErrors, group_description: "" });
                } 
                break;
            case "group_members":
                let selected_participants = value.map(item => {
                    return item.id;
                })
                setGroupFormData({ ...groupFormData, group_members: value });
                if (value.length > 20) {
                    setGroupFormDataErrors({ ...groupFormDataErrors, group_members: "You cannot add more than 20 members" });
                }else if(value.length < 1){
                    setGroupFormDataErrors({ ...groupFormDataErrors, group_members: "There should be atleast one member !" });
                }else if(selected_participants.indexOf(curr_user_data.id) < 0){
                    setGroupFormDataErrors({ ...groupFormDataErrors, group_members: "You cannot remove yourself. You will need to exit the group to do so." });
                }else{
                    setGroupFormDataErrors({ ...groupFormDataErrors, group_members: "" });
                } 
                break;
            case "removing_self":
                setGroupFormDataErrors({ ...groupFormDataErrors, group_members: "You cannot remove yourself. You will need to exit the group to do so." });
            default:
                break;
        }
    }

    const setDefaultGroupImg = () => {
        setIsDefaultGroupImg(true);
        setGroupFormData({...groupFormData, group_image: ""})
    }

    const adminPopover = (
        <Popover className="admin_popover" id="admin_popover">
          <Popover.Title className="admin_popover_title" as="h3">Manage Participants</Popover.Title>
          <Popover.Content className="admin_popover_content">
          {previousGroupData && previousGroupData.hasOwnProperty('user_options_data')?
          previousGroupData.user_options_data.map((item, index) => {
            return (<Row key={index} style={{ margin: '2px 0px', padding: '0px' }}>
                <Col xs={4} sm={4} md={4} lg={4} xl={4} style={{ margin: '0px', padding: '0px 0px 0px 10px' }}>
                <img
                    key={index+"admin_photo_manage"}
                    className="group_admin_photo_manage"
                    width="30"
                    height="30"
                    src={item.profile_picture?item.profile_picture:defaultProfilePictureImageDataUri}
                    alt="group_admin_photo_manage"
                    />
                </Col>
                <Col xs={4} sm={4} md={4} lg={4} xl={4} style={{ margin: '0px', padding: '4px 0px 0px 0px' }}>
                    <div>{item.username}</div>
                </Col>
                <Col xs={4} sm={4} md={4} lg={4} xl={4} style={{ margin: '0px', padding: '5px 0px 0px 0px' }}>
                    {item.is_admin?
                    item.id === item.curr_user_id?
                    (<div className="manage_admin_msg">You are an admin.</div>):
                    (<OverlayTrigger
                    key="remove_group_admin"
                    placement="top"
                    overlay={
                        <Tooltip id="remove_group_admin_tooltip">
                        <span>Dismiss as Group Admin</span>
                        </Tooltip>
                    }
                    >
                    <FaTimes onClick={() => manageAdminList(item, 'remove')} className="remove_group_admin"></FaTimes>
                    </OverlayTrigger>):
                    <OverlayTrigger
                    key="make_group_admin"
                    placement="top"
                    overlay={
                        <Tooltip id="make_group_admin_tooltip">
                        <span>Make Group Admin</span>
                        </Tooltip>
                    }
                    >
                    <FaUserCog onClick={() => manageAdminList(item, 'add')} className="make_group_admin"></FaUserCog>
                    </OverlayTrigger>}
                </Col>
            </Row>)
          }): ""}
          </Popover.Content>
        </Popover>
    );


    const manageToolTip = () => {
        let ele = document.getElementById("admin_popover");
        if(ele){
            setShowAdminToolTip(false);
        }else{
            setShowAdminToolTip(true);
        }   
    }

  return (
      <div>
        <Modal
                show={showAddGroupModal}
                onHide={closeAddGroupModal}
                size="md"
                backdrop="static"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header style={{ padding: "2%" }}>
                <Modal.Title id="contained-modal-title-vcenter">
  <span style={{ fontSize: "1.2rem" }}>{editMode?'Manage Group':'Add Group'}</span>
                </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ paddingTop: "0px", paddingLeft: "0px", paddingRight: "0px" }}>
                <Row style={{ padding: '0px', margin: '0px' }}>
                    <Col style={{ padding: '15px 0px 0px 0px', height: "80px", maxHeight: "80px" }} xs={{span: 4, offset: 5}} sm={{span: 4, offset: 5}} md={{span: 4, offset: 5}} lg={{span: 4, offset: 4}} xl={{span: 4, offset: 5}}>
                        {/* <ReactCrop src={defaultGroupProfilePictureImageDataUri} crop={crop} onChange={newCrop => setGroupImageCrop(newCrop)} /> */}
                        <img
                            width="75"
                            height="75"
                            className="group-photo"
                            src={groupFormData.group_image?groupFormData.group_image:defaultGroupProfilePictureImageDataUri}
                            alt="group_photo"
                            />
                            
                            {isDefaultGroupImg?<div className="group_image_upload">
                            <label htmlFor="upload_group_image">
                                <FaCamera style={{
                                    cursor: "pointer",
                                    position: "absolute",
                                    color:"gray",
                                    right: "0px",
                                    left: "58px",
                                    top: "12px",
                                }} />
                            </label>
                            <input
                                accept="image/*"
                                onChange={handleGroupImageChangeMethod}
                                id="upload_group_image"
                                type="file"
                            />
                            </div>:
                            <FaTimes style={{
                                    cursor: "pointer",
                                    position: "absolute",
                                    color:"red",
                                    right: "0px",
                                    left: "58px",
                                    top: "12px",
                                    border: "1px solid white",
                                    borderRadius:"50%"
                            }} onClick={() => setDefaultGroupImg()}/>}
                    </Col>
                    <Col xs={12} sm={12} md={12} lg={12} xl={12} style={{ padding: '0x' }}>
                    <Form>
                        <Form.Group controlId="group_name">
                            <Form.Label>Group Name</Form.Label>
                            <Form.Control
                                autoComplete="off"
                                name="group_name"
                                value={groupFormData.group_name}
                                onChange={e => handleGroupDataChange(e)}
                                type="text"
                                placeholder="Group Name"
                            />
                            <Row style={{ margin: "8px 0px 0px 0px", padding: "0px" }}>
                                <Col sm={12} xs={12} md={12} style={{ padding: "0px" }}>
                                    {groupFormDataErrors.group_name.length > 0 && (
                                        <span className="float-left errorMessage">
                                        {groupFormDataErrors.group_name}
                                        </span>
                                    )}
                                </Col>
                            </Row>
                        </Form.Group>
                            <Form.Group controlId="group_description">
                            <Form.Label>Group Description</Form.Label>
                            <Form.Control autoComplete="off" name="group_description" value={groupFormData.group_description} autoComplete="off"
                        onChange={e => handleGroupDataChange(e)} type="text" placeholder="Group Description" />
                                <Row style={{ margin: "8px 0px 0px 0px", padding: "0px" }}>
                                <Col sm={12} xs={12} md={12} style={{ padding: "0px" }}>
                                    {groupFormDataErrors.group_description.length > 0 && (
                                        <span className="float-left errorMessage">
                                        {groupFormDataErrors.group_description}
                                        </span>
                                    )}
                                </Col>
                            </Row>
                            </Form.Group>
                            <Form.Group controlId="admin">
                                <Form.Label className="manage_admin_label"> 
                                    <Row style={{ margin : '0px', padding: '0px'}}>
                                        <Col xs={4} sm={4} md={4} lg={4} xl={4} style={{ margin : '0px', padding: '0px'}}>
                                            <div>Manage Participants</div>
                                        </Col>
                                        {editMode?
                                        isAdmin?
                                        (<Col xs={8} sm={8} md={8} lg={8} xl={8} style={{ margin : '0px', padding: '3px 0px 0px 0px'}}>
                                            {adminToolTip?
                                            <OverlayTrigger rootClose={true} trigger="click" placement="right" overlay={adminPopover}>
                                                <FaCogs onClick={() => manageToolTip()} className="group_admin"></FaCogs>
                                            </OverlayTrigger>:<OverlayTrigger
                                                key="group_admin_logo"
                                                placement="top"
                                                overlay={
                                                    <Tooltip id="group_admin_logo_tooltip">
                                                    <span>Manage Participants</span>
                                                    </Tooltip>
                                                }
                                                >
                                            <FaCogs onClick={() => manageToolTip()} className="group_admin"></FaCogs>
                                            </OverlayTrigger>}
                                        </Col>):("")
                                        :
                                        (<Col xs={2} sm={2} md={2} lg={2} xl={2} style={{ margin : '0px', padding: '3px 0px 0px 0px'}}>
                                            {adminToolTip?
                                            <OverlayTrigger rootClose={true} trigger="click" placement="right" overlay={adminPopover}>
                                                <FaCogs onClick={() => manageToolTip()} className="group_admin"></FaCogs>
                                            </OverlayTrigger>:<OverlayTrigger
                                                key="group_admin_logo"
                                                placement="top"
                                                overlay={
                                                    <Tooltip id="group_admin_logo_tooltip">
                                                    <span>Manage Admin</span>
                                                    </Tooltip>
                                                }
                                                >
                                            <FaCogs onClick={() => manageToolTip()} className="group_admin"></FaCogs>
                                            </OverlayTrigger>}
                                        </Col>)}
                                    </Row>
                                </Form.Label>
                                <Row style={{ padding: '0px', margin :'0px'}}>
                                    <Col style={{ padding: '0px', margin: '0px' }} xs={2} sm={2} md={2} lg={2} xl={2}>
                                        <div className="admin_list_label">{admin.length > 1?"Group Admins":"Group Admin"}</div>
                                    </Col>
                                    <Col style={{ padding: '1px 0px 0px 6px', margin: '0px' }} xs={1} sm={1} md={1} lg={1} xl={1}>
                                        <FaLongArrowAltRight className="admin_list_label_logo"></FaLongArrowAltRight>
                                    </Col>
                                    <Col style={{ padding: '0px 0px 0px 5px', margin :'0px', textAlign: 'left' }} xs={9} sm={9} md={9} lg={9} xl={9}>
                                        {admin.map((item, index) => {
                                                return (
                                                <OverlayTrigger
                                                key={index}
                                                placement="top"
                                                overlay={
                                                    <Tooltip id="group_admin_tooltip">
                                                    <span>{item.username}</span>
                                                    </Tooltip>
                                                }
                                                ><img
                                                key={index+"admin_photo"}
                                                className="group_admin_photo"
                                                width="30"
                                                height="30"
                                                src={item.profile_picture?item.profile_picture:defaultProfilePictureImageDataUri}
                                                alt="group_admin_photo"
                                                /></OverlayTrigger>)
                                        })}
                                    </Col>
                                </Row>
                            </Form.Group>
                            <Form.Group controlId="add_remove_members">
                            <Form.Label>{editMode?!isAdmin?"Members":"Manage Members":"Manage Members"}</Form.Label>
                            <Multiselect
                                disable={editMode?!isAdmin:false}
                                placeholder={editMode?!isAdmin?"":"Add Members":"Add Members"}
                                options={groupUserOptions} 
                                onSelect={onSelectGroupUser} 
                                onRemove={onRemoveGroupUser}
                                selectedValues={groupFormData.group_members}
                                displayValue="name"
                                style={{
                                    chips: { 
                                        backgroundColor: '#0879FA'
                                    },
                                }}
                            />
                            <Row style={{ margin: "8px 0px 0px 0px", padding: "0px" }}>
                                <Col sm={12} xs={12} md={12} style={{ padding: "0px" }}>
                                    {groupFormDataErrors.group_members.length > 0 && (
                                        <span className="float-left errorMessage">
                                        {groupFormDataErrors.group_members}
                                    </span>
                                    )}
                                </Col>
                            </Row>
                            </Form.Group>
                        </Form>
                    </Col>
                </Row>
                {groupErrMsg? (
                <Row style={{ margin: "8px 0px 2px 0px", padding: "0px" }}>
                <Col style={{ width: "100%" }}>
                    <div
                    style={{ display: "table", margin: "0 auto" }}
                    className="form_error_message"
                    >
                    {groupErrMsg}
                    </div>
                </Col>
                </Row>): ""}
                </Modal.Body>
                <Modal.Footer>
                <Row style={{ padding: "0px", margin: "0px" }}>
                    <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Button
                        style={{ marginLeft: "5px" }}
                        className="float-right"
                        size="sm"
                        variant="danger"
                        onClick={() => closeAddGroupModal()}
                    >
                        Close
                    </Button>
                    <Button
                        className="float-right"
                        size="sm"
                        variant="success"
                        onClick={(e) => handleSubmit(e, editMode)}
                    >
                        {editMode?"Save":"Add"}
                    </Button>
                    </Col>
                </Row>
                </Modal.Footer>
            </Modal>    
    </div>);
})

export default GroupForm;
