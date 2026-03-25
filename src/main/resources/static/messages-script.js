let loginButton = document.getElementById("send-username-btn");
loginButton.addEventListener("click", login)

let publicChatButton = document.getElementById("public-chat-btn");
publicChatButton.addEventListener("click", () => {
    changeChat("public-chat", "Public chat")
    publicChatButton.style.setProperty("color", "white");
    publicChatButton.style.setProperty("border-color", "white")
    publicChatButton.style.setProperty("background", "deepskyblue");
    let publicChatButtonContainer = document.getElementById("public-chat-btn-container");
    if (!publicChatButtonContainer.querySelector(".new-message-counter").classList.contains("hidden")) {
        publicChatButtonContainer.querySelector(".new-message-counter").classList.add("hidden");
        publicChatButtonContainer.querySelector(".new-message-counter").innerHTML = "0";
    }
});

let sendMessageButton = document.getElementById("send-msg-btn");
sendMessageButton.addEventListener("click", sendMessage);

let messageInputArea = document.getElementById("input-msg");
messageInputArea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

let username = "Anonymous user";
let currentChatId = "public-chat";
let currentUser = "Public chat"
let stompClient = null;
let subscriptions = new Map();
let displayedMessages = new Set();

//TODO allow unique usernames only.
// Currently users can login with same usernames. This causes the whole application to behave unexpectedly.
// Implement a feature which prohibits other users from using the username of a user currently logged in.
function login() {
    let loginUsernameField = document.getElementById("input-username");
    if (loginUsernameField.value) {
        username = loginUsernameField.value;
        let loginLayer = document.getElementById("login-layer");
        loginLayer.style.setProperty("display", "none");
        document.getElementById("send-msg-panel").classList.remove("hidden");
        document.getElementById("connecting-element").classList.remove("hidden");
        document.getElementById("messages").classList.remove("hidden");
        document.getElementById("chat-with").classList.remove("hidden");
        document.getElementById("users").classList.remove("hidden");
        document.getElementById("public-chat-btn").classList.remove("hidden");
        connect();
    }
}

function changeChat(target, user) {
    if (stompClient) {
        let users = document.getElementById("users");
        for (let i = 0; i < users.children.length; i++) {
            users.children[i].style.setProperty("color", "black");
            users.children[i].style.setProperty("border-color", "lightgray");
            users.children[i].style.setProperty("background", "white");
        }
        let publicChatButton = document.getElementById("public-chat-btn");
        publicChatButton.style.setProperty("color", "black");
        publicChatButton.style.setProperty("border-color", "lightgray");
        publicChatButton.style.setProperty("background", "white");
        let messages = document.getElementById("messages");
        messages.innerHTML = "";
        displayedMessages.clear();
        currentChatId = target;
        currentUser = user;
        let chatWithText = document.getElementById("chat-with");
        chatWithText.textContent = currentUser;
        let chatId = target;
        if (!subscriptions.has("/topic/" + chatId)) {
            subscriptions.set("/topic/" + chatId, stompClient.subscribe("/topic/" + chatId, onMessageReceived));
        }
        let loadHistoryMessage = {
            type: "CHAT",
            content: "",
            sender: username,
            chatId: chatId
        };
        stompClient.send("/app/chat.loadHistory", {}, JSON.stringify(loadHistoryMessage));
    }
}

function sendMessage() {
    let messageInputArea = document.getElementById("input-msg");
    let messageContent = messageInputArea.value;
    if (messageContent && stompClient) {
        let connectionRequestMessage = {
            type: 'CONNECTION_REQUEST',
            sender: username,
            content: currentUser,
            chatId: currentChatId
        }
        stompClient.send("/app/chat.sendConnectionRequest", {}, JSON.stringify(connectionRequestMessage));
        let chatMessage = {
            type: 'CHAT',
            content: messageInputArea.value,
            sender: username,
            chatId: currentChatId
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInputArea.value = '';
    }
}

function connect(event) {
    if (username) {
        let socket = new SockJS("/ws");
        stompClient = Stomp.over(socket);
        stompClient.connect({}, onConnected, onError);
    }
    if (event) {
        event.preventDefault();
    }
}

function onConnected() {
    let sockJsUrl = stompClient.ws._transport.url;
    let sessionId = sockJsUrl.split('/')[5];
    if (!subscriptions.has("/queue/" + sessionId)) {
        subscriptions.set("/queue/" + sessionId, stompClient.subscribe("/queue/" + sessionId, onMessageReceived));
    }
    if (!subscriptions.has("/topic/public")) {
        subscriptions.set("/topic/public", stompClient.subscribe("/topic/public", onMessageReceived));
    }
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({
            type: "JOIN",
            content: username + " joined",
            sender: username,
            chatId: currentChatId
        }));
    let connectingElement = document.getElementById("connecting-element");
    connectingElement.classList.add("hidden");
}

