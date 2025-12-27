import { io } from 'socket.io-client';
import { getCurrentUser } from './api';

// Get auth token from localStorage (internal function, not exported)
const getToken = () => {
  return localStorage.getItem('authToken');
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket = null;

export const connectSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = getToken();
  const user = getCurrentUser();

  console.log('Connecting socket with user:', { 
    userId: user?.userId, 
    username: user?.username,
    hasToken: !!token 
  });

  socket = io(SOCKET_URL, {
    auth: {
      token: token || null,
      userId: user?.userId || null,
      username: user?.username || null
    },
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    console.error('Attempting to connect to:', SOCKET_URL);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  if (!socket || !socket.connected) {
    return connectSocket();
  }
  return socket;
};

export default {
  connect: connectSocket,
  disconnect: disconnectSocket,
  get: getSocket
};

