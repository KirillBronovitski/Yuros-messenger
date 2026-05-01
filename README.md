# Yuros Messenger

A real-time web chat application built with Spring Boot and WebSockets. Users can communicate in a shared public chat room and send private direct messages to other online users.

## Features

- Username-based login (no password yet)
- Public chat room shared by all connected users
- Private one-on-one direct messages between any two users
- Sidebar listing all currently online users
- Chat history loaded automatically when opening a conversation
- Unread message counters per chat shown in the sidebar
- Join notifications displayed in the public chat when a user connects

## Tech Stack

**Backend**
- Java 25
- Spring Boot 4.0.4
- Spring WebSocket with STOMP message broker
- Spring Data JPA
- H2 database (in-memory or file-based)

**Frontend**
- Vanilla HTML / CSS / JavaScript (no framework)
- SockJS client
- STOMP.js

**Build**
- Maven (Maven Wrapper included)

## Getting Started

### Prerequisites

- Java 25 or later
- Maven 3.x (or use the included `mvnw` wrapper)

### Running the Application

```bash
./mvnw spring-boot:run
```

The server starts on port `8080`. Open your browser and navigate to:

```
http://localhost:8080
```

Enter a username when prompted. You'll land in the public chat and see other online users in the left sidebar.

### Database Configuration

H2 runs in-memory by default. Messages are lost when the application stops.

**In-memory (default)**

```properties
spring.datasource.url=jdbc:h2:mem:chatdb
spring.jpa.hibernate.ddl-auto=create
```

**File-based (persistent across restarts)**

```properties
spring.datasource.url=jdbc:h2:file:./data/chatdb
spring.jpa.hibernate.ddl-auto=update
```

Switch `ddl-auto` from `create` to `update` so the schema is not dropped on every start. The database file is written to `./data/chatdb.mv.db` relative to the working directory.

## Project Structure

```
src/main/java/com/example/Euros_messenger/
  EurosMessengerApplication.java
  chat/
    controllers/
      ChatController.java          # STOMP message handlers
      WebSocketConfig.java         # WebSocket / STOMP broker configuration
      WebSocketEventListener.java  # Connect and disconnect event handlers
    data/
      entities/
        ChatMessageEntity.java     # JPA entity mapped to the H2 table
      repositories/
        ChatMessageRepository.java # Spring Data repository
    model/
      ChatMessage.java             # Message DTO
    services/
      MessageService.java          # Saves and retrieves messages

src/main/resources/
  application.properties
  static/
    index.html                     # Single-page frontend
    messages-script.js             # Frontend WebSocket logic
    chat-style.css                 # Styles
```

## WebSocket API

The application uses STOMP over SockJS. The WebSocket endpoint is `/ws`.

### Client-to-server destinations (prefix `/app`)

| Destination                       | Description                                                                                               |
|-----------------------------------|-----------------------------------------------------------------------------------------------------------|
| `/app/chat.addUser`               | Called once after connecting. Registers the user and triggers history load for the public chat.           |
| `/app/chat.sendMessage`           | Sends a chat message to the specified `chatId`.                                                           |
| `/app/chat.loadHistory`           | Requests all persisted messages for a given `chatId`. History is delivered to the caller's private queue. |
| `/app/chat.sendConnectionRequest` | Notifies the recipient that they should subscribe to a new DM topic before messages arrive.               |

### Server-to-client destinations

| Destination          | Description                                                                                  |
|----------------------|----------------------------------------------------------------------------------------------|
| `/topic/{chatId}`    | Receives new messages broadcast to a specific chat room.                                     |
| `/topic/public`      | Receives system-wide events: user joined, user left, connection requests.                    |
| `/queue/{sessionId}` | Private channel per session. Used to deliver chat history without broadcasting it to others. |

### Message format

```json
{
  "type": "CHAT",
  "content": "Hello",
  "sender": "Alice",
  "chatId": "alice-bob",
  "date": "2026-04-30T12:00:00",
  "fromHistory": false
}
```

`type` is one of: `CHAT`, `JOIN`, `LEAVE`, `ADD_TO_USER_LIST`, `REMOVE_FROM_USER_LIST`, `CONNECTION_REQUEST`.

### Direct message chat IDs

When two users open a private conversation, the `chatId` is formed by sorting their usernames alphabetically and joining them with a hyphen. For example, users `alice` and `bob` share the chat ID `alice-bob`.

## Known Limitations

- Duplicate usernames are not prevented. Two users logging in with the same name will cause the application to behave unexpectedly.
- The server receives leave notifications but the UI does not render them yet.
