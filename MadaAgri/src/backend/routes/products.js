const express = require('express');
const { randomUUID } = require('crypto');
const pool = require('../db');
const { kmpContains } = require('../algos/kmp');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/products - Récupérer les produits
router.get('/', asyncHandler(async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const [rows] = await pool.query('SELECT * FROM products WHERE visibility = "public" ORDER BY created_at DESC');

  if (!q) return res.json({ products: rows });

  const filtered = rows.filter((p) => kmpContains(p.title, q) || kmpContains(p.description, q));
  res.json({ products: filtered });
}));

// POST /api/products - Créer un produit
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { title, description, price, quantity, unit, region_id, culture_id, image_url } = req.body;

  if (!title || !price || !quantity || !unit) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = randomUUID();
  await pool.query(
    'INSERT INTO products (id, farmer_id, culture_id, title, description, price, quantity, unit, region_id, image_url, is_available, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, "public", NOW(), NOW())',
    [id, userId, culture_id || null, title, description || null, price, quantity, unit, region_id || null, image_url || null]
  );

  const [productRows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  res.json({ product: productRows[0] });
}));

module.exports = router;
