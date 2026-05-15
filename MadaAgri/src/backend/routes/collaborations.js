const express = require('express');
const router = express.Router();
const collaborationController = require('../controllers/collaborationController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Envoyer / Gérer invitations
router.post('/send', collaborationController.sendCollaborationInvitation);
router.put('/:invitationId/accept', collaborationController.acceptInvitation);
router.put('/:invitationId/reject', collaborationController.rejectInvitation);
router.delete('/:invitationId/cancel', collaborationController.cancelInvitation);

// Listes
router.get('/received', collaborationController.getReceivedInvitations);
router.get('/sent', collaborationController.getSentInvitations);
router.get('/collaborators/:userId', collaborationController.getCollaborators);

// Supprimer collaboration
router.delete('/:userId', collaborationController.removeCollaboration);

module.exports = router;
