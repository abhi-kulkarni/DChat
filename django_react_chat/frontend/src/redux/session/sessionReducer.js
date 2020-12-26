import { last_seen } from './sessionActions';
import {SIGN_IN, SIGN_OUT, CLEAR_SESSION, USER_CREATED_SUCCESS, HAS_READ, FORGOT_PASSWORD_CLICKED, SPINNER_OVERLAY, USER_DATA, FRIEND_REQUESTS, NOTIFICATIONS, CHAT_REQUESTS, CHAT_MESSAGES, CHAT_STATUS, WS_LIST, LAST_SEEN} from './sessionTypes'

const initialState = {
    isLoggedIn: false,
    user_created_success:false,
    forgot_password_clicked:false,
    spinner_overlay:false,
    user_data:{},
    friend_requests:{},
    chat_status: {},
    has_read: {},
    notifications: [],
    chat_requests:{},
    chat_messages: {'messages': [], 'recent_msg_data': {}, 'type': ''},
    ws_list: [],
    last_seen:{}
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
        case CLEAR_SESSION:
            return {
                state: {
                    isLoggedIn: false,
                    spinner_overlay:false,
                    user_data:{},
                    friend_requests:{},
                    chat_status: {},
                    notifications: [],
                    chat_requests:{},
                    last_seen:{},
                    has_read:{},
                    chat_messages: {'messages': [], 'recent_msg_data': {}, 'type': ''},
                }
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
        case WS_LIST:
            return {
                ...state,
                ws_list: action.payload
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
                 'type': action.payload.type, 'recent_msg_data': action.payload.recent_msg_data}
            }    
        case CHAT_STATUS:
            let curr_chat_status = state.chat_status;
            if(curr_chat_status && action.payload.user_id){
                curr_chat_status[action.payload.user_id] = action.payload.status;
            }
            return {
                ...state,
                chat_status: curr_chat_status
            };
        case HAS_READ:
            let chat_id = action.payload.chat_id;
            let has_read_dict = state.has_read;
            if(!has_read_dict.hasOwnProperty(chat_id)){
                has_read_dict[chat_id] = {};
            }else{
                has_read_dict[chat_id][action.payload.user_id] = {'has_read': action.payload.has_read, 'user_id': action.payload.user_id, 'recipient_id': action.payload.hasOwnProperty('recipient_id')?action.payload.recipient_id:''};
            }
            return {
                ...state,
                has_read: has_read_dict
            };
        case LAST_SEEN:
            let curr_chat_id = action.payload.chat_id;
            let last_seen_dict = state.last_seen;
            if(!last_seen_dict.hasOwnProperty(curr_chat_id)){
                last_seen_dict[curr_chat_id] = {};
            }else{
                last_seen_dict[curr_chat_id][action.payload.user_id] = {'last_seen': action.payload.last_seen, 'user_id': action.payload.user_id, 'recipient_id': action.payload.hasOwnProperty('recipient_id')?action.payload.recipient_id:''};
            }
            return {
                ...state,
                last_seen: last_seen_dict,
            };
        default:
            return state
    }
};

export default sessionReducer
