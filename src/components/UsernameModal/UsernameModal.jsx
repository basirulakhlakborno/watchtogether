import { useState, useEffect } from 'react';
import './UsernameModal.less';

function UsernameModal({ onConfirm, isOpen }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Focus input when modal opens
      const input = document.querySelector('.username-input');
      if (input) {
        input.focus();
      }
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Username cannot be empty');
      return;
    }

    if (trimmedUsername.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }

    if (trimmedUsername.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    onConfirm(trimmedUsername);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="username-modal-overlay">
      <div className="username-modal">
        <div className="username-modal-header">
          <h2>Welcome!</h2>
          <p>Please enter your username to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="username-modal-form">
          <div className="username-input-wrapper">
            <input
              type="text"
              className="username-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              maxLength={20}
              autoFocus
            />
            {error && <span className="username-error">{error}</span>}
          </div>
          
          <div className="username-modal-actions">
            <button type="submit" className="username-submit-btn">
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UsernameModal;

