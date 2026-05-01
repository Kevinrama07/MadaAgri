const express = require('express');
const { randomUUID } = require('crypto');
const pool = require('../db');
const { calculatePostScore } = require('../services/postScoringService');
const { kmpContains } = require('../algos/kmp');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/posts - Récupérer les publications avec scoring
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const sort = (req.query.sort || 'relevance').toString();
  const q = (req.query.q || '').toString().trim();

  // Récupérer les données de l'utilisateur connecté
  const [userRows] = await pool.query('SELECT id, region_id FROM users WHERE id = ?', [userId]);
  const currentUser = userRows[0] || { id: userId, region_id: null };

  // Récupérer les abonnements
  const [followRows] = await pool.query('SELECT followee_id FROM follows WHERE follower_id = ?', [userId]);
  const following = new Set(followRows.map((r) => r.followee_id));

  // Récupérer les interactions passées
  const [userInteractionRows] = await pool.query(
    'SELECT post_id FROM post_likes WHERE user_id = ?',
    [userId]
  );
  const userInteractedPosts = new Set(userInteractionRows.map((r) => r.post_id));

  // Récupérer tous les posts
  const [postRows] = await pool.query(
    `SELECT p.*, p.author_id AS user_id, u.display_name, u.email, u.region_id AS author_region_id, u.profile_image_url,
      (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,
      (SELECT IF(COUNT(*) > 0, 1, 0) FROM post_likes WHERE post_id = p.id AND user_id = ?) AS user_likes,
      (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comments_count
     FROM posts p
     JOIN users u ON u.id = p.author_id
     ORDER BY p.created_at DESC`,
    [userId]
  );

  // Filtrer par visibilité
  let visible = postRows.filter((p) => {
    if (p.visibility === 'public') return true;
    if (p.author_id === userId) return true;
    if (p.visibility === 'followers') return following.has(p.author_id);
    return false;
  });

  // Filtrer par texte si nécessaire
  if (q) {
    visible = visible.filter((p) => kmpContains(p.content, q) || kmpContains(p.display_name, q));
  }

  // Ajouter le score de pertinence
  visible = visible.map((post) => ({
    ...post,
    score: calculatePostScore(post, currentUser, following, userInteractedPosts),
  }));

  // Trier selon le paramètre
  if (sort === 'popular') {
    visible.sort((a, b) => Number(b.likes_count || 0) * 10 + Number(b.comments_count || 0) - (Number(a.likes_count || 0) * 10 + Number(a.comments_count || 0)));
  } else if (sort === 'recent') {
    visible.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else {
    visible.sort((a, b) => b.score - a.score);
  }

  res.json({ posts: visible });
}));

// POST /api/posts - Créer une publication
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const authorId = req.user.id;
  const { content, image_url, visibility } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'content required' });

  const id = randomUUID();
  await pool.query(
    'INSERT INTO posts (id, author_id, content, image_url, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
    [id, authorId, content.trim(), image_url || null, visibility || 'public']
  );

  const [rows] = await pool.query(
    `SELECT p.*, p.author_id AS user_id, u.display_name, u.email, u.profile_image_url FROM posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.id = ?`,
    [id]
  );
  res.json({ post: rows[0] });
}));

// GET /api/posts/user/:authorId - Récupérer les publications d'un utilisateur
router.get('/user/:authorId', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const authorId = req.params.authorId;

  if (!authorId) {
    return res.status(400).json({ error: 'authorId required' });
  }

  // Récupérer les abonnements de l'utilisateur connecté
  const [followRows] = await pool.query('SELECT followee_id FROM follows WHERE follower_id = ?', [userId]);
  const following = new Set(followRows.map((r) => r.followee_id));

  // Récupérer tous les posts de l'auteur
  const [postRows] = await pool.query(
    `SELECT p.*, p.author_id AS user_id, u.display_name, u.email, u.region_id AS author_region_id, u.profile_image_url,
      (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,
      (SELECT IF(COUNT(*) > 0, 1, 0) FROM post_likes WHERE post_id = p.id AND user_id = ?) AS user_likes,
      (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comments_count
     FROM posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.author_id = ?
     ORDER BY p.created_at DESC`,
    [userId, authorId]
  );

  // Filtrer par visibilité
  const visible = postRows.filter((p) => {
    if (p.visibility === 'public') return true;
    if (p.author_id === userId) return true;
    if (p.visibility === 'followers') return following.has(p.author_id);
    return false;
  });

  res.json({ posts: visible });
}));

