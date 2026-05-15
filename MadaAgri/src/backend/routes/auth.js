const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const pool = require('../db');
const { authMiddleware, JWT_SECRET, asyncHandler } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/security');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', authLimiter, asyncHandler(async (req, res) => {
  const { email, password, displayName, role } = req.body;
  console.log('[SIGNUP] Request received:', { email, role });
  
  // Validation complète
  if (!email || !password || !displayName || !role) {
    return res.status(400).json({ error: ' Veuillez insérer vos informations' });
  }
  
  // Validation du rôle
  const validRoles = ['farmer', 'client', 'admin'];
  if (!validRoles.includes(role)) {
    console.warn(`[SIGNUP] Invalid role attempted: ${role}`);
    return res.status(400).json({ error: 'Invalid role. Must be: farmer, client, or admin' });
  }

  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (rows.length) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const id = randomUUID();
  
  console.log(`[SIGNUP] Creating user - email: ${email.toLowerCase()}, role: ${role}`);
  
  await pool.query(
    'INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
    [id, email.toLowerCase(), hashed, displayName, role]
  );

  const token = jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' });
  
  console.log(`[SIGNUP] User created successfully - email: ${email.toLowerCase()}, role: ${role}`);
  
  const userType = role === 'farmer' ? 'farmer' : 'client';
  res.json({ 
    success: true,
    user: { 
      id, 
      email, 
      name: displayName, 
      userType,
      role 
    }, 
    token 
  });
}));

// POST /api/auth/login
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const startedAt = Date.now();
  console.log('[LOGIN] Request received:', { email });

  if (!email || !password) {
    return res.status(400).json({ error: 'Veuillez insérer vos informations' });
  }

  const TIMEOUT_MS = Number(process.env.AUTH_LOGIN_TIMEOUT_MS || 8000);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`AUTH_LOGIN_TIMEOUT after ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
  });

  try {
    const [rows] = await Promise.race([
      pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]),
      timeoutPromise,
    ]);

    console.log('[LOGIN] DB query done in ms:', Date.now() - startedAt);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Mot de passe ou identifiant incorrect' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Mot de passe ou identifiant incorrect' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const userType = user.role === 'farmer' ? 'farmer' : 'client';

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name,
        userType,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('[LOGIN] Error:', err.message);
    const elapsed = Date.now() - startedAt;
    return res.status(503).json({
      error: 'Authentication service unavailable (DB timeout)',
      details: err.message,
      elapsedMs: elapsed,
    });
  }
}));


router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log('[auth/me] Request from user:', userId);
  try {
    const [rows] = await pool.query(
      `SELECT id, email, display_name, role, profile_image_url, bio, region_id, phone, created_at, updated_at,
        (SELECT COUNT(*) FROM follows WHERE followee_id = ?) AS followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) AS following_count,
        (SELECT COUNT(*) FROM posts WHERE author_id = ?) AS posts_count
      FROM users WHERE id = ?`,
      [userId, userId, userId, userId]
    );
    if (rows.length === 0) {
      console.log('[auth/me] User not found for id:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('[auth/me] User found:', rows[0].email);
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('[auth/me] Database error:', err.message, err.code);
    throw err;
  }
}));

// POST /api/auth/logout
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  console.log('[LOGOUT] User logged out:', req.user.id);
  res.json({ success: true, message: 'Logged out successfully' });
}));

// POST /api/auth/refresh
router.post('/refresh', authMiddleware, asyncHandler(async (req, res) => {
  const { id, email, role } = req.user;
  console.log('[REFRESH] Refreshing token for user:', id);
  
  const token = jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token });
}));

module.exports = { router, authMiddleware };
