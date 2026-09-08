// PATTERNS ENGINE - Learns from every result, updates confidence dynamically
// This engine MAKES the system adaptive (not fixed)

export async function recordResult(env, data) {
  if (!env.PICKS_KV) return;
  
  // data = { platform, type, match, pick, outcome, formA, formB, posA, posB, conversation }
  
  const patternsRaw = await env.PICKS_KV.get("patterns");
  const patterns = patternsRaw ? JSON.parse(patternsRaw) : {
    rules: {},
    lastUpdate: null,
    totalRecorded: 0
  };
  
  patterns.totalRecorded++;
  patterns.lastUpdate = new Date().toISOString();
  
  // Build keys for different pattern types
  const formA = data.formA || [];
  const formB = data.formB || [];
  const sA = formA.reduce((sum, r) => sum + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const sB = formB.reduce((sum, r) => sum + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const formGap = sA - sB;
  const posGap = (data.posB || 5) - (data.posA || 5);
  
  // Pattern 1: By platform + form difference
  const key1 = (data.platform || "unknown") + "_form_" + formGap;
  updateRule(patterns, key1, data.outcome);
  
  // Pattern 2: By platform + position difference
  const key2 = (data.platform || "unknown") + "_pos_" + posGap;
  updateRule(patterns, key2, data.outcome);
  
  // Pattern 3: By pick type
  if (data.pick) {
    const pickType = data.pick.includes("Over") ? "over" :
                     data.pick.includes("Under") ? "under" :
                     data.pick.includes("BTTS") ? "btts" :
                     data.pick.includes("Win") ? "win" :
                     data.pick.includes("Draw") ? "draw" : "other";
    const key3 = (data.platform || "unknown") + "_" + pickType;
    updateRule(patterns, key3, data.outcome);
  }
  
  // Pattern 4: By platform overall
  const key4 = (data.platform || "unknown") + "_overall";
  updateRule(patterns, key4, data.outcome);
  
  // Save updated patterns
  await env.PICKS_KV.put("patterns", JSON.stringify(patterns));
}

function updateRule(patterns, key, outcome) {
  if (!patterns.rules[key]) {
    patterns.rules[key] = {
      total: 0,
      wins: 0,
      confidence: 50,
      lastUpdate: null
    };
  }
  
  patterns.rules[key].total++;
  if (outcome === "win") patterns.rules[key].wins++;
  patterns.rules[key].confidence = Math.round(
    (patterns.rules[key].wins / patterns.rules[key].total) * 100
  );
  patterns.rules[key].lastUpdate = new Date().toISOString();
}

export async function getPattern(env, key) {
  if (!env.PICKS_KV) return null;
  
  const patternsRaw = await env.PICKS_KV.get("patterns");
  if (!patternsRaw) return null;
  
  const patterns = JSON.parse(patternsRaw);
  return patterns.rules[key] || null;
}

export async function getAdjustment(env, platform, type, formGap, posGap) {
  // Returns confidence adjustments based on learned patterns
  if (!env.PICKS_KV) return { boost: 0, penalty: 0 };
  
  const patternsRaw = await env.PICKS_KV.get("patterns");
  if (!patternsRaw) return { boost: 0, penalty: 0 };
  
  const patterns = JSON.parse(patternsRaw);
  const rules = patterns.rules || {};
  
  let boost = 0;
  let penalty = 0;
  
  // Check form-based pattern
  const formKey = platform + "_form_" + formGap;
  if (rules[formKey] && rules[formKey].total >= 5) {
    const conf = rules[formKey].confidence;
    if (conf > 60) boost += (conf - 50) / 10;
    if (conf < 40) penalty += (50 - conf) / 10;
  }
  
  // Check position-based pattern
  const posKey = platform + "_pos_" + posGap;
  if (rules[posKey] && rules[posKey].total >= 5) {
    const conf = rules[posKey].confidence;
    if (conf > 60) boost += (conf - 50) / 10;
    if (conf < 40) penalty += (50 - conf) / 10;
  }
  
  // Check pick-type pattern
  const typeKey = platform + "_" + type;
  if (rules[typeKey] && rules[typeKey].total >= 5) {
    const conf = rules[typeKey].confidence;
    if (conf > 60) boost += (conf - 50) / 10;
    if (conf < 40) penalty += (50 - conf) / 10;
  }
  
  return { 
    boost: Math.round(boost), 
    penalty: Math.round(penalty) 
  };
}

export async function getAllPatterns(env) {
  if (!env.PICKS_KV) return [];
  
  const patternsRaw = await env.PICKS_KV.get("patterns");
  if (!patternsRaw) return [];
  
  const patterns = JSON.parse(patternsRaw);
  return Object.entries(patterns.rules || {})
    .filter(([key, rule]) => rule.total >= 10)
    .sort((a, b) => b[1].confidence - a[1].confidence);
}

export async function getStreakInfo(env) {
  if (!env.PICKS_KV) return { current: 0, type: "none" };
  
  const list = await env.PICKS_KV.list({ prefix: "p_" });
  const recent = [];
  
  for (const key of list.keys.slice(-15).reverse()) {
    const v = await env.PICKS_KV.get(key.name);
    if (v) {
      const p = JSON.parse(v);
      if (p.status === "win" || p.status === "lose") recent.push(p.status);
    }
  }
  
  if (!recent.length) return { current: 0, type: "none" };
  
  let current = 0;
  let type = recent[0];
  for (const r of recent) {
    if (r === type) current++;
    else break;
  }
  
  let warning = null;
  if (type === "lose" && current >= 3) {
    warning = current + " losses in a row. Take a break.";
  } else if (type === "win" && current >= 3) {
    warning = current + " wins streak. Stay disciplined.";
  }
  
  return { current, type, warning };
}
