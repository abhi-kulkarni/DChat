import React, {
    useEffect,
    useState,
    useRef,
    forwardRef,
    useImperativeHandle,
} from "react";
import { withRouter } from "react-router-dom";
import axiosInstance from "../components/axiosInstance";
import { useHistory, useLocation } from "react-router-dom";
import { notifications, manage_request_count, is_typing, conversation_messages, user_created_success, chat_status, spinner_overlay, conversation_delete, user_data, conversation_modal_data, current_selected_conversation } from "../redux";
import { useDispatch, useSelector } from "react-redux";
import "../index.css";
import AtomSpinner from "../components/Atomspinner";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Toolbar from "../components/Chat/Toolbar";
import Message from "../components/Chat/Message";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { Orientation } from "../components/Orientation";
import PulseLoader from "react-spinners/PulseLoader";
import ConversationSearch from "../components/Chat/ConversationSearch"
import Popover from "react-bootstrap/Popover";
import CustomBadge from "../components/CustomBadge/badge.js"
import {isMobile, isIOS, isMobileOnly, isTablet} from 'react-device-detect';
import Picker from "emoji-picker-react";
import Viewer from 'react-viewer';
import {
    FaTrashAlt,
    FaPaperPlane,
    FaEllipsisV,
    FaSignOutAlt,
    FaArrowLeft,
    FaPen,
    FaTimes,
    FaSmile,
    FaSync,
    FaCamera,
    FaUsers,
    FaCogs,
    FaInfoCircle,
    FaRegPaperPlane,
    FaTasks,
    FaMicrophone,
    FaTrash,
    FaCheck,
    FaCheckCircle,
    FaComment,
    FaCommentSlash,
    FaUserTimes,
    FaUserCheck,
    FaCog,
    FaEdit,
    FaArrowDown,
    FaDivide
} from "react-icons/fa";
import WebSocketInstance from "../websocket";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Overlay from "react-bootstrap/Overlay";
import Tooltip from "react-bootstrap/Tooltip";
import Dialog from "react-bootstrap-dialog";
import $ from "jquery";
import { css } from "@emotion/core";
import { defaultProfilePictureImageDataUri } from "../constants";
import { defaultGroupProfilePictureImageDataUri } from "../constants";
import shave from "shave";
import Moment from "react-moment";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import GroupForm from "../components/GroupForm"
import moment from 'moment';

