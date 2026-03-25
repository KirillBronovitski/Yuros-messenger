package com.example.Euros_messenger.chat.controllers;

import com.example.Euros_messenger.chat.model.ChatMessage;
import com.example.Euros_messenger.chat.services.MessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Controller
public class ChatController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    private final List<ChatMessage> onlineUsers = new CopyOnWriteArrayList<>();

    public ChatController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(ChatMessage chatMessage) {
        chatMessage.setFromHistory(false);
        chatMessage.setDate(LocalDateTime.now());
        messageService.saveMessage(chatMessage);
        messagingTemplate.convertAndSend("/topic/" + chatMessage.getChatId(), chatMessage);
    }

    @MessageMapping("/chat.addUser")
    public void addUser(ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        if (headerAccessor.getSessionAttributes() != null) {
            chatMessage.setDate(LocalDateTime.now());
            messageService.saveMessage(chatMessage);
            headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
            ChatMessage userListUpdateMessage = new ChatMessage(ChatMessage.MessageType.ADD_TO_USER_LIST, "", chatMessage.getSender(), chatMessage.getChatId(), LocalDateTime.now(), false);
            messagingTemplate.convertAndSend("/topic/" + chatMessage.getChatId(), chatMessage);
            for (ChatMessage onlineUserMessage: onlineUsers) {
                messagingTemplate.convertAndSend("/queue/" + headerAccessor.getSessionId(), onlineUserMessage);
            }
            messagingTemplate.convertAndSend("/topic/public", userListUpdateMessage);
            onlineUsers.add(userListUpdateMessage);
            loadHistory(chatMessage, headerAccessor);
        }
    }

    @MessageMapping("/chat.loadHistory")
    public void loadHistory(ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        List<ChatMessage> messages = messageService.getMessagesOfChat(chatMessage.getChatId());
        for (ChatMessage message : messages) {
            messagingTemplate.convertAndSend("/queue/" + sessionId, message);
        }
    }

    public void removeUserFromList(String username) {
        for (int i = 0; i < onlineUsers.size(); i++) {
            if (onlineUsers.get(i).getSender().equals(username)) {
                onlineUsers.remove(i);
                break;
            }
        }
    }

    @MessageMapping("/chat.sendConnectionRequest")
    public void sendConnectionRequest(ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        messagingTemplate.convertAndSend("/topic/public", chatMessage);
    }
}
