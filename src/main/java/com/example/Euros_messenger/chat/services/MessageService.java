package com.example.Euros_messenger.chat.services;


import com.example.Euros_messenger.chat.data.entities.ChatMessageEntity;
import com.example.Euros_messenger.chat.data.repositories.ChatMessageRepository;
import com.example.Euros_messenger.chat.model.ChatMessage;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MessageService {

    private final ChatMessageRepository messageRepo;

    public MessageService(ChatMessageRepository messageRepo) {
        this.messageRepo = messageRepo;
    }

    public void saveMessage(ChatMessage message) {
        ChatMessageEntity chatMessageEntity = new ChatMessageEntity(
                message.getType(),
                message.getContent(),
                message.getSender(),
                message.getChatId(),
                message.getDate()
        );
        messageRepo.save(chatMessageEntity);
    }

    public List<ChatMessage> getMessagesOfChat(String chatId) {
        List<ChatMessage> messages = new ArrayList<>();
        for (ChatMessageEntity chatMessageEntity : messageRepo.findAllByChatId(chatId, Sort.by(Sort.Order.asc("date"), Sort.Order.asc("id")))) {
            messages.add(new ChatMessage(
                    chatMessageEntity.getType(),
                    chatMessageEntity.getContent(),
                    chatMessageEntity.getSender(),
                    chatMessageEntity.getChatId(),
                    chatMessageEntity.getDate(),
                    true
            ));
        }
        return messages;
    }
}
