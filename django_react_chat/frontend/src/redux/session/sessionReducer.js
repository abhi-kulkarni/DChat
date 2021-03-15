import { last_seen } from "./sessionActions";
import {
  SIGN_IN,
  SIGN_OUT,
  CLEAR_SESSION,
  USER_CREATED_SUCCESS,
  HAS_READ,
  IS_TYPING,
  MSG_COUNT,
  FORGOT_PASSWORD_CLICKED,
  SPINNER_OVERLAY,
  USER_DATA,
  FRIEND_REQUESTS,
  NOTIFICATIONS,
  CHAT_REQUESTS,
  CHAT_MESSAGES,
  CHAT_STATUS,
  WS_LIST,
  LAST_SEEN,
  CHAT_DELETE,
  LAST_CHAT_SEEN_TIME,
  CURRENT_CHAT,
  CONVERSATION_MODAL_DATA,
  IS_REFRESHED,
  CURRENT_SELECTED_CONVERSATION,
  CONVERSATION_DELETE,
  MANAGE_REQUESTS_COUNT
} from "./sessionTypes";

const initialState = {
  isLoggedIn: false,
  user_created_success: false,
  forgot_password_clicked: false,
  spinner_overlay: false,
  user_data: {},
  friend_requests: {},
  chat_status: {},
  has_read: {},
  last_chat_seen_time:"",
  notifications: [],
  current_chat:{},
  chat_requests: {},
  chat_messages: { messages: [], recent_msg_data: {}, type: "" },
  ws_list: [],
  last_seen: {},
  is_typing: {},
  msg_count: {},
  chat_delete:{},
  conversation_modal_data:{},
  is_refreshed:false,
  current_selected_conversation: {},
  conversation_delete:{},
  manage_request_count:{}
};

