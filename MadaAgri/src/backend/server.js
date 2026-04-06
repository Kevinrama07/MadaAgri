const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const pool = require('./db');
const dotenv = require('dotenv');

// Charger les variables d'environnement avant tout autre import qui en dépend
dotenv.config();

const { kmpContains } = require('./algos/kmp');
const { heapSortDesc } = require('./algos/heap');
const { buildAdjacency, bfsReachable } = require('./algos/graph');
const { dijkstra } = require('./algos/dijkstra');
const { knnRecommend } = require('./algos/knn');
const { upload, uploadErrorHandler } = require('./middlewares/uploadMiddleware');
const { uploadImage } = require('./controllers/uploadController');
const { updateProfilePicture, updateUserProfile } = require('./controllers/userController');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/auth/signup', async (req, res) => {
  const { email, password, displayName, role } = req.body;
  if (!email || !password || !displayName || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (rows.length) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const id = randomUUID();
  await pool.query(
    'INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
    [id, email.toLowerCase(), hashed, displayName, role]
  );

  const token = jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id, email, display_name: displayName, role }, token });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role }, token });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const [rows] = await pool.query(
    'SELECT id, email, display_name, role, profile_image_url, bio, region_id, phone, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ user: rows[0] });
});

app.get('/api/users', authMiddleware, async (req, res) => {
  const { id } = req.user;
  const [rows] = await pool.query('SELECT id, email, display_name, role FROM users WHERE id != ?', [id]);
  res.json({ users: rows });
});

app.post('/api/upload', authMiddleware, upload.single('image'), uploadImage, uploadErrorHandler);

app.put('/api/users/profile-picture', authMiddleware, upload.single('profilePicture'), updateProfilePicture, uploadErrorHandler);

app.put('/api/users', authMiddleware, updateUserProfile);

app.get('/api/regions', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM regions');
  res.json({ regions: rows });
});

app.get('/api/cultures', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM cultures');
  res.json({ cultures: rows });
});

app.get('/api/region_cultures', async (req, res) => {
  const regionId = req.query.regionId;
  if (!regionId) {
    return res.status(400).json({ error: 'regionId is required' });
  }

  const [rows] = await pool.query(
    `SELECT rc.suitability_score, c.* FROM region_cultures rc
     JOIN cultures c ON c.id = rc.culture_id
     WHERE rc.region_id = ?
     ORDER BY rc.suitability_score DESC`,
    [regionId]
  );

  const results = rows.map((row) => ({
    culture: {
      id: row.id,
      name: row.name,
      description: row.description,
      ideal_soil: row.ideal_soil,
      ideal_climate: row.ideal_climate,
      growing_period_days: row.growing_period_days,
      yield_potential: row.yield_potential,
      created_at: row.created_at,
    },
    suitability_score: row.suitability_score,
  }));

  res.json({ region_cultures: results });
});

// k-NN recommandations cultures (cahier de charge)
app.get('/api/analysis/cultures_knn', async (req, res) => {
  const regionId = req.query.regionId;
  const k = Number(req.query.k || 5);
  if (!regionId) return res.status(400).json({ error: 'regionId is required' });

  const [regionRows] = await pool.query('SELECT * FROM regions WHERE id = ?', [regionId]);
  if (regionRows.length === 0) return res.status(404).json({ error: 'Region not found' });

  const [cultureRows] = await pool.query('SELECT * FROM cultures');
  const recs = knnRecommend(regionRows[0], cultureRows, k);
  res.json({ recommendations: recs });
});

app.get('/api/products', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const [rows] = await pool.query('SELECT * FROM products WHERE visibility = "public" ORDER BY created_at DESC');

  if (!q) return res.json({ products: rows });

  // Recherche rapide KMP (nom + description)
  const filtered = rows.filter((p) => kmpContains(p.title, q) || kmpContains(p.description, q));
  res.json({ products: filtered });
});

app.get('/api/deliveries', authMiddleware, async (req, res) => {
  const farmerId = req.query.farmerId;
  if (!farmerId) return res.status(400).json({ error: 'farmerId query param is required' });
  const [rows] = await pool.query('SELECT * FROM deliveries WHERE farmer_id = ? ORDER BY created_at DESC', [farmerId]);
  res.json({ deliveries: rows });
});

app.post('/api/products', authMiddleware, async (req, res) => {
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
});

