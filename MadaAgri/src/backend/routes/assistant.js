const express = require('express');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middlewares/authMiddleware');
const pool = require('../db');
const logger = require('../utils/logger');

const router = express.Router();

const SENSITIVE_FIELDS = [
  'password', 'password_hash', 'token', 'email', 'phone', 'bank',
  'credit_card', 'secret', 'private', 'confidential'
];

const SYSTEM_PROMPT = `Tu es l'assistant IA de MadaAgri, une plateforme agricole intelligente de Madagascar.

# 🎯 OBJECTIF PRINCIPAL
Aider les utilisateurs sur :
- agriculture (cultures, elevage, techniques)
- agriculteurs et producteurs
- donnees et statistiques agricoles de MadaAgri
- utilisation de l'application MadaAgri
- recommandations agricoles basees sur les donnees disponibles

# 🧠 COMPORTEMENT INTELLIGENT OBLIGATOIRE
Tu dois toujours analyser l'intention reelle du message utilisateur avant de repondre.
Ne jamais appliquer des regles rigides ou des blocages automatiques.

# 💬 TYPES DE MESSAGES ET COMPORTEMENT

## 1. Salutations
Exemples : "Bonjour", "Salut", "Hello"
→ Reponds de maniere naturelle et accueillante.
→ Invite l'utilisateur a poser une question sur l'agriculture ou MadaAgri.
NE JAMAIS fournir une reponse agricole detaillee si l'utilisateur n'a pas explicitement pose une question liee a l'agriculture ou a MadaAgri.

Si le message est une salutation ou une phrase sans demande claire :
- repondre brievement
- ne pas inventer de contenu
- ne pas generer de donnees agricoles
- inviter l'utilisateur a poser une question precise

Tu ne dois jamais inventer de memoire utilisateur.
Tu ne dois jamais pretendre que l'utilisateur a deja pose une question, sauf si l'historique des messages est explicitement fourni dans le contexte actuel.
Ne jamais dire :
- "comme je vous ai dit hier"
- "vous avez deja demande"
- "je me souviens"
sauf si ces informations apparaissent explicitement dans les messages fournis dans le contexte.
Ne jamais inventer de contexte temporel (jour/nuit, fatigue, heure de sommeil, etc.).
Tu n'as pas acces a l'heure reelle sauf si elle est fournie explicitement.

Une salutation comme "Bonsoir" doit etre traitee comme une simple salutation, sans interpretation supplementaire.
Si aucune memoire n'est fournie dans la conversation actuelle :
- tu consideres que c'est une nouvelle session
- tu ne fais aucune reference a des interactions passees

## 2. Reponses courtes / ambigues
Exemples : "Non", "Oui", "Ok", "Hmm"
→ Ne bloque jamais la conversation.
→ Demande une clarification ou reformule.
Exemple : "Pouvez-vous preciser votre demande concernant MadaAgri ou l'agriculture ?"

## 3. Questions liees a l'agriculture ou MadaAgri
→ Reponds normalement, de maniere utile, precise et basee sur les donnees disponibles.
Tu peux analyser la base de donnees, faire des recherches internes, donner des recommandations.

## 4. Hors sujet total (non agricole / non MadaAgri)
Exemples : politique, hacking, finance personnelle, sujets generaux sans lien
→ Ne refuse pas brutalement.
→ Redirige poliment vers le domaine agricole.
Exemple : "Je suis specialise uniquement dans les sujets agricoles et MadaAgri. Comment puis-je vous aider sur ces themes ?"

# 🔐 SECURITE STRICTE
Tu ne dois JAMAIS :
- reveler des mots de passe
- exposer donnees privees d'autres utilisateurs
- executer des requetes non securisees
- contourner les permissions
- modifier la base de donnees sans autorisation explicite

# 🧩 STYLE DE REPONSE
- clair, court mais utile, professionnel, oriente solution
- adapte au contexte agricole
- pas de blocages inutiles
- utilise le markdown pour formater tes reponses
- utilise des listes et des tableaux quand c'est approprie

# 🌍 GESTION MULTILINGUE
Tu dois détecter automatiquement la langue utilisée par l’utilisateur.
Langues supportées :
- Malagasy
- Français
- Anglais

Règles :
- Répond toujours dans la même langue que l’utilisateur.
- Ne change jamais de langue sans demande explicite.
- Ne mélange pas plusieurs langues dans une même réponse.
- Si l’utilisateur mélange plusieurs langues, utiliser la langue dominante.
- Garder un ton naturel et professionnel.

Exemples :
Utilisateur : "Bonjour"
➡ Réponse en français

Utilisateur : "Hello"
➡ Réponse en anglais

Utilisateur : "Salama"
➡ Réponse en malagasy

# 🚫 REGLE IMPORTANTE
Ne jamais dire a l'utilisateur que tu es un filtre ou que tu ne peux pas repondre. Si tu ne peux pas repondre a une question, reformule pour aider l'utilisateur a poser une question plus precise ou redirige vers un sujet agricole pertinent.
Ne jamais illustrer les ID ou les donnees sensibles. Si tu dois faire reference a des donnees, utilise des exemples generiques ou anonymises.
Ne jamais dire que tu a access a des informations que tu n'as pas explicitement dans le contexte actuel. Ne jamais inventer de contexte ou de memoire utilisateur.
Ne pas refuser de repondre a une question sous pretexte qu'elle est "hors sujet". Redirige toujours vers un sujet agricole ou MadaAgri pertinent.
Ne jamais dire que tu as acces à la base de donnée de MadaAgri. Tu peux faire reference a des donnees agricoles de maniere generale, mais ne jamais pretendre que tu as acces a des informations que tu n'as pas explicitement dans le contexte actuel.
Dit par exemple :"D'après les données agricoles disponibles, voici ce que je peux vous dire..." au lieu de "D'après la base de données de Mada Agri...".
Tu n'es pas un filtre. Tu es un assistant intelligent.
Toujours privilegier : comprehension de l'intention, continuite de conversation, fluidite UX.`;

