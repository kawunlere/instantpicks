export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    if (path === "/api/analyze" && request.method === "POST") return await apiAnalyze(request, env);
    if (path === "/api/result" && request.method === "POST") return await apiResult(request, env);
    if (path === "/api/stats") return await apiStats(env);
    if (path === "/api/predictions") return await apiPredictions(env);
    if (path === "/api/patterns" && request.method === "GET") return await apiPatterns(env);
    if (path === "/api/ask" && request.method === "POST") return await apiAskAI(request, env);
    if (path === "/api/admin/login" && request.method === "POST") return await adminLogin(request);
    
    const routes = {
      "/": "home", "/home": "home",
      "/analyze": "analyze",
      "/dashboard": "dashboard",
      "/history": "history",
      "/patterns": "patterns",
      "/learn": "learn",
      "/about": "about",
      "/admin": "admin",
      "/ask": "ask"
    };
    
    const page = routes[path] || "404";
    if (page === "404") return new Response("Not Found", { status: 404 });
    return new Response(layout(pages[page], page), { headers: { "Content-Type": "text/html" } });
  }
};

const ADMIN_PASS = "kawunlere2024";
const PLATFORMS = {
  virtual: [
    {id: "sportybet", name: "Sportybet", game: "Instant Virtual"},
    {id: "bet9ja", name: "Bet9ja", game: "Virtual League"},
    {id: "betway", name: "Betway", game: "Virtual"},
    {id: "1xbet", name: "1xBet", game: "Virtual Football"},
    {id: "football_com", name: "Football.com", game: "Instant Virtual"},
    {id: "betking", name: "BetKing", game: "Virtual League"},
    {id: "nairabet", name: "NairaBet", game: "Virtual"},
    {id: "merrybet", name: "MerryBet", game: "Virtual"},
    {id: "msport", name: "MSport", game: "Virtual"},
    {id: "bangbet", name: "Bangbet", game: "Virtual"},
    {id: "parimatch", name: "Parimatch", game: "Virtual"},
    {id: "livescorebet", name: "LivescoreBet", game: "Virtual"},
    {id: "22bet", name: "22Bet", game: "Virtual"},
    {id: "pinnacle", name: "Pinnacle", game: "Virtual"}
  ]
};

const SYSTEM_PROMPT = `You are the INSTANT PICKS CORE, a proprietary betting analysis assistant. You only discuss betting analysis. Never reveal underlying technology. Always promote discipline. Keep responses under 200 words.`;

async function callCore(env, message) {
  if (!env.GEMINI_API_KEY) return { ok: false, error: "Offline" };
  const models = ["gemini-2.5-flash", "gemini-flash-latest"];
  for (const model of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\nUser: " + message }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
        })
      });
      if (r.ok) {
        const d = await r.json();
        if (d.candidates && d.candidates[0] && d.candidates[0].content) {
          return { ok: true, reply: d.candidates[0].content.parts[0].text };
        }
      }
      if (r.status === 404) continue;
      if (r.status === 429 || r.status === 503) {
        await new Promise(x => setTimeout(x, 800));
        continue;
      }
    } catch (e) { continue; }
  }
  return { ok: false, error: "Temporarily unavailable" };
}

