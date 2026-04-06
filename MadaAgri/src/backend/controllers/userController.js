const pool = require('../db');

exports.updateProfilePicture = async (req, res) => {
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
};

exports.updateUserProfile = async (req, res) => {
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
};