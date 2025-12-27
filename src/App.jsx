import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home';
import WatchTogether from './pages/WatchTogether';
import UsernameModal from './components/UsernameModal/UsernameModal';
import { setUsernameModalCallback, getCurrentUser } from './utils/api';
import './App.less';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [roomId, setRoomId] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameCallback, setUsernameCallback] = useState(null);

  useEffect(() => {
    // Check URL hash for navigation
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#watch') {
        setCurrentPage('watch');
      } else if (hash.startsWith('#watch?room=')) {
        const room = hash.split('room=')[1];
        setRoomId(room);
        setCurrentPage('watch');
      } else {
        setCurrentPage('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    // Set up username modal callback
    setUsernameModalCallback((callback) => {
      setUsernameCallback(() => callback);
      setShowUsernameModal(true);
    });

    // Check if user already has a username
    const user = getCurrentUser();
    if (user && user.username && !user.isGuest) {
      // User is logged in, no modal needed
      return;
    }
    
    const savedUsername = localStorage.getItem('guestUsername');
    if (!savedUsername) {
      // No username saved, will show modal on first API request
    }
  }, []);

  const handleUsernameConfirm = (username) => {
    if (usernameCallback) {
      usernameCallback(username);
      setUsernameCallback(null);
    }
    setShowUsernameModal(false);
  };

  return (
    <ThemeProvider>
      <div className="app">
        <Header />
        <main className="main-content">
          {currentPage === 'home' ? <Home /> : <WatchTogether roomId={roomId} />}
        </main>
        <Footer />
        <UsernameModal 
          isOpen={showUsernameModal} 
          onConfirm={handleUsernameConfirm}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