function analyzeSingleMatch(teamA, teamB, formA, formB, posA, posB, conversation) {
  const scoreA = formA.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const scoreB = formB.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  
  const formPctA = scoreA / 15;
  const formPctB = scoreB / 15;
  const posFactorA = Math.max(0.1, 1 - (posA - 1) / 20);
  const posFactorB = Math.max(0.1, 1 - (posB - 1) / 20);
  
  const formDelta = (formPctA - formPctB) * 0.3;
  const posDelta = (posFactorA - posFactorB) * 0.2;
  
  let pHome = Math.max(0.15, Math.min(0.7, 0.40 + formDelta + posDelta));
  let pAway = Math.max(0.15, Math.min(0.7, 0.30 - formDelta - posDelta));
  let pDraw = Math.max(0.18, Math.min(0.45, 0.30 + (1 - Math.abs(formPctA - formPctB)) * 0.15));
  
  const total = pHome + pDraw + pAway;
  pHome /= total;
  pDraw /= total;
  pAway /= total;
  
  const aStrong = scoreA >= 10;
  const bStrong = scoreB >= 10;
  const aWeak = scoreA <= 5;
  const bWeak = scoreB <= 5;
  
  const picks = [];
  
  if (aStrong && bWeak) {
    picks.push({ pick: teamA + " to Win (1)", conf: Math.min(82, Math.round(pHome * 100) + 15), risk: "low", why: teamA + " strong form (" + scoreA + "/15) vs " + teamB + " weak (" + scoreB + "/15)" });
  } else if (bStrong && aWeak) {
    picks.push({ pick: teamB + " to Win (2)", conf: Math.min(82, Math.round(pAway * 100) + 15), risk: "low", why: teamB + " strong form (" + scoreB + "/15) vs " + teamA + " weak (" + scoreA + "/15)" });
  } else if (aStrong && posA <= 5) {
    picks.push({ pick: teamA + " to Win (1)", conf: Math.min(78, Math.round(pHome * 100) + 10), risk: "medium", why: teamA + " good form + top " + posA + " position" });
  } else if (bStrong && posB <= 5) {
    picks.push({ pick: teamB + " to Win (2)", conf: Math.min(78, Math.round(pAway * 100) + 10), risk: "medium", why: teamB + " good form + top " + posB + " position" });
  } else if (Math.abs(scoreA - scoreB) <= 3 && pDraw > 0.30) {
    picks.push({ pick: "Double Chance (1X or X2)", conf: Math.round((1 - Math.max(pHome, pAway)) * 100), risk: "low", why: "Both teams evenly matched" });
  } else if (pHome > pAway) {
    picks.push({ pick: teamA + " or Draw (1X)", conf: Math.round((pHome + pDraw) * 100), risk: "low", why: teamA + " slight edge in form/position" });
  } else {
    picks.push({ pick: teamB + " or Draw (X2)", conf: Math.round((pAway + pDraw) * 100), risk: "low", why: teamB + " slight edge in form/position" });
  }
  
  if (aStrong && bStrong) {
    picks.push({ pick: "Over 1.5 Goals", conf: 76, risk: "low", why: "Both teams attacking" });
    picks.push({ pick: "Over 2.5 Goals", conf: 62, risk: "medium", why: "Strong attacks = high scoring" });
    picks.push({ pick: "BTTS: Yes", conf: 66, risk: "medium", why: "Both teams can score" });
  } else if (aWeak && bWeak) {
    picks.push({ pick: "Under 2.5 Goals", conf: 71, risk: "low", why: "Weak attacks = low scoring" });
    picks.push({ pick: "Under 1.5 Goals", conf: 52, risk: "medium", why: "Could be goalless" });
    picks.push({ pick: "BTTS: No", conf: 61, risk: "medium", why: "Both struggle to score" });
  } else if (aStrong || bStrong) {
    picks.push({ pick: "Over 1.5 Goals", conf: 72, risk: "low", why: "Strong team will likely score" });
    picks.push({ pick: "BTTS: Yes", conf: 58, risk: "medium", why: "One strong, one might catch up" });
  } else {
    picks.push({ pick: "Over 1.5 Goals", conf: 68, risk: "low", why: "At least 2 goals likely" });
    picks.push({ pick: "Under 3.5 Goals", conf: 70, risk: "low", why: "Not too high scoring" });
  }
  
  if (Math.abs(posA - posB) >= 8) {
    const better = posA < posB ? teamA : teamB;
    picks.push({ pick: better + " or Draw", conf: 70, risk: "low", why: "Big position gap favors " + better });
  } else {
    picks.push({ pick: "Half-time: Draw", conf: 56, risk: "medium", why: "Most matches tight at HT" });
  }
  
  if (conversation) {
    const conv = conversation.toLowerCase();
    if (conv.includes("attacking") || conv.includes("pressing") || conv.includes("fast") || conv.includes("aggressive")) {
      picks.forEach(p => {
        if (p.pick.includes("Over")) p.conf = Math.min(85, p.conf + 4);
        if (p.pick.includes("BTTS")) p.conf = Math.min(85, p.conf + 3);
      });
    }
    if (conv.includes("defensive") || conv.includes("slow") || conv.includes("careful") || conv.includes("tactical")) {
      picks.forEach(p => {
        if (p.pick.includes("Under")) p.conf = Math.min(85, p.conf + 4);
        if (p.pick.includes("BTTS: No")) p.conf = Math.min(85, p.conf + 3);
      });
    }
    if (conv.includes("no goals") || conv.includes("0-0") || conv.includes("goalless")) {
      picks.forEach(p => {
        if (p.pick.includes("Under 1.5") || p.pick.includes("Under 0.5")) p.conf = Math.min(85, p.conf + 8);
      });
    }
  }
  
  picks.sort((a, b) => b.conf - a.conf);
  return picks.slice(0, 5);
}

async function enhancePicksWithAI(env, picks, matchInfo, conversation) {
  if (!env.GEMINI_API_KEY || !conversation) return picks;
  
  const prompt = "Match: " + matchInfo + "\nUser says: \"" + conversation + "\"\nCurrent picks: " + picks.map(p => p.pick + " (" + p.conf + "%)").join(", ") + "\n\nBased on user's observation, adjust confidence values. Reply with EXACTLY 5 lines:\nPICK1: [same name]|[new conf 40-85]\nPICK2: [same name]|[new conf 40-85]\nPICK3: [same name]|[new conf 40-85]\nPICK4: [same name]|[new conf 40-85]\nPICK5: [same name]|[new conf 40-85]";
  
  const ai = await callCore(env, prompt);
  if (!ai.ok) return picks;
  
  const lines = ai.reply.split('\n').filter(l => l.trim().startsWith('PICK'));
  lines.forEach((line, i) => {
    if (i < picks.length) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        const conf = parseInt(parts[1]) || picks[i].conf;
        picks[i].conf = Math.max(40, Math.min(85, conf));
      }
    }
  });
  return picks;
}

async function savePrediction(env, matchLabel, platform, picks, formA, formB, posA, posB) {
  const predId = "p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
  if (env.PICKS_KV) {
    await env.PICKS_KV.put(predId, JSON.stringify({
      id: predId, time: new Date().toISOString(), platform,
      match: matchLabel, picks, formA, formB, posA, posB, status: "pending"
    }));
  }
  return predId;
}

