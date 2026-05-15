import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';

class VoiceCallService {
  constructor() {
    this.socket = null;
    this.peer = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentCallId = null;
    this.listeners = new Map();
  }

  // Initialiser la connexion Socket.io
  connect(userId) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('[VoiceCall] Socket connected');
      this.socket.emit('user:register', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('[VoiceCall] Socket disconnected');
      this.cleanup();
    });

    // Écouter les événements d'appel
    this.socket.on('call:incoming', this.handleIncomingCall.bind(this));
    this.socket.on('call:accepted', this.handleCallAccepted.bind(this));
    this.socket.on('call:declined', this.handleCallDeclined.bind(this));
    this.socket.on('call:ended', this.handleCallEnded.bind(this));
    this.socket.on('call:error', this.handleCallError.bind(this));

    // Écouter les événements WebRTC
    this.socket.on('webrtc:offer', this.handleWebRTCOffer.bind(this));
    this.socket.on('webrtc:answer', this.handleWebRTCAnswer.bind(this));
    this.socket.on('webrtc:ice-candidate', this.handleICECandidate.bind(this));
  }

  // Déconnecter
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.cleanup();
  }

  // Démarrer un appel
  async initiateCall(receiverId, callType = 'voice') {
    try {
      // Obtenir le flux média local
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });

      // Émettre l'événement d'initiation d'appel
      this.socket.emit('call:initiate', {
        callerId: this.socket.id,
        receiverId,
        callType
      });

      this.emit('call:initiated', { receiverId, callType });

      return this.localStream;
    } catch (error) {
      console.error('[VoiceCall] Error initiating call:', error);
      this.emit('call:error', { message: 'Impossible d\'accéder au microphone' });
      throw error;
    }
  }

  // Accepter un appel entrant
  async acceptCall(callId) {
    try {
      // Obtenir le flux média local
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      this.currentCallId = callId;
      this.socket.emit('call:accept', { callId });

      this.emit('call:accepted', { callId });

      return this.localStream;
    } catch (error) {
      console.error('[VoiceCall] Error accepting call:', error);
      this.emit('call:error', { message: 'Impossible d\'accéder au microphone' });
      throw error;
    }
  }

  // Refuser un appel
  declineCall(callId, reason = 'declined') {
    this.socket.emit('call:decline', { callId, reason });
    this.cleanup();
  }

  // Terminer un appel
  endCall() {
    if (this.currentCallId) {
      this.socket.emit('call:end', { callId: this.currentCallId });
    }
    this.cleanup();
  }

  // Gérer un appel entrant
  handleIncomingCall({ callId, callerId, callerSocketId, callType }) {
    console.log('[VoiceCall] Incoming call:', callId);
    this.currentCallId = callId;
    this.emit('call:incoming', { callId, callerId, callType });
  }

  // Gérer l'acceptation d'un appel
  async handleCallAccepted({ callId, receiverSocketId }) {
    console.log('[VoiceCall] Call accepted:', callId);
    this.currentCallId = callId;

    // Créer une connexion peer (initiateur)
    this.peer = new Peer({
      initiator: true,
      stream: this.localStream,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    this.setupPeerListeners();

    this.peer.on('signal', (offer) => {
      this.socket.emit('webrtc:offer', {
        callId,
        offer,
        to: receiverSocketId
      });
    });
  }

  // Gérer le refus d'un appel
  handleCallDeclined({ callId, reason }) {
    console.log('[VoiceCall] Call declined:', callId, reason);
    this.emit('call:declined', { callId, reason });
    this.cleanup();
  }

  // Gérer la fin d'un appel
  handleCallEnded({ callId, reason }) {
    console.log('[VoiceCall] Call ended:', callId, reason);
    this.emit('call:ended', { callId, reason });
    this.cleanup();
  }

  // Gérer une erreur d'appel
  handleCallError({ message }) {
    console.error('[VoiceCall] Call error:', message);
    this.emit('call:error', { message });
    this.cleanup();
  }

  // Gérer une offre WebRTC
  handleWebRTCOffer({ callId, offer, from }) {
    console.log('[VoiceCall] Received WebRTC offer');

    // Créer une connexion peer (récepteur)
    this.peer = new Peer({
      initiator: false,
      stream: this.localStream,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    this.setupPeerListeners();

    this.peer.on('signal', (answer) => {
      this.socket.emit('webrtc:answer', {
        callId,
        answer,
        to: from
      });
    });

    this.peer.signal(offer);
  }

  // Gérer une réponse WebRTC
  handleWebRTCAnswer({ callId, answer, from }) {
    console.log('[VoiceCall] Received WebRTC answer');
    if (this.peer) {
      this.peer.signal(answer);
    }
  }

  // Gérer un candidat ICE
  handleICECandidate({ callId, candidate, from }) {
    console.log('[VoiceCall] Received ICE candidate');
    if (this.peer) {
      this.peer.signal(candidate);
    }
  }

  // Configurer les écouteurs du peer
  setupPeerListeners() {
    this.peer.on('stream', (remoteStream) => {
      console.log('[VoiceCall] Received remote stream');
      this.remoteStream = remoteStream;
      this.emit('stream:remote', remoteStream);
    });

    this.peer.on('connect', () => {
      console.log('[VoiceCall] Peer connected');
      this.emit('call:connected');
    });

    this.peer.on('close', () => {
      console.log('[VoiceCall] Peer closed');
      this.cleanup();
    });

    this.peer.on('error', (error) => {
      console.error('[VoiceCall] Peer error:', error);
      this.emit('call:error', { message: error.message });
      this.cleanup();
    });
  }

  // Mute/Unmute le microphone
  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // Retourne true si muted
      }
    }
    return false;
  }

  // Obtenir le flux local
  getLocalStream() {
    return this.localStream;
  }

  // Obtenir le flux distant
  getRemoteStream() {
    return this.remoteStream;
  }

  // Nettoyer les ressources
  cleanup() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.remoteStream = null;
    this.currentCallId = null;
  }

  // Système d'événements
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
}

// Singleton
const voiceCallService = new VoiceCallService();
export default voiceCallService;
