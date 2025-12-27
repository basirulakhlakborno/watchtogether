import { useState, useEffect, useRef } from 'react';
import { HiPlay, HiPause, HiMicrophone, HiPhone, HiClipboard, HiLogout } from 'react-icons/hi';
import { MdMicOff, MdTv } from 'react-icons/md';
import VideoPlayer from '../components/VideoPlayer/VideoPlayer';
import { roomAPI, getCurrentUser } from '../utils/api';
import { connectSocket, disconnectSocket, getSocket } from '../utils/socket';
import './WatchTogether.less';

function WatchTogether({ roomId: initialRoomId }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [roomName, setRoomName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // Store multiple peer connections
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [audioLevels, setAudioLevels] = useState(Array(24).fill(0));
  const socketRef = useRef(null);
  const playerRef = useRef(null);
  const isSyncingRef = useRef(false);
  const noiseSuppressionNodeRef = useRef(null);
  const processedStreamRef = useRef(null);

  // Initialize room and socket connection
  useEffect(() => {
    let isMounted = true;
    let socketInstance = null;
    
    const initializeRoom = async () => {
      try {
        // Get current user
        const user = getCurrentUser();
        if (isMounted) setCurrentUser(user);

        // If no room ID, create a new room
        let finalRoomId = initialRoomId;
        if (!finalRoomId) {
          const response = await roomAPI.createRoom('My Watch Room');
          if (response.success && response.room) {
            finalRoomId = response.room.id;
            if (isMounted) {
              setRoomId(finalRoomId);
              setRoomName(response.room.name);
            }
            window.location.hash = `#watch?room=${finalRoomId}`;
          } else {
            alert('Failed to create room');
            window.location.hash = '#';
            return;
          }
        } else {
          // Load existing room
          try {
            const roomData = await roomAPI.getRoom(finalRoomId);
            if (roomData.success && roomData.room) {
              if (isMounted) {
                setRoomId(finalRoomId);
                setRoomName(roomData.room.name);
                if (roomData.room.videoUrl) {
                  setVideoUrl(roomData.room.videoUrl);
                }
                setOnlineCount(roomData.room.participantCount || 0);
              }
            } else {
              alert('Room not found');
              window.location.hash = '#';
              return;
            }
          } catch (error) {
            console.error('Error loading room:', error);
            alert('Failed to load room');
            window.location.hash = '#';
            return;
          }
        }

        // Connect to socket
        const socket = connectSocket();
        socketInstance = socket;
        socketRef.current = socket;

        // Join room
        socket.emit('join-room', finalRoomId);

        // Listen for room state
        socket.on('room-state', (state) => {
          if (state.videoUrl && state.videoUrl !== videoUrl) {
            setVideoUrl(state.videoUrl);
          }
          if (state.isPlaying !== isPlaying) {
            setIsPlaying(state.isPlaying);
          }
          setOnlineCount(state.participants || 0);
        });

        // Listen for user joined/left
        socket.on('user-joined', (data) => {
          setOnlineCount(data.participants || 0);
        });

        socket.on('user-left', (data) => {
          setOnlineCount(data.participants || 0);
        });

        // Listen for video sync events
        socket.on('video-play', () => {
          if (playerRef.current && playerRef.current.playVideo) {
            isSyncingRef.current = true;
            playerRef.current.playVideo();
            setIsPlaying(true);
            setTimeout(() => {
              isSyncingRef.current = false;
            }, 500);
          }
        });

        socket.on('video-pause', () => {
          if (playerRef.current && playerRef.current.pauseVideo) {
            isSyncingRef.current = true;
            playerRef.current.pauseVideo();
            setIsPlaying(false);
            setTimeout(() => {
              isSyncingRef.current = false;
            }, 500);
          }
        });

        socket.on('video-seek', (time) => {
          if (playerRef.current && playerRef.current.seekTo) {
            isSyncingRef.current = true;
            playerRef.current.seekTo(time, true);
            setTimeout(() => {
              isSyncingRef.current = false;
            }, 500);
          }
        });

        socket.on('video-url-change', (url) => {
          setVideoUrl(url);
        });

        // Listen for chat messages
        socket.on('chat-message', (data) => {
          if (isMounted) {
            setChatMessages(prev => [...prev, {
              userId: data.userId,
              username: data.username,
              message: data.message,
              timestamp: data.timestamp,
              isOwn: data.userId === user?.userId
            }]);
          }
        });

        // Listen for WebRTC signaling events
        socket.on('voice-offer', async (data) => {
          if (data.from === user?.userId) return;
          
          // Only handle if we have a local stream (we're in the call)
          if (!localStreamRef.current) {
            console.log('Received voice offer but no local stream available');
            return;
          }
          
          try {
            console.log('Handling voice offer from:', data.from);
            
            const configuration = {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
              ]
            };
            
            // Check if we already have a connection for this user
            let pc = peerConnectionsRef.current.get(data.from);
            if (!pc) {
              pc = new RTCPeerConnection(configuration);
              peerConnectionsRef.current.set(data.from, pc);
              
              // Add local stream tracks
              localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
              });

              // Handle remote stream
              pc.ontrack = (event) => {
                console.log('Received remote track from:', data.from, 'tracks:', event.streams[0].getTracks().length);
                event.streams[0].getTracks().forEach(track => {
                  console.log('Remote track:', track.kind, track.id, 'enabled:', track.enabled, 'readyState:', track.readyState);
                });
                
                if (remoteAudioRef.current) {
                  // Merge streams if multiple users
                  if (!remoteStreamRef.current) {
                    remoteStreamRef.current = new MediaStream();
                    remoteAudioRef.current.srcObject = remoteStreamRef.current;
                    console.log('Created new remote stream');
                  }
                  
                  event.streams[0].getTracks().forEach(track => {
                    const existingTrack = remoteStreamRef.current.getTracks().find(t => t.id === track.id);
                    if (!existingTrack) {
                      remoteStreamRef.current.addTrack(track);
                      console.log('Added remote audio track:', track.id);
                      
                      // Enable the track
                      track.enabled = true;
                      
                      // Listen for track ended
                      track.onended = () => {
                        console.log('Remote track ended:', track.id);
                      };
                    }
                  });
                  
                  // Ensure audio element is set up and playing
                  if (remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
                    remoteAudioRef.current.srcObject = remoteStreamRef.current;
                  }
                  
                  remoteAudioRef.current.volume = 1.0;
                  remoteAudioRef.current.muted = false;
                  
                  // Try to play audio
                  const playPromise = remoteAudioRef.current.play();
                  if (playPromise !== undefined) {
                    playPromise
                      .then(() => {
                        console.log('Remote audio playing successfully');
                      })
                      .catch(err => {
                        console.error('Error playing remote audio:', err);
                        // Try again after a short delay
                        setTimeout(() => {
                          remoteAudioRef.current?.play().catch(e => {
                            console.error('Retry play failed:', e);
                          });
                        }, 500);
                      });
                  }
                } else {
                  console.error('remoteAudioRef.current is null!');
                }
              };

              // Handle ICE candidates
              pc.onicecandidate = (event) => {
                if (event.candidate && socketRef.current) {
                  socketRef.current.emit('voice-ice-candidate', {
                    roomId: finalRoomId,
                    candidate: event.candidate,
                    to: data.from
                  });
                }
              };

              // Handle connection state changes
              pc.onconnectionstatechange = () => {
                console.log('Peer connection state:', pc.connectionState, 'for user:', data.from);
                if (pc.connectionState === 'connected') {
                  console.log('✅ Peer connection established with:', data.from);
                } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                  console.error('❌ Peer connection failed/disconnected with:', data.from);
                }
              };
              
              // Handle ICE connection state
              pc.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', pc.iceConnectionState, 'for user:', data.from);
              };
              
              // Handle ICE gathering state
              pc.onicegatheringstatechange = () => {
                console.log('ICE gathering state:', pc.iceGatheringState, 'for user:', data.from);
              };
            }

            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            socket.emit('voice-answer', {
              roomId: finalRoomId,
              answer: answer,
              to: data.from
            });
            
            console.log('Sent voice answer to:', data.from);
          } catch (error) {
            console.error('Error handling voice offer:', error);
          }
        });

        socket.on('voice-answer', async (data) => {
          if (data.from === user?.userId) return;
          
          const pc = peerConnectionsRef.current.get(data.from);
          if (!pc) {
            console.log('Received voice answer but no peer connection for:', data.from);
            return;
          }
          
          try {
            console.log('Handling voice answer from:', data.from);
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('Set remote description for:', data.from);
          } catch (error) {
            console.error('Error handling voice answer:', error);
          }
        });

        socket.on('voice-ice-candidate', async (data) => {
          if (data.from === user?.userId) return;
          
          const pc = peerConnectionsRef.current.get(data.from);
          if (!pc) {
            console.log('Received ICE candidate but no peer connection for:', data.from);
            return;
          }
          
          try {
            if (data.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              console.log('Added ICE candidate from:', data.from);
            }
          } catch (error) {
            console.error('Error handling ICE candidate:', error);
          }
        });

        socket.on('voice-user-joined', (data) => {
          console.log('User joined voice chat:', data.username, 'userId:', data.userId);
          // If we have a local stream (we're in the call), create a peer connection for the new user
          if (localStreamRef.current && data.userId !== user?.userId) {
            console.log('Creating peer connection for new user:', data.userId);
            createPeerConnectionForUser(data.userId, finalRoomId);
          }
        });

        socket.on('voice-user-left', (data) => {
          console.log('User left voice chat:', data.username);
          // Close peer connection for this user
          const pc = peerConnectionsRef.current.get(data.userId);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(data.userId);
          }
          
          // If no more connections, clear remote stream
          if (peerConnectionsRef.current.size === 0) {
            if (remoteStreamRef.current) {
              remoteStreamRef.current.getTracks().forEach(track => track.stop());
              remoteStreamRef.current = null;
            }
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = null;
            }
          }
        });

        // Listen for errors
        socket.on('error', (error) => {
          console.error('Socket error:', error);
        });

      } catch (error) {
        console.error('Error initializing room:', error);
        alert('Failed to initialize room');
        window.location.hash = '#';
      }
    };

    initializeRoom();

    return () => {
      isMounted = false;
      // Cleanup on unmount
      if (socketInstance) {
        const currentRoomId = roomId || initialRoomId;
        if (currentRoomId) {
          socketInstance.emit('leave-room', currentRoomId);
        }
        socketInstance.removeAllListeners();
        disconnectSocket();
      }
    };
  }, [initialRoomId]);

  const handleExitRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomId);
      disconnectSocket();
    }
    window.location.hash = '#';
  };

  const handlePlayPause = () => {
    if (isSyncingRef.current) return;
    
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    if (socketRef.current) {
      if (newPlayingState) {
        socketRef.current.emit('video-play', roomId);
      } else {
        socketRef.current.emit('video-pause', roomId);
      }
    }
  };

  const handleVideoStateChange = (state) => {
    if (isSyncingRef.current) return;
    
    // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    if (state === 1) {
      setIsPlaying(true);
      if (socketRef.current) {
        socketRef.current.emit('video-play', roomId);
      }
    } else if (state === 2 || state === 0) {
      setIsPlaying(false);
      if (socketRef.current) {
        socketRef.current.emit('video-pause', roomId);
      }
    }
  };

  const handleLoadVideo = () => {
    if (videoUrl.trim() && socketRef.current) {
      socketRef.current.emit('video-url-change', roomId, videoUrl);
    }
  };

  const handleSeek = (time) => {
    if (isSyncingRef.current || !socketRef.current) return;
    socketRef.current.emit('video-seek', roomId, time);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;

    socketRef.current.emit('chat-message', roomId, chatInput.trim());
    setChatInput('');
  };

  // Helper function to create peer connection for a specific user
  const createPeerConnectionForUser = async (userId, roomId) => {
    if (!localStreamRef.current || !socketRef.current) {
      console.log('Cannot create peer connection: missing local stream or socket');
      return;
    }

    // Check if connection already exists
    if (peerConnectionsRef.current.has(userId)) {
      console.log('Peer connection already exists for user:', userId);
      return;
    }

    try {
      console.log('Creating peer connection for user:', userId);
      
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      };
      
      const pc = new RTCPeerConnection(configuration);
      peerConnectionsRef.current.set(userId, pc);

      // Add local stream tracks with proper settings for stability
      localStreamRef.current.getTracks().forEach(track => {
        // Ensure track is enabled and not muted
        track.enabled = true;
        pc.addTrack(track, localStreamRef.current);
        console.log('Added local track to peer connection');
      });
      
      // Configure peer connection for better audio stability
      pc.onconnectionstatechange = () => {
        console.log('Peer connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('✅ Peer connection stable');
        }
      };
      
      // Handle ICE connection state for stability monitoring
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          console.error('ICE connection failed - audio may be unstable');
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track from:', userId, 'tracks:', event.streams[0].getTracks().length);
        event.streams[0].getTracks().forEach(track => {
          console.log('Remote track:', track.kind, track.id, 'enabled:', track.enabled, 'readyState:', track.readyState);
        });
        
        if (remoteAudioRef.current) {
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
            remoteAudioRef.current.srcObject = remoteStreamRef.current;
            console.log('Created new remote stream');
          }
          
          event.streams[0].getTracks().forEach(track => {
            const existingTrack = remoteStreamRef.current.getTracks().find(t => t.id === track.id);
            if (!existingTrack) {
              remoteStreamRef.current.addTrack(track);
              console.log('Added remote audio track from:', userId, 'track:', track.id);
              
              // Enable the track
              track.enabled = true;
              
              // Listen for track ended
              track.onended = () => {
                console.log('Remote track ended:', track.id);
              };
            }
          });
          
          // Ensure audio element is set up and playing
          if (remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
            remoteAudioRef.current.srcObject = remoteStreamRef.current;
          }
          
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.muted = false;
          
          // Try to play audio
          const playPromise = remoteAudioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Remote audio playing successfully');
              })
              .catch(err => {
                console.error('Error playing remote audio:', err);
                // Try again after a short delay
                setTimeout(() => {
                  remoteAudioRef.current?.play().catch(e => {
                    console.error('Retry play failed:', e);
                  });
                }, 500);
              });
          }
        } else {
          console.error('remoteAudioRef.current is null!');
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('voice-ice-candidate', {
            roomId: roomId,
            candidate: event.candidate,
            to: userId
          });
          console.log('Sent ICE candidate to:', userId);
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Peer connection state for', userId, ':', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('✅ Peer connection established with:', userId);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.error('❌ Peer connection failed/disconnected with:', userId);
        }
      };
      
      // Handle ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state for', userId, ':', pc.iceConnectionState);
      };
      
      // Handle ICE gathering state
      pc.onicegatheringstatechange = () => {
        console.log('ICE gathering state for', userId, ':', pc.iceGatheringState);
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit('voice-offer', {
        roomId: roomId,
        offer: offer
      });
      
      console.log('Sent voice offer to:', userId);
    } catch (error) {
      console.error('Error creating peer connection for user:', error);
    }
  };

  // Create noise suppression using Web Audio API - Simplified and more effective
  const createNoiseSuppression = (audioContext, sourceNode) => {
    try {
      // Step 1: High-pass filter to remove low-frequency noise (rumble, wind, background)
      const highPassFilter = audioContext.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.value = 200; // Cut below 200Hz - more aggressive
      highPassFilter.Q.value = 0.5; // Gentle rolloff

      // Step 2: Low-pass filter to remove high-frequency noise (hiss, static, sibilance)
      const lowPassFilter = audioContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.value = 5000; // Cut above 5kHz - removes hiss
      lowPassFilter.Q.value = 0.5;

      // Step 3: Compressor to normalize levels and reduce background noise
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -35;
      compressor.knee.value = 25;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.15;

      // Step 4: Soft noise gate - reduces volume instead of muting completely
      // This prevents audio cut-offs while still reducing background noise
      const noiseGate = audioContext.createGain();
      noiseGate.gain.value = 0.3; // Start at 30% volume (not muted) to prevent cut-offs

      // Connect the chain: source -> highpass -> lowpass -> compressor -> noiseGate
      sourceNode.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(compressor);
      compressor.connect(noiseGate);

      // Create analyser for noise gate (after compressor for accurate detection)
      const gateAnalyser = audioContext.createAnalyser();
      gateAnalyser.fftSize = 256;
      gateAnalyser.smoothingTimeConstant = 0.8; // Less smoothing for faster response
      compressor.connect(gateAnalyser);

      // Soft noise gate - reduces volume instead of muting
      const gateDataArray = new Uint8Array(gateAnalyser.frequencyBinCount);
      const gateThreshold = 15; // Lower threshold - more sensitive
      const minGain = 0.2; // Minimum gain (20%) - never fully mute
      const maxGain = 1.0; // Maximum gain (100%)
      let currentGain = 0.3;
      let speechDetectedCount = 0;
      const speechConfirmationCount = 2; // Need 2 consecutive detections to fully open
      
      const gateInterval = setInterval(() => {
        gateAnalyser.getByteFrequencyData(gateDataArray);
        
        // Calculate peak and average
        let peak = 0;
        let sum = 0;
        for (let i = 0; i < gateDataArray.length; i++) {
          const value = gateDataArray[i];
          if (value > peak) peak = value;
          sum += value;
        }
        const average = sum / gateDataArray.length;
        
        // Use peak detection for better speech detection
        const speechLevel = Math.max(peak * 0.6, average);
        
        if (speechLevel > gateThreshold) {
          // Speech detected - gradually increase gain
          speechDetectedCount++;
          if (speechDetectedCount >= speechConfirmationCount) {
            // Confirmed speech - smoothly increase to max
            currentGain = Math.min(maxGain, currentGain + 0.15);
          }
        } else {
          // No speech - gradually decrease gain (but never below min)
          speechDetectedCount = 0;
          currentGain = Math.max(minGain, currentGain - 0.1);
        }
        
        // Smoothly apply gain changes to prevent audio artifacts
        noiseGate.gain.setTargetAtTime(currentGain, audioContext.currentTime, 0.05);
      }, 20); // Check more frequently for smoother transitions

      // Store cleanup function
      noiseGate.cleanup = () => clearInterval(gateInterval);

      console.log('Noise suppression initialized - stable audio with soft gating');
      return { output: noiseGate, cleanup: noiseGate.cleanup };
    } catch (error) {
      console.error('Error creating noise suppression:', error);
      // Return source node if noise suppression fails
      return { output: sourceNode, cleanup: () => {} };
    }
  };

  const handleJoinCall = async () => {
    try {
      setIsConnecting(true);
      
      // Get user media (microphone) with maximum noise suppression
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true, // Browser's built-in noise suppression - CRITICAL
            autoGainControl: true,
            sampleRate: 44100, // Standard sample rate
            channelCount: 1, // Mono reduces noise
            // Chrome-specific constraints (will be ignored by other browsers)
            googEchoCancellation: true,
            googAutoGainControl: true,
            googNoiseSuppression: true,
            googHighpassFilter: true,
            googTypingNoiseDetection: true
          } 
        });
        
        // Verify noise suppression is actually enabled
        const audioTrack = stream.getAudioTracks()[0];
        const settings = audioTrack.getSettings();
        console.log('Audio settings:', {
          noiseSuppression: settings.noiseSuppression,
          echoCancellation: settings.echoCancellation,
          autoGainControl: settings.autoGainControl,
          sampleRate: settings.sampleRate,
          channelCount: settings.channelCount
        });
        
        if (settings.noiseSuppression === false) {
          console.warn('⚠️ Browser noise suppression is DISABLED! This may cause noise issues.');
        }
      } catch (error) {
        console.error('Error getting user media with constraints:', error);
        // Fallback to basic audio without constraints
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.warn('Using fallback audio stream without noise suppression constraints');
      }
      
      // Set up audio context for processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 44100 // Match the stream sample rate
      });
      
      // Create source from stream
      const sourceNode = audioContext.createMediaStreamSource(stream);
      
      // Apply custom noise suppression
      const noiseSuppression = createNoiseSuppression(audioContext, sourceNode);
      noiseSuppressionNodeRef.current = noiseSuppression;
      
      // Create destination to get processed stream
      const destination = audioContext.createMediaStreamDestination();
      noiseSuppression.output.connect(destination);
      
      // Use processed stream for peer connections
      processedStreamRef.current = destination.stream;
      localStreamRef.current = processedStreamRef.current;
      
      // Ensure audio context is running (important for stability)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('Audio context resumed for stable playback');
        });
      }
      
      // Set up audio visualization (use original stream for visualization)
      const analyser = audioContext.createAnalyser();
      sourceNode.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      
      // Start visualization
      startAudioVisualization();
      
      // Play local audio for feedback (muted to avoid echo)
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream; // Use original stream for local feedback
        localAudioRef.current.muted = true; // Mute local audio to prevent echo
        localAudioRef.current.play().catch(err => {
          console.error('Error playing local audio:', err);
        });
      }

      // Initialize remote audio element
      if (remoteAudioRef.current) {
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.muted = false;
        // Don't try to play yet - wait for remote tracks
        console.log('Remote audio element initialized');
      } else {
        console.error('remoteAudioRef.current is null during join!');
      }

      // Notify others that we joined voice chat
      if (socketRef.current && roomId) {
        const user = getCurrentUser();
        console.log('Emitting voice-user-joined for room:', roomId, 'user:', user?.username);
        socketRef.current.emit('voice-user-joined', { roomId });
      }

      setIsCallActive(true);
      setIsConnecting(false);
      console.log('Voice call joined successfully with noise suppression');
    } catch (error) {
      console.error('Error joining call:', error);
      alert('Failed to join voice call. Please check microphone permissions.');
      setIsConnecting(false);
    }
  };

  const handleLeaveCall = () => {
    // Notify others that we're leaving voice chat
    if (socketRef.current && roomId) {
      socketRef.current.emit('voice-user-left', { roomId });
    }

    // Cleanup noise suppression
    if (noiseSuppressionNodeRef.current && noiseSuppressionNodeRef.current.cleanup) {
      noiseSuppressionNodeRef.current.cleanup();
      noiseSuppressionNodeRef.current = null;
    }

    // Stop audio visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (processedStreamRef.current) {
      processedStreamRef.current.getTracks().forEach(track => track.stop());
      processedStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc, userId) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();

    // Clear audio elements
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setIsCallActive(false);
    setIsMuted(false);
    setAudioLevels(Array(24).fill(0));
  };
  
  const startAudioVisualization = () => {
    if (!analyserRef.current || !dataArrayRef.current || !isCallActive) return;
    
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    const updateLevels = () => {
      if (!analyser || !isCallActive) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }
      
      analyser.getByteFrequencyData(dataArray);
      
      // Extract levels for 12 bars (like Telegram)
      const levels = [];
      const step = Math.floor(dataArray.length / 12);
      
      for (let i = 0; i < 12; i++) {
        const index = i * step;
        const value = dataArray[index] || 0;
        // Normalize to 0-100
        const normalized = Math.min(100, (value / 255) * 100);
        levels.push(normalized);
      }
      
      setAudioLevels(levels);
      
      if (isCallActive && !isMuted) {
        animationFrameRef.current = requestAnimationFrame(updateLevels);
      } else {
        setAudioLevels(Array(24).fill(0));
      }
    };
    
    updateLevels();
  };
  
  // Start visualization when call becomes active
  useEffect(() => {
    if (isCallActive && analyserRef.current && !isMuted) {
      startAudioVisualization();
    } else if (!isCallActive || isMuted) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (isMuted || !isCallActive) {
        setAudioLevels(Array(24).fill(0));
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCallActive, isMuted]);

  const handleToggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
      
      if (!isMuted) {
        // Restart visualization when unmuted
        if (analyserRef.current && isCallActive) {
          startAudioVisualization();
        }
      } else {
        // Clear levels when muted
        setAudioLevels(Array(24).fill(0));
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleLeaveCall();
      if (socketRef.current) {
        socketRef.current.emit('leave-room', roomId);
        disconnectSocket();
      }
    };
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="watch-together">
      <div className="watch-container">
        <div className="room-info">
          <div className="room-id-section">
            <div className="room-header">
              <h3>
                <HiClipboard /> Room Information
              </h3>
            </div>
            <div className="room-id-display">
              <div className="room-id-wrapper">
                <label className="room-id-label">Room ID</label>
                <span className="room-id">{roomId}</span>
              </div>
              <button onClick={handleExitRoom} className="btn-new-room">
                <HiLogout /> Exit Room
              </button>
            </div>
            <p className="room-share">Share this room ID with friends to watch together</p>
          </div>
        </div>

        <div className="video-section">
          <div className="video-input-section">
            <input
              type="text"
              placeholder="Enter YouTube video URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLoadVideo();
                }
              }}
              className="video-url-input"
            />
            <button onClick={handleLoadVideo} className="btn-load">Load Video</button>
          </div>

          <div className="video-player-container">
            <VideoPlayer
              videoUrl={videoUrl}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onStateChange={handleVideoStateChange}
              onSeek={handleSeek}
              playerRef={playerRef}
            />
          </div>
        </div>

        <div className="voice-call-section">
          <h3>Voice Call</h3>
          <div className="call-status">
            <div className="status-indicator">
              <span className={`status-dot ${isCallActive ? 'active' : ''}`}></span>
              <span className="status-text">
                {isConnecting ? 'Connecting...' : isCallActive ? `Call Active (${onlineCount} participants)` : 'Not in call'}
              </span>
            </div>
          </div>
          
          {isCallActive && (
            <div className="audio-visualization">
              <div className="audio-waves">
                {audioLevels.map((level, index) => {
                  const baseHeight = 8;
                  const maxHeight = 90;
                  const height = Math.max(baseHeight, Math.min(maxHeight, baseHeight + (level * 0.82)));
                  const isActive = !isMuted && level > 5;
                  const scale = isActive ? 1 : 0.2;
                  
                  return (
                    <div
                      key={index}
                      className={`wave-bar ${isActive ? 'active' : ''}`}
                      style={{
                        height: `${height}px`,
                        transform: `scaleY(${scale})`,
                        transition: `all 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.01}s`
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="call-controls">
            {!isCallActive ? (
              <button 
                onClick={handleJoinCall} 
                className="btn-call btn-join"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  'Connecting...'
                ) : (
                  <>
                    <HiMicrophone /> Join
                  </>
                )}
              </button>
            ) : (
              <>
                <button 
                  onClick={handleToggleMute} 
                  className={`btn-call btn-mute ${isMuted ? 'muted' : ''}`}
                >
                  {isMuted ? (
                    <>
                      <MdMicOff /> Unmute
                    </>
                  ) : (
                    <>
                      <HiMicrophone /> Mute
                    </>
                  )}
                </button>
                <button 
                  onClick={handleLeaveCall} 
                  className="btn-call btn-leave"
                >
                  <HiPhone /> Leave Call
                </button>
              </>
            )}
          </div>

          {/* Hidden audio elements for local and remote streams */}
          <audio ref={localAudioRef} autoPlay muted playsInline style={{ display: 'none' }} />
          <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
        </div>

        <div className="chat-section">
          <div className="chat-header">
            <h3>Chat</h3>
            <span className="chat-badge">{onlineCount} online</span>
          </div>
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="chat-empty">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              chatMessages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`chat-message ${msg.isOwn ? 'own-message' : ''}`}
                >
                  <div className="message-content">
                    <div className="message-header">
                      <span className="chat-user">{msg.username || 'Guest'}</span>
                      <span className="message-time">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="message-bubble">
                      <span className="chat-text">{msg.message}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="chat-input-section">
            <form onSubmit={handleSendMessage} className="input-wrapper">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="chat-input"
              />
              <button type="submit" className="btn-send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WatchTogether;
