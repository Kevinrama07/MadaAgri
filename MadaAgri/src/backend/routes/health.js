const express = require('express');
const router = express.Router();

// GET /api/health - Vérifier l'état du serveur
router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
