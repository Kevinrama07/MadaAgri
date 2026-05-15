const socketIO = require('socket.io');
const logger = require('../utils/logger');

let io = null;
const activeUsers = new Map(); // userId -> socketId
const activeCalls = new Map(); // callId -> { caller, receiver, status }

function initializeSocket(server) {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Enregistrer l'utilisateur
    socket.on('user:register', (userId) => {
      activeUsers.set(userId, socket.id);
      socket.userId = userId;
      logger.info(`User registered: ${userId} -> ${socket.id}`);
      
      // Notifier les autres utilisateurs que cet utilisateur est en ligne
      socket.broadcast.emit('user:online', userId);
    });

    // Démarrer un appel
    socket.on('call:initiate', ({ callerId, receiverId, callType = 'voice' }) => {
      const receiverSocketId = activeUsers.get(receiverId);
      
      if (!receiverSocketId) {
        socket.emit('call:error', { message: 'Utilisateur non disponible' });
        return;
      }

      const callId = `call-${Date.now()}-${callerId}`;
      activeCalls.set(callId, {
        callId,
        caller: callerId,
        receiver: receiverId,
        callType,
        status: 'ringing',
        startedAt: new Date()
      });

      // Notifier le destinataire
      io.to(receiverSocketId).emit('call:incoming', {
        callId,
        callerId,
        callerSocketId: socket.id,
        callType
      });

      // Confirmer à l'appelant
      socket.emit('call:initiated', { callId });

      logger.info(`Call initiated: ${callId} from ${callerId} to ${receiverId}`);
    });

    // Accepter un appel
    socket.on('call:accept', ({ callId }) => {
      const call = activeCalls.get(callId);
      
      if (!call) {
        socket.emit('call:error', { message: 'Appel introuvable' });
        return;
      }

      call.status = 'connecting';
      call.acceptedAt = new Date();

      const callerSocketId = activeUsers.get(call.caller);
      
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:accepted', {
          callId,
          receiverSocketId: socket.id
        });
      }

      logger.info(`Call accepted: ${callId}`);
    });

    // Refuser un appel
    socket.on('call:decline', ({ callId, reason = 'declined' }) => {
      const call = activeCalls.get(callId);
      
      if (!call) return;

      call.status = 'declined';
      call.endedAt = new Date();

      const callerSocketId = activeUsers.get(call.caller);
      
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:declined', { callId, reason });
      }

      activeCalls.delete(callId);
      logger.info(`Call declined: ${callId} - ${reason}`);
    });

    // Terminer un appel
    socket.on('call:end', ({ callId }) => {
      const call = activeCalls.get(callId);
      
      if (!call) return;

      call.status = 'ended';
      call.endedAt = new Date();

      // Notifier l'autre participant
      const otherUserId = socket.userId === call.caller ? call.receiver : call.caller;
      const otherSocketId = activeUsers.get(otherUserId);
      
      if (otherSocketId) {
        io.to(otherSocketId).emit('call:ended', { callId });
      }

      // Calculer la durée
      const duration = Math.floor((call.endedAt - call.acceptedAt) / 1000);
      
      // TODO: Sauvegarder dans la base de données
      logger.info(`Call ended: ${callId} - Duration: ${duration}s`);

      activeCalls.delete(callId);
    });

    // Signalisation WebRTC
    socket.on('webrtc:offer', ({ callId, offer, to }) => {
      const targetSocketId = activeUsers.get(to);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:offer', {
          callId,
          offer,
          from: socket.userId
        });
      }
    });

    socket.on('webrtc:answer', ({ callId, answer, to }) => {
      const targetSocketId = activeUsers.get(to);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:answer', {
          callId,
          answer,
          from: socket.userId
        });
      }
    });

    socket.on('webrtc:ice-candidate', ({ callId, candidate, to }) => {
      const targetSocketId = activeUsers.get(to);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:ice-candidate', {
          callId,
          candidate,
          from: socket.userId
        });
      }
    });

    // Déconnexion
    socket.on('disconnect', () => {
      if (socket.userId) {
        activeUsers.delete(socket.userId);
        
        // Terminer tous les appels actifs de cet utilisateur
        activeCalls.forEach((call, callId) => {
          if (call.caller === socket.userId || call.receiver === socket.userId) {
            const otherUserId = call.caller === socket.userId ? call.receiver : call.caller;
            const otherSocketId = activeUsers.get(otherUserId);
            
            if (otherSocketId) {
              io.to(otherSocketId).emit('call:ended', { 
                callId, 
                reason: 'disconnected' 
              });
            }
            
            activeCalls.delete(callId);
          }
        });

        // Notifier que l'utilisateur est hors ligne
        socket.broadcast.emit('user:offline', socket.userId);
        
        logger.info(`User disconnected: ${socket.userId}`);
      }
    });
  });

  logger.info('Socket.io initialized');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

function getActiveUsers() {
  return Array.from(activeUsers.keys());
}

function isUserOnline(userId) {
  return activeUsers.has(userId);
}

module.exports = {
  initializeSocket,
  getIO,
  getActiveUsers,
  isUserOnline
};
