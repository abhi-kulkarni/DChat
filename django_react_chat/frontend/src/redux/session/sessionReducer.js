import {SIGN_IN, SIGN_OUT, USER_CREATED_SUCCESS, SPINNER_OVERLAY, USER_DATA, FRIEND_REQUESTS, ONLINE_STATUS} from './sessionTypes'

const initialState = {
    isLoggedIn: false,
    user_created_success:false,
    spinner_overlay:false,
    user_data:{},
    friend_requests:[],
    online_status: {}
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
