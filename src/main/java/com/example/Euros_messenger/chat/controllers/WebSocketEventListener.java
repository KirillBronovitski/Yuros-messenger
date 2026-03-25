package com.example.Euros_messenger.chat.controllers;

import com.example.Euros_messenger.chat.model.ChatMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;

@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final SimpMessageSendingOperations messagingTemplate;
    private final ChatController chatController;

    public WebSocketEventListener(SimpMessageSendingOperations messagingTemplate, ChatController chatController) {
        this.messagingTemplate = messagingTemplate;
        this.chatController = chatController;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent ignored) {
        logger.info("User connected");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = null;
        if (headerAccessor.getSessionAttributes() != null) {
            username = (String) headerAccessor.getSessionAttributes().get("username");
        }
        if (username != null) {
            logger.info("User disconnected");
        }
        if (username != null) {
            ChatMessage userListUpdateMessage = new ChatMessage(ChatMessage.MessageType.REMOVE_FROM_USER_LIST, "", username, "", LocalDateTime.now(), false);
            ChatMessage chatMessage = new ChatMessage(ChatMessage.MessageType.LEAVE,username + " left", username, "public", LocalDateTime.now(), false);
            chatController.removeUserFromList(username);
            messagingTemplate.convertAndSend("/topic/public", userListUpdateMessage);
            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }

}