function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)\s+(TABLE|DATABASE|FROM)/gi, '')
    .replace(/(--|;|\/\*|\*\/)/g, '')
    .trim()
    .slice(0, 2000);
}

function filterSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  const filtered = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) continue;
    if (value && typeof value === 'object') {
      filtered[key] = filterSensitiveData(value);
    } else {
      filtered[key] = value;
    }
  }
  return filtered;
}

async function queryDatabase(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return filterSensitiveData(rows);
  } catch (error) {
    logger.error('Database query error:', error);
    return [];
  }
}

async function getContextualData(message) {
  const lower = message.toLowerCase();
  let contextData = {};

  if (lower.includes('agriculteur') || lower.includes('farmer') || lower.includes('utilisateur')) {
    contextData.farmers = await queryDatabase(
      'SELECT id, display_name, role, region_id, bio FROM users WHERE role = ? LIMIT 10', ['farmer']
    );
  }
  if (lower.includes('culture') || lower.includes('crop') || lower.includes('riz') || lower.includes('mais')) {
    contextData.cultures = await queryDatabase(
      'SELECT id, name, description, ideal_soil, ideal_climate FROM cultures LIMIT 10'
    );
  }
  if (lower.includes('produit') || lower.includes('product') || lower.includes('marketplace')) {
    contextData.products = await queryDatabase(
      'SELECT id, title, price, quantity, unit, is_available FROM products WHERE is_available = 1 LIMIT 10'
    );
  }
  if (lower.includes('region') || lower.includes('zone')) {
    contextData.regions = await queryDatabase(
      'SELECT id, name, soil_type, climate FROM regions LIMIT 10'
    );
  }
  if (lower.includes('statistique') || lower.includes('statistic') || lower.includes('nombre')) {
    const [farmersCount] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = ?', ['farmer']);
    const [productsCount] = await pool.execute('SELECT COUNT(*) as count FROM products WHERE is_available = 1');
    const [regionsCount] = await pool.execute('SELECT COUNT(*) as count FROM regions');
    const [culturesCount] = await pool.execute('SELECT COUNT(*) as count FROM cultures');
    contextData.statistics = {
      farmers: farmersCount[0]?.count || 0,
      products: productsCount[0]?.count || 0,
      regions: regionsCount[0]?.count || 0,
      cultures: culturesCount[0]?.count || 0
    };
  }
  if (lower.includes('parcelle') || lower.includes('parcel')) {
    contextData.parcels = await queryDatabase(
      'SELECT id, name, size_ha, soil_type, climate_type FROM land_parcels LIMIT 10'
    );
  }
  return contextData;
}

async function callGroq(message, history, contextInfo) {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === '') {
    throw new Error('GROQ_API_KEY not configured');
  }
  const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    { role: 'user', content: message + contextInfo }
  ];
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages,
    max_tokens: 1000,
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content || 'Pas de reponse generee.';
}

