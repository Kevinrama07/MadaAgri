const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Suivre / Ne plus suivre
router.post('/:userId', followController.followUser);
router.delete('/:userId', followController.unfollowUser);

// Listes
router.get('/followers/:userId', followController.getFollowers);
router.get('/following/:userId', followController.getFollowing);

// Statut de relation
router.get('/status/:userId', followController.getRelationshipStatus);

module.exports = router;
