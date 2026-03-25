package com.example.Euros_messenger.chat.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public class ChatMessage {

    public enum MessageType {
        CHAT, JOIN, LEAVE, ADD_TO_USER_LIST, REMOVE_FROM_USER_LIST, CONNECTION_REQUEST
    }

    @JsonProperty
    private MessageType type;

    @JsonProperty
    private String content;

    @JsonProperty
    private String sender;

    @JsonProperty
    private String chatId;

    @JsonProperty
    private LocalDateTime date;

    @JsonProperty
    private Boolean fromHistory;

    @JsonCreator
    public ChatMessage(MessageType type, String content, String sender, String chatId, LocalDateTime date, Boolean fromHistory) {
        this.type = type;
        this.content = content;
        this.sender = sender;
        this.chatId = chatId;
        this.date = date;
        this.fromHistory = fromHistory;
    }

    public MessageType getType() {
        return type;
    }

    public String getContent() {
        return content;
    }

    public String getSender() {
        return sender;
    }

    public String getChatId() {
        return chatId;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public void setFromHistory(Boolean fromHistory) {
        this.fromHistory = fromHistory;
    }
}
