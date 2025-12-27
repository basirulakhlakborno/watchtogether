import { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import PlayerControls from './PlayerControls';
import './VideoPlayer.less';

function VideoPlayer({ videoUrl, isPlaying, onPlay, onPause, onStateChange, onSeek, playerRef: externalPlayerRef }) {
  const [videoId, setVideoId] = useState(null);
  const internalPlayerRef = useRef(null);
  const playerRef = externalPlayerRef || internalPlayerRef;

  // Extract YouTube video ID from URL
  useEffect(() => {
    if (!videoUrl) {
      setVideoId(null);
      return;
    }

    const extractVideoId = (url) => {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    };

    const id = extractVideoId(videoUrl);
    setVideoId(id);
  }, [videoUrl]);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0, // Hide default YouTube controls
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      enablejsapi: 1,
      iv_load_policy: 3,
      fs: 0, // Disable fullscreen button
    },
  };

  const handleReady = (event) => {
    playerRef.current = event.target;
    if (onStateChange) {
      onStateChange('ready');
    }
  };

  const handleStateChange = (event) => {
    const state = event.data;
    if (onStateChange) {
      onStateChange(state);
    }

    // Sync play/pause with parent
    if (state === 1 && !isPlaying) {
      // Playing
      if (onPlay) onPlay();
    } else if (state === 2 && isPlaying) {
      // Paused
      if (onPause) onPause();
    }
  };

  // Control player from parent
  useEffect(() => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  if (!videoId) {
    return (
      <div className="video-player-placeholder">
        <div className="placeholder-content">
          <p>Enter a valid YouTube URL to load the video</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-wrapper">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={handleReady}
        onStateChange={handleStateChange}
        className="youtube-player"
      />
      <PlayerControls
        player={playerRef.current}
        isPlaying={isPlaying}
        onPlay={onPlay}
        onPause={onPause}
        onSeek={onSeek}
      />
    </div>
  );
}

export default VideoPlayer;

