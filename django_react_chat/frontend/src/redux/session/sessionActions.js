import {SIGN_IN, SIGN_OUT, USER_CREATED_SUCCESS, USER_DATA, SPINNER_OVERLAY, FRIEND_REQUESTS, ONLINE_STATUS, FORGOT_PASSWORD_CLICKED, NOTIFICATIONS, CHAT_REQUESTS, CHAT_MESSAGES} from "./sessionTypes";

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


export const online_status = (online_status = {}) => {
    return {
        type:   ONLINE_STATUS,
        payload: online_status
    }
};

export const chat_messages = (chat_messages = [], type = '') => {
    return {
        type:   CHAT_MESSAGES,
        payload: {'messages': chat_messages, 'type': type}
    }
};