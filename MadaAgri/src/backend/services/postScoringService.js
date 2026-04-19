function calculateEngagementScore(likesCount, commentsCount) {
  const likes = Number(likesCount || 0);
  const comments = Number(commentsCount || 0);
  return (likes * 2) + (comments * 3);
}

function calculateRecencyScore(createdAt) {
  try {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const hoursSinceCreation = (now - created) / (1000 * 60 * 60);
    const recency = 1 / (hoursSinceCreation + 1);
    return Math.max(0, Math.min(1, recency)); // Normaliser entre 0 et 1
  } catch (err) {
    return 0;
  }
}

function calculateUserAffinityScore(post, currentUser, following, userInteractedPosts) {
  let affinityScore = 0;

  // [+5] Si l'utilisateur suit l'auteur du post
  if (following && following.has(post.author_id)) {
    affinityScore += 5;
  }

  // [+3] Si même région
  if (currentUser && currentUser.region_id && post.author_region_id && 
      currentUser.region_id === post.author_region_id) {
    affinityScore += 3;
  }

  // [+2] Si interaction passée (like ou commentaire)
  if (userInteractedPosts && userInteractedPosts.has(post.id)) {
    affinityScore += 2;
  }
  return affinityScore;
}

function calculateAgriculturalRelevanceScore(post, currentUser) {
  let relevanceScore = 0;

  // [+5] Si même culture (si les données sont disponibles)
  if (post.culture_id && currentUser && currentUser.preferred_culture_id &&
      post.culture_id === currentUser.preferred_culture_id) {
    relevanceScore += 5;
  }

  // [+3] Si même type d'activité agricole (si disponible dans le post)
  if (post.activity_type && currentUser && currentUser.activity_type &&
      post.activity_type === currentUser.activity_type) {
    relevanceScore += 3;
  }

  return relevanceScore;
}

function calculatePostScore(post, currentUser, following = new Set(), userInteractedPosts = new Set()) {
  if (!post) return 0;
  if (!currentUser) return 0;

  // [1] ENGAGEMENT (40%)
  // Engagement = (likes × 2) + (commentaires × 3)
  const engagementRaw = calculateEngagementScore(post.likes_count, post.comments_count);
  // Normaliser l'engagement avec une formule logarithmique pour éviter les dominantes excessives
  const engagementScore = Math.log(engagementRaw + 1) * 0.4;

  // [2] AFFINITÉ UTILISATEUR (30%)
  const userAffinityRaw = calculateUserAffinityScore(post, currentUser, following, userInteractedPosts);
  const affinityScore = userAffinityRaw * 0.3;

  // [3] RÉCENCE (20%)
  const recencyScore = calculateRecencyScore(post.created_at) * 0.2;

  // [4] PERTINENCE AGRICOLE (10%)
  const relevanceRaw = calculateAgriculturalRelevanceScore(post, currentUser);
  const relevanceScore = relevanceRaw * 0.1;

  // Score final
  const totalScore = engagementScore + affinityScore + recencyScore + relevanceScore;

  return Math.max(0, totalScore); // Pas de scores négatifs
}

module.exports = {
  calculatePostScore,
  calculateEngagementScore,
  calculateRecencyScore,
  calculateUserAffinityScore,
  calculateAgriculturalRelevanceScore,
};
