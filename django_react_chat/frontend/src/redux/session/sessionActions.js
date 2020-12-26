import {SIGN_IN, SIGN_OUT, CLEAR_SESSION, USER_CREATED_SUCCESS, USER_DATA, 
    SPINNER_OVERLAY, FRIEND_REQUESTS, FORGOT_PASSWORD_CLICKED, 
    NOTIFICATIONS, CHAT_REQUESTS, CHAT_MESSAGES, CHAT_STATUS, WS_LIST, LAST_SEEN, HAS_READ} from "./sessionTypes";

export const sign_in = () => {
    return {
        type: SIGN_IN
    }
};

export const sign_out = () => {
    return {
        type: SIGN_OUT
    }
};

export const clear_session = () => {
    return {
        type: CLEAR_SESSION
    }
};

export const user_created_success = () => {
    return {
        type: USER_CREATED_SUCCESS
    }
};

export const forgot_password_clicked = () => {
    return {
        type: FORGOT_PASSWORD_CLICKED
    }
};

export const spinner_overlay = (spinner_state = true) => {
    return {
        type: SPINNER_OVERLAY,
        payload: spinner_state
    }
};

export const user_data = (user_data = {}) => {
    return {
        type: USER_DATA,
        payload: user_data
    }
};


export const friend_requests = (friend_requests = {}) => {
    return {
        type:   FRIEND_REQUESTS,
        payload: friend_requests
    }
};

export const chat_requests = (chat_requests = {}) => {
    return {
        type:   CHAT_REQUESTS,
        payload: chat_requests
    }
};

export const notifications = (notifications = [], type="") => {
    return {
        type:   NOTIFICATIONS,
        payload: {'notifications':notifications, 'type': type}
    }
};


export const chat_status = (chat_status = {}) => {
    return {
        type:   CHAT_STATUS,
        payload: chat_status
    }
};

export const has_read = (has_read = {}) => {
    return {
        type:   HAS_READ,
        payload: has_read
    }
};

export const ws_list = (ws_list = []) => {
    return {
        type:   WS_LIST,
        payload: ws_list
    }
};

export const last_seen_time = (last_seen = {}) => {
    return {
        type:   LAST_SEEN,
        payload: last_seen
    }
};

export const chat_messages = (data = {}, type = '') => {
    return {
        type:   CHAT_MESSAGES,
        payload: {'messages': data['messages'], 'type': type, 'recent_msg_data': data['recent_msg_data']}
    }
};