app.get('/api/messages', authMiddleware, async (req, res) => {
  const { conversationId } = req.query;
  if (!conversationId) return res.status(400).json({ error: 'conversationId query param is required' });

  const [rows] = await pool.query('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [conversationId]);
  res.json({ messages: rows });
});

app.post('/api/messages', authMiddleware, async (req, res) => {
  const senderId = req.user.id;
  const { recipient_id, content } = req.body;

  if (!recipient_id || !content) return res.status(400).json({ error: 'recipient_id and content required' });

  const conversationId = [senderId, recipient_id].sort().join('_');
  const id = randomUUID();

  await pool.query(
    'INSERT INTO messages (id, sender_id, recipient_id, conversation_id, content, is_read, created_at) VALUES (?, ?, ?, ?, ?, false, NOW())',
    [id, senderId, recipient_id, conversationId, content]
  );

  const [rows] = await pool.query('SELECT * FROM messages WHERE id = ?', [id]);
  res.json({ message: rows[0] });
});

// Publications (mini réseau social)
app.get('/api/posts', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const sort = (req.query.sort || 'recent').toString(); // recent|popular
  const q = (req.query.q || '').toString().trim();

  // visibilité: public + followers (si follow) + private (si auteur)
  const [followRows] = await pool.query('SELECT followee_id FROM follows WHERE follower_id = ?', [userId]);
  const following = new Set(followRows.map((r) => r.followee_id));

  const [postRows] = await pool.query(
    `SELECT p.*, u.display_name, u.email,
      (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,
      (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comments_count
     FROM posts p
     JOIN users u ON u.id = p.author_id
     ORDER BY p.created_at DESC`
  );

  let visible = postRows.filter((p) => {
    if (p.visibility === 'public') return true;
    if (p.author_id === userId) return true;
    if (p.visibility === 'followers') return following.has(p.author_id);
    return false;
  });

  if (q) {
    visible = visible.filter((p) => kmpContains(p.content, q) || kmpContains(p.display_name, q));
  }

  if (sort === 'popular') {
    visible = heapSortDesc(visible, (p) => Number(p.likes_count || 0) * 10 + Number(p.comments_count || 0));
  } else {
    visible = heapSortDesc(visible, (p) => new Date(p.created_at).getTime());
  }

  res.json({ posts: visible });
});

app.post('/api/posts', authMiddleware, async (req, res) => {
  const authorId = req.user.id;
  const { content, image_url, visibility } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'content required' });

  const id = randomUUID();
  await pool.query(
    'INSERT INTO posts (id, author_id, content, image_url, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
    [id, authorId, content.trim(), image_url || null, visibility || 'public']
  );

  const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
  res.json({ post: rows[0] });
});

app.post('/api/posts/:postId/like', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const postId = req.params.postId;
  await pool.query('INSERT IGNORE INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW())', [postId, userId]);
  res.json({ ok: true });
});

app.delete('/api/posts/:postId/like', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const postId = req.params.postId;
  await pool.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
  res.json({ ok: true });
});

app.get('/api/posts/:postId/comments', authMiddleware, async (req, res) => {
  const postId = req.params.postId;
  const [rows] = await pool.query(
    `SELECT pc.*, u.display_name FROM post_comments pc
     JOIN users u ON u.id = pc.user_id
     WHERE pc.post_id = ?
     ORDER BY pc.created_at ASC`,
    [postId]
  );
  res.json({ comments: rows });
});

app.post('/api/posts/:postId/comments', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const postId = req.params.postId;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'content required' });

  const id = randomUUID();
  await pool.query(
    'INSERT INTO post_comments (id, post_id, user_id, content, created_at) VALUES (?, ?, ?, ?, NOW())',
    [id, postId, userId, content.trim()]
  );
  const [rows] = await pool.query('SELECT * FROM post_comments WHERE id = ?', [id]);
  res.json({ comment: rows[0] });
});

// Suivre / réseau (graphe BFS/DFS)
app.post('/api/follows/:userId', authMiddleware, async (req, res) => {
  const followerId = req.user.id;
  const followeeId = req.params.userId;
  if (followerId === followeeId) return res.status(400).json({ error: 'cannot follow self' });
  await pool.query(
    'INSERT IGNORE INTO follows (follower_id, followee_id, status, created_at) VALUES (?, ?, "following", NOW())',
    [followerId, followeeId]
  );
  res.json({ ok: true });
});

app.delete('/api/follows/:userId', authMiddleware, async (req, res) => {
  const followerId = req.user.id;
  const followeeId = req.params.userId;
  await pool.query('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?', [followerId, followeeId]);
  res.json({ ok: true });
});

app.get('/api/network/suggestions', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const [followRows] = await pool.query('SELECT follower_id, followee_id FROM follows');
  const adj = buildAdjacency(followRows);
  const reachable = bfsReachable(adj, userId, 2); // BFS: amis d'amis

  const [users] = await pool.query('SELECT id, email, display_name, role FROM users WHERE id != ?', [userId]);
  const suggestions = users
    .filter((u) => reachable.has(u.id))
    .sort((a, b) => reachable.get(a.id) - reachable.get(b.id))
    .slice(0, 10);

  res.json({ suggestions });
});

// Dijkstra: plus court chemin entre 2 régions (prototype)
app.get('/api/routes/dijkstra', authMiddleware, async (req, res) => {
  const startId = req.query.startRegionId;
  const endId = req.query.endRegionId;
  if (!startId || !endId) return res.status(400).json({ error: 'startRegionId and endRegionId required' });

  const [rows] = await pool.query('SELECT id, name, latitude, longitude FROM regions');
  const nodes = rows.map((r) => ({ id: r.id, name: r.name, lat: Number(r.latitude), lon: Number(r.longitude) }));

  const result = dijkstra(nodes, startId, endId);
  res.json({ route: result });
});

// simple health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
});
process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', err);
});

