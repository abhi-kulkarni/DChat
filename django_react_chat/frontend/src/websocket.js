import { SOCKET_URL } from "./settings";

class WebSocketService {
  static instance = null;
  callbacks = {};

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  constructor() {
    this.socketRef = null;
  }

  connect(type, chatUrl) {
    let path = null;
    let self = this;
    if(type === "conversation"){
      path = `${SOCKET_URL}/ws/${type}/${chatUrl}/`;
    }else{
      if (type === "chat") {
        chatUrl = chatUrl.replace(/-/g, "_");
        path = `${SOCKET_URL}/ws/${type}/${chatUrl}/`;
      } else {
        if (type) {
          path = `${SOCKET_URL}/ws/${type}/`;
        }
      }
    }
    
    if (path) {
      this.socketRef = new WebSocket(path);
      this.socketRef.onopen = () => {
        console.log("WebSocket open");
      };
      this.socketRef.onmessage = (e) => {
        self.socketNewMessage(e.data);
      };
      this.socketRef.onerror = (e) => {
        console.log(e.message);
      };
      this.socketRef.onclose = () => {
        console.log("WebSocket closed let's reopen");
        self.connect();
      };
    }
  }

  disconnect() {
    this.socketRef.close();  
  }

  socketNewMessage(data) {
    const parsedData = JSON.parse(data);
    const command = parsedData.command;

    if (Object.keys(this.callbacks).length === 0) {
      return;
    }
    if (command === "messages" && this.callbacks.hasOwnProperty(command)) {
      this.callbacks[command](parsedData.messages);
    }
    if (command === "new_message" && this.callbacks.hasOwnProperty(command)) {
      this.callbacks[command](parsedData.message);
    }
    if (command === "friend_requests" && this.callbacks.hasOwnProperty(command)) {
      this.callbacks[command](parsedData.friends_modal_data);
    }
    if (command === "chat_requests" && this.callbacks.hasOwnProperty(command)) {
      this.callbacks[command](JSON.parse(parsedData.chat_requests));
    }
    if (command === "conversation_requests" && this.callbacks.hasOwnProperty(command)){
      this.callbacks[command](parsedData.conversation_modal_data);
    }
    if (command === "conversation_status" && this.callbacks.hasOwnProperty(command)) {
      this.callbacks[command](parsedData.conversation_status);
    }
    if (command === "is_typing" && this.callbacks.hasOwnProperty(command)) {
      this.callbacks[command](parsedData.is_typing);
    }
    if (command === "recent_msg" && this.callbacks.hasOwnProperty(command)) {
      this.callbacks[command](parsedData.message);
    }
    if (command === "last_seen" && this.callbacks.hasOwnProperty(command)) {
      this.callbacks[command](parsedData.last_seen);
    }
    if(command === "socket_data" && this.callbacks.hasOwnProperty(command)){
      this.callbacks[command](parsedData.socket_data);
    }
  }

  fetchMessages(uId, chatId) {
    this.sendMessage({
      command: "fetch_messages",
      userId: uId,
      chatId: chatId,
    });
  }

  newChatMessage(message) {
    this.sendMessage({
      command: "new_message",
      from: message.from,
      message: message.content,
      chatId: message.chatId,
      type: message.type,
    });
  }

  fetchSocketData(userId){
    this.sendMessage({
      user_id: userId,
      command: "fetch_socket_data",
    });
  }

  fetchFriendRequests(userId, recipientUserId, action, notificationData) {
    this.sendMessage({
      user_id: userId,
      recipient_user_id: recipientUserId,
      action: action,
      notification_data: notificationData,
      command: "fetch_friend_requests",
      request_source:'friend_requests'
    });
  }

  fetchChatRequests(
    userId,
    recipientUserId,
    action,
    chatId,
    notificationData,
    type
  ) {
    this.sendMessage({
      user_id: userId,
      recipient_user_id: recipientUserId,
      chat_id: chatId,
      action: action,
      notification_data: notificationData,
      type: type,
      command: "fetch_chat_requests",
    });
  }

  fetchConversationRequests(
    userId,
    recipientUserId,
    action,
    chatId,
    notificationData,
    type,
    isGroup,
    groupData
  ) {
    this.sendMessage({
      user_id: userId,
      recipient_user_id: recipientUserId,
      chat_id: chatId,
      action: action,
      notification_data: notificationData,
      type: type,
      command: "fetch_conversation_requests",
      is_group: isGroup,
      group_data:groupData,
      request_source:'conversation_requests'
    });
  }

  setConversationStatus(userId, status, type) {
    this.sendMessage({
      user_id: userId,
      status: status,
      type: type,
      command: "conversation_status",
    });
  }

  setIsTypingStatus(userId, status, chatId, type) {
    this.sendMessage({
      user_id: userId,
      status: status,
      type: type,
      chat_id: chatId,
      command: "is_typing",
    });
  }

  setLastSeen(data) {
    this.sendMessage({
      data: data,
      command: "last_seen",
    });
  }

  addCallbacks(messagesCallback, newMessageCallback, isTypingCallBack) {
    this.callbacks["messages"] = messagesCallback;
    this.callbacks["new_message"] = newMessageCallback;
    this.callbacks["is_typing"] = isTypingCallBack;
  }

  friendRequestNotificationCallbacks(
    friendRequestCallback,
    sessionFriendRequestCallback
  ) {
    this.callbacks["friend_requests"] = friendRequestCallback;
  }

  chatRequestNotificationCallbacks(
    chatRequestCallback,
    chatStatusCallback,
    recentMsgCallback,
    lastSeenMsgCallback,
    isTypingCallBack
  ) {
    this.callbacks["chat_requests"] = chatRequestCallback;
    this.callbacks["chat_status"] = chatStatusCallback;
    this.callbacks["recent_msg"] = recentMsgCallback;
    this.callbacks["last_seen"] = lastSeenMsgCallback;
    this.callbacks["is_typing"] = isTypingCallBack;
  }

  conversationRequestNotificationCallbacks(conversationRequestCallback, conversationStatusCallback){
    this.callbacks["conversation_requests"] = conversationRequestCallback;
    this.callbacks["conversation_status"] = conversationStatusCallback;

  }

  socketDataCallbacks(appDataCallback, conversationRequestDataCallback, 
    friendRequestDataCallback, conversationDataCallback){
    this.callbacks["socket_data"] = appDataCallback;
    this.callbacks["conversation_requests"] = conversationRequestDataCallback;
    this.callbacks["friend_requests"] = friendRequestDataCallback;
  }

  sendMessage(data) {
    try {
      this.socketRef.send(JSON.stringify({ ...data }));
    } catch (err) {
      console.log(err.message);
    }
  }

  state() {
    return this.socketRef && this.socketRef.readyState;
  }

  getCurrentSocketInstance() {
    return this.socketRef;
  }

  getCurrentWsList() {
    return [...new Set(this.ws)];
  }
}

const WebSocketInstance = WebSocketService.getInstance();

export default WebSocketInstance;