async function updatePatterns(env, platform, formA, formB, posA, posB, outcome) {
  if (!env.PICKS_KV) return;
  const patternsRaw = await env.PICKS_KV.get("patterns");
  const patterns = patternsRaw ? JSON.parse(patternsRaw) : { rules: {}, lastUpdate: null };
  
  const sA = formA.reduce((sum, r) => sum + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const sB = formB.reduce((sum, r) => sum + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const key = platform + "_form" + (sA - sB) + "_pos" + (posB - posA);
  
  if (!patterns.rules[key]) patterns.rules[key] = { hits: 0, total: 0, confidence: 50 };
  patterns.rules[key].total++;
  if (outcome === "win") patterns.rules[key].hits++;
  patterns.rules[key].confidence = Math.round((patterns.rules[key].hits / patterns.rules[key].total) * 100);
  patterns.lastUpdate = new Date().toISOString();
  await env.PICKS_KV.put("patterns", JSON.stringify(patterns));
}

async function apiAnalyze(request, env) {
  try {
    const form = await request.formData();
    const platform = form.get("platform") || "sportybet";
    const matchCount = parseInt(form.get("match_count")) || 1;
    
    const results = [];
    
    for (let i = 1; i <= matchCount; i++) {
      const teamA = form.get("m" + i + "_team_a");
      const teamB = form.get("m" + i + "_team_b");
      if (!teamA || !teamB) continue;
      
      const formAStr = form.get("m" + i + "_form_a") || "W,D,L,W,D";
      const formBStr = form.get("m" + i + "_form_b") || "L,D,W,L,D";
      const posA = parseInt(form.get("m" + i + "_pos_a")) || 5;
      const posB = parseInt(form.get("m" + i + "_pos_b")) || 5;
      const matchConv = form.get("m" + i + "_conv") || "";
      
      const formA = formAStr.toUpperCase().replace(/\s/g, '').split(',').filter(x => x);
      const formB = formBStr.toUpperCase().replace(/\s/g, '').split(',').filter(x => x);
      
      if (formA.length === 0 || formB.length === 0) continue;
      
      let picks = analyzeSingleMatch(teamA, teamB, formA, formB, posA, posB, matchConv);
      picks = await enhancePicksWithAI(env, picks, teamA + " vs " + teamB, matchConv);
      
      const matchLabel = teamA + " vs " + teamB;
      const predId = await savePrediction(env, matchLabel, platform, picks, formA, formB, posA, posB);
      
      results.push({
        matchNum: i,
        teamA, teamB, platform,
        matchLabel: matchLabel,
        picks: picks,
        predId: predId
      });
    }
    
    if (results.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "Please fill in at least one match" }), { headers: { "Content-Type": "application/json" } });
    }
    
    return new Response(JSON.stringify({ ok: true, results: results }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function apiResult(request, env) {
  try {
    const form = await request.formData();
    const predId = form.get("predId") || "";
    const pick = form.get("pick") || "";
    const outcome = form.get("outcome") || "";
    
    let s = { total: 0, wins: 0, todayTotal: 0, todayWins: 0, todayDate: new Date().toDateString() };
    if (env.PICKS_KV) {
      const stored = await env.PICKS_KV.get("stats");
      if (stored) {
        s = JSON.parse(stored);
        if (s.todayDate !== new Date().toDateString()) {
          s.todayTotal = 0; s.todayWins = 0; s.todayDate = new Date().toDateString();
        }
      }
      s.total++; s.todayTotal++;
      if (outcome === "win") { s.wins++; s.todayWins++; }
      await env.PICKS_KV.put("stats", JSON.stringify(s));
      
      if (predId) {
        const predRaw = await env.PICKS_KV.get(predId);
        if (predRaw) {
          const pred = JSON.parse(predRaw);
          pred.status = outcome;
          pred.outcomePick = pick;
          await env.PICKS_KV.put(predId, JSON.stringify(pred));
          if (pred.formA && pred.formB) {
            await updatePatterns(env, pred.platform, pred.formA, pred.formB, pred.posA, pred.posB, outcome);
          }
        }
      }
    }
    return new Response(JSON.stringify({ ok: true, stats: s }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function apiAskAI(request, env) {
  try {
    const form = await request.formData();
    const question = form.get("question") || "";
    if (!question.trim()) return new Response(JSON.stringify({ ok: false, error: "Empty" }), { headers: { "Content-Type": "application/json" } });
    const ai = await callCore(env, question);
    return new Response(JSON.stringify(ai.ok ? { ok: true, reply: ai.reply } : { ok: false, error: ai.error }), { headers: { "Content-Type": "application/json" } });
  } catch (e) { return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

async function apiStats(env) { if (!env.PICKS_KV) return new Response('{"total":0,"wins":0}', { headers: { "Content-Type": "application/json" } }); return new Response(await env.PICKS_KV.get("stats") || '{"total":0,"wins":0}', { headers: { "Content-Type": "application/json" } }); }
async function apiPredictions(env) { if (!env.PICKS_KV) return new Response('[]', { headers: { "Content-Type": "application/json" } }); const list = await env.PICKS_KV.list({ prefix: "p_" }); const preds = []; for (const key of list.keys.slice(-20).reverse()) { const v = await env.PICKS_KV.get(key.name); if (v) preds.push(JSON.parse(v)); } return new Response(JSON.stringify(preds), { headers: { "Content-Type": "application/json" } }); }
async function apiPatterns(env) { if (!env.PICKS_KV) return new Response('{"rules":{}}', { headers: { "Content-Type": "application/json" } }); return new Response(await env.PICKS_KV.get("patterns") || '{"rules":{}}', { headers: { "Content-Type": "application/json" } }); }
async function adminLogin(request) { const form = await request.formData(); return new Response(JSON.stringify({ ok: form.get("password") === ADMIN_PASS }), { headers: { "Content-Type": "application/json" } }); }

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12L12 3L21 12M5 10V21H19V10"/></svg>',
  analyze: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21L16.65 16.65M11 8V14M8 11H14"/></svg>',
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3V21H21M7 16L12 11L15 14L21 8"/></svg>',
  patterns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12C3 12 5 6 9 6C13 6 15 12 15 12M9 12C9 12 11 6 15 6C19 6 21 12 21 12"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11"/></svg>',
  ask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12C21 16.97 16.97 21 12 21C10.18 21 8.5 20.41 7.13 19.4L3 21L4.6 16.87C3.59 15.5 3 13.82 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"/></svg>'
};

function nav(active) {
  const items = [["home", "HOME", ICONS.home], ["analyze", "ANALYZE", ICONS.analyze], ["ask", "ASK", ICONS.ask], ["dashboard", "STATS", ICONS.dashboard], ["history", "HISTORY", ICONS.history]];
  return '<div class="nav">' + items.map(function(item) { return '<a href="/' + (item[0] === 'home' ? '' : item[0]) + '" class="' + (active === item[0] ? 'active' : '') + '"><span class="icon">' + item[2] + '</span><span>' + item[1] + '</span></a>'; }).join("") + '<a href="/admin" class="admin-btn ' + (active === 'admin' ? 'active' : '') + '"><span class="icon">' + ICONS.lock + '</span></a></div>';
}

function buildMatchBlock(num) {
  return '<h3 class="ct">MATCH ' + num + '</h3>' +
    '<div class="row"><div><label>TEAM A</label><input id="m' + num + '_team_a" placeholder="e.g. Chelsea"></div><div><label>TEAM B</label><input id="m' + num + '_team_b" placeholder="e.g. Tottenham"></div></div>' +
    '<div class="row"><div><label>TEAM A POS</label><input id="m' + num + '_pos_a" type="number" placeholder="3"></div><div><label>TEAM B POS</label><input id="m' + num + '_pos_b" type="number" placeholder="7"></div></div>' +
    '<label>TEAM A FORM (LAST 5)</label>' +
    '<div class="qt-row">' +
      '<button type="button" class="qt" data-target="m' + num + '_form_a" data-v="W">WIN</button>' +
      '<button type="button" class="qt" data-target="m' + num + '_form_a" data-v="D">DRAW</button>' +
      '<button type="button" class="qt" data-target="m' + num + '_form_a" data-v="L">LOSS</button>' +
    '</div>' +
    '<input id="m' + num + '_form_a" placeholder="W,L,D,W,W">' +
    '<label style="margin-top:10px">TEAM B FORM (LAST 5)</label>' +
    '<div class="qt-row">' +
      '<button type="button" class="qt" data-target="m' + num + '_form_b" data-v="W">WIN</button>' +
      '<button type="button" class="qt" data-target="m' + num + '_form_b" data-v="D">DRAW</button>' +
      '<button type="button" class="qt" data-target="m' + num + '_form_b" data-v="L">LOSS</button>' +
    '</div>' +
    '<input id="m' + num + '_form_b" placeholder="L,W,L,D,W">' +
    '<label style="margin-top:10px">HOW IS THIS MATCH PLAYING? (OPTIONAL)</label>' +
    '<textarea id="m' + num + '_conv" rows="2" placeholder="e.g. Team A attacking fast..."></textarea>';
}

const pages = {
  home: nav("home") + 
    '<div class="head"><div class="logo">⚡ INSTANT PICKS ⚡</div><div class="tag">SMART PICKS • NOT SURE PROMISES</div></div>' +
    '<div class="hero">' +
      '<div class="hero-stat"><div class="num" id="h-total">0</div><div class="lbl">ANALYSES</div></div>' +
      '<div class="hero-stat"><div class="num" id="h-rate">0%</div><div class="lbl">WIN RATE</div></div>' +
      '<div class="hero-stat"><div class="num" id="h-streak">0</div><div class="lbl">STREAK</div></div>' +
    '</div>' +
    '<div class="card glow"><h2 class="ct">WELCOME</h2><p class="txt">Analyze up to 3 matches at once. Quick form input, smart picks, real learning from every game.</p><a href="/analyze" class="btn">START ANALYZING</a></div>' +
    '<div class="card warn"><b class="warn-text">⚠ DISCIPLINE FIRST</b><p class="muted" style="margin-top:8px">No pick is 100% guaranteed. Bet within your means.</p></div>',

  analyze: nav("analyze") + 
    '<div class="head"><div class="logo">⚡ ANALYZE ⚡</div><div class="tag">UP TO 3 MATCHES AT ONCE</div></div>' +
    '<div class="card">' +
      '<label>PLATFORM</label>' +
      '<select id="platform">' + PLATFORMS.virtual.map(function(p) { return '<option value="' + p.id + '">' + p.name + ' — ' + p.game + '</option>'; }).join("") + '</select>' +
    '</div>' +
    '<div id="match1" class="card match-block"></div>' +
    '<div id="match2" class="card match-block"></div>' +
    '<div id="match3" class="card match-block"></div>' +
    '<button class="btn" id="analyzeBtn">⚡ ANALYZE ALL MATCHES ⚡</button>' +
    '<div id="result"></div>',

  ask: nav("ask") + 
    '<div class="head"><div class="logo">⚡ ASK ⚡</div></div>' +
    '<div class="card glow"><h3 class="ct">INSTANT PICKS ASSISTANT</h3><p class="muted">Ask about picks, strategy, bankroll management.</p></div>' +
    '<div class="card"><textarea id="aiQuestion" rows="3" placeholder="Ask anything betting-related..."></textarea><button class="btn" id="askBtn">⚡ ASK ⚡</button></div>' +
    '<div id="aiResponse" class="card" style="display:none"><h3 class="ct">RESPONSE</h3><div id="aiText" class="txt"></div></div>',

  dashboard: nav("dashboard") + 
    '<div class="head"><div class="logo">⚡ STATS ⚡</div></div>' +
    '<div class="stats-grid">' +
      '<div class="stat-card"><div class="stat-num" id="d-total">0</div><div class="stat-lbl">TOTAL</div></div>' +
      '<div class="stat-card"><div class="stat-num" id="d-wins">0</div><div class="stat-lbl">WINS</div></div>' +
      '<div class="stat-card"><div class="stat-num" id="d-today">0</div><div class="stat-lbl">TODAY</div></div>' +
      '<div class="stat-card highlight"><div class="stat-num" id="d-rate">0%</div><div class="stat-lbl">RATE</div></div>' +
    '</div>' +
    '<div class="card"><a href="/analyze" class="btn">NEW ANALYSIS</a></div>',

  history: nav("history") + '<div class="head"><div class="logo">⚡ HISTORY ⚡</div></div><div class="card"><div id="hist" class="muted">Loading...</div></div>',
  patterns: nav("patterns") + '<div class="head"><div class="logo">⚡ PATTERNS ⚡</div></div><div class="card"><div id="patterns-list" class="muted">Need 10+ results</div></div>',
  learn: nav("learn") + '<div class="head"><div class="logo">⚡ LEARN ⚡</div></div><div class="card"><h3 class="ct">VALUE BETTING</h3><p class="txt">Odds > true probability = value.</p></div>',
  about: nav("about") + '<div class="head"><div class="logo">⚡ ABOUT ⚡</div></div><div class="card"><h3 class="ct">DISCLAIMER</h3><p class="txt">Betting carries risk. Bet responsibly.</p></div>',
  admin: nav("admin") + '<div class="head"><div class="logo">⚡ ADMIN ⚡</div></div><div class="card" id="login-card"><h3 class="ct">ACCESS</h3><input type="password" id="pass" placeholder="Password" style="margin-top:15px"><button class="btn" onclick="adminLogin()">UNLOCK</button></div><div id="panel" style="display:none"><div class="card"><h3 class="ct">STATS</h3><div id="a-stats" class="muted">Loading...</div></div></div>'
};

function layout(content, active) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>INSTANT PICKS</title>' +
    '<style>' +
    '*{box-sizing:border-box;margin:0;padding:0}' +
    ':root{--green:#00ff88;--dark-green:#00cc6a;--black:#0a0a0a;--card:#161616;--red:#ff3333;--gray:#888;--yellow:#ffaa00;--orange:#ff8800}' +
    'body{font-family:"Courier New",monospace;background:var(--black);color:#fff;min-height:100vh;overflow-x:hidden;-webkit-tap-highlight-color:transparent}' +
    'canvas#matrix{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;opacity:.15}' +
    '.c{position:relative;z-index:2;max-width:560px;margin:0 auto;padding:12px;padding-bottom:80px}' +
    '.nav{display:flex;gap:3px;margin-bottom:18px;flex-wrap:wrap;background:rgba(0,0,0,.7);padding:5px;border-radius:10px;border:1px solid rgba(0,255,136,.2);position:sticky;top:8px;z-index:10}' +
    '.nav a{flex:1;min-width:48px;text-align:center;padding:8px 3px;color:var(--gray);text-decoration:none;font-size:8px;font-weight:700;border-radius:5px;display:flex;flex-direction:column;align-items:center;gap:2px}' +
    '.nav a .icon{width:16px;height:16px;display:block}' +
    '.nav a .icon svg{width:100%;height:100%;stroke:var(--gray)}' +
    '.nav a.active{background:rgba(0,255,136,.15);color:var(--green)}' +
    '.nav a.active .icon svg{stroke:var(--green);filter:drop-shadow(0 0 5px var(--green))}' +
    '.nav a.admin-btn{background:rgba(255,51,51,.1)}' +
    '.nav a.admin-btn .icon svg{stroke:var(--red)}' +
    '.head{text-align:center;padding:18px 0 12px;border-bottom:1px solid rgba(0,255,136,.2);margin-bottom:18px}' +
    '.logo{font-size:24px;font-weight:900;color:var(--green);text-shadow:0 0 20px var(--green);letter-spacing:2px}' +
    '.tag{color:var(--gray);font-size:9px;margin-top:5px;letter-spacing:2px}' +
    '.card{background:linear-gradient(135deg,rgba(0,255,136,.03),var(--card));border:1px solid rgba(0,255,136,.2);border-radius:12px;padding:16px;margin:10px 0}' +
    '.card.glow{border-color:rgba(0,255,136,.4);box-shadow:0 0 30px rgba(0,255,136,.1)}' +
    '.card.warn{border-color:rgba(255,51,51,.3)}' +
    '.match-block{border-left:4px solid var(--green)}' +
    '.ct{color:var(--green);margin-bottom:10px;font-size:14px;letter-spacing:1px}' +
    '.txt{color:#ccc;line-height:1.6;font-size:13px;white-space:pre-wrap}' +
    '.hl{color:var(--green);text-shadow:0 0 5px var(--green)}' +
    '.warn-text{color:var(--red);text-shadow:0 0 5px var(--red)}' +
    '.muted{color:var(--gray);font-size:12px;margin:4px 0;line-height:1.5}' +
    'label{display:block;color:var(--green);font-size:10px;font-weight:700;margin:12px 0 5px;letter-spacing:2px}' +
    'input,select,textarea{width:100%;padding:11px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:8px;font-size:14px;font-family:inherit}' +
    'input:focus,select:focus,textarea:focus{outline:none;border-color:var(--green)}' +
    '.row{display:flex;gap:8px;margin-top:5px;flex-wrap:wrap}.row>div{flex:1;min-width:100px}' +
    '.btn{display:block;width:100%;padding:14px;background:linear-gradient(135deg,var(--green),var(--dark-green));color:#000;font-weight:900;font-size:13px;border:none;border-radius:8px;margin-top:14px;cursor:pointer;text-transform:uppercase;letter-spacing:2px;font-family:inherit;box-shadow:0 0 20px rgba(0,255,136,.4);text-align:center;text-decoration:none;clear:both}' +
    '.hero{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:12px 0}' +
    '.hero-stat{background:var(--card);border:1px solid rgba(0,255,136,.2);border-radius:10px;padding:10px;text-align:center}' +
    '.hero-stat .num{font-size:20px;font-weight:900;color:var(--green);text-shadow:0 0 10px var(--green)}' +
    '.hero-stat .lbl{font-size:8px;color:var(--gray);letter-spacing:2px;margin-top:3px}' +
    '.stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:10px 0}' +
    '.stat-card{background:var(--card);border:1px solid rgba(0,255,136,.2);border-radius:10px;padding:14px;text-align:center}' +
    '.stat-card.highlight{border-color:var(--green);box-shadow:0 0 20px rgba(0,255,136,.2)}' +
    '.stat-num{font-size:26px;font-weight:900;color:var(--green);text-shadow:0 0 10px var(--green)}' +
    '.stat-lbl{font-size:9px;color:var(--gray);letter-spacing:2px;margin-top:3px}' +
    '.qt-row{display:flex;gap:5px;margin:8px 0}' +
    '.qt{flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700;font-size:12px;letter-spacing:1px}' +
    '.qt:hover,.qt:active{background:rgba(0,255,136,.2);border-color:var(--green);color:var(--green)}' +
    '.match-title{font-size:18px;font-weight:800;margin:15px 0 5px;text-align:center;color:var(--green)}' +
    '.match-sub{font-size:9px;color:var(--gray);text-align:center;letter-spacing:2px;margin-bottom:10px}' +
    '.pick-card{background:linear-gradient(135deg,rgba(0,255,136,.05),var(--card));border-left:4px solid var(--green);padding:14px;margin:10px 0;border-radius:8px}' +
    '.pick-card.risk-low{border-left-color:var(--green)}' +
    '.pick-card.risk-medium{border-left-color:var(--yellow)}' +
    '.pick-card.risk-high{border-left-color:var(--red)}' +
    '.pick-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}' +
    '.tag2{background:var(--green);color:#000;padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900;letter-spacing:1px}' +
    '.tag-risk{padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900;letter-spacing:1px}' +
    '.risk-low{background:#003300;color:var(--green);border:1px solid var(--green)}' +
    '.risk-medium{background:#332200;color:var(--yellow);border:1px solid var(--yellow)}' +
    '.risk-high{background:#330000;color:var(--red);border:1px solid var(--red)}' +
    '.pick-name{font-size:17px;font-weight:800;margin:6px 0}' +
    '.pick-conf{font-size:36px;font-weight:900;color:var(--green);text-shadow:0 0 15px var(--green);font-family:monospace}' +
    '.pick-why{color:var(--gray);font-size:12px;margin:6px 0;line-height:1.5}' +
    '.pick-btns{display:flex;gap:6px;margin-top:10px}' +
    '.pick-btns form{flex:1;display:flex;gap:6px}' +
    '.pick-btns button{flex:1;padding:11px;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;letter-spacing:1px}' +
    '.btn-win{background:var(--green);color:#000;box-shadow:0 0 10px rgba(0,255,136,.4)}' +
    '.btn-lose{background:#1a0000;color:var(--red);border:1px solid var(--red)}' +
    '</style></head><body>' +
    '<canvas id="matrix"></canvas>' +
    '<div class="c">' + content + '</div>' +
    '<script>' +
    'const c=document.getElementById("matrix"),x=c.getContext("2d");' +
    'function rs(){c.width=window.innerWidth;c.height=window.innerHeight}rs();window.addEventListener("resize",rs);' +
    'const ch="01<>{}[]/\\\\$#@!%&*+=";' +
    'const fs=14;let cols=Math.floor(c.width/fs);let drops=Array(cols).fill(1);' +
    'setInterval(function(){x.fillStyle="rgba(0,0,0,0.05)";x.fillRect(0,0,c.width,c.height);x.fillStyle="#00ff88";x.font=fs+"px monospace";for(let i=0;i<drops.length;i++){const t=ch[Math.floor(Math.random()*ch.length)];x.fillText(t,i*fs,drops[i]*fs);if(drops[i]*fs>c.height&&Math.random()>.975)drops[i]=0;drops[i]++}},33);' +
    '</script>' +
    '<script>' +
    'if(document.getElementById("match1")){' +
      'document.getElementById("match1").innerHTML=buildMatchBlock(1);' +
      'document.getElementById("match2").innerHTML=buildMatchBlock(2);' +
      'document.getElementById("match3").innerHTML=buildMatchBlock(3);' +
      'document.querySelectorAll(".qt").forEach(function(b){b.addEventListener("click",function(){' +
        'const target=document.getElementById(b.dataset.target);' +
        'if(!target)return;' +
        'const cur=target.value?target.value.split(","):[];' +
        'if(cur.length>=5)return;' +
        'cur.push(b.dataset.v);' +
        'target.value=cur.join(",");' +
      '})});' +
    '}' +
    'async function loadStats(){' +
      'try{' +
        'const r=await fetch("/api/stats");' +
        'const s=await r.json();' +
        'const rate=s.total>0?Math.round(s.wins/s.total*1000)/10:0;' +
        'const h=document.getElementById("h-total");if(h)h.textContent=s.total;' +
        'const hr=document.getElementById("h-rate");if(hr)hr.textContent=rate+"%";' +
        'const dt=document.getElementById("d-total");if(dt)dt.textContent=s.total;' +
        'const dw=document.getElementById("d-wins");if(dw)dw.textContent=s.wins;' +
        'const dt2=document.getElementById("d-today");if(dt2)dt2.textContent=s.todayTotal||0;' +
        'const dr=document.getElementById("d-rate");if(dr)dr.textContent=rate+"%";' +
        'if(s.total>0){' +
          'const r2=await fetch("/api/predictions");' +
          'const p=await r2.json();' +
          'const recent=p.slice(0,10).filter(function(x){return x.status==="win"||x.status==="lose"});' +
          'let cur=0,type=recent[0]?recent[0].status:"none";' +
          'for(const x of recent){if(x.status===type)cur++;else break;}' +
          'const hs=document.getElementById("h-streak");' +
          'if(hs)hs.textContent=cur+(type==="win"?"W":type==="lose"?"L":"");' +
        '}' +
      '}catch(e){}' +
    '}' +
    'loadStats();' +
    'const analyzeBtn=document.getElementById("analyzeBtn");' +
    'if(analyzeBtn){analyzeBtn.addEventListener("click",async function(){' +
      'const fd=new FormData();' +
      'fd.append("platform",document.getElementById("platform").value);' +
      'fd.append("match_count","3");' +
      'for(let i=1;i<=3;i++){' +
        'const tA=document.getElementById("m"+i+"_team_a");' +
        'if(tA&&tA.value){' +
          'fd.append("m"+i+"_team_a",tA.value);' +
          'fd.append("m"+i+"_team_b",document.getElementById("m"+i+"_team_b").value);' +
          'fd.append("m"+i+"_pos_a",document.getElementById("m"+i+"_pos_a").value);' +
          'fd.append("m"+i+"_pos_b",document.getElementById("m"+i+"_pos_b").value);' +
          'fd.append("m"+i+"_form_a",document.getElementById("m"+i+"_form_a").value);' +
          'fd.append("m"+i+"_form_b",document.getElementById("m"+i+"_form_b").value);' +
          'fd.append("m"+i+"_conv",document.getElementById("m"+i+"_conv").value);' +
        '}' +
      '}' +
      'analyzeBtn.disabled=true;' +
      'analyzeBtn.textContent="ANALYZING...";' +
      'try{' +
        'const r=await fetch("/api/analyze",{method:"POST",body:fd});' +
        'const d=await r.json();' +
        'if(d.ok&&d.results){' +
          'const res=document.getElementById("result");' +
          'let html="<div class=\\"head\\"><div class=\\"logo\\" style=\\"font-size:20px\\">⚡ RESULTS ⚡</div></div>";' +
          'd.results.forEach(function(match){' +
            'html+="<div class=\\"match-title\\">"+match.teamA+" <span class=\\"hl\\">VS</span> "+match.teamB+"</div>";' +
            'html+="<div class=\\"match-sub\\">"+match.platform.toUpperCase()+"</div>";' +
            'match.picks.forEach(function(p,i){' +
              'html+="<div class=\\"pick-card risk-"+p.risk+"\\"><div class=\\"pick-header\\"><span class=\\"tag2\\">PICK #"+(i+1)+"</span><span class=\\"tag-risk risk-"+p.risk+"\\">"+p.risk.toUpperCase()+"</span></div>";' +
              'html+="<div class=\\"pick-name\\">"+p.pick+"</div>";' +
              'html+="<div class=\\"pick-conf\\">"+p.conf+"%</div>";' +
              'html+="<div class=\\"pick-why\\">"+p.why+"</div>";' +
              'html+="<div class=\\"pick-btns\\"><form><input type=\\"hidden\\" name=\\"pid\\" value=\\""+match.predId+"\\"><input type=\\"hidden\\" name=\\"p\\" value=\\""+p.pick+"\\"><button type=\\"submit\\" name=\\"o\\" value=\\"win\\" class=\\"btn-win\\">WIN</button><button type=\\"submit\\" name=\\"o\\" value=\\"lose\\" class=\\"btn-lose\\">LOSE</button></form></div></div>";' +
            '});' +
          '});' +
          'html+="<a href=\\"/analyze\\" class=\\"btn\\">NEW ANALYSIS</a>";' +
          'res.innerHTML=html;' +
          'res.querySelectorAll("form").forEach(function(f){f.addEventListener("submit",async function(e){' +
            'e.preventDefault();' +
            'const fd=new FormData();' +
            'fd.append("predId",f.querySelector("[name=pid]").value);' +
            'fd.append("pick",f.querySelector("[name=p]").value);' +
            'fd.append("outcome",e.submitter.value);' +
            'await fetch("/api/result",{method:"POST",body:fd});' +
            'alert("Logged!");' +
            'loadStats();' +
          '})});' +
          'res.scrollIntoView({behavior:"smooth"});' +
        '}else{alert("Error: "+(d.error||"unknown"))}' +
      '}catch(e){alert("Error: "+e.message)}' +
      'analyzeBtn.disabled=false;' +
      'analyzeBtn.textContent="⚡ ANALYZE ALL MATCHES ⚡";' +
    '})}' +
    'async function loadHistory(){' +
      'try{' +
        'const r=await fetch("/api/predictions");' +
        'const p=await r.json();' +
        'const h=document.getElementById("hist");' +
        'if(!h)return;' +
        'if(!p.length){h.innerHTML="No predictions yet.";return}' +
        'h.innerHTML=p.map(function(x){return "<div style=\\"padding:10px;border-bottom:1px solid #222\\"><div style=\\"display:flex;justify-content:space-between\\"><b class=\\"hl\\">"+(x.match||"Match")+"</b><span style=\\"font-size:10px;color:var(--gray)\\">"+new Date(x.time).toLocaleString()+"</span></div><div style=\\"font-size:10px;margin-top:3px\\">"+(x.status==="win"?"<span class=\\"hl\\">WIN</span>":x.status==="lose"?"<span class=\\"warn-text\\">LOSE</span>":"<span class=\\"muted\\">PENDING</span>")+"</div></div>";}).join("");' +
      '}catch(e){}' +
    '}' +
    'loadHistory();' +
    'async function loadPatterns(){' +
      'try{' +
        'const r=await fetch("/api/patterns");' +
        'const p=await r.json();' +
        'const list=document.getElementById("patterns-list");' +
        'if(!list)return;' +
        'const rules=p.rules||{};' +
        'const active=Object.entries(rules).filter(function(entry){return entry[1].total>=10;});' +
        'if(!active.length){list.innerHTML="Need 10+ results";return}' +
        'list.innerHTML=active.slice(0,10).map(function(entry){return "<div style=\\"background:rgba(0,255,136,.05);border-left:3px solid var(--green);padding:10px;margin:6px 0;border-radius:6px\\"><b class=\\"hl\\">"+entry[0].replace(/_/g," ")+"</b><br><span class=\\"muted\\">"+entry[1].hits+"/"+entry[1].total+" = "+entry[1].confidence+"%</span></div>";}).join("");' +
      '}catch(e){}' +
    '}' +
    'loadPatterns();' +
    'const askBtn=document.getElementById("askBtn");' +
    'if(askBtn){askBtn.addEventListener("click",async function(){' +
      'const q=document.getElementById("aiQuestion").value.trim();' +
      'if(!q){alert("Ask a question");return}' +
      'const fd=new FormData();fd.append("question",q);' +
      'const r=await fetch("/api/ask",{method:"POST",body:fd});' +
      'const d=await r.json();' +
      'if(d.ok){document.getElementById("aiResponse").style.display="block";document.getElementById("aiText").textContent=d.reply;}' +
      'else alert("Error: "+d.error);' +
    '})}' +
    'async function adminLogin(){' +
      'const p=document.getElementById("pass").value;' +
      'const fd=new FormData();fd.append("password",p);' +
      'const r=await fetch("/api/admin/login",{method:"POST",body:fd});' +
      'const d=await r.json();' +
      'if(d.ok){' +
        'document.getElementById("login-card").style.display="none";' +
        'document.getElementById("panel").style.display="block";' +
        'const sr=await fetch("/api/stats");' +
        'const ss=await sr.json();' +
        'document.getElementById("a-stats").innerHTML="Total: "+ss.total+" | Wins: "+ss.wins;' +
      '}else alert("Wrong password");' +
    '}' +
    '</script>' +
    '</body></html>';
}
