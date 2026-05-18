const express = require('express');
const pool = require('../db');
const { randomUUID } = require('crypto');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');
const router = express.Router();

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS = 100;

const rateLimit = (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) return next();
  
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  next();
};

// GET /api/notifications - Récupérer les notifications
router.get('/', authMiddleware, rateLimit, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const type = req.query.type;
  const unreadOnly = req.query.unreadOnly === 'true';
  const archived = req.query.archived === 'true';
  
  let query = `
    SELECT * FROM notifications 
    WHERE user_id = ? AND is_archived = ?
  `;
  const params = [userId, archived ? 1 : 0];
  
  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }
  
  if (unreadOnly) {
    query += ` AND is_read = 0`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const [notifications] = await pool.query(query, params);
  
  // Compter le total
  let countQuery = `
    SELECT COUNT(*) as total FROM notifications 
    WHERE user_id = ? AND is_archived = ?
  `;
  const countParams = [userId, archived ? 1 : 0];
  
  if (type) {
    countQuery += ` AND type = ?`;
    countParams.push(type);
  }
  
  if (unreadOnly) {
    countQuery += ` AND is_read = 0`;
  }
  
  const [countResult] = await pool.query(countQuery, countParams);
  
  res.json({ 
    notifications,
    total: countResult[0].total,
    limit,
    offset
  });
}));

// GET /api/notifications/unread-count - Compteur non lus
router.get('/unread-count', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const [result] = await pool.query(`
    SELECT COUNT(*) as count 
    FROM notifications 
    WHERE user_id = ? AND is_read = 0 AND is_archived = 0
  `, [userId]);
  
  res.json({ count: result[0].count });
}));

router.get('/search', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const query = req.query.q || '';
  const limit = parseInt(req.query.limit) || 20;
  
  const [notifications] = await pool.query(`
    SELECT * FROM notifications 
    WHERE user_id = ? 
    AND (content LIKE ? OR actor_name LIKE ?)
    AND is_archived = 0
    ORDER BY created_at DESC 
    LIMIT ?
  `, [userId, `%${query}%`, `%${query}%`, limit]);
  
  res.json({ notifications });
}));

// POST /api/notifications - Créer une notification
router.post('/', authMiddleware, rateLimit, asyncHandler(async (req, res) => {
  const { 
    userId, 
    type, 
    actorId, 
    actorName, 
    actorImage, 
    content, 
    relatedType, 
    relatedId,
    priority 
  } = req.body;
  
  if (!userId || !type || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const notificationId = randomUUID();
  
  await pool.query(`
    INSERT INTO notifications (
      id, user_id, type, actor_id, actor_name, actor_image, 
      content, related_type, related_id, priority, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `, [
    notificationId, userId, type, actorId, actorName, actorImage,
    content, relatedType, relatedId, priority || 'normal'
  ]);
  
  // Récupérer la notification créée
  const [notification] = await pool.query(
    'SELECT * FROM notifications WHERE id = ?',
    [notificationId]
  );
  
  res.status(201).json({ notification: notification[0] });
}));

// PUT /api/notifications/:id/read - Marquer comme lu
router.put('/:id/read', authMiddleware, asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  const [result] = await pool.query(`
    UPDATE notifications 
    SET is_read = 1, read_at = NOW() 
    WHERE id = ? AND user_id = ?
  `, [notificationId, userId]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  res.json({ ok: true });
}));

// PUT /api/notifications/:id/unread - Marquer comme non lu
router.put('/:id/unread', authMiddleware, asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  const [result] = await pool.query(`
    UPDATE notifications 
    SET is_read = 0, read_at = NULL 
    WHERE id = ? AND user_id = ?
  `, [notificationId, userId]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  res.json({ ok: true });
}));

