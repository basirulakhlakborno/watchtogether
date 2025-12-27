import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { userDB, roomDB, participantDB } from './database.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-User-Id', 'X-Guest-Username']
  }
});

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-User-Id', 'X-Guest-Username']
}));

app.use(express.json());

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Database is now used instead of in-memory storage

// Middleware to optionally verify JWT token (not required)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  const guestUserId = req.headers['x-guest-user-id'];
  const guestUsername = req.headers['x-guest-username'];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err && user) {
        req.user = user;
      } else {
        // Invalid token, use guest user
        req.user = { 
          userId: guestUserId || `guest-${uuidv4()}`, 
          username: guestUsername || 'Guest',
          isGuest: true
        };
      }
      next();
    });
  } else {
    // Use guest user ID from header or generate new one
    const userId = guestUserId || `guest-${uuidv4()}`;
    req.user = { 
      userId, 
      username: guestUsername || 'Guest',
      isGuest: true
    };
    next();
  }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    for (const [userId, user] of users.entries()) {
      if (user.email === email) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (user.username === username) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const user = {
      userId,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.set(userId, user);
    userRooms.set(userId, []);

    // Generate JWT token
    const token = jwt.sign(
      { userId, username, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        userId,
        username,
        email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = userDB.findByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userId = user.id;

    // Generate JWT token
    const token = jwt.sign(
      { userId, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        userId,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', optionalAuth, (req, res) => {
  const user = userDB.findById(req.user.userId);
  if (!user || user.isGuest) {
    // Return guest user info
    return res.json({
      userId: req.user.userId,
      username: req.user.username || 'Guest',
      isGuest: true
    });
  }

  res.json({
    userId: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.created_at,
    isGuest: false
  });
});

// Room Routes
app.post('/api/rooms', optionalAuth, (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.userId;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    // Create room (database generates random ID)
    const room = {
      name: name.trim(),
      ownerId: userId,
      videoUrl: '',
      isPlaying: false,
      currentTime: 0,
      createdAt: new Date().toISOString()
    };

    const roomId = roomDB.create(room);

    // Get created room with participant count
    const createdRoom = roomDB.findById(roomId);
    const participantCount = roomDB.getParticipantCount(roomId);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room: {
        id: createdRoom.id,
        name: createdRoom.name,
        ownerId: createdRoom.ownerId,
        videoUrl: createdRoom.videoUrl,
        isPlaying: createdRoom.isPlaying,
        currentTime: createdRoom.currentTime,
        createdAt: createdRoom.createdAt,
        participantCount
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/rooms', optionalAuth, (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get rooms owned by user
    const ownedRooms = roomDB.findByOwner(userId);
    
    // Get rooms user is participating in
    const participantRoomIds = participantDB.getByUser(userId);
    const participantRooms = participantRoomIds
      .map(roomId => roomDB.findById(roomId))
      .filter(room => room && room.ownerId !== userId); // Exclude owned rooms
    
    // Combine and format
    const allUserRooms = [...ownedRooms, ...participantRooms];
    
    const roomsData = allUserRooms.map(room => {
      const participantCount = roomDB.getParticipantCount(room.id);
      return {
        id: room.id,
        name: room.name,
        ownerId: room.ownerId,
        videoUrl: room.videoUrl,
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        createdAt: room.createdAt,
        participantCount
      };
    });

    // If no rooms, return all public rooms for guests
    if (roomsData.length === 0 && req.user.isGuest) {
      const allRooms = roomDB.findAll();
      const publicRooms = allRooms.map(room => {
        const participantCount = roomDB.getParticipantCount(room.id);
        return {
          id: room.id,
          name: room.name,
          ownerId: room.ownerId,
          videoUrl: room.videoUrl,
          isPlaying: room.isPlaying,
          currentTime: room.currentTime,
          createdAt: room.createdAt,
          participantCount
        };
      });
      
      return res.json({
        success: true,
        rooms: publicRooms
      });
    }

    res.json({
      success: true,
      rooms: roomsData
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/rooms/:roomId', optionalAuth, (req, res) => {
  try {
    const { roomId } = req.params;
    const room = roomDB.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const participantCount = roomDB.getParticipantCount(roomId);

    res.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        ownerId: room.ownerId,
        videoUrl: room.videoUrl,
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        createdAt: room.createdAt,
        participantCount
      }
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/rooms/:roomId', optionalAuth, (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    const room = roomDB.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is the owner
    if (room.ownerId !== userId) {
      return res.status(403).json({ error: 'Only room owner can delete the room' });
    }

    // Delete room (cascade will handle participants)
    roomDB.delete(roomId);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Socket.io connection handling (authentication optional)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const guestUserId = socket.handshake.auth.userId;
  const guestUsername = socket.handshake.auth.username;
  
  console.log('Socket auth:', { 
    hasToken: !!token, 
    guestUserId, 
    guestUsername 
  });
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err && decoded) {
        socket.userId = decoded.userId;
        socket.username = decoded.username || 'User';
        console.log('Authenticated user:', socket.userId, socket.username);
      } else {
        // Invalid token, use guest user info if provided
        socket.userId = guestUserId || `guest-${uuidv4()}`;
        socket.username = guestUsername || 'Guest';
        console.log('Guest user (invalid token):', socket.userId, socket.username);
      }
      next();
    });
  } else {
    // Guest user - use provided info or generate new
    socket.userId = guestUserId || `guest-${uuidv4()}`;
    socket.username = guestUsername || 'Guest';
    console.log('Guest user (no token):', socket.userId, socket.username);
    next();
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId, socket.username);

  socket.on('join-room', (roomId) => {
    const room = roomDB.findById(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    socket.join(roomId);
    
    // Add user to room participants in database
    participantDB.add(roomId, socket.userId);
    
    const participantCount = roomDB.getParticipantCount(roomId);
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', {
      userId: socket.userId,
      username: socket.username,
      participants: participantCount
    });
    
    // Send current room state to the new user
    socket.emit('room-state', {
      videoUrl: room.videoUrl || '',
      isPlaying: room.isPlaying || false,
      currentTime: room.currentTime || 0,
      participants: participantCount
    });
    
    console.log(`User ${socket.userId} (${socket.username}) joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    
    const room = roomDB.findById(roomId);
    if (room) {
      // Remove user from room participants in database
      participantDB.remove(roomId, socket.userId);
      
      const participantCount = roomDB.getParticipantCount(roomId);
      
      socket.to(roomId).emit('user-left', {
        userId: socket.userId,
        username: socket.username,
        participants: participantCount
      });
    }
    
    console.log(`User ${socket.userId} (${socket.username}) left room ${roomId}`);
  });

  // Video synchronization
  socket.on('video-play', (roomId) => {
    const room = roomDB.findById(roomId);
    if (room) {
      roomDB.update(roomId, { isPlaying: true });
      socket.to(roomId).emit('video-play');
    }
  });

  socket.on('video-pause', (roomId) => {
    const room = roomDB.findById(roomId);
    if (room) {
      roomDB.update(roomId, { isPlaying: false });
      socket.to(roomId).emit('video-pause');
    }
  });

  socket.on('video-seek', (roomId, time) => {
    const room = roomDB.findById(roomId);
    if (room) {
      roomDB.update(roomId, { currentTime: time });
      socket.to(roomId).emit('video-seek', time);
    }
  });

  socket.on('video-url-change', (roomId, videoUrl) => {
    const room = roomDB.findById(roomId);
    if (room) {
      roomDB.update(roomId, { 
        videoUrl: videoUrl,
        currentTime: 0,
        isPlaying: false
      });
      socket.to(roomId).emit('video-url-change', videoUrl);
    }
  });

  // Chat messages
  socket.on('chat-message', (roomId, message) => {
    // Verify user is in the room
    const room = roomDB.findById(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Broadcast to all users in the room (including sender)
    const messageData = {
      userId: socket.userId,
      username: socket.username,
      message,
      timestamp: new Date().toISOString()
    };
    
    io.to(roomId).emit('chat-message', messageData);
    console.log(`Chat message from ${socket.username} in room ${roomId}: ${message}`);
  });

  // WebRTC signaling for voice chat
  socket.on('voice-offer', (data) => {
    const { roomId, offer } = data;
    // Forward offer to other users in the room
    socket.to(roomId).emit('voice-offer', {
      offer,
      from: socket.userId,
      fromUsername: socket.username
    });
    console.log(`Voice offer from ${socket.username} in room ${roomId}`);
  });

  socket.on('voice-answer', (data) => {
    const { roomId, answer, to } = data;
    // Forward answer to the specific user who sent the offer
    io.to(roomId).emit('voice-answer', {
      answer,
      from: socket.userId,
      fromUsername: socket.username,
      to
    });
    console.log(`Voice answer from ${socket.username} in room ${roomId}`);
  });

  socket.on('voice-ice-candidate', (data) => {
    const { roomId, candidate, to } = data;
    // Forward ICE candidate to the target user
    if (to) {
      // Send to specific user
      io.to(roomId).emit('voice-ice-candidate', {
        candidate,
        from: socket.userId,
        to
      });
    } else {
      // Broadcast to all in room
      socket.to(roomId).emit('voice-ice-candidate', {
        candidate,
        from: socket.userId
      });
    }
  });

  socket.on('voice-user-joined', (data) => {
    const { roomId } = data;
    // Notify others that this user joined voice chat
    socket.to(roomId).emit('voice-user-joined', {
      userId: socket.userId,
      username: socket.username
    });
    console.log(`User ${socket.username} joined voice chat in room ${roomId}`);
  });

  socket.on('voice-user-left', (data) => {
    const { roomId } = data;
    // Notify others that this user left voice chat
    socket.to(roomId).emit('voice-user-left', {
      userId: socket.userId,
      username: socket.username
    });
    console.log(`User ${socket.username} left voice chat in room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
    
    // Clean up participants from all rooms
    const userRooms = participantDB.getByUser(socket.userId);
    userRooms.forEach(roomId => {
      participantDB.remove(roomId, socket.userId);
      const participantCount = roomDB.getParticipantCount(roomId);
      
      io.to(roomId).emit('user-left', {
        userId: socket.userId,
        username: socket.username,
        participants: participantCount
      });
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
  console.log(`Socket.io available at: http://localhost:${PORT}`);
  console.log(`CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
});
