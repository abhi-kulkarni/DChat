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
    if(type === 'chat'){
      chatUrl = chatUrl.replace('-', '')
      path = `${SOCKET_URL}/ws/chat/${chatUrl}/`;
    }
    else if(type === 'friend_requests'){
      path = `${SOCKET_URL}/ws/friend_requests/`;
    }
    else if(type === 'chat_requests'){
      path = `${SOCKET_URL}/ws/chat_requests/`;
    }
    if(path){
     
      this.socketRef = new WebSocket(path);

      this.socketRef.onopen = () => {
        console.log("WebSocket open");
      };
      this.socketRef.onmessage = e => {
        this.socketNewMessage(e.data);
      };
      this.socketRef.onerror = e => {
        console.log(e.message);
      };
      this.socketRef.onclose = () => {
        console.log("WebSocket closed let's reopen");
        this.connect();
      };
    }
  }

  disconnect() {
    this.socketRef.removeEventListener("open", () => {
        //pass
    });
    this.socketRef.removeEventListener("message", () => {
      //pass
    });
    this.socketRef.removeEventListener("error", () => {
      //pass
    });
    this.socketRef.removeEventListener("close", () => {
      //pass
    });
    if(this.socketRef){
      this.socketRef.close();
    }
  }

  socketNewMessage(data) {
    const parsedData = JSON.parse(data);
    const command = parsedData.command;
    if (Object.keys(this.callbacks).length === 0) {
      return;
    }
    if (command === "messages") {
      this.callbacks[command](parsedData.messages);
    }
    if (command === "new_message") {
      console.log('EMIT');
      this.callbacks[command](parsedData.message);
    }
    if (command === "friend_requests") {
      this.callbacks[command](JSON.parse(parsedData.friend_requests));
    }
    if (command === "chat_requests") {
      this.callbacks[command](JSON.parse(parsedData.chat_requests));
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
    });
  }

  fetchFriendRequests(userId, recipientUserId, action, notificationData) {
    this.sendMessage({
      user_id: userId,
      recipient_user_id: recipientUserId,
      action: action,
      notification_data: notificationData,
      command:'fetch_friend_requests'
    });
  }

  fetchChatRequests(userId, recipientUserId, action, chatId, notificationData) {
    this.sendMessage({
      user_id: userId,
      recipient_user_id: recipientUserId,
      chat_id: chatId,
      action: action,
      notification_data: notificationData,
      command:'fetch_chat_requests'
    });
  }

  addCallbacks(messagesCallback, newMessageCallback) {
    this.callbacks["messages"] = messagesCallback;
    this.callbacks["new_message"] = newMessageCallback;
    
  }

  friendRequestNotificationCallbacks(friendRequestCallback, sessionFriendRequestCallback){
    this.callbacks["friend_requests"] = friendRequestCallback;
  }

  conversationRequestNotificationCallbacks(chatRequestCallback, sessionChatRequestCallback){
    this.callbacks["chat_requests"] = chatRequestCallback;
  }

  sendMessage(data) {
    try {
      this.socketRef.send(JSON.stringify({ ...data }));
    } catch (err) {
      console.log(err.message);
    }
  }

  state() {
    return this.socketRef.readyState;
  }

  getCurrentSocketInstance() {
    return this.socketRef;
  }

}

const WebSocketInstance = WebSocketService.getInstance();

export default WebSocketInstance;
