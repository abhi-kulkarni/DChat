import {SIGN_IN, SIGN_OUT, USER_CREATED_SUCCESS, USER_DATA, SPINNER_OVERLAY, FRIEND_REQUESTS, ONLINE_STATUS} from "./sessionTypes";

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


export const friend_requests = (friend_requests = []) => {
    return {
        type:   FRIEND_REQUESTS,
        payload: friend_requests
    }
};


export const online_status = (online_status = {}) => {
    return {
        type:   ONLINE_STATUS,
        payload: online_status
    }
};