// PUT /api/notifications/read-all - Tout marquer comme lu
router.put('/read-all', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const type = req.query.type;
  
  let query = `
    UPDATE notifications 
    SET is_read = 1, read_at = NOW() 
    WHERE user_id = ? AND is_read = 0 AND is_archived = 0
  `;
  const params = [userId];
  
  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }
  
  const [result] = await pool.query(query, params);
  
  res.json({ ok: true, count: result.affectedRows });
}));

// PUT /api/notifications/:id/archive - Archiver
router.put('/:id/archive', authMiddleware, asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  const [result] = await pool.query(`
    UPDATE notifications 
    SET is_archived = 1 
    WHERE id = ? AND user_id = ?
  `, [notificationId, userId]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  res.json({ ok: true });
}));

// PUT /api/notifications/:id/unarchive - Désarchiver
router.put('/:id/unarchive', authMiddleware, asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  const [result] = await pool.query(`
    UPDATE notifications 
    SET is_archived = 0 
    WHERE id = ? AND user_id = ?
  `, [notificationId, userId]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  res.json({ ok: true });
}));

// DELETE /api/notifications/:id - Supprimer
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  const [result] = await pool.query(`
    DELETE FROM notifications 
    WHERE id = ? AND user_id = ?
  `, [notificationId, userId]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  res.json({ ok: true });
}));

// DELETE /api/notifications/clear-all - Supprimer toutes les lues
router.delete('/clear-all', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const [result] = await pool.query(`
    DELETE FROM notifications 
    WHERE user_id = ? AND is_read = 1
  `, [userId]);
  
  res.json({ ok: true, count: result.affectedRows });
}));

// GET /api/notifications/preferences - Récupérer préférences
router.get('/preferences', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const [prefs] = await pool.query(
    'SELECT * FROM notification_preferences WHERE user_id = ?',
    [userId]
  );
  
  if (prefs.length === 0) {
    // Créer préférences par défaut
    await pool.query(
      'INSERT INTO notification_preferences (user_id) VALUES (?)',
      [userId]
    );
    
    const [newPrefs] = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = ?',
      [userId]
    );
    
    return res.json({ preferences: newPrefs[0] });
  }
  
  res.json({ preferences: prefs[0] });
}));

// PUT /api/notifications/preferences - Mettre à jour préférences
router.put('/preferences', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { 
    email_enabled, 
    push_enabled, 
    sound_enabled, 
    types_enabled,
    quiet_hours_start,
    quiet_hours_end
  } = req.body;
  
  await pool.query(`
    INSERT INTO notification_preferences (
      user_id, email_enabled, push_enabled, sound_enabled, 
      types_enabled, quiet_hours_start, quiet_hours_end
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    email_enabled = VALUES(email_enabled),
    push_enabled = VALUES(push_enabled),
    sound_enabled = VALUES(sound_enabled),
    types_enabled = VALUES(types_enabled),
    quiet_hours_start = VALUES(quiet_hours_start),
    quiet_hours_end = VALUES(quiet_hours_end),
    updated_at = NOW()
  `, [
    userId, 
    email_enabled, 
    push_enabled, 
    sound_enabled,
    JSON.stringify(types_enabled),
    quiet_hours_start,
    quiet_hours_end
  ]);
  
  res.json({ ok: true });
}));

// GET /api/notifications/stats - Statistiques
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
      SUM(CASE WHEN is_archived = 1 THEN 1 ELSE 0 END) as archived,
      SUM(CASE WHEN type = 'message' THEN 1 ELSE 0 END) as messages,
      SUM(CASE WHEN type = 'collaboration' THEN 1 ELSE 0 END) as collaborations,
      SUM(CASE WHEN type = 'follow' THEN 1 ELSE 0 END) as follows,
      SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END) as likes,
      SUM(CASE WHEN type = 'comment' THEN 1 ELSE 0 END) as comments
    FROM notifications 
    WHERE user_id = ?
  `, [userId]);
  
  res.json({ stats: stats[0] });
}));

module.exports = router;
