import { useState, useEffect, useRef } from 'react';
import { HiPlay, HiPause, HiVolumeUp, HiVolumeOff, HiArrowsExpand, HiCog, HiX, HiChevronRight, HiChevronLeft, HiGlobe } from 'react-icons/hi';
import { MdReplay10, MdForward10, MdSubtitles, MdSpeed, MdHighQuality, MdLightMode, MdNote, MdTimer } from 'react-icons/md';
import './PlayerControls.less';

function PlayerControls({ player, isPlaying, onPlay, onPause, onSeek }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('auto');
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState([]);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captionLanguage, setCaptionLanguage] = useState('en');
  const [availableCaptionLanguages, setAvailableCaptionLanguages] = useState([]);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [cinematicLighting, setCinematicLighting] = useState(false);
  const [annotationComposition, setAnnotationComposition] = useState(false);
  const [sleepTimer, setSleepTimer] = useState('off');
  const progressRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const settingsRef = useRef(null);
  const playPauseTimeoutRef = useRef(null);

  // Show controls immediately when component mounts or player becomes available
  useEffect(() => {
    setShowControls(true);
    if (!player) {
      setIsLoading(true);
    }
  }, []);

  // Show controls when player becomes available
  useEffect(() => {
    if (player) {
      setShowControls(true);
      setIsLoading(true); // Initially loading until we check state
    }
  }, [player]);

  useEffect(() => {
    if (!player) return;

    // Show controls immediately when player is available
    setShowControls(true);
    setIsLoading(true); // Assume loading initially

    const updateTime = () => {
      if (player.getCurrentTime) {
        setCurrentTime(player.getCurrentTime());
      }
      if (player.getDuration) {
        setDuration(player.getDuration());
      }
      // Check buffering and loading state
      try {
        const state = player.getPlayerState ? player.getPlayerState() : null;
        // YouTube player states: -1 = UNSTARTED, 0 = ENDED, 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 5 = CUED
        setIsBuffering(state === 3); // 3 = BUFFERING
        const loading = state === -1 || state === 5; // -1 = UNSTARTED (loading), 5 = CUED (ready but not started)
        setIsLoading(loading);
        // Keep controls visible when loading
        if (loading) {
          setShowControls(true);
        }
      } catch (e) {
        // Ignore errors, but assume loading
        setIsLoading(true);
        setShowControls(true);
      }
    };

    // Check immediately
    updateTime();
    
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, [player]);

  useEffect(() => {
    if (!player) return;

    const getVolume = () => {
      try {
        if (player.isMuted && player.isMuted()) {
          setIsMuted(true);
        } else if (player.getVolume) {
          const vol = player.getVolume();
          setVolume(vol);
          setIsMuted(vol === 0);
        }
      } catch (e) {
        console.log('Volume check error:', e);
      }
    };

    getVolume();
  }, [player]);

  // Load available qualities and captions from YouTube player
  useEffect(() => {
    if (!player) return;
    
    const loadPlayerData = () => {
      try {
        // Get available quality levels
        if (player.getAvailableQualityLevels) {
          const qualities = player.getAvailableQualityLevels();
          if (qualities && qualities.length > 0) {
            // Filter and format quality levels
            const qualityMap = {
              'tiny': '144p',
              'small': '240p',
              'medium': '360p',
              'large': '480p',
              'hd720': '720p',
              'hd1080': '1080p',
              'highres': '2160p'
            };
            
            const formattedQualities = qualities
              .map(q => {
                const quality = qualityMap[q] || q.toUpperCase();
                return { value: q, label: quality };
              })
              .filter(q => q.label); // Remove invalid qualities
            
            // Add 'auto' option at the beginning
            setAvailableQualities([
              { value: 'auto', label: 'Auto' },
              ...formattedQualities
            ]);
          }
        }

        // Get current quality
        if (player.getPlaybackQuality) {
          const currentQ = player.getPlaybackQuality();
          if (currentQ && currentQ !== 'unknown') {
            setCurrentQuality(currentQ);
            // Only set quality if it's not auto/default
            if (currentQ !== 'auto' && currentQ !== 'default') {
              setQuality(currentQ);
            } else {
              setQuality('auto');
            }
          }
        }

        // Get available caption tracks
        try {
          if (player.getOption) {
            const tracks = player.getOption('captions', 'trackList');
            if (tracks && Array.isArray(tracks) && tracks.length > 0) {
              const languages = tracks
                .filter(track => track && track.languageCode)
                .map(track => ({
                  code: track.languageCode,
                  name: track.name?.simpleText || 
                        track.name?.runs?.[0]?.text || 
                        track.name?.default || 
                        track.languageCode ||
                        'Unknown'
                }));
              
              if (languages.length > 0) {
                setAvailableCaptionLanguages(languages);
                
                // Check if captions are currently enabled
                const currentTrack = player.getOption('captions', 'track');
                if (currentTrack && currentTrack.languageCode) {
                  setCaptionsEnabled(true);
                  setCaptionLanguage(currentTrack.languageCode);
                } else {
                  // Check if captions are visible (alternative method)
                  const captionsVisible = player.getOption('captions', 'visible');
                  if (captionsVisible === true) {
                    setCaptionsEnabled(true);
                  }
                }
              }
            }
          }
        } catch (captionError) {
          console.log('Caption loading error:', captionError);
        }

        // Get current playback rate
        if (player.getPlaybackRate) {
          const rate = player.getPlaybackRate();
          if (rate) {
            setPlaybackRate(rate);
          }
        }
      } catch (e) {
        console.log('Player data loading error:', e);
      }
    };

    // Try loading data after a delay to ensure player is ready
    const timeout = setTimeout(loadPlayerData, 1500);
    
    // Also listen for quality changes
    const checkQuality = () => {
      try {
        if (player.getPlaybackQuality) {
          const currentQ = player.getPlaybackQuality();
          if (currentQ && currentQ !== 'unknown' && currentQ !== currentQuality) {
            setCurrentQuality(currentQ);
            // Only update quality state if we're in auto mode
            if (quality === 'auto' || quality === 'default') {
              // Keep it as auto, but update currentQuality for display
            }
          }
        }
      } catch (e) {
        // Ignore errors
      }
    };

    const qualityInterval = setInterval(checkQuality, 2000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(qualityInterval);
    };
  }, [player]);

  const handlePlayPause = () => {
    // Prevent rapid double clicks
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (isPlaying) {
      if (onPause) onPause();
      if (player && player.pauseVideo) player.pauseVideo();
    } else {
      if (onPlay) onPlay();
      if (player && player.playVideo) player.playVideo();
    }
  };

  const handleSeek = (e) => {
    if (!player || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    
    if (player.seekTo) {
      player.seekTo(newTime, true);
      setCurrentTime(newTime);
    }
    if (onSeek) onSeek(newTime);
  };

  const handleProgressDrag = (e) => {
    if (!player || !progressRef.current) return;
    
    const handleMove = (moveEvent) => {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      const newTime = percent * duration;
      setCurrentTime(newTime);
    };

    const handleEnd = (endEvent) => {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (endEvent.clientX - rect.left) / rect.width));
      const newTime = percent * duration;
      
      if (player.seekTo) {
        player.seekTo(newTime, true);
        setCurrentTime(newTime);
      }
      
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    handleSeek(e);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  const handleVolumeChange = (e) => {
    if (!player) return;
    
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    
    if (player.setVolume) {
      player.setVolume(newVolume);
    }
    
    if (newVolume === 0) {
      setIsMuted(true);
      if (player.mute) player.mute();
    } else {
      setIsMuted(false);
      if (player.unMute) player.unMute();
    }
  };

  const handleMuteToggle = () => {
    if (!player) return;
    
    if (isMuted) {
      setIsMuted(false);
      if (player.unMute) player.unMute();
      if (player.setVolume && volume === 0) {
        player.setVolume(50);
        setVolume(50);
      }
    } else {
      setIsMuted(true);
      if (player.mute) player.mute();
    }
  };

  const handleSkipForward = () => {
    if (!player) return;
    const newTime = Math.min(duration, currentTime + 10);
    if (player.seekTo) {
      player.seekTo(newTime, true);
      setCurrentTime(newTime);
    }
  };

  const handleSkipBackward = () => {
    if (!player) return;
    const newTime = Math.max(0, currentTime - 10);
    if (player.seekTo) {
      player.seekTo(newTime, true);
      setCurrentTime(newTime);
    }
  };

  const handlePlaybackRateChange = (rate) => {
    if (!player) return;
    try {
      if (player.setPlaybackRate) {
        player.setPlaybackRate(rate);
        setPlaybackRate(rate);
      }
    } catch (e) {
      console.log('Playback rate change error:', e);
    }
    setActiveSubMenu(null);
  };

  const handleQualityChange = (q) => {
    if (!player) return;
    try {
      if (q === 'auto') {
        if (player.setPlaybackQuality) {
          player.setPlaybackQuality('default');
        }
        setQuality('auto');
      } else {
        if (player.setPlaybackQuality) {
          const result = player.setPlaybackQuality(q);
          // YouTube API may return undefined or the quality string
          if (result !== undefined) {
            setQuality(q);
            setCurrentQuality(q);
          } else {
            // If API doesn't return value, still update state
            setQuality(q);
            // Check actual quality after a delay
            setTimeout(() => {
              if (player.getPlaybackQuality) {
                const actualQ = player.getPlaybackQuality();
                if (actualQ) {
                  setCurrentQuality(actualQ);
                }
              }
            }, 500);
          }
        }
      }
    } catch (e) {
      console.log('Quality change error:', e);
    }
    setActiveSubMenu(null);
  };

  const handleCaptionsToggle = () => {
    if (!player) return;
    try {
      if (player.setOption) {
        if (captionsEnabled) {
          // Disable captions
          player.setOption('captions', { 
            'track': {},
            'visible': false
          });
          setCaptionsEnabled(false);
        } else {
          // Enable captions with current language or first available
          const langToUse = captionLanguage || (availableCaptionLanguages.length > 0 ? availableCaptionLanguages[0].code : 'en');
          player.setOption('captions', { 
            'track': { 'languageCode': langToUse },
            'visible': true
          });
          setCaptionsEnabled(true);
          setCaptionLanguage(langToUse);
        }
        
        // Verify the change
        setTimeout(() => {
          try {
            const visible = player.getOption('captions', 'visible');
            if (visible !== undefined) {
              setCaptionsEnabled(visible);
            }
          } catch (e) {
            // Ignore verification errors
          }
        }, 300);
      }
    } catch (e) {
      console.log('Caption toggle error:', e);
    }
  };

  const handleCaptionLanguageChange = (langCode) => {
    if (!player) return;
    try {
      if (player.setOption) {
        // Enable captions and set language
        player.setOption('captions', { 
          'track': { 'languageCode': langCode },
          'visible': true
        });
        setCaptionLanguage(langCode);
        setCaptionsEnabled(true);
        
        // Verify the change was applied
        setTimeout(() => {
          try {
            const currentTrack = player.getOption('captions', 'track');
            if (currentTrack && currentTrack.languageCode === langCode) {
              setCaptionLanguage(langCode);
              setCaptionsEnabled(true);
            }
          } catch (e) {
            // Ignore verification errors
          }
        }, 300);
      }
    } catch (e) {
      console.log('Caption language change error:', e);
    }
    setActiveSubMenu(null);
  };

  const getQualityDisplay = () => {
    if (quality === 'auto' || quality === 'default') {
      // Try to get current quality for display
      if (currentQuality && currentQuality !== 'auto' && currentQuality !== 'default' && currentQuality !== 'unknown') {
        const qualityMap = {
          'tiny': '144p',
          'small': '240p',
          'medium': '360p',
          'large': '480p',
          'hd720': '720p HD',
          'hd1080': '1080p HD',
          'highres': '2160p'
        };
        const display = qualityMap[currentQuality] || currentQuality.toUpperCase();
        return `Auto (${display})`;
      }
      return 'Auto';
    }
    const qualityMap = {
      'tiny': '144p',
      'small': '240p',
      'medium': '360p',
      'large': '480p',
      'hd720': '720p HD',
      'hd1080': '1080p HD',
      'highres': '2160p'
    };
    return qualityMap[quality] || quality.toUpperCase();
  };

  const getPlaybackSpeedDisplay = () => {
    if (playbackRate === 1) {
      return 'Normal';
    }
    return `${playbackRate}x`;
  };

  const getCaptionDisplay = () => {
    if (!captionsEnabled) {
      return 'Off';
    }
    const lang = availableCaptionLanguages.find(l => l.code === captionLanguage);
    return lang ? lang.name : 'English';
  };

  const getCaptionCount = () => {
    return availableCaptionLanguages.length > 0 ? availableCaptionLanguages.length : 1;
  };

  const handleFullscreen = () => {
    // Make the entire website fullscreen, not just the video
    const element = document.documentElement;

    if (!isFullscreen) {
      // Enter fullscreen
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || 
                     !!document.webkitFullscreenElement || 
                     !!document.mozFullScreenElement || 
                     !!document.msFullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showControlsWithDelay = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    // Only hide if video is playing, not paused, not buffering, and not loading
    if (isPlaying && !isBuffering && !isLoading) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
  };

  const handleMouseMove = () => {
    showControlsWithDelay();
  };

  const handleMouseEnter = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    // Only hide if video is playing, not paused, not buffering, and not loading
    if (isPlaying && !isBuffering && !isLoading) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  };

  useEffect(() => {
    // Show controls initially
    setShowControls(true);
    // Don't auto-hide if video is paused, buffering, or loading
    if (isPlaying && !isBuffering && !isLoading) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    } else {
      // Keep controls visible when paused, buffering, or loading
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isBuffering, isLoading]);

  // Keep controls visible when paused, buffering, or loading
  useEffect(() => {
    if (!isPlaying || isBuffering || isLoading) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isPlaying, isBuffering, isLoading]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (playPauseTimeoutRef.current) {
        clearTimeout(playPauseTimeoutRef.current);
      }
    };
  }, []);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSettings]);

  useEffect(() => {
    if (!player) return;

    // Keyboard shortcuts
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // Space bar - play/pause
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      }
      // Arrow left - seek backward 10s
      else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkipBackward();
      }
      // Arrow right - seek forward 10s
      else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkipForward();
      }
      // Arrow up - volume up
      else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const newVolume = Math.min(100, volume + 10);
        setVolume(newVolume);
        if (player.setVolume) player.setVolume(newVolume);
        if (isMuted && newVolume > 0) {
          setIsMuted(false);
          if (player.unMute) player.unMute();
        }
      }
      // Arrow down - volume down
      else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const newVolume = Math.max(0, volume - 10);
        setVolume(newVolume);
        if (player.setVolume) player.setVolume(newVolume);
        if (newVolume === 0) {
          setIsMuted(true);
          if (player.mute) player.mute();
        }
      }
      // M - mute/unmute
      else if (e.code === 'KeyM') {
        e.preventDefault();
        handleMuteToggle();
      }
      // F - fullscreen
      else if (e.code === 'KeyF') {
        e.preventDefault();
        handleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [player, currentTime, duration, volume, isMuted, isPlaying]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleOverlayClick = (e) => {
    // Don't handle clicks here - let center-click-area handle it
    // This is just for showing controls
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    // Keep controls visible longer after click, but only if playing and not buffering/loading
    if (isPlaying && !isBuffering && !isLoading) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
  };

  return (
    <div 
      className={`player-controls-overlay ${showControls ? 'visible' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        // Only handle if click is directly on overlay, not on center-click-area
        if (e.target === e.currentTarget || e.target.classList.contains('player-controls-overlay')) {
          handleOverlayClick(e);
        }
      }}
      onTouchStart={() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        // Keep controls visible longer on touch, but only if playing and not buffering/loading
        if (isPlaying && !isBuffering && !isLoading) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 5000);
        }
      }}
      onTouchMove={() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        // Keep controls visible longer on touch, but only if playing and not buffering/loading
        if (isPlaying && !isBuffering && !isLoading) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 5000);
        }
      }}
    >
      {isBuffering && (
        <div className="buffering-indicator">
          <svg 
            className="buffering-icon" 
            xmlns="http://www.w3.org/2000/svg" 
            aria-label="Arch Linux" 
            role="img" 
            viewBox="0 0 512 512"
          >
            <rect width="512" height="512" rx="15%" className="arch-bg-buffering"></rect>
            <path d="M256 72c-14 35-23 57-39 91 10 11 22 23 41 36-21-8-35-17-45-26-21 43-53 103-117 220 50-30 90-48 127-55-2-7-3-14-3-22v-1c1-33 18-58 38-56 20 1 36 29 35 62l-2 17c36 7 75 26 125 54l-27-50c-13-10-27-23-55-38 19 5 33 11 44 17-86-159-93-180-122-250z" className="arch-path-buffering"></path>
          </svg>
        </div>
      )}

      {/* Center click area for play/pause */}
      <div 
        className="center-click-area"
        onClick={(e) => {
          e.stopPropagation(); // Prevent overlay click from firing
          // Only toggle if not clicking on controls
          const clickedOnControls = e.target.closest('.controls-top, .controls-bottom, .control-btn, .settings-slider, .settings-backdrop, .progress-bar-container, .volume-control, .time-display, .buffering-indicator');
          if (!clickedOnControls) {
            // Prevent rapid double clicks
            if (playPauseTimeoutRef.current) {
              return; // Ignore if already processing
            }
            handlePlayPause();
            // Set a short timeout to prevent double clicks
            playPauseTimeoutRef.current = setTimeout(() => {
              playPauseTimeoutRef.current = null;
            }, 300);
          }
        }}
        onTouchStart={(e) => {
          e.stopPropagation(); // Prevent overlay touch from firing
          const clickedOnControls = e.target.closest('.controls-top, .controls-bottom, .control-btn, .settings-slider, .settings-backdrop, .progress-bar-container, .volume-control, .time-display, .buffering-indicator');
          if (!clickedOnControls) {
            // Prevent rapid double touches
            if (playPauseTimeoutRef.current) {
              return; // Ignore if already processing
            }
            handlePlayPause();
            setShowControls(true);
            // Set a short timeout to prevent double touches
            playPauseTimeoutRef.current = setTimeout(() => {
              playPauseTimeoutRef.current = null;
            }, 300);
          }
        }}
      />

      <div className="controls-top" onClick={(e) => e.stopPropagation()}>
      </div>

      <div className="controls-bottom" onClick={(e) => e.stopPropagation()}>
        <div 
          className="progress-bar-container" 
          ref={progressRef} 
          onClick={handleSeek}
          onMouseDown={handleProgressDrag}
          onTouchStart={handleProgressDrag}
        >
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercent}%` }}
            />
            <div 
              className="progress-handle" 
              style={{ left: `${progressPercent}%` }}
            >
              <HiGlobe className="progress-handle-icon" />
            </div>
          </div>
        </div>
        
        <div className="controls-main">
          <div className="controls-left">
            <button 
              className="control-btn skip-btn"
              onClick={handleSkipBackward}
              aria-label="Skip backward 10 seconds"
            >
              <MdReplay10 />
            </button>

            <button 
              className="control-btn play-pause-btn"
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <HiPause /> : <HiPlay />}
            </button>

            <button 
              className="control-btn skip-btn"
              onClick={handleSkipForward}
              aria-label="Skip forward 10 seconds"
            >
              <MdForward10 />
            </button>

            <div className="volume-control">
              <button 
                className="control-btn volume-btn"
                onClick={handleMuteToggle}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <HiVolumeOff /> : <HiVolumeUp />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                aria-label="Volume"
              />
            </div>

            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span className="time-separator">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="controls-right">
            <button 
              className="control-btn fullscreen-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleFullscreen();
              }}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <HiArrowsExpand />
            </button>
            <div className="settings-container">
              <button 
                className="control-btn settings-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(!showSettings);
                }}
                aria-label="Settings"
              >
                <HiCog />
              </button>
            </div>
          </div>
        </div>
      </div>
      {showSettings && (
        <>
          <div className="settings-backdrop" onClick={() => setShowSettings(false)} />
          <div className={`settings-slider ${showSettings ? 'open' : ''}`} ref={settingsRef}>
            <div className="settings-header">
              <h3>Settings</h3>
              <button 
                className="settings-close-btn"
                onClick={() => setShowSettings(false)}
                aria-label="Close settings"
              >
                <HiX />
              </button>
            </div>
            
            {activeSubMenu === null ? (
              <div className="settings-list">
                <div className="settings-item" onClick={() => setCinematicLighting(!cinematicLighting)}>
                  <div className="settings-item-left">
                    <MdLightMode className="settings-item-icon" />
                    <span className="settings-item-text">Cinematic Lighting</span>
                  </div>
                  <div className="settings-item-right">
                    <div className={`toggle-switch ${cinematicLighting ? 'on' : ''}`}>
                      <div className="toggle-slider" />
                    </div>
                  </div>
                </div>

                <div className="settings-item" onClick={() => setAnnotationComposition(!annotationComposition)}>
                  <div className="settings-item-left">
                    <MdNote className="settings-item-icon" />
                    <span className="settings-item-text">Annotation Composition</span>
                  </div>
                  <div className="settings-item-right">
                    <div className={`toggle-switch ${annotationComposition ? 'on' : ''}`}>
                      <div className="toggle-slider" />
                    </div>
                  </div>
                </div>

                <div className="settings-item" onClick={() => setActiveSubMenu('subtitles')}>
                  <div className="settings-item-left">
                    <MdSubtitles className="settings-item-icon" />
                    <span className="settings-item-text">Subtitles ({getCaptionCount()})</span>
                  </div>
                  <div className="settings-item-right">
                    <span className="settings-item-value">{getCaptionDisplay()}</span>
                    <HiChevronRight className="settings-item-arrow" />
                  </div>
                </div>

                <div className="settings-item" onClick={() => setActiveSubMenu('sleepTimer')}>
                  <div className="settings-item-left">
                    <MdTimer className="settings-item-icon" />
                    <span className="settings-item-text">Sleep Timer</span>
                  </div>
                  <div className="settings-item-right">
                    <span className="settings-item-value">Off</span>
                    <HiChevronRight className="settings-item-arrow" />
                  </div>
                </div>

                <div className="settings-item" onClick={() => setActiveSubMenu('playbackSpeed')}>
                  <div className="settings-item-left">
                    <MdSpeed className="settings-item-icon" />
                    <span className="settings-item-text">Playback Speed</span>
                  </div>
                  <div className="settings-item-right">
                    <span className="settings-item-value">{getPlaybackSpeedDisplay()}</span>
                    <HiChevronRight className="settings-item-arrow" />
                  </div>
                </div>

                <div className="settings-item" onClick={() => setActiveSubMenu('quality')}>
                  <div className="settings-item-left">
                    <MdHighQuality className="settings-item-icon" />
                    <span className="settings-item-text">Quality</span>
                  </div>
                  <div className="settings-item-right">
                    <span className="settings-item-value">{getQualityDisplay()}</span>
                    <HiChevronRight className="settings-item-arrow" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="settings-submenu">
                <div className="settings-submenu-header">
                  <button 
                    className="settings-back-btn"
                    onClick={() => setActiveSubMenu(null)}
                    aria-label="Back"
                  >
                    <HiChevronLeft className="back-icon" />
                  </button>
                  <h3>
                    {activeSubMenu === 'subtitles' && 'Subtitles'}
                    {activeSubMenu === 'playbackSpeed' && 'Playback Speed'}
                    {activeSubMenu === 'quality' && 'Quality'}
                    {activeSubMenu === 'sleepTimer' && 'Sleep Timer'}
                  </h3>
                  <button 
                    className="settings-close-btn"
                    onClick={() => setShowSettings(false)}
                    aria-label="Close settings"
                  >
                    <HiX />
                  </button>
                </div>
                
                {activeSubMenu === 'subtitles' && (
                  <div className="settings-submenu-list">
                    <div 
                      className={`settings-submenu-item ${!captionsEnabled ? 'active' : ''}`}
                      onClick={() => {
                        handleCaptionsToggle();
                        setActiveSubMenu(null);
                      }}
                    >
                      <span>Off</span>
                    </div>
                    {availableCaptionLanguages.length > 0 ? (
                      availableCaptionLanguages.map((lang) => {
                        const isActive = captionsEnabled && captionLanguage === lang.code;
                        return (
                          <div
                            key={lang.code}
                            className={`settings-submenu-item ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              if (lang.code) {
                                handleCaptionLanguageChange(lang.code);
                              }
                            }}
                          >
                            <span>{lang.name || lang.code || 'Unknown'}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        className={`settings-submenu-item ${captionsEnabled && captionLanguage === 'en' ? 'active' : ''}`}
                        onClick={() => handleCaptionLanguageChange('en')}
                      >
                        <span>English</span>
                      </div>
                    )}
                  </div>
                )}

                {activeSubMenu === 'playbackSpeed' && (
                  <div className="settings-submenu-list">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <div
                        key={rate}
                        className={`settings-submenu-item ${playbackRate === rate ? 'active' : ''}`}
                        onClick={() => handlePlaybackRateChange(rate)}
                      >
                        <span>{rate === 1 ? 'Normal' : `${rate}x`}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeSubMenu === 'quality' && (
                  <div className="settings-submenu-list">
                    {availableQualities.length > 0 ? (
                      availableQualities.map((q) => (
                        <div
                          key={q.value}
                          className={`settings-submenu-item ${(quality === q.value || (quality === 'auto' && q.value === 'auto') || (quality === 'default' && q.value === 'auto')) ? 'active' : ''}`}
                          onClick={() => handleQualityChange(q.value)}
                        >
                          <span>
                            {q.value === 'auto' 
                              ? (currentQuality && currentQuality !== 'auto' && currentQuality !== 'default' && currentQuality !== 'unknown'
                                  ? (() => {
                                      const qualityMap = {
                                        'tiny': '144p',
                                        'small': '240p',
                                        'medium': '360p',
                                        'large': '480p',
                                        'hd720': '720p HD',
                                        'hd1080': '1080p HD',
                                        'highres': '2160p'
                                      };
                                      const display = qualityMap[currentQuality] || currentQuality.toUpperCase();
                                      return `Auto (${display})`;
                                    })()
                                  : 'Auto')
                              : q.label}
                          </span>
                        </div>
                      ))
                    ) : (
                      // Fallback if qualities not loaded yet
                      ['auto', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'].map((q) => {
                        const qualityMap = {
                          'tiny': '144p',
                          'small': '240p',
                          'medium': '360p',
                          'large': '480p',
                          'hd720': '720p HD',
                          'hd1080': '1080p HD',
                          'auto': 'Auto'
                        };
                        return (
                          <div
                            key={q}
                            className={`settings-submenu-item ${quality === q ? 'active' : ''}`}
                            onClick={() => handleQualityChange(q)}
                          >
                            <span>{qualityMap[q] || q.toUpperCase()}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeSubMenu === 'sleepTimer' && (
                  <div className="settings-submenu-list">
                    <div className={`settings-submenu-item ${sleepTimer === 'off' ? 'active' : ''}`} onClick={() => setSleepTimer('off')}>
                      <span>Off</span>
                    </div>
                    <div className={`settings-submenu-item ${sleepTimer === '5' ? 'active' : ''}`} onClick={() => setSleepTimer('5')}>
                      <span>5 minutes</span>
                    </div>
                    <div className={`settings-submenu-item ${sleepTimer === '10' ? 'active' : ''}`} onClick={() => setSleepTimer('10')}>
                      <span>10 minutes</span>
                    </div>
                    <div className={`settings-submenu-item ${sleepTimer === '15' ? 'active' : ''}`} onClick={() => setSleepTimer('15')}>
                      <span>15 minutes</span>
                    </div>
                    <div className={`settings-submenu-item ${sleepTimer === '30' ? 'active' : ''}`} onClick={() => setSleepTimer('30')}>
                      <span>30 minutes</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PlayerControls;

