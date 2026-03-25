package com.example.Euros_messenger.chat.data.repositories;

import com.example.Euros_messenger.chat.data.entities.ChatMessageEntity;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;

public interface ChatMessageRepository extends CrudRepository<ChatMessageEntity, Long>, PagingAndSortingRepository<ChatMessageEntity, Long> {

    Iterable<ChatMessageEntity> findAllByChatId(String chatId, Sort sort);

}
