import {SIGN_IN, SIGN_OUT, USER_CREATED_SUCCESS, FORGOT_PASSWORD_CLICKED, SPINNER_OVERLAY, USER_DATA, FRIEND_REQUESTS, ONLINE_STATUS, NOTIFICATIONS, CHAT_REQUESTS, CHAT_MESSAGES} from './sessionTypes'

const initialState = {
    isLoggedIn: false,
    user_created_success:false,
    forgot_password_clicked:false,
    spinner_overlay:false,
    user_data:{},
    friend_requests:{},
    online_status: {},
    notifications: [],
    chat_requests:{},
    chat_messages: {},
};

const sessionReducer = (state = initialState, action) => {
    switch (action.type) {
        case SIGN_IN:
            return {
                ...state,
                isLoggedIn: true
            };
        case SIGN_OUT:
            return {
                ...state,
                isLoggedIn: false
            };
        case USER_CREATED_SUCCESS:
            return {
                ...state,
                user_created_success: true
            };
        case FORGOT_PASSWORD_CLICKED:
            return {
                ...state,
                forgot_password_clicked: true
            };
        case SPINNER_OVERLAY:
            return {
                ...state,
                spinner_overlay: action.payload
            };
        case USER_DATA:
            return {
                ...state,
                user_data: action.payload
            };
        case FRIEND_REQUESTS:
            return {
                ...state,
                friend_requests: action.payload
            };
        case CHAT_REQUESTS:
            return {
                ...state,
                chat_requests: action.payload
            };
        case NOTIFICATIONS:
            return {
                ...state,
                notifications: action.payload.notifications
            };    
        case CHAT_MESSAGES:
            return {
                ...state,
                chat_messages: { 'messages':Array.isArray(action.payload.messages)?action.payload.messages:[...state.chat_messages.messages, action.payload.messages],
                 'type': action.payload.type }
            }    
        case ONLINE_STATUS:
            return {
                ...state,
                online_status: action.payload
            };
        default:
            return state
    }
};

export default sessionReducer