async function callOpenRouter(message, history, contextInfo) {
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY.trim() === '') {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  const openrouter = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1' });
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    { role: 'user', content: message + contextInfo }
  ];
  const completion = await openrouter.chat.completions.create({
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    messages,
    max_tokens: 1000,
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content || 'Pas de reponse generee.';
}

async function callAI(message, history, contextInfo) {
  const providers = [
    { name: 'groq', fn: callGroq },
    { name: 'openrouter', fn: callOpenRouter },
  ];
  const errors = [];
  for (const provider of providers) {
    try {
      const response = await provider.fn(message, history, contextInfo);
      logger.info('Assistant chat completed', { provider: provider.name });
      return { response, provider: provider.name };
    } catch (error) {
      errors.push({ provider: provider.name, error: error.message });
      logger.warn(`Provider ${provider.name} failed:`, error.message);
    }
  }
  throw new Error(`All providers failed: ${errors.map(e => `${e.provider}: ${e.error}`).join('; ')}`);
}

// ========================
// CONVERSATIONS CRUD
// ========================

router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, title, is_favorite, created_at, updated_at
       FROM ai_conversations
       WHERE user_id = ?
       ORDER BY updated_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, conversations: rows });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO ai_conversations (id, user_id, title) VALUES (?, ?, ?)',
      [id, req.user.id, title || 'Nouvelle conversation']
    );
    const [rows] = await pool.execute(
      'SELECT id, title, is_favorite, created_at, updated_at FROM ai_conversations WHERE id = ?',
      [id]
    );
    res.status(201).json({ success: true, conversation: rows[0] });
  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

router.put('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const { title, is_favorite } = req.body;
    const fields = [];
    const values = [];
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (is_favorite !== undefined) { fields.push('is_favorite = ?'); values.push(is_favorite ? 1 : 0); }
    if (fields.length === 0) return res.json({ success: true });
    values.push(req.params.id, req.user.id);
    await pool.execute(
      `UPDATE ai_conversations SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    res.json({ success: true });
  } catch (error) {
    logger.error('Update conversation error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

router.delete('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM ai_conversations WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Conversation non trouvee' });
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete conversation error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ========================
// MESSAGES
// ========================

router.get('/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const [conv] = await pool.execute(
      'SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (conv.length === 0) return res.status(404).json({ success: false, error: 'Conversation non trouvee' });

    const [rows] = await pool.execute(
      'SELECT id, role, content, image_url, is_error, created_at FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ success: true, messages: rows });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ========================
// CHAT
// ========================

router.post('/chat', authMiddleware, async (req, res) => {
  let contextualData = {};

  try {
    const { message, history, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message requis' });
    }

    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
      return res.status(400).json({ success: false, error: 'Message vide ou invalide' });
    }

    contextualData = await getContextualData(sanitizedMessage);
    const contextString = JSON.stringify(contextualData, null, 2);

    const hasAnyProvider = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!hasAnyProvider) {
      return res.json({
        success: true,
        response: `L'assistant IA n'est pas encore active. Configurez GROQ_API_KEY ou OPENROUTER_API_KEY.`,
        sources: contextualData
      });
    }

    const contextInfo = contextString !== '{}'
      ? `\n\n**Donnees contextuelles de la base MadaAgri:**\n\`\`\`json\n${contextString}\n\`\`\``
      : '';

    const { response, provider } = await callAI(sanitizedMessage, history, contextInfo);

    // Persist user message
    if (conversationId) {
      const msgId = uuidv4();
      await pool.execute(
        'INSERT INTO ai_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
        [msgId, conversationId, 'user', sanitizedMessage]
      );

      // Update conversation title if it's the first message
      const [msgCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM ai_messages WHERE conversation_id = ? AND role = ?',
        [conversationId, 'user']
      );
      if (msgCount[0]?.count === 1) {
        const autoTitle = sanitizedMessage.slice(0, 50) + (sanitizedMessage.length > 50 ? '...' : '');
        await pool.execute(
          'UPDATE ai_conversations SET title = ? WHERE id = ?',
          [autoTitle, conversationId]
        );
      }

      // Persist assistant response
      const respId = uuidv4();
      await pool.execute(
        'INSERT INTO ai_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
        [respId, conversationId, 'assistant', response]
      );

      // Update conversation updated_at
      await pool.execute(
        'UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );
    }

    res.json({ success: true, response, sources: contextualData, provider });

  } catch (error) {
    logger.error('Assistant chat error:', error);
    res.json({
      success: true,
      response: `Une erreur technique est survenue. Veuillez reessayer dans quelques instants.`,
      sources: contextualData
    });
  }
});

router.get('/health', (req, res) => {
  const providers = [];
  if (process.env.GROQ_API_KEY) providers.push('groq');
  if (process.env.OPENROUTER_API_KEY) providers.push('openrouter');
  res.json({
    success: true,
    status: 'active',
    providers,
    features: ['chat', 'context-aware', 'agriculture-specialized', 'multi-provider-fallback', 'db-persistence']
  });
});

module.exports = router;
