function normStr(s) {
  return (s || '').toString().trim().toLowerCase();
}

// Distance simple: pénalise mismatch sol/climat + différence de période
function cultureDistance(region, culture) {
  const soilMismatch = normStr(region.soil_type) && normStr(culture.ideal_soil)
    ? normStr(region.soil_type) === normStr(culture.ideal_soil)
      ? 0
      : 1
    : 0.5;
  const climateMismatch = normStr(region.climate) && normStr(culture.ideal_climate)
    ? normStr(region.climate) === normStr(culture.ideal_climate)
      ? 0
      : 1
    : 0.5;

  const rDays = 120; // proxy si région ne porte pas de valeur
  const cDays = culture.growing_period_days ? Number(culture.growing_period_days) : 120;
  const dayDiff = Math.min(Math.abs(rDays - cDays) / 120, 1);

  return soilMismatch * 0.45 + climateMismatch * 0.45 + dayDiff * 0.10;
}

function knnRecommend(region, cultures, k = 5) {
  const scored = cultures.map((c) => ({
    culture: c,
    distance: cultureDistance(region, c),
  }));
  scored.sort((a, b) => a.distance - b.distance);
  const top = scored.slice(0, Math.max(1, k));

  // Convertit la distance en score de compatibilité (0..100)
  return top.map((x) => ({
    culture: x.culture,
    suitability_score: Math.max(0, Math.min(100, Math.round((1 - x.distance) * 100))),
  }));
}

module.exports = { knnRecommend };

