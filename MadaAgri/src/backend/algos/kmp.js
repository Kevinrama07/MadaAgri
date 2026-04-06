function buildLps(pattern) {
  const lps = new Array(pattern.length).fill(0);
  let len = 0;
  let i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len += 1;
      lps[i] = len;
      i += 1;
    } else if (len !== 0) {
      len = lps[len - 1];
    } else {
      lps[i] = 0;
      i += 1;
    }
  }
  return lps;
}

// Retourne true si pattern est contenu dans text (insensible à la casse)
function kmpContains(text, pattern) {
  if (!pattern) return true;
  if (!text) return false;

  const t = String(text).toLowerCase();
  const p = String(pattern).toLowerCase();
  const lps = buildLps(p);

  let i = 0; // index t
  let j = 0; // index p
  while (i < t.length) {
    if (t[i] === p[j]) {
      i += 1;
      j += 1;
      if (j === p.length) return true;
    } else if (j !== 0) {
      j = lps[j - 1];
    } else {
      i += 1;
    }
  }
  return false;
}

module.exports = { kmpContains };

