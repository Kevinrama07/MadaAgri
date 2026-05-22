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

  const { displayName, bio, regionId, phone, profileImageUrl, language, preferredLanguage, timezone, date_format, privacy_settings, notification_settings } = req.body;
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
  if (language !== undefined) {
    updates.push('language = ?');
    params.push(language);
  } else if (preferredLanguage !== undefined) {
    updates.push('language = ?');
    params.push(preferredLanguage);
  }
  if (timezone !== undefined) {
    updates.push('timezone = ?');
    params.push(timezone);
  }
  if (date_format !== undefined) {
    updates.push('date_format = ?');
    params.push(date_format);
  }
  if (privacy_settings !== undefined) {
    updates.push('privacy_settings = ?');
    params.push(JSON.stringify(privacy_settings));
  }
  if (notification_settings !== undefined) {
    updates.push('notification_settings = ?');
    params.push(JSON.stringify(notification_settings));
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });
  }

  params.push(userId);
  const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
  await pool.query(sql, params);

  const [rows] = await pool.query(
    'SELECT id, email, display_name, role, profile_image_url, bio, region_id, phone, language, timezone, date_format, privacy_settings, notification_settings, created_at, updated_at FROM users WHERE id = ?',
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

// POST /api/users/2fa/enable - Activer la 2FA
router.post('/2fa/enable', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié.' });

  const speakeasy = require('speakeasy');
  const secret = speakeasy.generateSecret({ name: `MadaAgri:${userId}` });
  
  await pool.query(
    'UPDATE users SET two_factor_secret = ?, two_factor_enabled = FALSE, updated_at = NOW() WHERE id = ?',
    [secret.base32, userId]
  );

  res.json({
    secret: secret.base32,
    qrCodeUrl: secret.otpauth_url,
  });
}));

// POST /api/users/2fa/verify - Vérifier et activer la 2FA
router.post('/2fa/verify', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié.' });

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token requis.' });

  const [rows] = await pool.query('SELECT two_factor_secret FROM users WHERE id = ?', [userId]);
  if (rows.length === 0 || !rows[0].two_factor_secret) {
    return res.status(400).json({ error: '2FA non initialisée.' });
  }

  const speakeasy = require('speakeasy');
  const verified = speakeasy.totp.verify({
    secret: rows[0].two_factor_secret,
    encoding: 'base32',
    token,
  });

  if (!verified) {
    return res.status(400).json({ error: 'Token invalide.' });
  }

  await pool.query(
    'UPDATE users SET two_factor_enabled = TRUE, updated_at = NOW() WHERE id = ?',
    [userId]
  );

  res.json({ message: '2FA activée avec succès.' });
}));

// POST /api/users/2fa/disable - Désactiver la 2FA
router.post('/2fa/disable', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié.' });

  await pool.query(
    'UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL, updated_at = NOW() WHERE id = ?',
    [userId]
  );

  res.json({ message: '2FA désactivée.' });
}));

// POST /api/users/sessions/revoke - Fermer toutes les autres sessions
router.post('/sessions/revoke', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié.' });

  const crypto = require('crypto');
  const newTokenVersion = crypto.randomUUID();
  
  await pool.query(
    'UPDATE users SET token_version = ?, updated_at = NOW() WHERE id = ?',
    [newTokenVersion, userId]
  );

  res.json({ message: 'Toutes les autres sessions ont été fermées.' });
}));

// GET /api/users/export - Exporter les données utilisateur (RGPD)
router.get('/export', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié.' });

  const [userRows] = await pool.query(
    'SELECT id, email, display_name, role, bio, region_id, phone, language, timezone, date_format, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (userRows.length === 0) {
    return res.status(404).json({ error: 'Utilisateur non trouvé.' });
  }

  const [productRows] = await pool.query(
    'SELECT * FROM products WHERE farmer_id = ?',
    [userId]
  );

  const [postRows] = await pool.query(
    'SELECT * FROM posts WHERE author_id = ?',
    [userId]
  );

  const [reservationRows] = await pool.query(
    'SELECT * FROM reservations WHERE buyer_id = ? OR farmer_id = ?',
    [userId, userId]
  );

  const exportData = {
    user: userRows[0],
    products: productRows,
    posts: postRows,
    reservations: reservationRows,
    export_date: new Date().toISOString(),
  };

  const archiver = require('archiver');
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename=madaagri_data_export_${new Date().toISOString().split('T')[0]}.zip`);
  
  archive.pipe(res);
  archive.append(JSON.stringify(exportData, null, 2), { name: 'user_data.json' });
  archive.finalize();
}));

// DELETE /api/users - Supprimer le compte (RGPD)
router.delete('/', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié.' });

  await pool.query('DELETE FROM users WHERE id = ?', [userId]);

  res.json({ message: 'Compte supprimé définitivement.' });
}));

module.exports = router;
