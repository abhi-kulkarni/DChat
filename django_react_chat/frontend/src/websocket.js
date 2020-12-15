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
    let path;
    if(type === 'chat'){
      path = `${SOCKET_URL}/ws/chat/${chatUrl}/`;
    }
    else{
      path = `${SOCKET_URL}/ws/friend_requests/`;
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
    if(this.socketRef) {
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
      this.callbacks[command](parsedData.message);
    }
    if (command === "friend_requests") {
      this.callbacks[command](JSON.parse(parsedData.friend_requests));
    }
  }

  fetchMessages(username, chatId, owner) {
    this.sendMessage({
      command: "fetch_messages",
      username: username,
      chatId: chatId,
      owner:owner
    });
  }

  newChatMessage(message, owner) {
    this.sendMessage({
      command: "new_message",
      from: message.from,
      message: message.content,
      chatId: message.chatId,
      owner:owner
    });
  }

  newFriendRequest(userId) {
    this.sendMessage({
      user_id: userId,
      command:'new_friend_request'
    });
  }

  fetchFriendRequests(userId, recipientUserId, action) {
    this.sendMessage({
      user_id: userId,
      recipient_user_id: recipientUserId,
      action: action,
      command:'fetch_friend_requests'
    });
  }


  addCallbacks(messagesCallback, newMessageCallback, newChatRequestCallback, chatRequestStatusCallback, deleteChatCallback, deleteChatFriendCallback, setOnlineStatusCallback, fetchOnlineStatusCallback) {
    this.callbacks["messages"] = messagesCallback;
    this.callbacks["new_message"] = newMessageCallback;
    
  }

  friendRequestNotificationCallbacks(friendRequestCallback, sessionFriendRequestCallback){
    this.callbacks["friend_requests"] = friendRequestCallback;
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
