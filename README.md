# WatchTogether 🎬

A real-time video watching platform where users can watch YouTube videos together, chat, and have voice conversations in synchronized rooms.

## ✨ Features

- 🎥 **Synchronized Video Playback** - Watch YouTube videos together in real-time
- 💬 **Real-time Chat** - Chat with other users in the room
- 🎤 **Voice Chat** - Join voice calls with noise cancellation
- 👥 **Room Management** - Create and join rooms with unique IDs
- 🎨 **Modern UI** - Beautiful, responsive design with dark/light theme
- 📱 **Mobile Friendly** - Works seamlessly on all devices

## 🚀 Tech Stack

### Frontend
- React 19
- Vite
- Socket.io Client
- YouTube IFrame API
- WebRTC for voice chat
- Web Audio API for noise cancellation

### Backend
- Node.js
- Express.js
- Socket.io
- JSON file-based database
- JWT for authentication (optional)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 🔧 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### Backend (.env)
```env
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
```

## 📖 Usage

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Create or join a room:**
   - Enter a YouTube video URL
   - Create a new room or join with a room ID
   - Share the room ID with friends

4. **Features:**
   - Play/pause videos (synchronized across all users)
   - Chat with other users
   - Join voice calls
   - Adjust video settings (quality, speed, etc.)

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
- **Frontend:** Deploy to [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
- **Backend:** Deploy to [Railway](https://railway.app) or [Render](https://render.com)

## 👨‍💻 Author

**Basirul Akhlak Borno**

- 🌍 Location: Jamalpur, Bangladesh
- 💼 GitHub: [@basirulakhlakborno](https://github.com/basirulakhlakborno)
- 📧 Email: basirulakhlak@gmail.com
- 📱 Facebook: [BorNoBXE](https://facebook.com/BorNoBXE)
- 📷 Instagram: [bornosixninez](https://instagram.com/bornosixninez)

> _"Believe in yourself, listen to your gut, and do what you love."_

## 📄 License

ISC

## 🙏 Acknowledgments

- YouTube IFrame API
- Socket.io for real-time communication
- WebRTC for peer-to-peer voice chat

---

⭐️ Made with ❤️ by [Basirul Akhlak Borno](https://github.com/basirulakhlakborno)