function onError(error) {
    let connectingElement = document.getElementById("connecting-element");
    connectingElement.textContent = 'Could not connect to the server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
    console.log("Failed to connect to the server: \n" + error);
}

function onMessageReceived(payload) {
    console.log("Message received:", payload);
    let messageData = JSON.parse(payload.body);
    console.log("Parsed message:", messageData);

    switch (messageData.type) {
        case "JOIN":
            handleReceivedJoinMessage(messageData);
            break;

        case "LEAVE":
            handleReceivedLeaveMessage(messageData);
            break;

        case "CHAT":
            handleReceivedChatMessage(messageData);
            break;

        case "ADD_TO_USER_LIST":
            handleReceivedAddToUserListMessage(messageData);
            break;

        case "REMOVE_FROM_USER_LIST":
            handleReceivedDeleteFromUserListMessage(messageData);
            break;

        case "CONNECTION_REQUEST":
            handleReceivedConnectionRequestMessage(messageData);
    }
}

function handleReceivedChatMessage(messageData) {
    if (messageData.chatId !== currentChatId) {
        if (messageData.sender !== username) {
            incrementMessageCounter(messageData);
        }
        return;
    }
    let messageId = `${messageData.chatId}-${messageData.sender}-${messageData.date}-${messageData.content}`;
    if (displayedMessages.has(messageId)) {
        console.log("duplicate message skipped");
        return;
    }
    displayedMessages.add(messageId);

    let chatContainer = document.getElementById("messages");
    let messageContainer = document.createElement("div");
    let message = document.createElement("div");
    let profilePicture = document.createElement("div");
    let sender = document.createElement("div");
    let date = document.createElement("div");
    let messageContent = document.createElement("div");

    messageContainer.classList.add("message-container");
    message.classList.add("message");
    profilePicture.classList.add("profile-picture");
    sender.classList.add("sender");
    messageContent.classList.add("message-content");
    sender.textContent = messageData.sender;
    messageContent.textContent = messageData.content;
    let dateObject = new Date(messageData.date);
    date.textContent = dateObject.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
    });
    date.classList.add("date");
    message.append(sender);
    message.append(messageContent);
    messageContainer.appendChild(profilePicture);
    messageContainer.appendChild(message);
    message.append(date);
    chatContainer.appendChild(messageContainer);

    let inserted = false;
    let existingMessages = chatContainer.querySelectorAll('.message-container');
    for (let i = 0; i < existingMessages.length; i++) {
        let existingDate = existingMessages[i].querySelector(".date").textContent;
        if (messageData.date < existingDate) {
            chatContainer.insertBefore(messageContainer, existingMessages[i]);
            inserted = true;
            break;
        }
    }
    if (!inserted) {
        chatContainer.appendChild(messageContainer);
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;

    //move chat to the top
    let userList =  document.getElementById("users");
    let user = document.getElementById(currentUser);
    if (!messageData.fromHistory && user !== null) {
        userList.prepend(user);
    }
}

function incrementMessageCounter(messageData) {
    if (messageData.chatId === "public-chat") {
        let publicChatButtonContainer = document.getElementById("public-chat-btn-container");
        if (publicChatButtonContainer.children[1].classList.contains("hidden")) {
            publicChatButtonContainer.children[1].classList.remove("hidden");
        }
        let messageCounter = publicChatButtonContainer.querySelector(".new-message-counter");
        console.log("Preparing to increment the counter for public chat, current count: " + messageCounter.innerHTML);
        messageCounter.innerHTML = String(parseInt(messageCounter.innerHTML) + 1);
        console.log("Incremented count for public chat because of message " + JSON.stringify(messageData));
    } else {
        let user = document.getElementById(messageData.sender);
        if (user) {
            if (user.querySelector(".new-message-counter").classList.contains("hidden")) {
                user.querySelector(".new-message-counter").classList.remove("hidden");
            }
            let messageCounter = user.querySelector(".new-message-counter");
            console.log("Preparing to increment the counter for chat with user " + messageData.sender + ", current count: " + messageCounter.innerHTML);
            console.log("Current subscriptions:");
            console.log(subscriptions);
            messageCounter.innerHTML = String(parseInt(messageCounter.innerHTML) + 1);
            console.log("Incremented count for chat with chatId " + currentChatId + " because of message " + JSON.stringify(messageData));

            //add chat to the top
            if (!messageData.fromHistory) {
                document.getElementById("users").prepend(user);
            }
        }
    }
}

