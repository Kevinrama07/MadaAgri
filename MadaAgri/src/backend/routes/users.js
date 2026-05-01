const express = require('express');
const pool = require('../db');
const { kmpContains } = require('../algos/kmp');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/users/search - Chercher des utilisateurs
router.get('/search', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.user;
  const q = (req.query.q || '').toString().trim().toLowerCase();

  if (!q) {
    return res.json({ users: [] });
  }

  const [rows] = await pool.query(
    'SELECT id, email, display_name, role, profile_image_url FROM users WHERE id != ?',
    [id]
  );

  // Filtrer avec KMP
  const filtered = rows.filter(u => 
    kmpContains(u.display_name?.toLowerCase() || '', q) ||
    kmpContains(u.email?.toLowerCase() || '', q)
  );

  res.json({ users: filtered });
}));

// GET /api/users/:userId - Récupérer les données d'un utilisateur spécifique
router.get('/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const [rows] = await pool.query(
    'SELECT id, email, display_name, role, profile_image_url, bio, region_id, phone, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  const user = rows[0];
  
  // Récupérer les contacts (numéro de téléphone, email)
  const contacts = {
    email: user.email,
    phone: user.phone || null
  };

  res.json({
    user: {
      id: user.id,
      display_name: user.display_name,
      role: user.role,
      profile_image_url: user.profile_image_url,
      bio: user.bio,
      region_id: user.region_id,
      created_at: user.created_at
    },
    contacts
  });
}));

// GET /api/users - Lister les utilisateurs
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.user;
  const [rows] = await pool.query('SELECT id, email, display_name, role, profile_image_url FROM users WHERE id != ?', [id]);
  res.json({ users: rows });
}));

// PUT /api/users - Mettre à jour le profil
router.put('/', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié.' });

  const { displayName, bio, regionId, phone, profileImageUrl } = req.body;
  const updates = [];
  const params = [];

  if (displayName) {
    updates.push('display_name = ?');
    params.push(displayName);
  }
  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }
  if (regionId !== undefined) {
    updates.push('region_id = ?');
    params.push(regionId);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    params.push(phone);
  }
  if (profileImageUrl) {
    updates.push('profile_image_url = ?');
    params.push(profileImageUrl);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });
  }

  params.push(userId);
  const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
  await pool.query(sql, params);

  const [rows] = await pool.query(
    'SELECT id, email, display_name, role, profile_image_url, bio, region_id, phone, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );
  return res.json({ message: 'Profil mis à jour.', user: rows[0] });
}));

// PUT /api/users/profile-picture - Mettre à jour la photo de profil
router.put('/profile-picture', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié.' });

  let imageUrl = '';
  if (req.file?.path) {
    imageUrl = req.file.path;
  } else if (req.body?.imageUrl) {
    imageUrl = req.body.imageUrl;
  }

  if (!imageUrl) {
    return res.status(400).json({ error: 'Aucune image fournie.' });
  }

  await pool.query('UPDATE users SET profile_image_url = ?, updated_at = NOW() WHERE id = ?', [imageUrl, userId]);
  return res.json({ message: 'Photo de profil mise à jour.', profileImageUrl: imageUrl });
}));

module.exports = router;