const CustomMessenger = forwardRef((props, ref) => {

    const override = css`
        display: flex;
        justify-content: center;
        align-items: center;
        height: 55vh;
    `;

    const typingLoaderCss = css`
        justify-content: center;
        align-items: center;
        padding-top: 1px;
        float: left;
        margin-top:-7px;
  `;

    const uploadImgLoadingCss = css`
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
    `;

    const conversationLoadingCss = css`
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        padding-top: 20%;
    `;  

    const history = useHistory();
    const dispatch = useDispatch();
    const location = useLocation();
    let CustomDialog = useRef(null);
    const groupFormRef = useRef(null);
    const [loaderActive, setLoaderActive] = useState(false);
    const session_is_typing = useSelector((state) => state.session.is_typing);
    const [conversationReqLastSeen, setConversationReqLastSeen] = useState("");
    const session_conversation_modal_data = useSelector(state => state.session.conversation_modal_data);
    const session_messages = useSelector(state => state.session.messages);
    const [showManageConversationsModal, setShowManageConversationsModal] = useState(false);
    const [showAddGroupModal, setShowAddGroupModal] = useState(false);
    const [selectedConversationMenu, setSelectedConversationMenu] = useState({});
    const [currConversation, setCurrConversation] = useState({});
    const [groupMembers, setGroupMembers] = useState([]);
    const [removedChatData, setRemovedChatData] = useState("");
    const [isConversationFriend, setIsConversationFriend] = useState({});
    const session_chat_status = useSelector(state => state.session.chat_status);
    const session_current_selected_conversation_id = useSelector(state => state.session.current_selected_conversation_id);
    const [currConversationUserData, setCurrConversationUserData] = useState({});
    let messagesEnd = useRef(null);
    let messagesStart = useRef(null);
    let emojiInputRef = useRef(null);
    const [editGroupModal, setEditGroupModal] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isTypingMsg, setIsTypingMsg] = useState({});
    const [chosenEmoji, setChosenEmoji] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState({});
    const [orientation, setOrientation] = useState("default");
    const [chatCssChange, setChatCssChange] = useState(false);
    const store_overlay = useSelector(state => state.session.spinner_overlay);
    const curr_user_data = useSelector(state => state.session.user_data);
    const session_current_selected_conversation = useSelector(state => state.session.current_selected_conversation);
    const session_conversation_delete_dict = useSelector(state => state.session.conversation_delete);
    const session_conversation_exit_dict = useSelector(state => state.session.conversation_exit);
    const session_conversation_removed_dict = useSelector(state => state.session.conversation_removed);
    const session_manage_requests_count = useSelector(state => state.session.manage_request_count);
    const [user, setUser] = useState({});
    const [inputMsg, setInputMsg] = useState("");
    const [uploadImgSrc, setUploadImgSrc] = useState("");
    const [imgExt, setImgExt] = useState("");
    const [uploadedFileName, setUploadedFileName] = useState("");
    const [uploadedImage, setUploadedImage] = useState("");
    const [uploadingImg, setUploadingImg] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);
    const [windowHeight, setWindowHeight] = useState(0);
    const [showConversationMenu, setShowConversationMenu] = useState(true);
    const [conversationMenuTarget, setConversationMenuTarget] = useState({});
    const [refs, setRefs] = useState({});
    const [conversationReqNotificationCount, setConversationReqNotificationCount] = useState(0)
    const [customClass, setCustomClass] = useState("msg_lst_content");
    const [conversationRequestsModalData, setConversationRequestModalData] = useState({'modal_friends':[], 'modal_conversations': [], 'modal_conversation_requests': [], 'modal_sent_conversation_requests': []});
    const [key, setKey] = useState("friends");
    const [conversationLoading, setConversationLoading] = useState(false);
    const [conversationRequestModalErrors, setConversationModalErrors] = useState({});
    const [allConversations, setAllConversations] = useState([]);
    const [searchConversations, setSearchConversations] = useState([]);
    const session_is_refreshed = useSelector(state => state.session.is_refreshed);
    const [conversationUserDict, setConversationUserDict] = useState({});
    const mounted = useRef(null);
    const [conversationStatus, setConversationStatus] = useState({});
    const [isInfoDataOpened, setIsInfoDataOpened] = useState(false);
    const [allGroups, setAllGroups] = useState([]);
    const [currentGroupData, setCurrentGroupData] = useState({});
    const [groupEditedSocketChange, setGroupEditedSocketChange] = useState({});
    const [conversationStatusMsg, setConversationStatusMsg] = useState({}); 
    const [isRemoved, setIsRemoved] = useState({});
    const [conversationUserDataDict, setConversationUserDataDict] = useState({});
    const [stateConversationStatus, setStateConversationStatus] = useState({});
    const [ imageMsgVisible, setImageMsgVisible ] = React.useState(false);
    const [messages, setMessages] = useState([])
    const [currentMsg, setCurrentMsg] = useState({})
    const [newMessage, setNewMessage] = useState({});
    const [scrollBtnVisible, setScrollBtnVisble] = useState(false);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        getConversationModalData();
        initSocket();
        document.addEventListener("mousedown", handleClickOutside, false);
        window.addEventListener("resize", resizeWindow);
        return () => window.removeEventListener("resize", resizeWindow);
    }, []);

    useEffect(() => {
        if(document.getElementById("conversation_menu_popover")){
            document.getElementById("conversation_menu_popover").style.display = 'none';
        }
        if(uploadingImg){
            setCustomClass("custom_msg_lst_content");
        }else{
            setCustomClass("msg_lst_content");
        }
    }, [windowWidth, windowHeight])

    
    useEffect(() => {
        initializeConversationStatus(curr_user_data.id, "online", "sender");
        getConversationModalData();
    }, [session_is_refreshed]);

    useEffect(() => {
        if(currConversation.id === groupEditedSocketChange.id){
            setCurrConversation(groupEditedSocketChange);
        }
    }, [groupEditedSocketChange])

    useEffect(() => {
        updateRecentMessage(newMessage);
    },[newMessage])

    const handleMessageListOnScroll = () => {
        let ele = document.getElementById('message_list');
        if(ele.scrollTop === (ele.scrollHeight - ele.offsetHeight)){
            setScrollBtnVisble(false);
        }
    }

    const renderMessages = () => {

        let curr_username = curr_user_data ? curr_user_data.username : "";
        let messageCount = messages.length;
        let tempMessages = [];
        let msgs = messages ? messages : [];
        let i = 0;
  
        while (i < messageCount) {
          let previous = msgs[i - 1];
          let current = msgs[i];
          let next = msgs[i + 1];
          let isMine = current.author === curr_username;
          let currentMoment = moment(current.timestamp);
          let prevBySameAuthor = false;
          let nextBySameAuthor = false;
          let startsSequence = true;
          let endsSequence = true;
          let showTimestamp = true;
  
          if (previous) {
            let previousMoment = moment(previous.timestamp);
            let previousDuration = moment.duration(
              currentMoment.diff(previousMoment)
            );
            prevBySameAuthor = previous.author === current.author;
  
            if (prevBySameAuthor && previousDuration.as("hours") < 1) {
              startsSequence = false;
            }
  
            if (previousDuration.as("hours") < 1) {
              showTimestamp = false;
            }
          }
  
          if (next) {
            let nextMoment = moment(next.timestamp);
            let nextDuration = moment.duration(nextMoment.diff(currentMoment));
            nextBySameAuthor = next.author === current.author;
  
            if (nextBySameAuthor && nextDuration.as("hours") < 1) {
              endsSequence = false;
            }
          }
  
          tempMessages.push(
            <Message
              key={i}
              isMine={isMine}
              startsSequence={startsSequence}
              endsSequence={endsSequence}
              showTimestamp={showTimestamp}
              data={current}
            />
          );
          i += 1;
        }
  
        return tempMessages;
    };

    const resizeWindow = () => {
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight);
    };

    const editGroup = (groupData, type) => {
        if(type === "modal"){
            setShowManageConversationsModal(false);
        }else if(type === "conversation_list"){
            if(document.getElementById("conversation_menu_popover")){
                document.getElementById("conversation_menu_popover").style.display = 'none';
            }
        }
        let user_options = [];
        let user_options_data = [];
        let admin_list = JSON.parse(groupData.admin);
        let new_admin_list = [...admin_list];

        let existing_group_members = [];
        let existing_group_member_ids = [];

        groupData.participants_detail.map(item => {
            existing_group_members.push({'name': item.username, 'id': item.id });
            existing_group_member_ids.push(item.id);
        })

        allConversations.map(item => {
            if(!item.is_group){
                user_options.push({'name': item.user.username, 'id': item.user.id });
            }
        })

        user_options.push({'name': curr_user_data.username, 'id': curr_user_data.id });

        let all_user_list = new_admin_list.concat(existing_group_member_ids);

        let uniq = [...new Set(all_user_list)];


        uniq.map(item => {
            let curr_user = conversationUserDataDict[item];
            if(admin_list.indexOf(item) > -1){
                curr_user['is_admin'] = true;
            }else{
                curr_user['is_admin'] = false;
            }
            curr_user['curr_user_id'] = curr_user_data.id;
            user_options_data.push(curr_user);
        });

        
        setEditGroupModal(true);
        let temp_group_data = {};
        temp_group_data['group_name'] = groupData.group_name;
        temp_group_data['group_description'] = groupData.group_description;
        temp_group_data['group_image'] = groupData.group_profile_picture;
        temp_group_data['group_members'] = existing_group_members;
        temp_group_data['user_options'] = user_options;
        temp_group_data['user_options_data'] = user_options_data;
        temp_group_data['id'] = groupData.id;
        temp_group_data['admin'] = admin_list;
        temp_group_data['admin_users'] = groupData.admin_users;
        temp_group_data['is_admin'] = JSON.parse(groupData.admin).indexOf(curr_user_data.id) > -1;
        temp_group_data['curr_user'] = curr_user_data;
        temp_group_data['conversation_user_data_dict'] = conversationUserDataDict;
        setCurrentGroupData(temp_group_data)
        groupFormRef && groupFormRef.current?groupFormRef.current.editGroupModalChild(temp_group_data):''
    }

    const getConversationRequestCount = (data) => {
        let req_count = 0;
        data?data.map(item => {
            if(new Date(curr_user_data.conversation_request_last_seen) < new Date(item.conversation_request_created_on)){
                req_count += 1;
            }
        }):""
        return req_count
    }

    const initSocket = () => {
        WebSocketInstance.conversationRequestNotificationCallbacks(
        (data) => setSocketConversationRequestData1(data),
        (data) => setConversationStatusData(data))

        WebSocketInstance.conversationMessageCallbacks(
            (data) => setMessagesMethod(data),
            (data) => addMessageMethod(data),
            (data) => setIsTyping(data)
        );
    }

    const initializeConversationStatus = (uId, status, type) => {
        waitForSocketConnection(() => {
          WebSocketInstance.setConversationStatus(uId, status, type);
        });
    };

    const setIsTyping = (data) => {
        let temp = { ...session_is_typing[data.chat_id] };
        temp[data.user_id] = data.status;
        setIsTypingMsg(temp);
        // scrollToBottom();
        data.user_id !== curr_user_data.id ? dispatch(is_typing(data)) : "";
    };

    const setMessagesMethod = (data) => {
        console.log('FETCHED');
        if(data.user_id === curr_user_data.id){
            setMessages(data.messages);
            dispatch(conversation_messages(data.messages.reverse(), "fetch", data.chatId));
        }
    }

    const addMessageMethod = (data) => {
        console.log('NEW');
        let curr_chat_id = window.location.pathname.split('/')[3];
        if(curr_chat_id === data.message.chatId){
            let chat_id = data.message.chatId;
            let curr_msgs = session_messages && session_messages.hasOwnProperty(chat_id)?session_messages[chat_id]:[];
            curr_msgs.push(data.message);
            setMessages(curr_msgs);
            setNewMessage(data.message);
            dispatch(conversation_messages(data.message, "new", data.chatId));
            if(data.message.author_id !== curr_user_data.id){
                let ele = document.getElementById('message_list');
                if((ele.scrollTop + 43) !== (ele.scrollHeight - ele.offsetHeight)){
                    setScrollBtnVisble(true);
                }else{
                    scrollToBottom();
                }
            }else{
                scrollToBottom();
            }
        }
    }

    const initializeSocket = (uId, rId, action, chatId, notificationData, type, isGroup, groupData) => {
        waitForSocketConnection(() => {
        WebSocketInstance.fetchConversationRequests(
            uId,
            rId,
            action,
            chatId,
            notificationData,
            type,
            isGroup,
            groupData
        ),
        WebSocketInstance.setConversationStatus(uId, status, type);
        });
    };

    const waitForSocketConnection = (callback) => {
        setTimeout(function () {
          if (WebSocketInstance.state() === 1) {
            console.log("Connection is secure");
            callback();
          } else {
            console.log("wait for connection...");
            waitForSocketConnection(callback);
          }
        }, 100);
    };


    const updateRecentMessage = (data) => {
        let recent_msg = getRecentMsg(data);
        let curr_conversation = allConversations?[...allConversations]:[];
        let updated_conversations = [];
        updated_conversations = curr_conversation.map(item => {
            if(item.id === data.chatId){
                item.recent_message.content = recent_msg
            }
            return item;
        })
        setAllConversations(updated_conversations);
        setSearchConversations(updated_conversations);
    }

    const setConversationStatusData = (data) => {
        data.user_id !== curr_user_data.id ? dispatch(chat_status(data)) : "";
        if (data.type !== "reciever") {
            initializeConversationStatus(curr_user_data.id, "online", "reciever");
        }
    }

    const setSocketConversationRequestData1 = (data) => {
        if(data.user_id !== curr_user_data.id){
            if(data.is_group){
                console.log(data.group_data);
                console.log("GROUP")
                let group_data_dict = data.group_data;
                getConversationModalData();
                let exit_dict = JSON.parse(group_data_dict.has_exit);
                let remove_dict = JSON.parse(group_data_dict.removed);
                let delete_dict = JSON.parse(group_data_dict.deleted);
                Object.keys(exit_dict).map(item => {
                    if(exit_dict[item] && item == curr_user_data.id){
                        group_data_dict['is_exit'] = true;
                    }else{
                        group_data_dict['is_exit'] = false;
                    }
                })
                Object.keys(remove_dict).map(item => {
                    if(remove_dict[item] && item == curr_user_data.id){
                        group_data_dict['is_removed'] = true;
                    }
                })
                Object.keys(delete_dict).map(item => {
                    if(delete_dict[item] && item == curr_user_data.id){
                        group_data_dict['is_deleted'] = true;
                    }
                })
                if(data.action === "exit"){
                    let temp_msgs = {};
                    temp_msgs[data.group_data.id] = data.group_data.group_exit_user.username + " has left the group."
                    setConversationStatusMsg(temp_msgs);
                }else if(data.action === "update"){
                    let removed_p_list = data.group_data.removed_participants;
                    let added_p_list = data.group_data.added_participants;
                    let exit_p_list = data.group_data.exit_participants;
                    let temp_msgs = {};
                    if(removed_p_list.length <= 0 && added_p_list.length <= 0){
                        setGroupSocketMsg(data, true);
                    }else{
                        if (removed_p_list.indexOf(curr_user_data.id) > -1){
                            group_data_dict['is_removed'] = true;
                            temp_msgs[data.group_data.id] = "You have been removed from this group. You will no longer recieve any new messages on this group."
                        }
                        if (exit_p_list.indexOf(curr_user_data.id) > -1){
                            group_data_dict['is_exit'] = true;
                            temp_msgs[data.group_data.id] = data.group_data.group_exit_user.username + " has left the group."
                        }
                        if (added_p_list.indexOf(curr_user_data.id) > -1){
                            group_data_dict['is_removed'] = false; 
                            temp_msgs[data.group_data.id] = "You have been added to this group."
                        }
                        setConversationStatusMsg(temp_msgs);
                    }
                }else{
                    setGroupSocketMsg(data, true);
                }
                setGroupEditedSocketChange(group_data_dict);
            }else{
                console.log(data);
                console.log("CONVERSATION");
                if(data.action === 'accept' || data.action === 'add'){
                    dispatch(notifications(data.notification_data, "new"));
                }
                getConversationModalData();
            }   
        }else{
            //pass
        }
    }

    const setGroupSocketMsg = (data, receiver) => {
        let temp_msgs = {};
        let property = setGroupMsg(data);
        if(receiver){
            if(data.action === "accept"){
                temp_msgs[data.group_data.id] = data.group_data.group_create_user.username +" has created this group.\nYou have been added to this group.";
            }else if(data.action === "update"){
                temp_msgs[data.group_data.id] = data.group_data.group_update_user.username+" has changed the " + property;
                if(data.group_data.group_admin_change){
                    if(data.group_data.admin.indexOf(curr_user_data.id) > -1){
                        temp_msgs[data.group_data.id] = "You are now the group admin.";
                    }else{
                        temp_msgs[data.group_data.id] = "You are not the group admin anymore.";
                    }
                }
            }
        }else{
            if(data.action === "accept"){
                temp_msgs[data.group_data.id] = "You have created this group.";
            }else if(data.action === "update"){
                if(data.group_data.group_admin_change){
                    temp_msgs[data.group_data.id] = "You have changed the group admins."
                }else{
                    temp_msgs[data.group_data.id] = "You have changed the " + property;
                }
            }
        }
        setConversationStatusMsg(temp_msgs);
    }


    const setGroupMsg = (data) => {

        let property = '';
        if(data.group_data.group_name_change && data.group_data.group_description_change && data.group_data.group_image_change){
            property = 'group details.';
        }else if(data.group_data.group_name_change && data.group_data.group_description_change){
            property = 'group details.';
        }else if(data.group_data.group_description_change && data.group_data.group_image_change){
            property = 'group details.';
        }else if(data.group_data.group_name_change && data.group_data.group_image_change){
            property = 'group details.';
        }else if(data.group_data.group_name_change){
            property = 'group name.';
        }else if(data.group_data.group_description_change){
            property = 'group description.';
        }else if(data.group_data.group_image_change){
            property = 'group image.';
        }

        return property;

    }

    const merge = (obj1, obj2) => {
        const obj = {};
        for (const attrname1 in obj1) {
          if (obj1.hasOwnProperty(attrname1)) {
            obj[attrname1] = obj1[attrname1];
          }
        }
        for (const attrname2 in obj2) {
          if (obj2.hasOwnProperty(attrname2)) {
            obj[attrname2] = obj2[attrname2];
          }
        }
        return obj;
    }

    const getConversationModalData = (refresh) => {
        setConversationLoading(true);
        axiosInstance
        .get("get_conversation_modal_data/")
        .then((res) => {
            setConversationLoading(false);
            if (res.data.ok) {
                let all_conv_data_res = res.data.all_conv_data;
                let user_data_dict = res.data.user_data_dict;
                let modal_data = {
                    modal_friends: res.data.modal_friends, 
                    modal_conversation_requests: res.data.modal_conversation_requests, 
                    modal_conversations: res.data.modal_conversations, 
                    modal_sent_conversation_requests: res.data.modal_sent_conversation_requests, 
                    all_conversations: res.data.all_conversations, 
                    conversation_request_last_seen: res.data.conversation_request_last_seen, 
                    modal_groups: res.data.all_groups, 
                    all_conv_data: all_conv_data_res
                };
                let req_count = getConversationRequestCount(modal_data.modal_conversation_requests)
                setConversationReqNotificationCount(req_count);
                dispatch(manage_request_count(req_count, "conversations"));
                setConversationRequestModalData(modal_data);
                let all_groups = res.data.all_groups;
                let temp_is_removed_dict = {};
                all_groups?all_groups.map(item => {
                    let removed_dict = JSON.parse(item.removed);
                    temp_is_removed_dict[item.id] = merge(removed_dict, {...isRemoved});
                }):'';
                setIsRemoved(temp_is_removed_dict);
                setAllGroups(res.data.all_groups);
                let temp = {};
                res.data.all_conversations?res.data.all_conversations.map(item => {
                    temp[item.user.id] = item.id; 
                }):"";
                let temp_friends = {};
                modal_data.modal_friends?modal_data.modal_friends.map(item => {
                    if(item.has_conversation){
                        temp_friends[item.id] = true;
                    }else{
                        temp_friends[item.id] = false;
                    }
                }):""
                setIsConversationFriend(temp_friends);
                setConversationUserDict(temp);
                setConversationUserDataDict(user_data_dict);
                setAllConversations(all_conv_data_res);
                setSearchConversations(all_conv_data_res);
                // dispatch(conversation_modal_data(modal_data));
            } else {
                //pass
            }
        })
        .catch((err) => {
            setConversationLoading(false);
            console.log(err);
        });
    };

    const handleClickOutside = (e) => {
      if (
        emojiInputRef &&
        e.target &&
        emojiInputRef.current &&
        !emojiInputRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    const handleEmojiPicker = () => {
        let showEmojiPicker_obj = !showEmojiPicker;
        setShowEmojiPicker(showEmojiPicker_obj);
    };

    const onEmojiClick = (event, emoji) => {
        let input_msg = document.getElementById("composeMsg").value;
        input_msg += String.fromCodePoint(parseInt(emoji.unified, 16));
        setInputMsg(input_msg);
        setChosenEmoji(emoji);
    };

    const spinner = (display, type) => {
        if(type === "conversation_modal"){
            setLoaderActive(true);
            display
            ? (document.getElementById("loadingoverlay").style.display = "block")
            : (document.getElementById("loadingoverlay").style.display = "none");
        }else{
            display
            ? (document.getElementById("overlay").style.display = "block")
            : (document.getElementById("overlay").style.display = "none");
        }
    };

    const spinnerStop = (type) => {
        if(type === "conversation_modal"){
            setLoaderActive(false);
            document.getElementById("loadingoverlay").style.display = "none";
        }else{
            document.getElementById("overlay").style.display = "none";
        }
    };

    const renderTooltipGroup = ({placement, scheduleUpdate, arrowProps, outOfBoundaries, show, ...props}) => (
        <div className="info_group_data_hover" id="info_group_data">
            <Row style={{ padding: '0px', margin: '0px' }}>
            <Col style={{ padding: '4px 0px 0px 4px', margin: '0px' }} xs={4} sm={4} md={4} lg={4} xl={4}>
            <img
                className="conversation_info_photo"
                width="30"
                height="30"
                src={currConversation && currConversation.group_profile_picture?currConversation.group_profile_picture:defaultGroupProfilePictureImageDataUri}
                alt="info_photo"
                />
            </Col>
            <Col style={{ padding: '2px 10px 10px 5px', margin: '0px' }} xs={8} sm={8} md={8} lg={8} xl={8}>
                <Row style={{ padding: '0px', margin: '0px', height: '18px' }}>
                    <Col style={{ padding: '0px' }} xs={12} sm={12} md={12} lg={12} xl={12}>
                    {currConversation ?
                    <p className="conversation_info_username">{currConversation.group_name}</p>: ""
                    }
                    </Col>
                </Row>
                <Row style={{ padding: '0px', margin: '0px', height: '10px' }}>
                    <Col style={{ padding: '0px' }}xs={12} sm={12} md={12} lg={12} xl={12}>
                    {currConversation?
                    <p className="conversation_info_email">{currConversation.group_description}</p>:""
                    }
                    </Col>
                </Row>
            </Col>
            <Col style={{ padding: '0px', margin: '0px' }} xs={12} sm={12} md={12} lg={12} xl={12}>
                <Row style={{ padding: '0px', margin :'0px'}}>
                    <Col style={{ padding: '0px', margin :'5px 0px 0px 0px', textAlign: 'center' }} xs={2} sm={2} md={2} lg={2} xl={2}>
                        <FaUsers className="conversation_info_msgs"/>
                    </Col>
                    <Col style={{ padding: '0px 5px', margin :'0px', textAlign: 'left' }} xs={6} sm={6} md={6} lg={6} xl={6}>
                        {currConversation.participants_detail.map((item, index) => {
                            if(index <= 4){
                                return (<img
                                key={index}
                                className="group_info_photo"
                                width="20"
                                height="20"
                                src={item.profile_picture?item.profile_picture:defaultProfilePictureImageDataUri}
                                alt="group_info_photo"
                                />)
                            }
                        })}
                    </Col>
                    {currConversation.participants_detail.length > 5?<Col style={{ padding: '0px', margin :'0px', textAlign: 'left' }} xs={4} sm={4} md={4} lg={4} xl={4}>
                        <div className="group_info_participants"> and {currConversation.participants_detail.length - 5} more ...</div>
                    </Col>:""}
                </Row>
            </Col>
            </Row>
        </div>
    )

    const renderTooltip = ({placement, scheduleUpdate, arrowProps, outOfBoundaries, show, ...props}) => (
        <div className="info_user_data_hover" id="info_user_data">
            <Row style={{ padding: '0px', margin: '0px' }}>
            <Col style={{ padding: '4px 0px 0px 4px', margin: '0px' }} xs={4} sm={4} md={4} lg={4} xl={4}>
            <img
                className="conversation_info_photo"
                width="30"
                height="30"
                src={currConversation && currConversation.user && currConversation.user.profile_picture?currConversation.user.profile_picture:defaultProfilePictureImageDataUri}
                alt="info_photo"
                />
            </Col>
            <Col style={{ padding: '2px 10px 10px 5px', margin: '0px' }} xs={8} sm={8} md={8} lg={8} xl={8}>
                <Row style={{ padding: '0px', margin: '0px', height: '18px' }}>
                    <Col style={{ padding: '0px' }} xs={12} sm={12} md={12} lg={12} xl={12}>
                    {currConversation && currConversation.user?
                    <p className="conversation_info_username">{currConversation.user.username}</p>: ""
                    }
                    </Col>
                </Row>
                <Row style={{ padding: '0px', margin: '0px', height: '10px' }}>
                    <Col style={{ padding: '0px' }}xs={12} sm={12} md={12} lg={12} xl={12}>
                    {currConversation && currConversation.user?
                    <p className="conversation_info_email">{currConversation.user.email}</p>:""
                    }
                    </Col>
                </Row>
            </Col>
            <Col style={{ padding: '0px', margin: '0px' }} xs={12} sm={12} md={12} lg={12} xl={12}>
                <Row style={{ padding: '0px', margin :'0px'}}>
                    <Col style={{ padding: '0px', margin :'0px', textAlign: 'center' }} xs={1} sm={1} md={1} lg={1} xl={1}>
                    <div
                        className="chat_status"
                        style={{
                        backgroundColor:currConversation && currConversation.user && session_chat_status &&
                        session_chat_status.hasOwnProperty(
                          currConversation.user.id
                        ) &&
                        session_chat_status[currConversation.user.id] === "online"
                          ? "#58A847"
                          : "#efefef",
                        borderRadius: "100%",
                        width: "0.52rem",
                        height: "0.52rem",
                        margin: "4px 0px 0px 5px",
                        border: "1px solid darkgrey",
                        }}></div>
                    </Col>
                    <Col style={{ padding: '0px', margin :'0px', textAlign: 'left' }} xs={4} sm={4} md={4} lg={4} xl={4}>
                        {currConversation && currConversation.user && session_chat_status &&
                            session_chat_status.hasOwnProperty(
                            currConversation.user.id
                            ) &&
                            session_chat_status[currConversation.user.id] === "online"
                            ?<p className="conversation_info_status">Active</p>:
                            <p className="conversation_info_status">Away</p>}
                    </Col>
                    <Col style={{ padding: '0px', margin :'0px', textAlign: 'center' }} xs={7} sm={7} md={7} lg={7} xl={7}>
                    <FaComment className="conversation_info_msgs"/>
                    </Col>
                </Row>
            </Col>
            </Row>
        </div>
    );
                    

    const hideInfoData = () => {
        console.log('HIDDEN');
    }

    const setGroupImageCrop = (newCrop) => {
        setCrop(newCrop)
    }

    const getOrCreateRef = (id) => {
        if (!refs.hasOwnProperty(id)) {
            refs[id] = React.createRef();
        }
        return refs[id];
    };

    const cancelConversationRequestRef = (action, recipient_user, chat_id) => {
        if(document.getElementById("conversation_menu_popover")){
            document.getElementById("conversation_menu_popover").style.display = 'none';
        }
        CustomDialog.show({
          body: "Are you sure you want to cancel this request ?",
          actions: [
            Dialog.DefaultAction(
              "Cancel Request",
              () => {
                manageModalConversations(action, recipient_user, chat_id);
              },
              "btn-danger"
            ),
            Dialog.Action(
              "Close",
              () => {
                CustomDialog?CustomDialog.hide():'';
              },
              "btn-primary"
            ),
          ],
        });
    };

        const getAllConversations = () => {
        
        axiosInstance
            .get("get_all_conversations/")
            .then((res) => {
            if (res.data.ok) {
                // console.log(res.data.conversations)
            } else {
                console.log('Error get all conversations call')
            }
            })
            .catch((err) => {
            console.log(err);
            });
        }

        const deleteGroup = (groupData) => {
        
            axiosInstance
                .get("delete_group/"+groupData.id+"/")
                .then((res) => {
                if (res.data.ok) {
                    getConversationModalData();
                    // console.log(res.data.conversations)
                } else {
                    console.log('Error delete group call')
                }
                })
                .catch((err) => {
                    console.log(err);
                });
            }
        
        const manageModalConversations = (action, recipient_user, chat_id, groupData) => {
        if(groupData){
            spinner(true, "");  
        }else{
            spinner(true, "conversation_modal");  
        }
        let post_data = {};
        post_data["action"] = action;
        post_data["user_id"] = curr_user_data.id;
        post_data["chat_id"] = chat_id;
        post_data["is_group"] = false;
        let recipient;
        if(groupData){
            let participants_temp = [...recipient_user]
            post_data["is_group"] = true;
            post_data["admin"] = groupData.admin;
            post_data["group_profile_picture"] = groupData.group_image;
            post_data["group_name"] = groupData.group_name;
            post_data["group_description"] = groupData.group_description;
            post_data["participants"] = participants_temp;
            recipient = recipient_user;
        }else{
            post_data["recipient_user_id"] = recipient_user.id;
            recipient = recipient_user.id
        }
        axiosInstance
            .post("manage_chats/", post_data)
            .then((res) => {
            if(groupData){
                spinnerStop("");  
            }else{
                spinnerStop("conversation_modal");  
            }
            if (res.data.ok) {
                let res_chat_id = '';
                let res_conversation = {};
                let res_group = {};
                let notification_data = res.data.notification;
                let res_type = res.data.accept_type;
                let res_is_group = res.data.is_group;
                let sender_notification = {};
                let recipient_notification = {};
                if(res_is_group){
                    res_group = res.data.group;
                    res_group['group_create_user'] = curr_user_data;
                    setConversationModalData(action, recipient_user, res_group, "", "new", res_is_group);
                }else{
                    if(notification_data.hasOwnProperty(curr_user_data.id)){
                        sender_notification = [notification_data[curr_user_data.id]]
                    }
                    if(notification_data.hasOwnProperty(recipient)){
                        recipient_notification = [notification_data[recipient]]
                    }
                    if(action === "accept"){
                        dispatch(notifications(sender_notification, "new"));
                        if(res_type === "new"){
                            if(res.data.created_conversation !== undefined){
                                res_conversation = res.data.created_conversation;
                                res_chat_id = res.data.created_conversation.id;
                                setConversationModalData(action, recipient_user, res_conversation, res_chat_id, res_type, res_is_group);
                            }else{
                                setErrorsConversationModal(recipient_user, res, action, 'custom');
                            }
                        }else{
                            setConversationModalData(action, recipient_user, res_conversation, res_chat_id, res_type, res_is_group);
                        }
                    }else if(action == "remove"){
                        res_chat_id = chat_id;
                        setConversationModalData(action, recipient_user, res_conversation, res_chat_id, "", res_is_group);
                    }else{
                        setConversationModalData(action, recipient_user, res_conversation, res_chat_id, "", res_is_group);
                    }
                }
                initializeSocket(
                    curr_user_data.id,
                    recipient,
                    action,
                    res_chat_id,
                    recipient_notification,
                    res_type,
                    res_is_group,
                    res_group
                );
            } else {
                setErrorsConversationModal(recipient_user, res, action, "");
            }
            })
            .catch((err) => {
            if(groupData){
                spinnerStop("");  
            }else{
                spinnerStop("conversation_modal");  
            }
            // setErrorsConversationModal(recipient_user, res, action, "");
            console.log(err);
            });
        };

      const groupAdd = (data) => {
        let group_data = {...data};
        manageModalConversations("accept", group_data.group_members, "", group_data);
      }

      const groupEdit = (data) => {
        let post_data = {};
        let participants_id_list = data['group_members'].map(item => {
                return item.id;
        })
        if(participants_id_list.indexOf(curr_user_data.id) < 0){
            data['group_members'].push({'name': curr_user_data.username, 'id': curr_user_data.id})
        }
        let previous_participants = data['participant_change']['before'];
        let new_participants = data['participant_change']['after'];

        let previous_admin = data['admin_change']['before'];
        let new_admin = data['admin_change']['after'];

        if(arraysEqual(previous_participants, new_participants)){
            post_data['participant_change'] = false;
        }else{
            post_data['participant_change'] = true;
            post_data['added_participants'] = data['added_participants'];
            post_data['removed_participants'] = data['removed_participants'];
        }
        if(arraysEqual(previous_admin, new_admin)){
            post_data['group_admin_change'] = false;
        }else{
            post_data['group_admin_change'] = true;
        }
        if(data['group_name'] !== data['previous_group_data']['group_name']){
            post_data['group_name_change'] = true;
        }else{
            post_data['group_name_change'] = false;
        }
        if(data['group_description'] !== data['previous_group_data']['group_description']){
            post_data['group_description_change'] = true;
        }else{
            post_data['group_description_change'] = false;
        }
        if(data['group_image'] !== data['previous_group_data']['group_image']){
            post_data['group_image_change'] = true;
        }else{
            post_data['group_image_change'] = false;
        }
        post_data['id'] = data['id'];
        post_data['type'] = 'update';
        post_data['participants'] = data['group_members']
        post_data['group_name'] = data['group_name'];
        post_data['group_description'] = data['group_description'];
        post_data['group_profile_picture'] = data['group_image'];
        post_data['is_admin'] = data['is_admin'];
        post_data['admin'] = data['admin']
        spinner(true, "");
        axiosInstance
        .post("update_group/", post_data)
        .then((res) => {
        spinnerStop("");
        if (res.data.ok) {
            let updated_group = res.data.group;
            let temp = {'group_data': updated_group, 'action': 'update'};
            let removed_p_list = temp.group_data.removed_participants;
            let added_p_list = temp.group_data.added_participants;
            let exit_p_list = temp.group_data.exit_participants;
            let temp_msgs = {};
            if(removed_p_list.length > 0 || added_p_list.length > 0 || exit_p_list.length > 0){
                if(removed_p_list.length > 0){
                    let removed_msg = 'You removed ';
                    removed_p_list.map((item, index) => {
                        if(index !== removed_p_list.length-1){
                            removed_msg += conversationUserDataDict[item].username + ', '
                        }else{
                            removed_msg += conversationUserDataDict[item].username;
                        }
                    })
                    temp_msgs[temp.group_data.id] = removed_msg;
                }
                if(added_p_list.length > 0){
                    let added_msg = 'You added ';
                    added_p_list.map((item, index) => {
                        if(index !== added_p_list.length-1){
                            added_msg += conversationUserDataDict[item].username + ', '
                        }else{
                            added_msg += conversationUserDataDict[item].username;
                        }
                    })
                    temp_msgs[temp.group_data.id] = added_msg;
                }
                if(exit_p_list.length > 0){
                    let exit_msg = 'You left';
                    temp_msgs[temp.group_data.id] = exit_msg;
                }
                setConversationStatusMsg(temp_msgs);
            }else{
                setGroupSocketMsg(temp, false);
            }
            setCurrConversation(updated_group);

            updated_group['group_update_user'] = curr_user_data;
            let curr_all_conv_data = conversationRequestsModalData.all_conv_data;
            let curr_all_groups = conversationRequestsModalData.modal_groups;

            let updated_all_conv_data = curr_all_conv_data.map(item => {
                if(item.id === updated_group.id){
                    return updated_group;
                }else{
                    return item;
                }
            })

            let updated_all_groups = curr_all_groups.map(item => {
                if(item.id === updated_group.id){
                    return updated_group;
                }else{
                    return item;
                }
            })

            let updated_modal_data = {...conversationRequestsModalData, all_groups: updated_all_groups, all_conv_data: updated_all_conv_data};
            
            setConversationRequestModalData(updated_modal_data);
            setAllGroups(updated_all_groups);
            setAllConversations(updated_all_conv_data);
            setSearchConversations(updated_all_conv_data);
            
            initializeSocket(
                curr_user_data.id,
                post_data['participants'],
                "update",
                updated_group.id,
                {},
                "old",
                true,
                updated_group
            );
        } else {
            console.log('Error all update group call')
        }
        })
        .catch((err) => {
        spinnerStop("");
        console.log(err);
        });
      }

      const arraysEqual = (a, b) => {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; ++i) {
          if (a[i] !== b[i]) return false;
        }
        return true;
    }

      const setErrorsConversationModal = (recipient_user, res, action, type) => {
        let err_dict = {...conversationRequestModalErrors};
        let temp = {};
        if(action === "add"){
            temp[parseInt(recipient_user.id)] = res.data.error;
            err_dict['modal_friends'] = temp;
        }else if(action === "accept"){
            if(type === 'custom'){
                temp[parseInt(recipient_user.id)] = 'Some error occured. Please refresh.';
            }else{
                temp[parseInt(recipient_user.id)] = res.data.error;
            }
            err_dict['modal_conversation_req'] = temp;
        }else if(action === "reject"){
            temp[parseInt(recipient_user.id)] = res.data.error;
            err_dict['modal_conversation_req'] = temp;
        }else if(action === "cancel"){
            temp[parseInt(recipient_user.id)] = res.data.error;
            err_dict['modal_sent_conversation_req'] = temp;
        }else if(action === "remove"){
            temp[parseInt(recipient_user.id)] = res.data.error;
            err_dict['modal_conversations'] = temp;
        }else{
            //pass
        }
        setConversationModalErrors(err_dict);
        // setTimeout(function(){
        //     setConversationModalErrors("");
        // }, 5000)
      }

      const conversationModalRefresh = () => {
        setConversationModalErrors("");
        getConversationModalData(true);
      }

      const setConversationModalData = (action, recipient_user, chat, chat_id, type, is_group) => {
        if(is_group){
            if(action === "accept"){
                let temp = [...conversationRequestsModalData.all_conv_data];
                let all_conv = [...temp, chat];
                setAllConversations(all_conv);
                setSearchConversations(all_conv);
                setConversationRequestModalData({...conversationRequestsModalData, modal_group: all_conv})
            }else if(action === "remove"){
                console.log('GROUP REMOVED');
            }
        }else{
            let updated_modal_friends = [];
            let updated_modal_conversations = [];
            let updated_modal_conversations_requests = [];
            let updated_all_conv = [];
            let sent_conversation_requests = [...conversationRequestsModalData.modal_sent_conversation_requests];
            let conversations = [...conversationRequestsModalData.modal_conversations];
            if(action === "add"){
                updated_modal_friends = conversationRequestsModalData.modal_friends.map(item => {
                    if(item.id === parseInt(recipient_user.id)){
                        item.sent_conversation_request = true;
                        sent_conversation_requests.push(item);
                    }
                    return item
                })
                setConversationRequestModalData({...conversationRequestsModalData, modal_friends: updated_modal_friends, modal_sent_conversation_requests: sent_conversation_requests})
            }else if(action === "accept"){
                let temp_friends = {};
                let all_conv = [];
                updated_modal_conversations_requests = conversationRequestsModalData.modal_conversation_requests.filter(item => {
                    if(item.id === parseInt(recipient_user.id)){
                        item.chat_id = chat_id;
                        conversations.push(item);
                    }
                    return item.id !== parseInt(recipient_user.id)
                })
                updated_modal_friends = conversationRequestsModalData.modal_friends.map(item => {
                    if(item.id === parseInt(recipient_user.id)){
                        item.has_conversation = true;
                    }
                    return item
                })
                if(type === "new"){
                    let temp = {};
                    let temp_conv = [];
                    temp_conv = [...conversationRequestsModalData.all_conversations, chat]
                    temp_conv.map(item => {
                        temp[item.user.id] = chat_id; 
                    });
                    let all_groups = conversationRequestsModalData.all_groups?[...conversationRequestsModalData.all_groups]:[];
                    updated_all_conv = [...temp_conv, ...all_groups];
                    all_conv = updated_all_conv;
                    setConversationUserDict(temp);
                }else{
                    all_conv = [...conversationRequestsModalData.all_conv_data];
                    updated_all_conv = all_conv;
                }
                let conv = [...conversationRequestsModalData.modal_friends]
                conv.map(item => {
                    if(item.has_conversation){
                        temp_friends[item.id] = true; 
                    }else{
                        temp_friends[item.id] = false;
                    }
                });
                setAllConversations(all_conv);
                setSearchConversations(all_conv);
                setIsConversationFriend(temp_friends);
                // dispatch(conversation_delete(temp_friends, "remove"));
                setConversationRequestModalData({...conversationRequestsModalData, modal_friends: updated_modal_friends, modal_conversations: conversations, modal_conversation_requests: updated_modal_conversations_requests, all_conv: updated_all_conv})
            }else if(action === "remove"){
                updated_modal_conversations = conversationRequestsModalData.modal_conversations.filter(item => {               
                    return item.id !== parseInt(recipient_user.id)
                })
                updated_modal_friends = conversationRequestsModalData.modal_friends.map(item => {
                    if(item.id === parseInt(recipient_user.id)){
                        item.has_conversation = false;
                    }
                    return item
                })
                let updated_all_conversations = allConversations.filter(item => { 
                    return item.id !== chat_id
                })
                let temp = {...conversationUserDict};
                let temp_friends = {...isConversationFriend};
                delete temp[recipient_user.id];
                delete temp_friends[recipient_user.id];
                setConversationUserDict(temp);
                setIsConversationFriend(temp_friends);
                // dispatch(conversation_delete(temp_friends, "remove"));
                // setAllConversations(updated_all_conversations);
                setConversationRequestModalData({...conversationRequestsModalData, modal_friends: updated_modal_friends, modal_conversations: updated_modal_conversations})
            }else if(action === "reject"){
                updated_modal_conversations_requests = conversationRequestsModalData.modal_conversation_requests.filter(item => {
                    return item.id !== parseInt(recipient_user.id)
                })
                setConversationRequestModalData({...conversationRequestsModalData, modal_conversation_requests: updated_modal_conversations_requests})
            }else if(action === "cancel"){
                updated_modal_friends = conversationRequestsModalData.modal_friends.map(item => {
                    if(item.id === parseInt(recipient_user.id)){
                        item.sent_conversation_request = false;
                    }
                    return item
                })
                sent_conversation_requests = conversationRequestsModalData.modal_sent_conversation_requests.filter(item => {
                    return item.id !== parseInt(recipient_user.id)
                })
                setConversationRequestModalData({...conversationRequestsModalData, modal_friends: updated_modal_friends, modal_sent_conversation_requests: sent_conversation_requests})
            }
        }
    }
    
      const deleteConversationRequestRef = (action, recipient_user, group) => {
        let curr_chat_id = group?recipient_user.id:conversationUserDict[recipient_user.id];
        if(document.getElementById("conversation_menu_popover")){
            document.getElementById("conversation_menu_popover").style.display = 'none';
        }
        CustomDialog.show({
          body:
          group?"Are you sure you want to remove "+recipient_user.group_name+" from your groups ?":"Are you sure you want to remove "+recipient_user.username+" from your conversations ?",
          actions: [
            Dialog.DefaultAction(
              "Remove",
              () => {
                group?manageModalConversations(action, recipient_user.participants, curr_chat_id, recipient_user):manageModalConversations(action, recipient_user, curr_chat_id);
              },
              "btn-danger"
            ),
            Dialog.Action(
              "Close",
              () => {
                CustomDialog?CustomDialog.hide():'';
              },
              "btn-primary"
            ),
          ],
        });
      };

    const clearConversationRef = (recipient_user, is_group) => {
        if(document.getElementById("conversation_menu_popover")){
            document.getElementById("conversation_menu_popover").style.display = 'none';
        }
        CustomDialog.show({
        body:is_group?"Are you sure you want to clear all messages from this group ?":"Are you sure you want to clear all messages from this conversation ?",
        actions: [
            Dialog.DefaultAction(
            "Clear",
            () => {
                if(is_group){
                    console.log('CLEAR GROUP')
                }else{
                    console.log('CLEAR CONVERSATION');
                }
            },
            "btn-danger"
            ),
            Dialog.Action(
            "Cancel",
            () => {
                CustomDialog?CustomDialog.hide():'';
            },
            "btn-primary"
            ),
        ],
        });
    };
  
    const deleteConversationRef = (recipient_user, is_group) => {
        if(document.getElementById("conversation_menu_popover")){
            document.getElementById("conversation_menu_popover").style.display = 'none';
        }
        CustomDialog.show({
        body: is_group?"Are you sure you want to delete this group ?":"Are you sure you want to delete this conversation ?",
        actions: [
            Dialog.DefaultAction(
            "Delete",
            () => {
                if(is_group){
                    deleteGroup(recipient_user);
                }else{
                    console.log('DELETE CONVERSATION');
                }
            },
            "btn-danger"
            ),
            Dialog.Action(
            "Cancel",
            () => {
                CustomDialog?CustomDialog.hide():'';
            },
            "btn-primary"
            ),
        ],
        });
    };

    const exitConversationRef = (groupData) => {
        if(document.getElementById("conversation_menu_popover")){
            document.getElementById("conversation_menu_popover").style.display = 'none';
        }
        CustomDialog.show({
        body: "Are you sure you want to exit this group ?",
        actions: [
            Dialog.DefaultAction(
            "Exit",
            () => {
                exitGroup(groupData);
            },
            "btn-danger"
            ),
            Dialog.Action(
            "Cancel",
            () => {
                CustomDialog?CustomDialog.hide():'';
            },
            "btn-primary"
            ),
        ],
        });
    };

    const exitGroup = (groupData) => {
        let post_data = groupData;
        post_data['curr_user_id'] = curr_user_data.id;
        post_data['type'] = 'exit';
        let participants = post_data['participants'].map(item => {
            return {'id': item}
        })
        axiosInstance
          .post("update_group/", post_data)
          .then((res) => {
            spinnerStop("");
            if (res.data.ok) {
                let temp_msgs = {};
                let updated_group = res.data.group;
                let updated_group_copy = {...updated_group};
                updated_group_copy['is_exit'] = true;
                updated_group_copy['group_exit_user'] = curr_user_data;
                updated_group['group_exit_user'] = curr_user_data;
                temp_msgs[updated_group.id] = 'You left';
                
                let curr_all_conv_data = conversationRequestsModalData.all_conv_data;
                let curr_all_groups = conversationRequestsModalData.modal_groups;

                let updated_all_conv_data = curr_all_conv_data.map(item => {
                    if(item.id === updated_group.id){
                        return updated_group;
                    }else{
                        return item;
                    }
                })

                let updated_all_groups = curr_all_groups.map(item => {
                    if(item.id === updated_group.id){
                        return updated_group;
                    }else{
                        return item;
                    }
                })

                let updated_modal_data = {...conversationRequestsModalData, all_groups: updated_all_groups, all_conv_data: updated_all_conv_data};
                
                setConversationRequestModalData(updated_modal_data);
                setAllGroups(updated_all_groups);
                setAllConversations(updated_all_conv_data);
                setSearchConversations(updated_all_conv_data);
                setCurrConversation(updated_group_copy);
                setConversationStatusMsg(temp_msgs);
                
                initializeSocket(
                    curr_user_data.id,
                    participants,
                    "exit",
                    updated_group.id,
                    {},
                    "old",
                    true,
                    updated_group
                );
            } else {
                console.log('Error exit group call')
            }
          })
          .catch((err) => {
            spinnerStop("");
            console.log(err);
          });
    }

    const openManageConversationsModal = () => {
        setKey("friends")
        setShowManageConversationsModal(true);
    };

    const getRecentMsg = (data) => {
        let recent_msg = 'Click to start a conversation';
        if(Object.keys(data).length > 0){
            if(data.message_type == 'text'){
                if(data.author_id == curr_user_data.id){
                    recent_msg = "You: " + data.content
                }else{
                    recent_msg = data.content;
                }
            }else{
                if(data.author_id == curr_user_data.id){
                    recent_msg = "You: Image"
                }else{
                    recent_msg = "Image"
                }
            }
        }
        return recent_msg;   
    }

    const openAddGroupModal = () => {
        let temp = allConversations;
        let temp_data = {};
        let user_options = [];
        let user_options_data = [];
        let temp_user = curr_user_data;
        temp_user['is_admin'] = true;
        temp_user['curr_user_id'] = curr_user_data.id;
        user_options_data = [temp_user];
        setEditGroupModal(false);
        temp.map(item => {
            if(!item.is_group){
                user_options.push({'name': item.user.username, 'id': item.user.id })
            }
        });
        user_options.push({'name': curr_user_data.username, 'id': curr_user_data.id })
        let admin = [curr_user_data.id];
        temp_data['admin'] = admin;
        temp_data['admin_users'] = [curr_user_data];
        temp_data['user_options'] = user_options;
        temp_data['user_options_data'] = user_options_data;
        temp_data['curr_user'] = curr_user_data;
        temp_data['conversation_user_data_dict'] = conversationUserDataDict;
        setGroupMembers(user_options)
        groupFormRef && groupFormRef.current?groupFormRef.current.openAddGroupModalChild(temp_data):''
    };
    
    const setTabKey = (k) => {
        setKey(k);
        if(k === "conversation_requests"){
            updateConversationReqLastSeen();
        }
    }

    const updateConversationReqLastSeen = () => {
        let post_data = {};
        post_data["request_type"] = "conversations";
        post_data["last_seen"] = new Date();
        setConversationReqLastSeen(post_data["last_seen"]);
        setConversationReqNotificationCount(0);
        dispatch(manage_request_count(0, "conversations"));
        axiosInstance
          .post("manage_requests_last_seen/", post_data)
          .then((res) => {
            if (res.data.ok) {
                // dispatch(manage_requests_last_seen(new Date(), "conversations"));
            } else {
              console.log("Error");
            }
        }).catch((err) => {
            console.log(err);
        });
    }

    const closeManageConversationsModal = () => {
        setShowManageConversationsModal(false);
        setConversationModalErrors({});
    };

    const handleUploadImageChangeMethod = (e) => {
        setUploadingImg(true);
        setCustomClass("custom_msg_lst_content");
        let uploaded_img = e.target.files[0];
        if(uploaded_img){
            let chatId = window.location.pathname.split('/')[3];
            let form_data = new FormData();
            form_data.append("image", uploaded_img);
            form_data.append("name", uploaded_img['name']);
            form_data.append("type", uploaded_img['type']);
            form_data.append("chatId", chatId);
            setUploadedImage(uploaded_img)
            axiosInstance.post("upload_chat_image/", form_data, {
                headers: {
                'content-type': 'multipart/form-data'
                }
            }).then(res => {
                setUploadingImg(true);
                setUploadImgSrc(res.data.image_url);
            }).catch(err => {
                setUploadingImg(true);
                console.log(err)
            })
        }
    };

    const handleMsgSeen = () => {
        //pass
    };


    const sendNewMessage = (message) => {
        let data = {};
        let chatId = currConversation.id;
        if (message.type === "text") {
          if (message.content.length > 0) {
            data = {
              from: curr_user_data.id,
              content: { msg: message.content, image_url: "" },
              chatId: chatId,
              type: message.type,
            };
          }
        } else {
          data = {
            from: curr_user_data.id,
            content: { msg: message.content, image_url: message.img_url, type: message.img_type, file_name: message.file_name },
            chatId: chatId,
            type: message.type,
          };
        }
        setCurrentMsg(message.content);
        WebSocketInstance.newChatMessage(data);
    };

    const scrollToBottom = (custom) => {
        if(custom){
            setScrollBtnVisble(false);
        }
        let ele = document.getElementById("messagesBottom");
        if (ele) {
          ele.scrollIntoView({ behavior: "smooth" });
        }
      };

    const handleChange = (e) => {
        e.preventDefault();
        setInputMsg(e.target.value);
        if (e.target.value.length > 0) {
            setIsTypingData(true);
        }else {
            setIsTypingData(false);
        }
    };


    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            let temp = {};
            temp["content"] = e.target.value;
            if (uploadImgSrc) {
                temp["img_url"] = uploadImgSrc;
                temp["type"] = "image";
            } else if(e.target.value.length > 0) {
                temp["type"] = "text";
            }
            e.target.value = "";
            setInputMsg("");
            setUploadImgSrc("");
            setUploadingImg(false);
            setIsTypingData(false);
            sendNewMessage(temp);
        }
    };

    const handleMessageInput = () => {
        let temp = {};
        let input_msg = document.getElementById("composeMsg").value;
        temp["content"] = input_msg;
        if (uploadImgSrc) {
          temp["img_url"] = uploadImgSrc;
          temp["type"] = "image";
        } else {
          temp["type"] = "text";
        }
        sendNewMessage(temp);
        // handleMsgSeen();
        setUploadImgSrc("");
        setUploadingImg(false);
        setIsTypingData(false);
        document.getElementById("composeMsg").value = "";
        setInputMsg("");
    };

    const setIsTypingData = (status) => {
        let chatId = window.location.pathname.split('/')[3];
        WebSocketInstance.setIsTypingStatus(
          curr_user_data.id,
          status,
          chatId,
          ""
        );
      };

    const cancelImgMsg = () => {
        setUploadingImg(false)
        setUploadImgSrc("");
        setCustomClass("msg_lst_content");
    }; 

    const handleSearch = (search_data) => {
        if (search_data) {
          let result =
            searchConversations &&
            searchConversations.filter((item) => {
                if(item.is_group){
                    return item.group_name.toLowerCase().includes(search_data.toLowerCase());
                }else{
                    return item.user.username.toLowerCase().includes(search_data.toLowerCase());
                }
            });
            setAllConversations(result);
        } else {
            setAllConversations(searchConversations);
        }
    };

    const handleMessengerBack = () => {
        setShowBothLists(false);
        setShowConversationList(true);
        setShowMsgList(false);
    }

    const handleConversationScroll = () => {
        if(document.getElementById("conversation_menu_popover")){
            document.getElementById("conversation_menu_popover").style.display = 'none';
        }
    }

    const handleConversationOpen = (conversation) => {
        let temp = {};
        temp[conversation.id] = true;
        temp['conversation'] = conversation;
        setSelectedConversation(temp);
        waitForSocketConnection(() => {
            WebSocketInstance.fetchMessages(curr_user_data.id, conversation.id)
        })
        setCurrConversation(conversation);
        if(conversation.is_group){
            window.history.replaceState(null, "Groups", '/messenger/groups/'+conversation.id)
        }else{
            window.history.replaceState(null, "Conversations", '/messenger/conversations/'+conversation.id)
        }
    }

    return (
        <Row className="chat_messenger">
            <GroupForm handleEditGroup={groupEdit} handleAddGroup={groupAdd} ref={groupFormRef}/>
            <Col onScroll={handleConversationScroll} className="conversation_lst"  xs={5} sm={5} md={4} lg={3} xl={3}>
                <Row style={{ padding: '0px', margin: '0px' }}>   
                    <Col
                        className="conversation_lst_toolbar"
                        style={{ paddingRight: "0%", paddingLeft: "0%" }}
                        xs={12}
                        sm={12}
                        md={12}
                        lg={12}
                        xl={12}
                    >
                        <Toolbar
                        title="Messenger"
                        leftItems={[
                            <OverlayTrigger
                            key="settings"
                            placement="top"
                            overlay={
                                <Tooltip id="settings_tooltip">
                                <span>Settings</span>
                                </Tooltip>
                            }
                            >
                            <FaCogs className="settings" />
                            </OverlayTrigger>,
                        ]}
                        rightItems={[
                            <OverlayTrigger
                            key="new_group"
                            placement="top"
                            overlay={
                                <Tooltip id="new_group_tooltip">
                                <span>Add new group.</span>
                                </Tooltip>
                            }
                            >
                            <FaUsers onClick={openAddGroupModal} className="new_group" />
                            </OverlayTrigger>,
                        ]}
                        />
                    </Col>
                    <Col
                        style={{ paddingRight: "0px", paddingLeft: "0px" }}
                        xs={12}
                        sm={12}
                        md={12}
                        lg={12}
                        xl={12}
                        >
                        <ConversationSearch onSearchInput={handleSearch} />
                    </Col>
                    <Col
                        style={{ paddingRight: "0px", paddingLeft: "0px" }}
                        xs={12}
                        sm={12}
                        md={12}
                        lg={12}
                        xl={12}
                    >
                        <Row style={{ padding: '0px', margin: '0px' }}>
                            <Col style={{ padding: '0px' }} xs={6} sm={6} md={6} lg={6} xl={6}>
                                <div className="conversation_heading">Conversations</div>
                            </Col>
                            <Col style={{ padding: '0px' }} xs={6} sm={6} md={6} lg={6} xl={6}>
                            <OverlayTrigger
                                key="manage_chats"
                                placement="top"
                                overlay={
                                    <Tooltip id="manage_chats_tooltip">
                                    <span>Manage Conversations</span>
                                    </Tooltip>
                                }
                                >
                                <FaTasks onClick={openManageConversationsModal} className="manage_chats"/>
                                </OverlayTrigger>
                                {conversationReqNotificationCount > 0?
                                <div style={{ top: '2px', right: '10px', position: 'absolute',  backgroundColor: 'red', height: '6px', width: '6px', borderRadius: '100%'}}>
                                </div>:""}
                                <OverlayTrigger
                                    key="refresh_conversation"
                                    placement="top"
                                    overlay={
                                        <Tooltip id="refresh_conversation_tooltip">
                                        <span>Refresh</span>
                                        </Tooltip>
                                    }
                                >
                                <FaSync onClick={() => conversationModalRefresh()} className="refresh_conversation"/>
                                </OverlayTrigger>
                            </Col>
                        </Row>
                    </Col>
                    <Col className="conversation_lst_content" xs={12} sm={12} md={12} lg={12} xl={12}>
                        {allConversations && allConversations.length > 0 ?allConversations.map((item, index) => { 
                            return (<Row onClick={() => handleConversationOpen(item)} className="conversation" key={"CONVERSATION_"+item.id} ref={getOrCreateRef(index)} style={{ backgroundColor: selectedConversation[item.id]?"#ececec": "white"}}>
                                <Col className="conversation_photo" xs={2} sm={2} md={2} lg={2} xl={2} style={{ padding: '0px 0px 0px 16px' }}>
                                    <img
                                        width="35"
                                        height="35"
                                        className="conversation-photo"
                                        src={item.is_group?item.group_profile_picture?item.group_profile_picture:defaultGroupProfilePictureImageDataUri:item.user.profile_picture?item.user.profile_picture:defaultProfilePictureImageDataUri}
                                        alt="conversation_photo"
                                        />
                                        {item.is_group?"":<div
                                            className="chat_status"
                                            style={{
                                            position: "absolute",
                                            backgroundColor:session_chat_status &&
                                            session_chat_status.hasOwnProperty(
                                              item.user.id
                                            ) &&
                                            session_chat_status[item.user.id] === "online"
                                              ? "#58A847"
                                              : "#efefef",
                                            borderRadius: "100%",
                                            width: "0.52rem",
                                            height: "0.52rem",
                                            right: "0px",
                                            left: "42px",
                                            top: "2px",
                                            border: "1px solid darkgrey",
                                            }}
                                        ></div>}
                                </Col>
                                <Col className="conversation_details" xs={10} sm={8} md={8} lg={8} xl={8}>
                                    <Row className="conversation_title_row" style={{ padding: '0px', margin: '0px', height: '20px', maxHeight: '20px' }}>
                                        <Col className="conversation_title_col" style={{ padding: '0px' }} xs={6} sm={8} md={8} lg={8} xl={8}>
                                            <div className="conversation_title">
                                                {item.is_group?item.group_name:item.user.username}
                                            </div>
                                        </Col>
                                        <Col className="conversation_last_seen_col" style={{ padding: '0px' }} xs={4} sm={4} md={4} lg={4} xl={4}>
                                            {!item.is_group?
                                            <div className="conversation_last_seen_time">
                                               15 minutes ago
                                            </div>:''}
                                            {!item.is_group?<br/>:''}
                                            <div className={item.is_group?"new_msg_group_notification":"new_msg_notification"}>
                                            </div>
                                            <CustomBadge
                                                className={item.is_group?"custom_badge_chat_notification_group":"custom_badge_chat_notifications_new"}
                                                count={2}/>
                                        </Col>
                                    </Row>
                                    <Row className="conversation_snippet_row" style={{ padding: '0px', margin: '0px' }}>
                                        <Col style={{ padding: '0px' }} xs={12} sm={12} md={12} lg={12} xl={12}>
                                        {!item.is_group?
                                        isTypingMsg && isTypingMsg.hasOwnProperty(item.user.id) && isTypingMsg[item.user.id]?
                                            <Row style={{ padding: '0px', margin: '0px' }}>
                                                <Col style={{ padding: '0px' }} xs={12} sm={3} md={3} lg={2} xl={2}>
                                                    <div
                                                    className="typing_msg"
                                                    >
                                                    typing
                                                    </div>
                                                </Col>
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
                                                    size={2}
                                                    color={"#0A73F0"}
                                                    loading={isTypingMsg &&
                                                        isTypingMsg.hasOwnProperty(item.user.id)
                                                          ? isTypingMsg[item.user.id]
                                                          : false}
                                                    />
                                                </Col>
                                            </Row>:
                                            <Row style={{ padding: '0px', margin: '0px' }}>
                                                <Col style={{ padding: '0px', margin: '0px' }} xs={12} sm={12} md={12} lg={12} xl={12}>
                                                    <div className="conversation_snippet">
                                                        {Object.keys(item.recent_message).length > 0?item.recent_message.content:"Begin Conversation"}
                                                    </div>
                                                </Col>
                                            </Row>:
                                            <Row style={{ padding: '0px', margin: '0px' }}>
                                                <Col style={{ padding: '0px', margin: '0px' }} xs={12} sm={12} md={12} lg={12} xl={12}>
                                                    <div className="conversation_snippet">
                                                        {Object.keys(item.recent_message).length > 0?item.recent_message.content:"Begin Conversation"}
                                                    </div>
                                                </Col>
                                            </Row>}
                                        </Col>
                                    </Row>
                                </Col>
                                <Col className="conversation_menu_options" xs={12} sm={2} md={2} lg={2} xl={2} style={{ padding: '0px' }}>
                                    <Row style={{ padding: '0px', margin: '0px', float: 'right' }}>
                                        <Col style={{ padding: '0px' }} className="conversation_menu_container_new" xs={6} sm={6} md={6} lg={6} xl={6}>
                                            <OverlayTrigger
                                                id="conversationMenu"
                                                rootClose={true}
                                                trigger="click"
                                                key={index}
                                                placement="bottom-end"
                                                overlay={
                                                    <Popover id="conversation_menu_popover">
                                                    <Popover.Content className="conversation_menu_content" style={{ padding: '5px', zIndex: '1000', maxHeight: item.is_group?'200px':'115px', overflow: 'auto', width: item.is_group?'170px':'200px' }}>
                                                    {item.is_group?
                                                    <div>
                                                        {(item.is_removed || item.is_exit)?"":<Row onClick={() => editGroup(item, "conversation_list")} className="text-left view_chat_info_row_conv cursor-pointer" style={{ padding: '0px', margin: '0px '}}>
                                                            <Col style={{ paddingTop: '3px' }} xs={2} sm={2} md={2} lg={2} xl={2}>
                                                                <FaCog style={{ fontSize: '0.8rem', color: '#0578fa' }} />
                                                            </Col>
                                                            <Col style={{ padding: '0px' }} xs={8} sm={8} md={8} lg={8} xl={8}>
                                                                <p style={{ color: 'black',fontSize: '0.8rem', margin: '5px 5px 5px 8px' }}>Manage Group</p>
                                                            </Col>
                                                        </Row>}
                                                        {(item.is_removed || item.is_exit)?"":<Row onClick={() => exitConversationRef(item)} className="text-left exit_chat_row_conv cursor-pointer" style={{ padding: '0px', margin: '0px '}}>
                                                            <Col style={{ paddingTop: '3px' }} xs={2} sm={2} md={2} lg={2} xl={2}>
                                                                <FaSignOutAlt style={{ fontSize: '0.8rem', color: '#58a847' }} />
                                                            </Col>
                                                            <Col style={{ padding: '0px' }} xs={8} sm={8} md={8} lg={8} xl={8}>
                                                                <p style={{ color: 'black',fontSize: '0.8rem', margin: '5px 5px 5px 8px' }}>Exit Group</p>
                                                            </Col>
                                                        </Row>}
                                                        <Row onClick={() => clearConversationRef(item, true)} className="text-left clear_chat_row_conv cursor-pointer" style={{ padding: '0px', margin: '0px '}}>
                                                            <Col style={{ paddingTop: '3px' }} xs={2} sm={2} md={2} lg={2} xl={2}>
                                                                <FaCommentSlash style={{ fontSize: '0.8rem', color: '#0578fa' }} />
                                                            </Col>
                                                            <Col style={{ padding: '0px' }} xs={8} sm={8} md={8} lg={8} xl={8}>
                                                                <p style={{ color: 'black',fontSize: '0.8rem', margin: '5px 5px 5px 8px' }}>Clear Messages</p>
                                                            </Col>
                                                        </Row>
                                                        {(item.is_removed || item.is_exit)?<Row onClick={() => deleteConversationRef(item, true)} className="text-left del_chat_row_conv cursor-pointer" style={{ padding: '0px', margin: '0px '}}>
                                                            <Col style={{ paddingTop: '3px' }} xs={2} sm={2} md={2} lg={2} xl={2}>
                                                                <FaTrash style={{ fontSize: '0.8rem', color: '#eb3e37' }} />
                                                            </Col>
                                                            <Col style={{ padding: '0px' }} xs={8} sm={8} md={8} lg={8} xl={8}>
                                                                <p style={{ color: 'black', fontSize: '0.8rem', margin: '5px 5px 5px 8px' }}>Delete Group</p>
                                                            </Col>
                                                        </Row>:""}                                                   
                                                    </div>:
                                                    <div>
                                                    <Row onClick={() => clearConversationRef(item, false)} className="text-center clear_chat_row_conv cursor-pointer" style={{ padding: '0px', margin: '0px '}}>
                                                        <Col style={{ paddingTop: '3px' }} xs={2} sm={2} md={2} lg={2} xl={2}>
                                                            <FaCommentSlash style={{ fontSize: '0.8rem', color: '#0578fa' }} />
                                                        </Col>
                                                        <Col style={{ padding: '0px' }} xs={8} sm={8} md={8} lg={8} xl={8}>
                                                            <p style={{ color: 'black',fontSize: '0.8rem', margin: '5px 0px 5px -18px' }}>Clear Messages</p>
                                                        </Col>
                                                    </Row>
                                                    <Row onClick={() => deleteConversationRef(item, false)} className="text-center del_chat_row_conv cursor-pointer" style={{ padding: '0px', margin: '0px '}}>
                                                        <Col style={{ paddingTop: '3px' }} xs={2} sm={2} md={2} lg={2} xl={2}>
                                                            <FaTrash style={{ fontSize: '0.8rem', color: '#eb3e37' }} />
                                                        </Col>
                                                        <Col style={{ padding: '0px' }} xs={8} sm={8} md={8} lg={8} xl={8}>
                                                            <p style={{ color: 'black', fontSize: '0.8rem', margin: '5px 0px 0px 5px' }}>Delete Conversation</p>
                                                        </Col>
                                                    </Row></div>}
                                                </Popover.Content>
                                                </Popover>
                                                }
                                            >
                                            <FaEllipsisV id={"conversation_menu_options_"+index} className="cursor-pointer delete_conversation_btn_conv_new"/>
                                            </OverlayTrigger>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>)}): <div className="text-center no_conversations">
                                <div>
                                    <PulseLoader
                                        css={conversationLoadingCss}
                                        size={8}
                                        color={"#0A73F0"}
                                        loading={conversationLoading}
                                    />
                                    </div>
                                </div>}
                    </Col>
                </Row>
            </Col>
            {Object.keys(currConversation).length > 0?<Col className="msg_lst" xs={7} sm={7} md={8} lg={9} xl={9}>
                <Row style={{ margin: '0px', padding: '0px' }}>
                    <Col className="msg_lst_toolbar" xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Toolbar
                        title={Object.keys(currConversation).length > 0?(currConversation.is_group?currConversation.group_name:currConversation.user.username):"Begin Conversation"}
                        leftItems={!currConversation.is_group?
                            (Object.keys(currConversation).length > 0?
                            (isConversationFriend && isConversationFriend.hasOwnProperty(currConversation.user.id) && isConversationFriend[currConversation.user.id]
                            ?[<OverlayTrigger
                            key="info" 
                            placement="top"
                            trigger={['hover', 'focus']}
                            onHide={hideInfoData}
                            overlay={currConversation?currConversation.is_group?'':currConversation.user?renderTooltip
                                    :<Tooltip><span>Info</span></Tooltip>
                                :<Tooltip><span>Info</span></Tooltip>}
                            >
                            <FaInfoCircle className="info" />
                            </OverlayTrigger>, <OverlayTrigger
                            key="user_friends"
                            placement="top"
                            overlay={
                                <Tooltip id="user_friends_tooltip">
                                <span>{currConversation.user.username} is your conversation friend.</span>
                                </Tooltip>
                            }
                            >
                            <FaUserCheck className="user_friends" />
                            </OverlayTrigger>]:isConversationFriend?[
                                <OverlayTrigger
                                placement="top"
                                key="info" 
                                trigger={['hover', 'focus']}
                                onHide={hideInfoData}
                                overlay={currConversation?currConversation.is_group?'':currConversation.user?renderTooltip
                                    :<Tooltip><span>Info</span></Tooltip>
                                :<Tooltip><span>Info</span></Tooltip>}
                                >
                                <FaInfoCircle className="info" />
                                </OverlayTrigger>, <OverlayTrigger
                                key="user_not_friends"
                                placement="top"
                                overlay={
                                    <Tooltip id="user_not_friends_tooltip">
                                    <span>{currConversation.user.username} is not your conversation friend anymore.</span>
                                    </Tooltip>
                                }
                                >
                                <FaUserTimes className="user_not_friends"/>
                                </OverlayTrigger>
                            ]:[<OverlayTrigger
                                placement="top"
                                key="info" 
                                trigger={['hover', 'focus']}
                                onHide={hideInfoData}
                                overlay={currConversation?currConversation.is_group?'':currConversation.user?renderTooltip
                                    :<Tooltip><span>Info</span></Tooltip>
                                :<Tooltip><span>Info</span></Tooltip>}
                                >
                                <FaInfoCircle className="info" />
                                </OverlayTrigger>]):[<OverlayTrigger
                                placement="top"
                                key="info" 
                                trigger={['hover', 'focus']}
                                onHide={hideInfoData}
                                overlay={currConversation?currConversation.is_group?'':currConversation.user?renderTooltip
                                    :<Tooltip><span>Info</span></Tooltip>
                                :<Tooltip><span>Info</span></Tooltip>}
                                >
                                <FaInfoCircle className="info" />
                                </OverlayTrigger>]):((currConversation.is_removed || currConversation.is_exit)?
                                [<OverlayTrigger
                                    placement="top"
                                    key="info" 
                                    overlay={renderTooltipGroup}
                                    >
                                    <FaInfoCircle className="info" />
                                </OverlayTrigger>]:[<OverlayTrigger
                                placement="top"
                                key="info" 
                                overlay={renderTooltipGroup}
                                >
                                <FaInfoCircle className="info" />
                                </OverlayTrigger>,
                                <OverlayTrigger
                                placement="top"
                                key="edit_group" 
                                overlay={<Tooltip id="edit_group_tooltip"><span>Manage Group</span></Tooltip>}
                                >
                                <FaCog onClick={() => editGroup(currConversation, "")} className="edit_group_details" />
                                </OverlayTrigger>
                                ])}
                        rightItems={Object.keys(currConversation).length > 0?currConversation.is_group?
                            (currConversation.is_removed || currConversation.is_exit)?
                            [
                            <OverlayTrigger
                            key="delete_conversation"
                            placement="top"
                            overlay={
                            <Tooltip id="delete_conversation_tooltip">
                                <span>Delete {currConversation.is_group?"Group":"Conversation"}</span>
                            </Tooltip>
                            }
                        >
                            <FaTrash
                            onClick={() => deleteConversationRef(currConversation, currConversation.is_group)}
                            className="delete_conversation"
                            />
                        </OverlayTrigger>,
                        <OverlayTrigger
                        key="clear_conversation"
                        placement="top"
                        overlay={
                            <Tooltip id="clear_conversation_tooltip">
                            <span>Clear Messages</span>
                            </Tooltip>
                        }
                        >
                        <FaCommentSlash
                            onClick={() => clearConversationRef(currConversation, currConversation.is_group)}
                            className="clear_conversation"
                        />
                        </OverlayTrigger>
                        ]:[
                        <OverlayTrigger
                        key="clear_conversation"
                        placement="top"
                        overlay={
                            <Tooltip id="clear_conversation_tooltip">
                            <span>Clear Messages</span>
                            </Tooltip>
                        }
                        >
                        <FaCommentSlash
                            onClick={() => clearConversationRef(currConversation, currConversation.is_group)}
                            className="clear_conversation"
                        />
                        </OverlayTrigger>,
                        <OverlayTrigger
                        key="exit_conversation"
                        placement="top"
                        overlay={
                        <Tooltip id="exit_conversation_tooltip">
                            <span>Exit Group</span>
                        </Tooltip>
                        }
                    >
                        <FaSignOutAlt
                        onClick={() => exitConversationRef(currConversation)}
                        className="exit_conversation"
                        />
                    </OverlayTrigger>
                        ]:[
                            <OverlayTrigger
                            key="delete_conversation"
                            placement="top"
                            overlay={
                            <Tooltip id="delete_conversation_tooltip">
                                <span>Delete {currConversation.is_group?"Group":"Conversation"}</span>
                            </Tooltip>
                            }
                        >
                            <FaTrash
                            onClick={() => deleteConversationRef(currConversation, currConversation.is_group)}
                            className="delete_conversation"
                            />
                        </OverlayTrigger>,
                        <OverlayTrigger
                        key="clear_conversation"
                        placement="top"
                        overlay={
                            <Tooltip id="clear_conversation_tooltip">
                            <span>Clear Messages</span>
                            </Tooltip>
                        }
                        >
                        <FaCommentSlash
                            onClick={() => clearConversationRef(currConversation, currConversation.is_group)}
                            className="clear_conversation"
                        />
                        </OverlayTrigger>
                        ]:[]}
                        />
                    </Col>
                </Row>
                <Row onScroll={() => handleMessageListOnScroll()} id="message_list" className={customClass}  style={{ padding: '0px 0px 6px 0px', margin: '0px' }}>
                    <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                        {Array.from(Array(0).keys()).map((item, index) => {
                            return (<p key={index}>MSGS  
                            {windowWidth} x {windowHeight}
                            </p>)
                        })}
                        {renderMessages()}
                        {/* <Button onClick={() => { setImageMsgVisible(true) }}>
                            View Image
                        </Button>
                        <Viewer
                            downloadable={true}
                            downloadInNewWindow={true}
                            attribute={false}
                            visible={imageMsgVisible}
                            onClose={() => { setImageMsgVisible(false) } }
                            images={[{src: 'https://picsum.photos/2000/3000?grayscale', alt: '', 
                            downloadUrl:"https://picsum.photos/2000/3000?grayscale" }]}
                        />
                        <p className="group_participant_status_msg">{conversationStatusMsg && conversationStatusMsg.hasOwnProperty(currConversation.id)?conversationStatusMsg[currConversation.id]:""}</p> */}
                    </Col>
                    <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                        <div id="messagesBottom"
                            ref={(el) => {
                            messagesEnd = el;
                            }}>
                        </div>
                    </Col>
                </Row>
                {scrollBtnVisible?
                <Button style={{ position:'absolute', zIndex: '10'}} size="sm" variant="danger" onClick={() => scrollToBottom(true)} className="scroll_btn">
                    <div>
                        <FaArrowDown style={{ marginRight: '8px' }} />You have a new message
                    </div>
                </Button>:""}
                {uploadingImg ? 
                <Row style={{padding: '0px', margin: '0px', backgroundColor: '#f4f5f7', borderRadius: '10px'}}>
                    <Col className="img_div_msg_list" xl={3} lg={3} md={5} sm={6} xs={10}>
                        {uploadImgSrc ? <img className="img-fluid square_msg_list" style={{ position: 'relative', padding: '15px' }} src={uploadImgSrc} />:
                            <div className="container">
                            <PulseLoader
                                css={uploadImgLoadingCss}
                                size={15}
                                color={"#0A73F0"}
                                loading={!uploadImgSrc}
                            />
                            </div>
                        }
                        {uploadImgSrc ?<OverlayTrigger
                            key="bottom"
                            placement="top"
                            overlay={
                            <Tooltip id="cancel_img_msg_tooltip">
                                <span>Cancel</span>
                            </Tooltip>
                            }
                        ><FaTimes onClick={() => cancelImgMsg()} style={{ position:'absolute', borderRadius: '50%',  border: '1px solid gray', backgroundColor: 'white', cursor: 'pointer', color: 'gray' }} />
                        </OverlayTrigger>:""}
                        </Col>
                </Row>: ""}
                {showEmojiPicker && !isMobile && !isTablet?<Row ref={emojiInputRef} className="emoji_picker_row" style={{ backgroundColor: 'red', padding: "0px", margin: "0px" }}>
                  <Col className="emoji_picker_col" xl={4} lg={4} md={4} sm={4} xs={4} style={{ padding: '0px' }}>
                  <Picker className="emoji_picker" onEmojiClick={onEmojiClick} />
                  </Col>
                </Row>:""}
                <Row style={{ position: 'relative', padding: '0px', margin: '0px' }}>
                    <Col
                        className="chat_msg_footer" 
                        xs={12}
                        sm={12}
                        md={7}
                        lg={9}
                        xl={10}>
                        <Form onSubmit={(e) => e.preventDefault()}>
                            <Form.Group controlId="composeMsg" className="compose-input">
                                <Form.Control
                                    onClick={() => handleMsgSeen()}
                                    onKeyDown={(e) => handleKeyDown(e)}
                                    onChange={(e) => handleChange(e)}
                                    autoComplete="off"
                                    name="inputMsg"
                                    type="text"
                                    value={inputMsg}
                                    placeholder={
                                    uploadImgSrc
                                        ? "Add some caption to your image."
                                        : "Type a message. @name"
                                    }
                                >
                                </Form.Control>
                            </Form.Group>
                        </Form>
                    </Col>
                    <Col
                        className="composeButtons"
                        xs={12}
                        sm={12}
                        md={5}
                        lg={3}
                        xl={2}
                        >
                        <Row style={{ margin: "0px", padding: "0px" }}>
                            <Col xl={1} lg={1} md={1} sm={1} xs={1}>
                            <OverlayTrigger
                                key="bottom"
                                placement="top"
                                overlay={
                                <Tooltip
                                    style={{
                                    display: inputMsg.length > 0 || uploadImgSrc ? "block" : "none",
                                    }}
                                    id="send_msg_tooltip"
                                >
                                    <span>Send</span>
                                </Tooltip>
                                }
                            >
                                <FaPaperPlane
                                onClick={() => handleMessageInput()}
                                className={
                                    inputMsg.length > 0 || uploadImgSrc
                                    ? "enable_send_btn"
                                    : "disable_send_btn"
                                }
                                />
                            </OverlayTrigger>
                            </Col>
                            <Col xl={1} lg={1} md={1} sm={1} xs={1}>
                            <OverlayTrigger
                                key="bottom"
                                placement="top"
                                overlay={
                                <Tooltip id="send_emoji_tooltip">
                                    <span>Emoji</span>
                                </Tooltip>
                                }
                            >
                                <FaSmile
                                onClick={() => handleEmojiPicker()}
                                className="composeIcons"
                                />
                            </OverlayTrigger>
                            </Col>
                            <Col xl={1} lg={1} md={1} sm={1} xs={1}>
                            <OverlayTrigger
                                key="bottom"
                                placement="top"
                                overlay={
                                <Tooltip id="send_img_tooltip">
                                    <span>Upload an Image</span>
                                </Tooltip>
                                }
                            >
                                <div className="message_image_upload">
                                <label htmlFor="upload_img_msg">
                                    <FaCamera className="composeIcons" />
                                </label>
                                <input
                                    accept="image/*"
                                    onChange={handleUploadImageChangeMethod}
                                    id="upload_img_msg"
                                    type="file"
                                />
                                </div>
                            </OverlayTrigger>
                            </Col>
                            <Col xl={1} lg={1} md={1} sm={1} xs={1}>
                            <OverlayTrigger
                                key="bottom"
                                placement="top"
                                overlay={
                                <Tooltip id="send_audio_tooltip">
                                    <span>Upload Audio</span>
                                </Tooltip>
                                }
                            >
                                <FaMicrophone className="composeIcons" />
                            </OverlayTrigger>
                            </Col>
                        </Row>
                        </Col>
                </Row>
            </Col>
            :""}
            <div id="overlay">
            <AtomSpinner/>
            </div>
            <div style={{ display: "none" }}>
                <Dialog
                    ref={(el) => {
                        CustomDialog = el;
                    }}
                />
            </div>
            <Modal
                show={showManageConversationsModal}
                onHide={closeManageConversationsModal}
                size="lg"
                backdrop="static"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >   <div id="loadingoverlay">
                    <AtomSpinner/>
                </div>
                <Modal.Header style={{ padding: "2%" }}>
                <Modal.Title id="contained-modal-title-vcenter">
                    <span style={{ fontSize: "1.2rem" }}>Manage Conversations</span>
                </Modal.Title>
                {Object.keys(conversationRequestModalErrors).length > 0?<Row style={{ padding: '0px', margin: '0px' }}>
                    <Col style={{ padding: '0px', margin: '0px'}} xs={12} sm={12} md={12} lg={12} xl={12}>
                    <OverlayTrigger
                        key="refresh"
                        placement="top"
                        overlay={
                            <Tooltip id="refresh_tooltip">
                            <span>Refresh</span>
                            </Tooltip>
                        }
                    >
                    <FaSync onClick={() => conversationModalRefresh()} className="refresh_conversation_modal float-right"/>
                    </OverlayTrigger>
                    </Col>
                </Row>:''}
                </Modal.Header>
                <Modal.Body
                className={loaderActive?"modalWrapper":""}
                style={{ paddingTop: "0px", paddingLeft: "0px", paddingRight: "0px" }}
                >
                <Tabs
                    className="nav-justified"
                    id="manage_chats_tab"
                    activeKey={key}
                    onSelect={(k) => setTabKey(k)}
                >
                    <Tab eventKey="friends" title={<span  style={{ fontSize: '0.9rem' }}>Friends</span>}>
                    <div
                        style={{
                        margin: "0px",
                        padding: "0px",
                        height: "400px",
                        overflowY: "scroll",
                        }}
                    >
                        {conversationRequestsModalData.hasOwnProperty("modal_friends") && conversationRequestsModalData.modal_friends &&
                        conversationRequestsModalData.modal_friends.length > 0 ? (
                        conversationRequestsModalData.modal_friends.map((friend, index) => {
                            return (
                            <Row
                                key={index}
                                style={{
                                padding: index == 0 ? "5% 0% 0% 0%" : "0% 0% 0% 0%",
                                margin: "0% 0% 1% 0%",
                                }}
                            >
                                <Col
                                xs={4}
                                sm={{ span: 2, offset: 3 }}
                                md={{ span: 2, offset: 3 }}
                                lg={{ span: 2, offset: 3 }}
                                xl={{ span: 2, offset: 3 }}
                                >
                                <img
                                    style={{
                                    margin: "0% 25%",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    }}
                                    src={
                                    friend.profile_picture
                                        ? friend.profile_picture
                                        : defaultProfilePictureImageDataUri
                                    }
                                    alt="profile_img"
                                />
                                </Col>
                                <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                                <p style={{ paddingTop: "5%" }}>{friend.username}</p>
                                </Col>
                                <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                                {friend.has_conversation?
                                <OverlayTrigger
                                key="has_conversation"
                                placement="top"
                                overlay={
                                    <Tooltip id="has_conversation_tooltip">
                                    <span>You already have a conversation.</span>
                                    </Tooltip>
                                }
                                >
                                <FaComment className="has_conversation" />
                                </OverlayTrigger>:
                                (friend.sent_conversation_request ? (
                                    <OverlayTrigger
                                    key="sent_conversation_request"
                                    placement="top"
                                    overlay={
                                        <Tooltip id="sent_conversation_request_tooltip">
                                        <span>Conversation Request Sent</span>
                                        </Tooltip>
                                    }
                                    >
                                    <FaCheckCircle className="sent_conversation_request" />
                                    </OverlayTrigger>
                                ) : (
                                    <OverlayTrigger
                                    key="send_conversation_request"
                                    placement="top"
                                    overlay={
                                        <Tooltip id="send_conversation_request">
                                        <span>Send Conversation Request</span>
                                        </Tooltip>
                                    }
                                    >
                                    <FaRegPaperPlane
                                        className="add_conversation"
                                        onClick={() => manageModalConversations("add", friend, "")}
                                    />
                                    </OverlayTrigger>)
                                )}
                                </Col>
                                <Col style={{ padding: '0px' }} xs={3} sm={3} md={3} lg={3} xl={3}>
                                    <div className="text-center conversation_modal_errors">{conversationRequestModalErrors.modal_friends?conversationRequestModalErrors.modal_friends[friend.id]: ''}</div>
                                </Col>
                            </Row>
                            );
                        })
                        ) : (
                        <Row style={{ padding: "0px", margin: "15%" }}>
                            <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                            <p
                                className="text-center"
                                style={{ fontSize: "1rem", fontWeight: "bold" }}
                            >
                                No Friends yet.
                            </p>
                            </Col>
                        </Row>
                        )}
                    </div>
                    </Tab>
                    <Tab eventKey="conversations" title={<span  style={{ fontSize: '0.9rem' }}>Conversations</span>}>
                    <div
                        style={{
                        margin: "0px",
                        padding: "0px",
                        height: "400px",
                        overflowY: "scroll",
                        }}
                    >
                        {conversationRequestsModalData.hasOwnProperty("modal_conversations") && conversationRequestsModalData.modal_conversations &&
                        conversationRequestsModalData.modal_conversations.length > 0 ? (
                        conversationRequestsModalData.modal_conversations.map((chat, index) => {
                            return (
                            <Row
                                key={index}
                                style={{
                                padding: index == 0 ? "5% 0% 0% 0%" : "0% 0% 0% 0%",
                                margin: "0% 0% 1% 0%",
                                }}
                            >
                                <Col
                                xs={4}
                                sm={{ span: 2, offset: 3 }}
                                md={{ span: 2, offset: 3 }}
                                lg={{ span: 2, offset: 3 }}
                                xl={{ span: 2, offset: 3 }}
                                >
                                <img
                                    style={{
                                    margin: "0% 25%",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    }}
                                    src={
                                    chat.profile_picture
                                        ? chat.profile_picture
                                        : defaultProfilePictureImageDataUri
                                    }
                                    alt="profile_img"
                                />
                                </Col>
                                <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                                <p style={{ paddingTop: "5%" }}>{chat.username}</p>
                                </Col>
                                <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                                <OverlayTrigger
                                    key="remove_conversation"
                                    placement="top"
                                    overlay={
                                    <Tooltip id="remove_conversation_tooltip">
                                        <span>Remove Conversation</span>
                                    </Tooltip>
                                    }
                                >
                                    <FaCommentSlash
                                    className="remove_conversation"
                                    onClick={() =>
                                        deleteConversationRequestRef("remove", chat, false)
                                    }
                                    />
                                </OverlayTrigger>
                                </Col>
                                <Col style={{ padding: '0px' }} xs={3} sm={3} md={3} lg={3} xl={3}>
                                    <div className="text-center conversation_modal_errors">{chat && chat.user && conversationRequestModalErrors.modal_conversations && conversationRequestModalErrors.modal_conversations.hasOwnProperty(chat.user.id)?conversationRequestModalErrors.modal_conversation_req[chat.user.id]:''}</div>
                                </Col>
                            </Row>
                            );
                        })
                        ) : (
                        <Row style={{ padding: "0px", margin: "15%" }}>
                            <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                            <p
                                className="text-center"
                                style={{ fontSize: "1rem", fontWeight: "bold" }}
                            >
                                No Conversations yet.
                            </p>
                            </Col>
                        </Row>
                        )}
                    </div>
                    </Tab>
                    <Tab eventKey="conversation_requests" title={
                    <Row style={{ padding: '0px', margin: '0px'}}>
                    <Col xl={12} lg={12} md={12} sm={12} xs={12}>
                    <span style={{ fontSize: '0.9rem' }}>Conversation Requests</span>
                    {conversationReqNotificationCount > 0?
                    <div style={{  float: 'right',  backgroundColor: 'red', height: '6px', width: '6px', borderRadius: '100%'}}>
                    </div>:""}
                    </Col>
                    </Row>}>
                    <div
                        style={{
                        margin: "0px",
                        padding: "0px",
                        height: "400px",
                        overflowY: "scroll",
                        }}
                    >
                        {conversationRequestsModalData.hasOwnProperty("modal_conversation_requests") && conversationRequestsModalData.modal_conversation_requests &&
                        conversationRequestsModalData.modal_conversation_requests.length > 0 ? (
                        conversationRequestsModalData.modal_conversation_requests.map((conversationReq, index) => {
                            return (
                            <Row
                                key={index}
                                style={{
                                padding: index == 0 ? "5% 0% 0% 0%" : "0% 0% 0% 0%",
                                margin: "0% 0% 1% 0%",
                                }}
                            >
                                <Col
                                xs={4}
                                sm={{ span: 2, offset: 3 }}
                                md={{ span: 2, offset: 3 }}
                                lg={{ span: 2, offset: 3 }}
                                xl={{ span: 2, offset: 3 }}
                                >
                                <img
                                    style={{
                                    margin: "0% 25%",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    }}
                                    src={
                                    conversationReq.profile_picture
                                        ? conversationReq.profile_picture
                                        : defaultProfilePictureImageDataUri
                                    }
                                    alt="profile_img"
                                />
                                </Col>
                                <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                                <p style={{ paddingTop: "5%" }}>{conversationReq.username}</p>
                                </Col>
                                <Col xs={3} sm={3} md={2} lg={2} xl={2}>
                                <OverlayTrigger
                                    key="accept_cr"
                                    placement="top"
                                    overlay={
                                    <Tooltip id="accept_cr_tooltip">
                                        <span>Accept</span>
                                    </Tooltip>
                                    }
                                >
                                    <FaCheck
                                    className="accept_conversation_request"
                                    onClick={() => manageModalConversations("accept", conversationReq, "")}
                                    />
                                </OverlayTrigger>
                                <OverlayTrigger
                                    key="reject_cr"
                                    placement="top"
                                    overlay={
                                    <Tooltip id="reject_cr_tooltip">
                                        <span>Reject</span>
                                    </Tooltip>
                                    }
                                >
                                    <FaTimes
                                    className="reject_conversation_request"
                                    onClick={() => manageModalConversations("reject", conversationReq, "")}
                                    />
                                </OverlayTrigger>
                                </Col>
                                <Col style={{ padding: '0px' }} xs={3} sm={3} md={3} lg={3} xl={3}>
                                    <div className="text-center conversation_modal_errors">{conversationRequestModalErrors.modal_conversation_req?conversationRequestModalErrors.modal_conversation_req[conversationReq.id]:''}</div>
                                </Col>
                            </Row>
                            );
                        })
                        ) : (
                        <Row style={{ padding: "0px", margin: "15%" }}>
                            <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                            <p
                                className="text-center"
                                style={{ fontSize: "1rem", fontWeight: "bold" }}
                            >
                                No Conversation Requests yet.
                            </p>
                            </Col>
                        </Row>
                        )}
                    </div>
                    </Tab>
                    <Tab eventKey="sent_conversation_requests" title={<span  style={{ fontSize: '0.9rem' }}>Sent Conversation Requests</span>}>
                    <div
                        style={{
                        margin: "0px",
                        padding: "0px",
                        height: "400px",
                        overflowY: "scroll",
                        }}
                    >
                        {Object.keys(conversationRequestsModalData).length > 0 &&
                        conversationRequestsModalData.hasOwnProperty("modal_sent_conversation_requests") && conversationRequestsModalData.modal_conversation_requests &&
                        conversationRequestsModalData.modal_sent_conversation_requests.length > 0 ? (
                            conversationRequestsModalData.modal_sent_conversation_requests.map(
                            (conversationReq, index) => {
                            return (
                                <Row
                                key={index}
                                style={{
                                    padding: index == 0 ? "5% 0% 0% 0%" : "0% 0% 0% 0%",
                                    margin: "0% 0% 1% 0%",
                                }}
                                >
                                <Col
                                    xs={4}
                                    sm={{ span: 2, offset: 3 }}
                                    md={{ span: 2, offset: 3 }}
                                    lg={{ span: 2, offset: 3 }}
                                    xl={{ span: 2, offset: 3 }}
                                >
                                    <img
                                    style={{
                                        margin: "0% 25%",
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                    }}
                                    src={
                                        conversationReq.profile_picture
                                        ? conversationReq.profile_picture
                                        : defaultProfilePictureImageDataUri
                                    }
                                    alt="profile_img"
                                    />
                                </Col>
                                <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                                    <p style={{ paddingTop: "5%" }}>
                                    {conversationReq.username}
                                    </p>
                                </Col>
                                <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                                    <OverlayTrigger
                                    key="cancel_cr"
                                    placement="top"
                                    overlay={
                                        <Tooltip id="cancel_cr_tooltip">
                                        <span>Cancel Conversation Request</span>
                                        </Tooltip>
                                    }
                                    >
                                    <FaTimes
                                        className="cancel_conversation_request"
                                        onClick={() =>
                                        cancelConversationRequestRef("cancel", conversationReq, conversationReq.chat_id)
                                        }
                                    />
                                    </OverlayTrigger>
                                </Col>
                                <Col style={{ padding: '0px' }} xs={3} sm={3} md={3} lg={3} xl={3}>
                                    <div className="text-center conversation_modal_errors">{conversationRequestModalErrors.modal_sent_conversation_req?conversationRequestModalErrors.modal_sent_conversation_req[conversationReq.id]:''}</div>
                                </Col>
                                </Row>
                            );
                            }
                        )
                        ) : (
                        <Row style={{ padding: "0px", margin: "15%" }}>
                            <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                            <p
                                className="text-center"
                                style={{ fontSize: "1rem", fontWeight: "bold" }}
                            >
                                No Sent Conversation Requests yet.
                            </p>
                            </Col>
                        </Row>
                        )}
                    </div>
                    </Tab>
                    <Tab eventKey="groups" title={<span  style={{ fontSize: '0.9rem' }}>Groups</span>}>
                    <div
                        style={{
                        margin: "0px",
                        padding: "0px",
                        height: "400px",
                        overflowY: "scroll",
                        }}
                    >
                        {conversationRequestsModalData.hasOwnProperty("modal_groups") && conversationRequestsModalData.modal_groups &&
                        conversationRequestsModalData.modal_groups.length > 0 ? (
                        conversationRequestsModalData.modal_groups.map((group, index) => {
                            return (
                            (group.is_removed || group.is_exit)?
                            <Row
                                key={index}
                                style={{
                                padding: index == 0 ? "5% 0% 0% 0%" : "0% 0% 0% 0%",
                                margin: "0% 0% 1% 0%",
                                }}
                            >
                                <Col
                                xs={4}
                                sm={{ span: 2, offset: 3 }}
                                md={{ span: 2, offset: 3 }}
                                lg={{ span: 2, offset: 3 }}
                                xl={{ span: 2, offset: 3 }}
                                >
                                <img
                                    style={{
                                    margin: "0% 25%",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    }}
                                    src={
                                        group.group_profile_picture
                                        ? group.group_profile_picture
                                        : defaultGroupProfilePictureImageDataUri
                                    }
                                    alt="profile_img"
                                />
                                </Col>
                                <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                                <p style={{ paddingTop: "5%" }}>{group.group_name}</p>
                                </Col>
                                <Col xs={1} sm={1} md={1} lg={1} xl={1}>
                                <OverlayTrigger
                                    key="remove_group"
                                    placement="top"
                                    overlay={
                                    <Tooltip id="remove_group_tooltip">
                                        <span>Delete Group</span>
                                    </Tooltip>
                                    }
                                >
                                    <FaTrashAlt
                                    className="remove_group"
                                    onClick={() =>
                                        deleteConversationRef(group, true)
                                    }
                                    />
                                </OverlayTrigger>
                                </Col>
                                {/* <Col style={{ padding: '0px' }} xs={3} sm={3} md={3} lg={3} xl={3}>
                                    <div className="text-center conversation_modal_errors">{chat && chat.user && conversationRequestModalErrors.modal_conversations && conversationRequestModalErrors.modal_conversations.hasOwnProperty(chat.user.id)?conversationRequestModalErrors.modal_conversation_req[chat.user.id]:''}</div>
                                </Col> */}
                            </Row>:
                            <Row
                                key={index}
                                style={{
                                padding: index == 0 ? "5% 0% 0% 0%" : "0% 0% 0% 0%",
                                margin: "0% 0% 1% 0%",
                                }}
                            >
                                <Col
                                xs={4}
                                sm={{ span: 2, offset: 3 }}
                                md={{ span: 2, offset: 3 }}
                                lg={{ span: 2, offset: 3 }}
                                xl={{ span: 2, offset: 3 }}
                                >
                                <img
                                    style={{
                                    margin: "0% 25%",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    }}
                                    src={
                                        group.group_profile_picture
                                        ? group.group_profile_picture
                                        : defaultGroupProfilePictureImageDataUri
                                    }
                                    alt="profile_img"
                                />
                                </Col>
                                <Col xs={2} sm={2} md={2} lg={2} xl={2}>
                                <p style={{ paddingTop: "5%" }}>{group.group_name}</p>
                                </Col>
                                <Col style={{ padding: "0px" }} xs={1} sm={1} md={1} lg={1} xl={1}>
                                <OverlayTrigger
                                    key="edit_group"
                                    placement="top"
                                    overlay={
                                    <Tooltip id="edit_group_tooltip">
                                        <span>Manage Group</span>
                                    </Tooltip>
                                    }
                                >
                                    <FaCog
                                    className="edit_group float-right"
                                    onClick={() =>
                                        editGroup(group, "modal")
                                    }
                                    />
                                </OverlayTrigger>
                                </Col>
                                <Col xs={1} sm={1} md={1} lg={1} xl={1}>
                                <OverlayTrigger
                                    key="exit_group"
                                    placement="top"
                                    overlay={
                                    <Tooltip id="exit_group_tooltip">
                                        <span>Exit Group</span>
                                    </Tooltip>
                                    }
                                >
                                    <FaSignOutAlt
                                    className="exit_group"
                                    onClick={() =>
                                        exitConversationRef(group)
                                    }
                                    />
                                </OverlayTrigger>
                                </Col>
                                {/* <Col style={{ padding: '0px' }} xs={3} sm={3} md={3} lg={3} xl={3}>
                                    <div className="text-center conversation_modal_errors">{chat && chat.user && conversationRequestModalErrors.modal_conversations && conversationRequestModalErrors.modal_conversations.hasOwnProperty(chat.user.id)?conversationRequestModalErrors.modal_conversation_req[chat.user.id]:''}</div>
                                </Col> */}
                            </Row>
                            );
                        })
                        ) : (
                        <Row style={{ padding: "0px", margin: "15%" }}>
                            <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                            <p
                                className="text-center"
                                style={{ fontSize: "1rem", fontWeight: "bold" }}
                            >
                                No Groups yet.
                            </p>
                            </Col>
                        </Row>
                        )}
                    </div>
                    </Tab>
                </Tabs>
                </Modal.Body>
                <Modal.Footer>
                <Row style={{ padding: "0px", margin: "0px" }}>
                    <Col xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Button
                        className="float-right"
                        size="sm"
                        variant="danger"
                        onClick={() => closeManageConversationsModal()}
                    >
                        Close
                    </Button>
                    </Col>
                </Row>
                </Modal.Footer>
            </Modal>
        </Row>
    );
    });

export default withRouter(CustomMessenger);