function handleReceivedJoinMessage(messageData) {
    if (messageData.chatId !== currentChatId) {
        if (messageData.sender !== username) {
            incrementMessageCounter(messageData);
        }
        return;
    }
    let messageId = `${messageData.chatId}-${messageData.sender}-${messageData.date}-${messageData.content}`;
    if (displayedMessages.has(messageId)) {
        console.log("duplicate message skipped");
        return;
    }
    displayedMessages.add(messageId);

    let chatContainer = document.getElementById("messages");
    let joinMessageContainer = document.createElement("div");
    let joinMessage = document.createElement("div");
    let date = document.createElement("div");
    joinMessageContainer.classList.add("message-container");
    joinMessage.classList.add("join-leave-message");
    date.classList.add("date");
    joinMessage.textContent = messageData.content;
    let dateObject = new Date(messageData.date);
    date.textContent = dateObject.toLocaleTimeString("en-GB", {
        "hour": "2-digit",
        "minute": "2-digit"
    });
    joinMessageContainer.appendChild(joinMessage);
    joinMessageContainer.appendChild(date);
    chatContainer.appendChild(joinMessageContainer);

    let inserted = false;
    let existingMessages = chatContainer.querySelectorAll('.message-container');
    for (let i = 0; i < existingMessages.length; i++) {
        let existingDate = existingMessages[i].querySelector(".date").textContent;
        if (messageData.date < existingDate) {
            chatContainer.insertBefore(joinMessageContainer, existingMessages[i]);
            inserted = true;
            break;
        }
    }
    if (!inserted) {
        chatContainer.appendChild(joinMessageContainer);
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleReceivedLeaveMessage(messageData) {
    //TODO
}

function handleReceivedAddToUserListMessage(messageData) {
    if (!subscriptions.has("/topic/" + currentChatId)) {
        subscriptions.set("/topic/" + currentChatId, stompClient.subscribe("/topic/" + currentChatId, onMessageReceived));
    }
    if (messageData.sender === username) {
        return;
    }
    let users = document.getElementById("users");
    let user = document.createElement("div");
    let newMessageCounter = document.createElement("div");
    let profilePicture = document.createElement("div");
    let usernameNode = document.createTextNode(messageData.sender);
    user.id = messageData.sender;
    newMessageCounter.innerHTML = "0";
    profilePicture.classList.add("profile-picture");
    user.classList.add("user");
    newMessageCounter.classList.add("new-message-counter");
    newMessageCounter.classList.add("hidden");
    user.appendChild(profilePicture);
    user.appendChild(usernameNode);
    user.appendChild(newMessageCounter);
    user.addEventListener("click", () => {
        let chatId;
        if (user.id < username) {
            chatId = user.id + "-" + username;
        } else {
            chatId = username + "-" + user.id;
        }
        changeChat(chatId, user.id);
        user.style.setProperty("color", "white");
        user.style.setProperty("border-color", "white")
        profilePicture.style.setProperty("border-color", "white");
        user.style.setProperty("background", "deepskyblue");
        if (!user.querySelector(".new-message-counter").classList.contains("hidden")) {
            user.querySelector(".new-message-counter").classList.add("hidden");
            user.querySelector(".new-message-counter").innerHTML = "0";
            console.log("reset the counter for chat with user" + user.id);
        }
    })
    users.appendChild(user);
}

function handleReceivedDeleteFromUserListMessage(messageData) {
    let user = document.getElementById(messageData.sender);
    user.remove();
}

function handleReceivedConnectionRequestMessage(messageData) {
    if (messageData.content === username && !subscriptions.has("/topic/" + messageData.chatId)) {
        subscriptions.set("/topic/" + messageData.chatId, stompClient.subscribe("/topic/" + messageData.chatId, onMessageReceived))
    }
}