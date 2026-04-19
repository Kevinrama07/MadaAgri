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
  
  // Validation complète
  if (!email || !password || !displayName || !role) {
    return res.status(400).json({ error: 'Missing fields' });
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
  
  res.json({ user: { id, email, display_name: displayName, role }, token });
}));

// POST /api/auth/login
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role }, token });
}));

// GET /api/auth/me
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [rows] = await pool.query(
    'SELECT id, email, display_name, role, profile_image_url, bio, region_id, phone, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ user: rows[0] });
}));

module.exports = { router, authMiddleware };
