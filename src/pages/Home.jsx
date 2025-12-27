import { useState } from 'react';
import { HiPlusCircle, HiLogin, HiClock, HiChat, HiVideoCamera } from 'react-icons/hi';
import { roomAPI } from '../utils/api';
import './Home.less';

function Home() {
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      const response = await roomAPI.createRoom('My Watch Room');
      if (response.success && response.room) {
        window.location.hash = `#watch?room=${response.room.id}`;
      } else {
        alert('Failed to create room. Please try again.');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      window.location.hash = `#watch?room=${roomId.toUpperCase()}`;
    }
  };

  return (
    <div className="home">
      <div className="home-content">
        <h1 className="home-title">SynsEvo</h1>
        <p className="home-subtitle">Watch videos synchronously with friends and family</p>
        
        <div className="home-actions">
          <div className="action-card">
            <div className="action-icon">
              <HiPlusCircle />
            </div>
            <h3>Create Room</h3>
            <p>Start a new watch party and invite friends</p>
            <button 
              onClick={handleCreateRoom} 
              className="btn-primary"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
          </div>

          <div className="action-card">
            <div className="action-icon">
              <HiLogin />
            </div>
            <h3>Join Room</h3>
            <p>Enter a room ID to join an existing watch party</p>
            <div className="join-section">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="room-input"
                maxLength={6}
              />
              <button 
                onClick={handleJoinRoom} 
                className="btn-primary"
                disabled={!roomId.trim()}
              >
                Join Room
              </button>
            </div>
          </div>
        </div>

        <div className="home-features">
          <h3>Features</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">
                <HiClock />
              </span>
              <h4>Synchronized Playback</h4>
              <p>Watch videos in perfect sync with everyone in the room</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">
                <HiChat />
              </span>
              <h4>Real-time Chat</h4>
              <p>Chat with friends while watching together</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">
                <HiVideoCamera />
              </span>
              <h4>Multiple Sources</h4>
              <p>Support for YouTube, Vimeo, and more</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

