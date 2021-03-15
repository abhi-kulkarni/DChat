import {
  SIGN_IN,
  SIGN_OUT,
  CLEAR_SESSION,
  USER_CREATED_SUCCESS,
  USER_DATA,
  SPINNER_OVERLAY,
  FRIEND_REQUESTS,
  FORGOT_PASSWORD_CLICKED,
  NOTIFICATIONS,
  CHAT_REQUESTS,
  MSG_COUNT,
  CHAT_MESSAGES,
  CHAT_STATUS,
  WS_LIST,
  LAST_SEEN,
  HAS_READ,
  IS_TYPING,
  CHAT_DELETE,
  LAST_CHAT_SEEN_TIME,
  CURRENT_CHAT,
  CONVERSATION_MODAL_DATA,
  IS_REFRESHED,
  CURRENT_SELECTED_CONVERSATION,
  CONVERSATION_DELETE,
  MANAGE_REQUESTS_COUNT
} from "./sessionTypes";

export const sign_in = () => {
  return {
    type: SIGN_IN,
  };
};

export const sign_out = () => {
  return {
    type: SIGN_OUT,
  };
};

export const clear_session = () => {
  return {
    type: CLEAR_SESSION,
  };
};

export const user_created_success = () => {
  return {
    type: USER_CREATED_SUCCESS,
  };
};

export const forgot_password_clicked = () => {
  return {
    type: FORGOT_PASSWORD_CLICKED,
  };
};

export const spinner_overlay = (spinner_state = true) => {
  return {
    type: SPINNER_OVERLAY,
    payload: spinner_state,
  };
};

export const user_data = (user_data = {}) => {
  return {
    type: USER_DATA,
    payload: user_data,
  };
};

export const friend_requests = (friend_requests = {}) => {
  return {
    type: FRIEND_REQUESTS,
    payload: friend_requests,
  };
};

export const chat_requests = (chat_requests = {}, type = "") => {
  return {
    type: CHAT_REQUESTS,
    payload: { chat_requests: chat_requests, type: type },
  };
};

export const msg_count = (msg_count = {}) => {
  return {
    type: MSG_COUNT,
    payload: msg_count,
  };
};

export const notifications = (notifications = [], type = "") => {
  return {
    type: NOTIFICATIONS,
    payload: { notifications: notifications, req_type: type },
  };
};

export const chat_status = (chat_status = {}) => {
  return {
    type: CHAT_STATUS,
    payload: chat_status,
  };
};

export const is_typing = (is_typing = {}) => {
  return {
    type: IS_TYPING,
    payload: is_typing,
  };
};

export const has_read = (has_read = {}) => {
  return {
    type: HAS_READ,
    payload: has_read,
  };
};

export const ws_list = (ws_list = []) => {
  return {
    type: WS_LIST,
    payload: ws_list,
  };
};

export const last_seen_time = (last_seen = {}) => {
  return {
    type: LAST_SEEN,
    payload: last_seen,
  };
};

export const chat_messages = (data = {}, type = "") => {
  return {
    type: CHAT_MESSAGES,
    payload: {
      messages: data["messages"],
      type: type,
      recent_msg_data: data["recent_msg_data"],
    },
  };
};

export const chat_delete = (data = {}) => {
  return {
    type: CHAT_DELETE,
    payload: {
      chat_delete: data,
    },
  };
};

export const last_chat_seen_time = (data = "") => {
  return {
    type: LAST_CHAT_SEEN_TIME,
    payload: data,
  };
};

export const current_chat = (data = {}) => {
  return {
    type: CURRENT_CHAT,
    payload: data,
  };
};

export const conversation_modal_data = (data = {}, type="") => {
  return {
    type: CONVERSATION_MODAL_DATA,
    payload: data,
    req_type: type
  };
};

export const is_refreshed = (data = false) => {
  return {
    type: IS_REFRESHED,
    payload: data,
  };
};

export const current_selected_conversation = (data = {}) => {
  return {
    type: CURRENT_SELECTED_CONVERSATION,
    payload: data,
  };
};

export const conversation_delete = (data = {}, type = '') => {
  return {
    type: CONVERSATION_DELETE,
    payload: data,
    req_type: type
  };
};

export const manage_request_count = (data = {}, type = '') => {
  return {
    type: MANAGE_REQUESTS_COUNT,
    payload: data,
    req_type: type
  };
};