import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database.json');

// Initialize database file if it doesn't exist
const initDatabaseFile = () => {
  if (!existsSync(dbPath)) {
    const initialData = {
      users: {},
      rooms: {},
      roomParticipants: {}
    };
    writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  }
};

// Read database
const readDB = () => {
  initDatabaseFile();
  try {
    const data = readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: {}, rooms: {}, roomParticipants: {} };
  }
};

// Write database
const writeDB = (data) => {
  try {
    writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
    throw error;
  }
};

// Generate random room ID
const generateRoomId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let roomId = '';
  for (let i = 0; i < 8; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return roomId;
};

// Ensure room ID is unique
const getUniqueRoomId = () => {
  const db = readDB();
  let roomId = generateRoomId();
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    if (!db.rooms[roomId]) {
      return roomId;
    }
    roomId = generateRoomId();
    attempts++;
  }

  // Fallback to UUID-based ID if we can't generate a unique short ID
  return `ROOM-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

// User operations
export const userDB = {
  create: (user) => {
    const db = readDB();
    db.users[user.id] = {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      isGuest: user.isGuest ? 1 : 0,
      createdAt: user.createdAt || new Date().toISOString()
    };
    writeDB(db);
    return { changes: 1 };
  },

  findByEmail: (email) => {
    const db = readDB();
    return Object.values(db.users).find(u => u.email === email) || null;
  },

  findByUsername: (username) => {
    const db = readDB();
    return Object.values(db.users).find(u => u.username === username) || null;
  },

  findById: (id) => {
    const db = readDB();
    const user = db.users[id];
    if (user) {
      return {
        ...user,
        isGuest: user.isGuest === 1
      };
    }
    return null;
  },
};

// Room operations
export const roomDB = {
  create: (room) => {
    const roomId = getUniqueRoomId();
    const db = readDB();
    db.rooms[roomId] = {
      id: roomId,
      name: room.name,
      ownerId: room.ownerId,
      videoUrl: room.videoUrl || '',
      isPlaying: room.isPlaying ? 1 : 0,
      currentTime: room.currentTime || 0,
      createdAt: room.createdAt || new Date().toISOString()
    };
    writeDB(db);
    return roomId;
  },

  findById: (id) => {
    const db = readDB();
    const room = db.rooms[id];
    if (room) {
      return {
        ...room,
        isPlaying: room.isPlaying === 1,
        ownerId: room.ownerId,
        videoUrl: room.videoUrl,
        currentTime: room.currentTime,
        createdAt: room.createdAt
      };
    }
    return null;
  },

  findByOwner: (ownerId) => {
    const db = readDB();
    return Object.values(db.rooms)
      .filter(room => room.ownerId === ownerId)
      .map(room => ({
        ...room,
        isPlaying: room.isPlaying === 1,
        ownerId: room.ownerId,
        videoUrl: room.videoUrl,
        currentTime: room.currentTime,
        createdAt: room.createdAt
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  findAll: () => {
    const db = readDB();
    return Object.values(db.rooms)
      .map(room => ({
        ...room,
        isPlaying: room.isPlaying === 1,
        ownerId: room.ownerId,
        videoUrl: room.videoUrl,
        currentTime: room.currentTime,
        createdAt: room.createdAt
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  update: (id, updates) => {
    const db = readDB();
    if (!db.rooms[id]) {
      return null;
    }

    if (updates.name !== undefined) {
      db.rooms[id].name = updates.name;
    }
    if (updates.videoUrl !== undefined) {
      db.rooms[id].videoUrl = updates.videoUrl;
    }
    if (updates.isPlaying !== undefined) {
      db.rooms[id].isPlaying = updates.isPlaying ? 1 : 0;
    }
    if (updates.currentTime !== undefined) {
      db.rooms[id].currentTime = updates.currentTime;
    }

    writeDB(db);
    return { changes: 1 };
  },

  delete: (id) => {
    const db = readDB();
    if (db.rooms[id]) {
      delete db.rooms[id];
      // Also remove all participants for this room
      if (db.roomParticipants[id]) {
        delete db.roomParticipants[id];
      }
      writeDB(db);
      return { changes: 1 };
    }
    return { changes: 0 };
  },

  getParticipantCount: (roomId) => {
    const db = readDB();
    if (!db.roomParticipants[roomId]) {
      return 0;
    }
    return Object.keys(db.roomParticipants[roomId]).length;
  },
};

// Participant operations
export const participantDB = {
  add: (roomId, userId) => {
    const db = readDB();
    if (!db.roomParticipants[roomId]) {
      db.roomParticipants[roomId] = {};
    }
    if (!db.roomParticipants[roomId][userId]) {
      db.roomParticipants[roomId][userId] = {
        joinedAt: new Date().toISOString()
      };
      writeDB(db);
      return { changes: 1 };
    }
    return { changes: 0 };
  },

  remove: (roomId, userId) => {
    const db = readDB();
    if (db.roomParticipants[roomId] && db.roomParticipants[roomId][userId]) {
      delete db.roomParticipants[roomId][userId];
      // Clean up empty room participant objects
      if (Object.keys(db.roomParticipants[roomId]).length === 0) {
        delete db.roomParticipants[roomId];
      }
      writeDB(db);
      return { changes: 1 };
    }
    return { changes: 0 };
  },

  getByRoom: (roomId) => {
    const db = readDB();
    if (!db.roomParticipants[roomId]) {
      return [];
    }
    return Object.keys(db.roomParticipants[roomId]);
  },

  getByUser: (userId) => {
    const db = readDB();
    const roomIds = [];
    for (const roomId in db.roomParticipants) {
      if (db.roomParticipants[roomId][userId]) {
        roomIds.push(roomId);
      }
    }
    return roomIds;
  },
};

// Initialize database on import
initDatabaseFile();
console.log('Database initialized successfully (JSON file-based)');

export default {
  read: readDB,
  write: writeDB
};
