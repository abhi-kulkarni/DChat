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
  notifications: [],
  chat_requests: {},
  chat_messages: { messages: [], recent_msg_data: {}, type: "" },
  ws_list: [],
  last_seen: {},
  is_typing: {},
  msg_count: {},
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
          friend_requests: {},
          chat_status: {},
          notifications: [],
          chat_requests: {},
          last_seen: {},
          has_read: {},
          msg_count: {},
          is_typing: {},
          chat_messages: { messages: [], recent_msg_data: {}, type: "" },
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
      } else if (action.payload.type === "recent_msg") {
        let new_reqd_chat_data = [];
        Object.keys(curr_chat_requests).map((item) => {
          if (item === "reqd_chat_data") {
            let curr_reqd_chat_data = curr_chat_requests[item];
            new_reqd_chat_data = curr_reqd_chat_data.map((innerItem) => {
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
        temp = { ...curr_chat_requests, chats: action.payload.chat_requests };
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
      return {
        ...state,
        notifications: [...state.notifications, ...action.payload.notifications]
      };
    case CHAT_MESSAGES:
      let temp_chat_msgs = {};
      if (action.payload.type === "clear_chat") {
        temp_chat_msgs = {
          messages: action.payload.messages,
          type: action.payload.type,
          recent_msg_data: action.payload.recent_msg_data,
          is_typing: action.payload.is_typing
        }
      }else{
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
        chat_messages:temp_chat_msgs
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
    default:
      return state;
  }
};

export default sessionReducer;
