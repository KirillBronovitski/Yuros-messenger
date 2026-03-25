package com.example.Euros_messenger.chat.data.entities;

import com.example.Euros_messenger.chat.model.ChatMessage;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

import java.time.LocalDateTime;

@Entity
public class ChatMessageEntity {

    @GeneratedValue
    @Id
    private Long id;

    @Column
    private ChatMessage.MessageType type;

    @Column
    private String content;

    @Column
    private String sender;

    @Column
    private String chatId;

    @Column
    private LocalDateTime date;

    public ChatMessageEntity() {}

    public ChatMessageEntity(ChatMessage.MessageType type, String content, String sender, String chatId, LocalDateTime date) {
        this.type = type;
        this.content = content;
        this.sender = sender;
        this.chatId = chatId;
        this.date = date;
    }

    public Long getId() {
        return id;
    }

    public ChatMessage.MessageType getType() {
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
}
