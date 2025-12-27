const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Generate unique guest user ID
const generateGuestId = () => {
  return `guest-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Get or create guest user ID
const getGuestUserId = () => {
  let userId = localStorage.getItem('guestUserId');
  if (!userId) {
    userId = generateGuestId();
    localStorage.setItem('guestUserId', userId);
  }
  return userId;
};

// Get auth token from localStorage
const getToken = () => {
  return localStorage.getItem('authToken');
};

// Set auth token in localStorage
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    return JSON.parse(userStr);
  }
  
  // Return guest user if no registered user
  const guestUserId = getGuestUserId();
  const savedUsername = localStorage.getItem('guestUsername') || 'Guest';
  return {
    userId: guestUserId,
    username: savedUsername,
    isGuest: true
  };
};

// Set current user in localStorage
export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    // Clear guest ID if user is registered
    if (!user.isGuest) {
      localStorage.removeItem('guestUserId');
    }
  } else {
    localStorage.removeItem('currentUser');
  }
};

// Username modal callback - will be set by the component
let usernameModalCallback = null;

// Set the username modal callback (called by UsernameModal component)
export const setUsernameModalCallback = (callback) => {
  usernameModalCallback = callback;
};

// Prompt for username using modal
const promptForUsername = () => {
  return new Promise((resolve) => {
    if (usernameModalCallback) {
      usernameModalCallback((username) => {
        resolve(username);
      });
    } else {
      // Fallback to default if modal not available
      resolve(`Guest-${Date.now().toString().slice(-6)}`);
    }
  });
};

// Initialize guest user on first load
let guestUserInitialized = false;
let usernamePromptPending = false;

const initializeGuestUser = async () => {
  if (guestUserInitialized || usernamePromptPending) return;
  
  const token = getToken();
  if (token) {
    // User is already logged in
    guestUserInitialized = true;
    return;
  }

  try {
    // Check if we already have a guest user with username
    const guestUserId = getGuestUserId();
    const savedUsername = localStorage.getItem('guestUsername');
    const currentUser = getCurrentUser();
    
    if (currentUser && currentUser.isGuest && currentUser.username && savedUsername) {
      guestUserInitialized = true;
      return;
    }

    // Prompt for username on first request
    usernamePromptPending = true;
    const username = savedUsername || await promptForUsername();
    
    // Save username to localStorage
    localStorage.setItem('guestUsername', username);
    
    // Save guest user info
    setCurrentUser({
      userId: guestUserId,
      username: username,
      isGuest: true
    });

    guestUserInitialized = true;
    usernamePromptPending = false;
  } catch (error) {
    console.error('Failed to initialize guest user:', error);
    usernamePromptPending = false;
  }
};

// API request helper (token is optional, auto-initializes guest user)
const apiRequest = async (endpoint, options = {}) => {
  // Ensure guest user is initialized (will prompt for username on first request)
  await initializeGuestUser();
  
  const token = getToken();
  const currentUser = getCurrentUser();
  
  // Add guest user ID and username to headers if no token
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(!token && currentUser?.isGuest && { 
      'X-Guest-User-Id': currentUser.userId,
      'X-Guest-Username': currentUser.username
    }),
    ...options.headers,
  };
  
  const config = {
    ...options,
    headers,
  };

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API Request:', url, options.method || 'GET');
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Request failed' };
      }
      console.error('API Error Response:', response.status, errorData);
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request error:', error);
    console.error('API Base URL:', API_BASE_URL);
    console.error('Full URL:', `${API_BASE_URL}${endpoint}`);
    throw error;
  }
};

// Auth API (optional - login not required)
export const authAPI = {
  register: async (username, email, password) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    
    if (data.token) {
      setAuthToken(data.token);
      setCurrentUser(data.user);
    }
    
    return data;
  },

  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      setAuthToken(data.token);
      setCurrentUser(data.user);
    }
    
    return data;
  },

  logout: () => {
    setAuthToken(null);
    setCurrentUser(null);
  },

  getCurrentUser: async () => {
    try {
      await initializeGuestUser();
      const user = await apiRequest('/auth/me');
      if (user && !user.isGuest) {
        setCurrentUser(user);
      }
      return user;
    } catch (error) {
      // Return guest user if not authenticated
      return getCurrentUser();
    }
  },
};

// Room API
export const roomAPI = {
  createRoom: async (name) => {
    return await apiRequest('/rooms', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  getRooms: async () => {
    return await apiRequest('/rooms');
  },

  getRoom: async (roomId) => {
    return await apiRequest(`/rooms/${roomId}`);
  },

  deleteRoom: async (roomId) => {
    return await apiRequest(`/rooms/${roomId}`, {
      method: 'DELETE',
    });
  },
};

