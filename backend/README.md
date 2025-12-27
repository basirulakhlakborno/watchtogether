# Backend Server

Backend server for the WatchTogether application.

## Features

- User authentication (register, login)
- JWT token-based authentication
- Real-time video synchronization using Socket.io
- Room management (create, list, delete)
- Chat functionality
- User presence tracking

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `JWT_SECRET` - Secret key for JWT tokens (default: 'your-secret-key-change-in-production')

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ username, email, password }`
  - Returns: `{ token, user }`

- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

- `GET /api/auth/me` - Get current user (requires auth)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ userId, username, email, createdAt }`

### Rooms

- `POST /api/rooms` - Create a new room (requires auth)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ name }`
  - Returns: `{ room }`

- `GET /api/rooms` - Get all rooms for current user (requires auth)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ rooms: [...] }`

- `GET /api/rooms/:roomId` - Get room information (requires auth)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ room }`

- `DELETE /api/rooms/:roomId` - Delete a room (requires auth, owner only)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: true }`

## Socket.io Events

**Note:** All Socket.io connections require authentication. Pass the JWT token in the `auth.token` field when connecting.

### Client to Server:
- `join-room` - Join a room (requires auth)
- `leave-room` - Leave a room (requires auth)
- `video-play` - Play video (requires auth)
- `video-pause` - Pause video (requires auth)
- `video-seek` - Seek to time (requires auth)
- `video-url-change` - Change video URL (requires auth)
- `chat-message` - Send chat message (requires auth)

### Server to Client:
- `user-joined` - User joined room
- `user-left` - User left room
- `room-state` - Current room state
- `video-play` - Video play event
- `video-pause` - Video pause event
- `video-seek` - Video seek event
- `video-url-change` - Video URL changed
- `chat-message` - New chat message
- `error` - Error message