// POST /api/posts/:postId/like - Liker une publication
router.post('/:postId/like', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const postId = req.params.postId;
  await pool.query('INSERT IGNORE INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW())', [postId, userId]);
  res.json({ ok: true });
}));

// DELETE /api/posts/:postId/like - Retirer un like
router.delete('/:postId/like', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const postId = req.params.postId;
  await pool.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
  res.json({ ok: true });
}));

// GET /api/posts/:postId/comments - Récupérer les commentaires (avec réponses imbriquées)
router.get('/:postId/comments', authMiddleware, asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  const [rows] = await pool.query(
    `SELECT pc.*, u.display_name, u.profile_image_url,
     (SELECT COUNT(*) FROM post_comments pc2 WHERE pc2.parent_id = pc.id) as replies_count
     FROM post_comments pc
     JOIN users u ON u.id = pc.user_id
     WHERE pc.post_id = ? AND pc.parent_id IS NULL
     ORDER BY pc.created_at ASC`,
    [postId]
  );
  
  // Pour chaque commentaire, charger les réponses
  const commentsWithReplies = await Promise.all(rows.map(async (comment) => {
    const [replies] = await pool.query(
      `SELECT pc.*, u.display_name, u.profile_image_url,
       (SELECT COUNT(*) FROM post_comments pc2 WHERE pc2.parent_id = pc.id) as replies_count
       FROM post_comments pc
       JOIN users u ON u.id = pc.user_id
       WHERE pc.parent_id = ?
       ORDER BY pc.created_at ASC`,
      [comment.id]
    );
    return { ...comment, replies: replies };
  }));
  
  res.json({ comments: commentsWithReplies });
}));

// POST /api/posts/:postId/comments - Ajouter un commentaire ou une réponse
router.post('/:postId/comments', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const postId = req.params.postId;
  const { content, parent_id } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'content required' });

  // Vérifier que le parent_id est valide si fourni
  if (parent_id) {
    const [parent] = await pool.query('SELECT id FROM post_comments WHERE id = ? AND post_id = ?', [parent_id, postId]);
    if (parent.length === 0) {
      return res.status(400).json({ error: 'parent comment not found' });
    }
  }

  const id = randomUUID();
  await pool.query(
    'INSERT INTO post_comments (id, post_id, user_id, parent_id, content, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [id, postId, userId, parent_id || null, content.trim()]
  );
  const [rows] = await pool.query(
    'SELECT pc.*, u.display_name, u.profile_image_url FROM post_comments pc JOIN users u ON u.id = pc.user_id WHERE pc.id = ?',
    [id]
  );
  res.json({ comment: rows[0] });
}));

// POST /api/posts/comments/:commentId/replies - Ajouter une réponse à un commentaire
router.post('/comments/:commentId/replies', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const commentId = req.params.commentId;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'content required' });

  // Récupérer le post_id du commentaire parent pour vérifier l'accès
  const [parentComment] = await pool.query('SELECT post_id FROM post_comments WHERE id = ?', [commentId]);
  if (parentComment.length === 0) {
    return res.status(404).json({ error: 'comment not found' });
  }

  const id = randomUUID();
  const postId = parentComment[0].post_id;
  await pool.query(
    'INSERT INTO post_comments (id, post_id, user_id, parent_id, content, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [id, postId, userId, commentId, content.trim()]
  );
  const [rows] = await pool.query(
    'SELECT pc.*, u.display_name, u.profile_image_url FROM post_comments pc JOIN users u ON u.id = pc.user_id WHERE pc.id = ?',
    [id]
  );
  res.json({ comment: rows[0] });
}));

// GET /api/posts/comments/:commentId/replies - Récupérer les réponses d'un commentaire
router.get('/comments/:commentId/replies', authMiddleware, asyncHandler(async (req, res) => {
  const commentId = req.params.commentId;
  const [rows] = await pool.query(
    `SELECT pc.*, u.display_name, u.profile_image_url FROM post_comments pc
     JOIN users u ON u.id = pc.user_id
     WHERE pc.parent_id = ?
     ORDER BY pc.created_at ASC`,
    [commentId]
  );
  res.json({ replies: rows });
}));

module.exports = router;