const sessionReducer = (state = initialState, action) => {
  switch (action.type) {
    case SIGN_IN:
      return {
        ...state,
        isLoggedIn: true,
      };
    case SIGN_OUT:
      return {
        ...state,
        isLoggedIn: false,
      };
    case CLEAR_SESSION:
      return {
          isLoggedIn: false,
          spinner_overlay: false,
          user_data: {},
          forgot_password_clicked:state.forgot_password_clicked,
          friend_requests: {},
          chat_status: {},
          notifications: [],
          current_chat:{},
          chat_requests: {},
          last_seen: {},
          last_chat_seen_time:"",
          has_read: {},
          msg_count: {},
          is_typing: {},
          chat_delete:{},
          chat_messages: { messages: [], recent_msg_data: {}, type: "" },
          conversation_modal_data:{},
          is_refreshed:false,
          current_selected_conversation: {},
          conversation_delete:{},
          manage_request_count:{}
      };
    case USER_CREATED_SUCCESS:
      return {
        ...state,
        user_created_success: true,
      };
    case FORGOT_PASSWORD_CLICKED:
      return {
        ...state,
        forgot_password_clicked: true,
      };
    case SPINNER_OVERLAY:
      return {
        ...state,
        spinner_overlay: action.payload,
      };
    case CURRENT_CHAT:
      return {
        ...state,
        current_chat: action.payload,
      };
    case USER_DATA:
      return {
        ...state,
        user_data: action.payload,
      };
    case FRIEND_REQUESTS:
      return {
        ...state,
        friend_requests: action.payload,
      };
    case CONVERSATION_MODAL_DATA:
      let temp_conv_modal_data = {};
      let curr_conv_modal_data = state.conversation_modal_data;
      if(action.req_type === "last_seen"){
        temp_conv_modal_data = {...curr_conv_modal_data, last_seen_conversation_requests: action.payload}
      }else{
        temp_conv_modal_data = action.payload;
      } 
      return {
        ...state,
        conversation_modal_data:temp_conv_modal_data
      }
    case IS_REFRESHED:
      return {
        ...state,
        is_refreshed:action.payload
      }
    case CURRENT_SELECTED_CONVERSATION:
      return {
        ...state,
        current_selected_conversation:action.payload
      }
    case CONVERSATION_DELETE:
      let temp_conv_delete = {};
      let curr_conv_delete = state.conversation_delete;
      if(action.req_type === "remove"){
        temp_conv_delete = {...curr_conv_delete, remove: action.payload};
      }else if(action.req_type === "delete"){ 
        temp_conv_delete = {...curr_conv_delete, delete: action.payload};
      }else if(action.req_type === "clear"){ 
        temp_conv_delete = {...curr_conv_delete, clear: action.payload};
      }else if(action.req_type === "exit_group"){ 
        temp_conv_delete = {...curr_conv_delete, exit_group: action.payload};
      }else if(action.req_type === "delete_group"){ 
        temp_conv_delete = {...curr_conv_delete, delete_group: action.payload};
      }else if(action.req_type === "clear_group"){ 
        temp_conv_delete = {...curr_conv_delete, clear_group: action.payload};
      }else if(action.req_type === "remove_group"){ 
        temp_conv_delete = {...curr_conv_delete, remove_group: action.payload};
      }else{
        temp_conv_delete = curr_conv_delete;
      }
      return {
        ...state,
        conversation_delete:temp_conv_delete
      }
    case LAST_CHAT_SEEN_TIME:
      return {
        ...state,
        last_chat_seen_time: action.payload,
      };
    case CHAT_DELETE:
      let curr_chat_delete_dict = state.chat_delete;
      return {
        ...state,
        chat_delete: action.payload.chat_delete,
      };
    case CHAT_REQUESTS:
      let temp = {};
      let curr_chat_requests = state.chat_requests;
      if (action.payload.type === "last_seen") {
        temp = {
          ...curr_chat_requests,
          last_seen: action.payload.chat_requests,
        };
      } else if (action.payload.type === "is_typing") {
        let curr_typing_dict = {};
        Object.keys(curr_chat_requests).map((item) => {
          if (item === "is_typing") {
            curr_typing_dict = { ...curr_chat_requests[item] };
            curr_typing_dict[action.payload.chat_requests.chat_id] =
              action.payload.chat_requests.status;
          }
        });
        temp = { ...curr_chat_requests, is_typing: curr_typing_dict };
      } else if(action.payload.type === "action_change") {
        temp = { ...curr_chat_requests, action: "" }
      }else if (action.payload.type === "recent_msg") {
        let new_reqd_chat_data = [];
        Object.keys(curr_chat_requests).map((item) => {
          if (item === "reqd_chat_data") {
            let curr_reqd_chat_data = curr_chat_requests[item];
            new_reqd_chat_data = curr_reqd_chat_data && curr_reqd_chat_data.map((innerItem) => {
              if (
                innerItem.chat_id === action.payload.chat_requests["chat_id"]
              ) {
                innerItem["chat"]["text"] =
                  action.payload.chat_requests["content"];
              }
              return innerItem;
            });
          }
        });
        temp = { ...curr_chat_requests, reqd_chat_data: new_reqd_chat_data };
      } else if(action.payload.type === 'recent_msg_resp') {
        temp = { ...curr_chat_requests, modal_chats: action.payload.chat_requests };
      } else {
        temp = action.payload.chat_requests;
      }
      return {
        ...state,
        chat_requests: temp,
      };
    case WS_LIST:
      return {
        ...state,
        ws_list: action.payload,
      };
    case NOTIFICATIONS:
      let req_notification_type = action.payload.req_type;
      let req_notifications = action.payload.notifications;
      let curr_notifications = state.notifications;
      let temp_notifications = [];
      if(req_notification_type === 'new'){
        temp_notifications = curr_notifications.concat(req_notifications);
      }else{
        temp_notifications = req_notifications;
      }
      return {
        ...state,
        notifications: temp_notifications
      };
    case CHAT_MESSAGES:
      let temp_chat_msgs = {};
      let temp_chat_reqs = {};
      let current_chat_requests = state.chat_requests;
      if (action.payload.type === "clear_chat") {
        temp_chat_reqs = state.chat_requests;
        temp_chat_msgs = {
          messages: action.payload.messages,
          type: action.payload.type,
          recent_msg_data: action.payload.recent_msg_data,
          is_typing: action.payload.is_typing
        }
      }else{
        let extra_data = action.payload.messages.hasOwnProperty('extra_data')?action.payload.messages['extra_data']:{};
        let is_deleted = extra_data['delete_chat_dict'];
        let is_cleared = extra_data['clear_chat_dict']
        let curr_reqd_chat_data = current_chat_requests['reqd_chat_data'];
        if(curr_reqd_chat_data){
          curr_reqd_chat_data = curr_reqd_chat_data.map(item => {
            if(item.chat_id === action.payload.messages.chatId){
              item.is_deleted = is_deleted;
              item.is_cleared = is_cleared;
            }
            return item;
          });
        }
        temp_chat_reqs = {
          ...current_chat_requests,
          reqd_chat_data: curr_reqd_chat_data
        }
        temp_chat_msgs = {
          messages: Array.isArray(action.payload.messages)
            ? action.payload.messages
            : [...state.chat_messages.messages, action.payload.messages],
          type: action.payload.type,
          recent_msg_data: action.payload.recent_msg_data,
          is_typing: action.payload.is_typing,
        }
      }
      return {
        ...state,
        chat_messages:temp_chat_msgs,
        chat_requests:temp_chat_reqs
      };
    case CHAT_STATUS:
      let curr_chat_status = state.chat_status;
      if (curr_chat_status && action.payload.user_id) {
        curr_chat_status[action.payload.user_id] = action.payload.status;
      }
      return {
        ...state,
        chat_status: curr_chat_status,
      };
    case IS_TYPING:
      let c_id = action.payload.chat_id;
      let is_typing_dict = state.is_typing;
      if (!is_typing_dict.hasOwnProperty(c_id)) {
        is_typing_dict[c_id] = {};
      }
      is_typing_dict[c_id][action.payload.user_id] = action.payload.status;
      return {
        ...state,
        is_typing: is_typing_dict,
      };
    case HAS_READ:
      let chat_id = action.payload.chat_id;
      let has_read_dict = state.has_read;
      if (!has_read_dict.hasOwnProperty(chat_id)) {
        has_read_dict[chat_id] = {};
      } else {
        has_read_dict[chat_id][action.payload.user_id] = {
          has_read: action.payload.has_read,
          user_id: action.payload.user_id,
          recipient_id: action.payload.hasOwnProperty("recipient_id")
            ? action.payload.recipient_id
            : "",
        };
      }
      return {
        ...state,
        has_read: has_read_dict,
      };
    case MSG_COUNT:
      return {
        ...state,
        msg_count: action.payload,
      };
    case LAST_SEEN:
      return {
        ...state,
        last_seen: action.payload,
      };
    case MANAGE_REQUESTS_COUNT:
      let temp_requests_count_data = {};
      let rec_count = action.payload;
      let rec_type = action.req_type;
      let curr_manage_requests_count_dict = state.manage_request_count;
      if(rec_type === "conversations"){
        temp_requests_count_data = {...curr_manage_requests_count_dict, conversations: rec_count}
      }else{
        temp_requests_count_data = {...curr_manage_requests_count_dict, friends: rec_count}
      }
      return {
        ...state,
        manage_request_count: temp_requests_count_data,
      };
    default:
      return state;
  }
};

export default sessionReducer;
