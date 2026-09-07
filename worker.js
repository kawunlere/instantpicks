export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const routes = {
      "/": "home", "/home": "home",
      "/analyze": "analyze",
      "/dashboard": "dashboard",
      "/history": "history",
      "/patterns": "patterns",
      "/learn": "learn",
      "/about": "about",
      "/admin": "admin",
      "/ask": "ask",
      "/insights": "insights"
    };
    
    // API routes MUST come BEFORE page route catch
    if (path === "/api/analyze" && request.method === "POST") return await apiAnalyze(request, env);
    if (path === "/api/result" && request.method === "POST") return await apiResult(request, env);
    if (path === "/api/stats") return await apiStats(env);
    if (path === "/api/predictions") return await apiPredictions(env);
    if (path === "/api/patterns") return await apiPatterns(env);
    if (path === "/api/insights") return await apiInsights(env);
    if (path === "/api/ask" && request.method === "POST") return await apiAskAI(request, env);
    if (path === "/api/admin/login" && request.method === "POST") return await adminLogin(request);
    
    const page = routes[path] || "404";
    if (page === "404") return new Response("Not Found", { status: 404 });
    return new Response(layout(pages[page], page), { headers: { "Content-Type": "text/html" } });
  }
};

const ADMIN_PASS = "kawunlere2024";
const PLATFORMS = {
  virtual: [
    {id: "sportybet", name: "Sportybet", game: "Instant Virtual", country: "Nigeria"},
    {id: "bet9ja", name: "Bet9ja", game: "Virtual League", country: "Nigeria"},
    {id: "betway", name: "Betway", game: "Virtual", country: "Nigeria"},
    {id: "1xbet", name: "1xBet", game: "Virtual Football", country: "Worldwide"},
    {id: "football_com", name: "Football.com", game: "Instant Virtual", country: "Nigeria"},
    {id: "betking", name: "BetKing", game: "Virtual League", country: "Nigeria"},
    {id: "nairabet", name: "NairaBet", game: "Virtual", country: "Nigeria"},
    {id: "merrybet", name: "MerryBet", game: "Virtual", country: "Nigeria"},
    {id: "msport", name: "MSport", game: "Virtual", country: "Nigeria"},
    {id: "bangbet", name: "Bangbet", game: "Virtual", country: "Nigeria"},
    {id: "parimatch", name: "Parimatch", game: "Virtual", country: "Worldwide"},
    {id: "livescorebet", name: "LivescoreBet", game: "Virtual", country: "Worldwide"},
    {id: "22bet", name: "22Bet", game: "Virtual", country: "Worldwide"},
    {id: "pinnacle", name: "Pinnacle", game: "Virtual", country: "Worldwide"}
  ],
  real: [
    {id: "sportybet", name: "Sportybet", country: "Nigeria"},
    {id: "bet9ja", name: "Bet9ja", country: "Nigeria"},
    {id: "betway", name: "Betway", country: "Worldwide"},
    {id: "1xbet", name: "1xBet", country: "Worldwide"},
    {id: "bet365", name: "Bet365", country: "Worldwide"},
    {id: "betking", name: "BetKing", country: "Nigeria"},
    {id: "nairabet", name: "NairaBet", country: "Nigeria"},
    {id: "msport", name: "MSport", country: "Nigeria"},
    {id: "parimatch", name: "Parimatch", country: "Worldwide"},
    {id: "stake", name: "Stake.com", country: "Worldwide"}
  ]
};

const SYSTEM_PROMPT = `You are the INSTANT PICKS CORE ENGINE, a strict betting analysis system.

YOUR ONLY JOB: Help users make smarter, safer betting decisions.

STRICT RULES:
1. ONLY discuss betting analysis, picks, patterns, odds value, bankroll management, and discipline.
2. NEVER drift to other topics. If asked, say "I only help with betting analysis."
3. Always recommend value betting, discipline, and responsible gambling.
4. Always remind users that no pick is 100% guaranteed.
5. Keep responses under 200 words.
6. Speak like a professional betting analyst.
7. Analyze attacking/defensive style, momentum, likely outcomes.
8. Consider form, home/away, table position, recent results, observations.

You focus 100% on your duty: smarter betting.`;

async function callCoreEngine(env, userMessage) {
  if (!env.GEMINI_API_KEY) {
    return { ok: false, error: "Core engine not configured" };
  }
  
  const models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-pro"];
  
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\nUser: " + userMessage }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          return { ok: true, reply: data.candidates[0].content.parts[0].text, model: model };
        }
      }
      
      if (response.status === 404) continue;
      const errText = await response.text();
      return { ok: false, error: `Core error ${response.status}`, details: errText.substring(0, 300) };
    } catch (e) { continue; }
  }
  
  return { ok: false, error: "Core engine unavailable" };
}

async function enhancePicksWithEngine(env, picks, match, conversation, platform, type) {
  if (!env.GEMINI_API_KEY || !conversation) return picks;
  
  const prompt = `Match: ${match} on ${platform} (${type})
Base picks: ${picks.map(p => `${p.pick} (${p.conf}%)`).join(', ')}
User description: "${conversation}"

Adjust based on description. EXACT format only:
PICK1: [pick name]|[confidence]|[one line why]
PICK2: [pick name]|[confidence]|[one line why]
PICK3: [pick name]|[confidence]|[one line why]
PICK4: [pick name]|[confidence]|[one line why]
PICK5: [pick name]|[confidence]|[one line why]

Max 85%, min 40%.`;

  const ai = await callCoreEngine(env, prompt);
  if (!ai.ok) return picks;
  
  const lines = ai.reply.split('\n').filter(l => l.trim().startsWith('PICK'));
  const enhanced = [];
  
  for (let i = 0; i < picks.length; i++) {
    const line = lines.find(l => l.trim().startsWith('PICK' + (i+1) + ':'));
    if (line) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 3) {
        const conf = parseInt(parts[1]) || picks[i].conf;
        enhanced.push({
          ...picks[i],
          pick: parts[0].replace(/^PICK\d+:\s*/, '').trim(),
          conf: Math.max(40, Math.min(85, conf)),
          why: parts[2]
        });
      } else { enhanced.push(picks[i]); }
    } else { enhanced.push(picks[i]); }
  }
  
  return enhanced;
}

async function apiAnalyze(request, env) {
  try {
    const form = await request.formData();
    const platform = form.get("platform") || "sportybet";
    const type = form.get("type") || "virtual";
    const teamA = form.get("team_a") || "Team A";
    const teamB = form.get("team_b") || "Team B";
    const formA = (form.get("form_a") || "").toUpperCase().replace(/\s/g, "").split(",");
    const formB = (form.get("form_b") || "").toUpperCase().replace(/\s/g, "").split(",");
    const tableA = parseInt(form.get("table_a")) || 5;
    const tableB = parseInt(form.get("table_b")) || 5;
    const conversation = form.get("conversation") || "";
    
    const patterns = await loadPatterns(env);
    const streaks = await getStreakInfo(env);
    let recs = generatePicks(formA, formB, tableA, tableB, type, platform, conversation, patterns, streaks);
    
    if (conversation && env.GEMINI_API_KEY) {
      recs = await enhancePicksWithEngine(env, recs, `${teamA} vs ${teamB}`, conversation, platform, type);
    }
    
    const predId = `p_${Date.now()}`;
    if (env.PICKS_KV) {
      await env.PICKS_KV.put(predId, JSON.stringify({
        id: predId,
        time: new Date().toISOString(),
        platform, type,
        match: `${teamA} vs ${teamB}`,
        formA, formB, tableA, tableB,
        conversation,
        picks: recs,
        status: "pending"
      }));
    }
    
    return new Response(JSON.stringify({ ok: true, predId, teamA, teamB, platform, type, picks: recs, streaks }), {
      headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function apiAskAI(request, env) {
  try {
    const form = await request.formData();
    const question = form.get("question") || "";
    
    if (!question.trim()) {
      return new Response(JSON.stringify({ ok: false, error: "Empty question" }), {
        headers: { "Content-Type": "application/json" } });
    }
    
    const ai = await callCoreEngine(env, question);
    
    if (!ai.ok) {
      return new Response(JSON.stringify({ ok: false, error: ai.error, details: ai.details || "" }), {
        headers: { "Content-Type": "application/json" } });
    }
    
    return new Response(JSON.stringify({ ok: true, reply: ai.reply, model: ai.model }), {
      headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function apiResult(request, env) {
  const form = await request.formData();
  const predId = form.get("predId") || "";
  const pick = form.get("pick");
  const outcome = form.get("outcome");
  
  let s = { total: 0, wins: 0, todayTotal: 0, todayWins: 0, todayDate: new Date().toDateString() };
  if (env.PICKS_KV) {
    const stored = await env.PICKS_KV.get("stats");
    if (stored) {
      s = JSON.parse(stored);
      if (s.todayDate !== new Date().toDateString()) {
        s.todayTotal = 0; s.todayWins = 0; s.todayDate = new Date().toDateString();
      }
    }
    s.total++;
    s.todayTotal++;
    if (outcome === "win") { s.wins++; s.todayWins++; }
    await env.PICKS_KV.put("stats", JSON.stringify(s));
    
    if (predId) {
      const predRaw = await env.PICKS_KV.get(predId);
      if (predRaw) {
        const pred = JSON.parse(predRaw);
        pred.status = outcome;
        pred.outcomePick = pick;
        pred.outcomeTime = new Date().toISOString();
        await env.PICKS_KV.put(predId, JSON.stringify(pred));
        await learnFromResult(env, pred, pick, outcome);
      }
    }
  }
  
  return new Response(JSON.stringify({ ok: true, stats: s }), { headers: { "Content-Type": "application/json" } });
}

async function getStreakInfo(env) {
  if (!env.PICKS_KV) return { current: 0, type: "none", message: "" };
  
  const list = await env.PICKS_KV.list({ prefix: "p_" });
  const recent = [];
  
  for (const key of list.keys.slice(-10).reverse()) {
    const v = await env.PICKS_KV.get(key.name);
    if (v) {
      const p = JSON.parse(v);
      if (p.status === "win" || p.status === "lose") recent.push(p.status);
    }
  }
  
  if (!recent.length) return { current: 0, type: "none", message: "" };
  
  let current = 0;
  let type = recent[0];
  for (const r of recent) {
    if (r === type) current++;
    else break;
  }
  
  let message = "";
  if (type === "lose" && current >= 3) {
    message = `${current} losses in a row. Take a break or reduce stakes.`;
  } else if (type === "win" && current >= 3) {
    message = `${current} wins hot streak! Stay disciplined.`;
  } else if (type === "lose" && current === 2) {
    message = `2 losses. Be cautious.`;
  }
  
  return { current, type, message };
}

async function learnFromResult(env, pred, pick, outcome) {
  if (!env.PICKS_KV) return;
  
  const patternsRaw = await env.PICKS_KV.get("patterns");
  const patterns = patternsRaw ? JSON.parse(patternsRaw) : { rules: {}, lastUpdate: null };
  
  const formA = pred.formA || [];
  const formB = pred.formB || [];
  const winsA = formA.filter(r => r === "W").length;
  const winsB = formB.filter(r => r === "W").length;
  const formDiff = winsA - winsB;
  const tableDiff = (pred.tableB || 5) - (pred.tableA || 5);
  const hour = new Date(pred.time).getHours();
  const timeSlot = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  
  const formKey = `${pred.platform}_${pred.type}_form${formDiff}_pos${tableDiff > 0 ? "good" : "bad"}`;
  if (!patterns.rules[formKey]) patterns.rules[formKey] = { hits: 0, total: 0, confidence: 50 };
  patterns.rules[formKey].total++;
  if (outcome === "win") patterns.rules[formKey].hits++;
  patterns.rules[formKey].confidence = Math.round((patterns.rules[formKey].hits / patterns.rules[formKey].total) * 100);
  
  const timeKey = `${pred.platform}_time_${timeSlot}`;
  if (!patterns.rules[timeKey]) patterns.rules[timeKey] = { hits: 0, total: 0, confidence: 50 };
  patterns.rules[timeKey].total++;
  if (outcome === "win") patterns.rules[timeKey].hits++;
  patterns.rules[timeKey].confidence = Math.round((patterns.rules[timeKey].hits / patterns.rules[timeKey].total) * 100);
  
  if (pred.conversation) {
    const convKey = `${pred.platform}_conv_${getConvCategory(pred.conversation.toLowerCase())}`;
    if (!patterns.rules[convKey]) patterns.rules[convKey] = { hits: 0, total: 0, confidence: 50 };
    patterns.rules[convKey].total++;
    if (outcome === "win") patterns.rules[convKey].hits++;
    patterns.rules[convKey].confidence = Math.round((patterns.rules[convKey].hits / patterns.rules[convKey].total) * 100);
  }
  
  patterns.lastUpdate = new Date().toISOString();
  await env.PICKS_KV.put("patterns", JSON.stringify(patterns));
}

function getConvCategory(text) {
  if (text.includes("attack") || text.includes("pressing") || text.includes("fast")) return "attacking";
  if (text.includes("defensive") || text.includes("slow") || text.includes("careful")) return "defensive";
  if (text.includes("injured") || text.includes("weak")) return "weak";
  if (text.includes("strong") || text.includes("dominating")) return "dominant";
  return "neutral";
}

async function loadPatterns(env) {
  if (!env.PICKS_KV) return { rules: {} };
  const raw = await env.PICKS_KV.get("patterns");
  return raw ? JSON.parse(raw) : { rules: {} };
}

async function apiPatterns(env) {
  if (!env.PICKS_KV) return new Response('{"rules":{}}', { headers: { "Content-Type": "application/json" } });
  const raw = await env.PICKS_KV.get("patterns") || '{"rules":{}}';
  return new Response(raw, { headers: { "Content-Type": "application/json" } });
}

async function apiInsights(env) {
  if (!env.PICKS_KV) return new Response(JSON.stringify({ insights: [] }), { headers: { "Content-Type": "application/json" } });
  
  const statsRaw = await env.PICKS_KV.get("stats") || '{"total":0,"wins":0}';
  const stats = JSON.parse(statsRaw);
  const patternsRaw = await env.PICKS_KV.get("patterns") || '{"rules":{}}';
  const patterns = JSON.parse(patternsRaw);
  
  const insights = [];
  
  if (stats.total > 0) {
    const rate = Math.round((stats.wins / stats.total) * 100);
    if (rate >= 60) insights.push({ type: "good", text: `Win rate ${rate}% — strong performance. Stay disciplined.` });
    else if (rate < 45 && stats.total >= 10) insights.push({ type: "warn", text: `Win rate ${rate}% — review your analysis approach.` });
  }
  
  const rules = patterns.rules || {};
  Object.entries(rules).forEach(([key, r]) => {
    if (r.total >= 10 && r.confidence >= 70) {
      insights.push({ type: "good", text: `Strong pattern: ${key.replace(/_/g, ' ')} hits ${r.confidence}%` });
    } else if (r.total >= 10 && r.confidence < 40) {
      insights.push({ type: "warn", text: `Weak pattern: ${key.replace(/_/g, ' ')} only ${r.confidence}%` });
    }
  });
  
  if (stats.todayTotal > 0) {
    const todayRate = Math.round((stats.todayWins / stats.todayTotal) * 100);
    if (stats.todayTotal >= 5 && todayRate < 40) {
      insights.push({ type: "warn", text: `Today is rough (${todayRate}%). Consider stopping and analyzing patterns.` });
    }
  }
  
  return new Response(JSON.stringify({ insights }), { headers: { "Content-Type": "application/json" } });
}

async function apiStats(env) {
  if (!env.PICKS_KV) return new Response('{"total":0,"wins":0}', { headers: { "Content-Type": "application/json" } });
  const s = await env.PICKS_KV.get("stats") || '{"total":0,"wins":0}';
  return new Response(s, { headers: { "Content-Type": "application/json" } });
}

async function apiPredictions(env) {
  if (!env.PICKS_KV) return new Response('[]', { headers: { "Content-Type": "application/json" } });
  const list = await env.PICKS_KV.list({ prefix: "p_" });
  const preds = [];
  for (const key of list.keys.slice(-30).reverse()) {
    const v = await env.PICKS_KV.get(key.name);
    if (v) preds.push(JSON.parse(v));
  }
  return new Response(JSON.stringify(preds), { headers: { "Content-Type": "application/json" } });
}

async function adminLogin(request) {
  const form = await request.formData();
  if (form.get("password") === ADMIN_PASS) {
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { "Content-Type": "application/json" } });
}

function generatePicks(fA, fB, tA, tB, type, platform, conversation, patterns, streaks) {
  const sA = fA.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const sB = fB.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const diff = sA - sB;
  const gap = tA - tB;
  
  let baseBoost = 0;
  let confPenalty = 0;
  
  if (patterns && patterns.rules) {
    const key = `${platform}_${type}_form${diff}_pos${gap > 0 ? "good" : "bad"}`;
    const rule = patterns.rules[key];
    if (rule && rule.total >= 3) baseBoost = Math.round((rule.confidence - 50) / 5);
  }
  
  if (streaks && streaks.type === "lose" && streaks.current >= 3) {
    confPenalty = -5;
  }
  
  const recs = [];
  
  if (type === "virtual") {
    if (diff > 3) recs.push({ pick: "Home Win (1)", conf: Math.max(40, Math.min(85, 68 + baseBoost + confPenalty)), risk: "medium", why: "Team A dominant form" + (baseBoost ? " + pattern" : "") });
    else if (diff < -3) recs.push({ pick: "Away Win (2)", conf: Math.max(40, Math.min(85, 64 + baseBoost + confPenalty)), risk: "medium", why: "Team B stronger" });
    else recs.push({ pick: "Over 1.5 Goals", conf: Math.max(40, Math.min(85, 72 + baseBoost + confPenalty)), risk: "low", why: "Virtuals score often" });
    recs.push({ pick: "BTTS: Yes", conf: 58 + confPenalty, risk: "medium", why: "Both teams attacking" });
    recs.push({ pick: "Double Chance (1X)", conf: 75, risk: "low", why: "Safest play" });
    recs.push({ pick: "Over 2.5 Goals", conf: 52, risk: "high", why: "High-scoring virtual" });
  } else {
    if (diff > 3 && gap < 0) recs.push({ pick: "Home Win (1)", conf: 66 + baseBoost + confPenalty, risk: "medium", why: "Form + position favor home" });
    else if (diff < -3) recs.push({ pick: "Away Win (2)", conf: 62 + baseBoost + confPenalty, risk: "medium", why: "Away team superior" });
    else recs.push({ pick: "Double Chance (1X or X2)", conf: 75, risk: "low", why: "Balanced match" });
    recs.push({ pick: "Under 3.5 Goals", conf: 70, risk: "low", why: "Tight match expected" });
    recs.push({ pick: "BTTS: No", conf: 60, risk: "medium", why: "Defensive setup likely" });
    recs.push({ pick: "Draw No Bet (Home)", conf: 65, risk: "low", why: "Insurance on draw" });
  }
  recs.push({ pick: "Half-time: Draw", conf: 55, risk: "medium", why: "Most matches tight at HT" });
  return recs.slice(0, 5);
}

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12L12 3L21 12M5 10V21H19V10"/></svg>',
  analyze: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21L16.65 16.65M11 8V14M8 11H14"/></svg>',
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3V21H21M7 16L12 11L15 14L21 8"/></svg>',
  patterns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12C3 12 5 6 9 6C13 6 15 12 15 12M9 12C9 12 11 6 15 6C19 6 21 12 21 12M9 12C9 12 11 18 15 18C19 18 21 12 21 12M9 12C9 12 11 18 15 18M3 12C3 12 5 18 9 18"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3H8C9 3 10 4 10 5V21C10 20 9 19 8 19H2V3M22 3H16C15 3 14 4 14 5V21C14 20 15 19 16 19H22V3M7 7H5M7 11H5M7 15H5M19 7H17M19 11H17M19 15H17"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11"/></svg>',
  ask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12C21 16.97 16.97 21 12 21C10.18 21 8.5 20.41 7.13 19.4L3 21L4.6 16.87C3.59 15.5 3 13.82 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"/><circle cx="8.5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="15.5" cy="12" r="1" fill="currentColor"/></svg>',
  insights: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17M2 12L12 17L22 12"/></svg>',
  core: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
};

function nav(active) {
  const items = [
    ["home", "HOME", ICONS.home],
    ["analyze", "ANALYZE", ICONS.analyze],
    ["ask", "CORE", ICONS.ask],
    ["dashboard", "STATS", ICONS.dashboard],
    ["insights", "TIPS", ICONS.insights],
    ["patterns", "PATTERNS", ICONS.patterns]
  ];
  return `<div class="nav">${items.map(([k, v, icon]) => 
    `<a href="/${k === 'home' ? '' : k}" class="${active === k ? 'active' : ''}"><span class="icon">${icon}</span><span>${v}</span></a>`
  ).join("")}<a href="/admin" class="admin-btn ${active === 'admin' ? 'active' : ''}"><span class="icon">${ICONS.lock}</span></a></div>`;
}

const pages = {
  home: `${nav("home")}
<div class="head"><div class="logo">⚡ INSTANT PICKS ⚡</div><div class="tag">SMART PICKS • NOT SURE PROMISES</div></div>
<div class="hero">
  <div class="hero-stat"><div class="num" id="h-total">0</div><div class="lbl">TOTAL</div></div>
  <div class="hero-stat"><div class="num" id="h-rate">0%</div><div class="lbl">WIN RATE</div></div>
  <div class="hero-stat"><div class="num" id="h-streak">0</div><div class="lbl">STREAK</div></div>
</div>
<div class="streak-msg" id="streak-msg" style="display:none"></div>
<div class="card glow">
  <h2 class="ct">WELCOME TO INSTANT PICKS</h2>
  <p class="txt">Your intelligent betting co-pilot with proprietary <b class="hl">pattern engine</b> and <b class="hl">streak intelligence</b>.</p>
  <a href="/analyze" class="btn">START ANALYZING</a>
  <a href="/insights" class="btn" style="background:linear-gradient(135deg,#ffaa00,#ff8800);margin-top:10px">VIEW INSIGHTS</a>
</div>
<div class="card">
  <h3 class="ct">PROPRIETARY TECHNOLOGY</h3>
  <div class="muted"><span class="check-icon">${ICONS.check}</span> Pattern Recognition Engine</div>
  <div class="muted"><span class="check-icon">${ICONS.check}</span> Streak Detection System</div>
  <div class="muted"><span class="check-icon">${ICONS.check}</span> 14 Platform Support</div>
  <div class="muted"><span class="check-icon">${ICONS.check}</span> Real-time Personal Insights</div>
</div>
<div class="card warn">
  <b class="warn-text">⚠ DISCIPLINE FIRST</b>
  <p class="muted" style="margin-top:8px">No tool guarantees wins. INSTANT PICKS helps you make smarter decisions, but always bet within your means.</p>
</div>`,

  analyze: `${nav("analyze")}
<div class="head"><div class="logo">⚡ ANALYZE ⚡</div><div class="tag">SMART MATCH ANALYSIS</div></div>
<div class="streak-msg" id="streak-msg" style="display:none"></div>
<div class="card">
  <form id="af">
    <label>MODE</label>
    <div class="toggle-row">
      <label class="toggle active" data-type="virtual">VIRTUAL</label>
      <label class="toggle" data-type="real">REAL</label>
    </div>
    <input type="hidden" name="type" id="typeInput" value="virtual">
    <label>PLATFORM</label>
    <select name="platform" id="platformSel">${PLATFORMS.virtual.map(p => `<option value="${p.id}">${p.name} — ${p.game}</option>`).join("")}</select>
    <label>TEAM A</label>
    <input name="team_a" placeholder="e.g. Manchester" required>
    <label>TEAM B</label>
    <input name="team_b" placeholder="e.g. Liverpool" required>
    <label>TEAM A — LAST 5 (W/L/D)</label>
    <div class="qt-row" data-target="form_a">
      <button type="button" class="qt" data-v="W">W</button>
      <button type="button" class="qt" data-v="D">D</button>
      <button type="button" class="qt" data-v="L">L</button>
    </div>
    <input name="form_a" id="form_a" placeholder="W,L,D,W,W" required>
    <label>TEAM B — LAST 5 (W/L/D)</label>
    <div class="qt-row" data-target="form_b">
      <button type="button" class="qt" data-v="W">W</button>
      <button type="button" class="qt" data-v="D">D</button>
      <button type="button" class="qt" data-v="L">L</button>
    </div>
    <input name="form_b" id="form_b" placeholder="L,W,L,D,W" required>
    <div class="row">
      <div><label>TEAM A POS</label><input name="table_a" type="number" placeholder="3" required></div>
      <div><label>TEAM B POS</label><input name="table_b" type="number" placeholder="7" required></div>
    </div>
    <label class="optional-label">DESCRIBE THE GAME (HELPS THE ENGINE)</label>
    <textarea name="conversation" id="conv" rows="3" placeholder="e.g. Team A pressing high, Team B defensive..."></textarea>
    <button type="submit" class="btn">⚡ ANALYZE ⚡</button>
  </form>
</div>
<div id="result"></div>`,

  ask: `${nav("ask")}
<div class="head"><div class="logo">⚡ CORE ENGINE ⚡</div><div class="tag">PROPRIETARY ANALYSIS SYSTEM</div></div>
<div class="card glow">
  <h3 class="ct">INSTANT PICKS CORE</h3>
  <p class="muted">Ask about picks, patterns, strategy. Locked to betting analysis only.</p>
</div>
<div class="card">
  <label>YOUR QUESTION</label>
  <textarea id="aiQuestion" rows="4" placeholder="e.g. How should I manage my bankroll?"></textarea>
  <button class="btn" id="askBtn">⚡ ASK CORE ⚡</button>
</div>
<div id="aiResponse" class="card" style="display:none">
  <h3 class="ct">CORE RESPONSE</h3>
  <div id="aiModel" class="muted" style="font-size:10px;margin-bottom:10px"></div>
  <div id="aiText" class="txt"></div>
</div>`,

  dashboard: `${nav("dashboard")}
<div class="head"><div class="logo">⚡ DASHBOARD ⚡</div></div>
<div class="stats-grid">
  <div class="stat-card"><div class="stat-num" id="d-total">0</div><div class="stat-lbl">ALL TIME</div></div>
  <div class="stat-card"><div class="stat-num" id="d-wins">0</div><div class="stat-lbl">WINS</div></div>
  <div class="stat-card"><div class="stat-num" id="d-today">0</div><div class="stat-lbl">TODAY</div></div>
  <div class="stat-card highlight"><div class="stat-num" id="d-rate">0%</div><div class="stat-lbl">WIN RATE</div></div>
</div>
<div class="streak-msg" id="streak-msg" style="display:none"></div>
<div class="card">
  <a href="/analyze" class="btn">NEW ANALYSIS</a>
  <a href="/insights" class="btn" style="background:linear-gradient(135deg,#ffaa00,#ff8800);margin-top:10px">VIEW INSIGHTS</a>
</div>`,

  history: `${nav("history")}
<div class="head"><div class="logo">⚡ HISTORY ⚡</div></div>
<div class="card"><h3 class="ct">ALL PREDICTIONS</h3><div id="hist" class="muted">Loading...</div></div>`,

  patterns: `${nav("patterns")}
<div class="head"><div class="logo">⚡ PATTERNS ⚡</div></div>
<div class="card glow"><h3 class="ct">PATTERN ENGINE</h3><p class="muted">Patterns with <b class="hl">10+ samples</b> appear below.</p></div>
<div class="card"><h3 class="ct">DETECTED PATTERNS</h3><div id="patterns-list" class="muted">Log 10+ results to see patterns</div></div>`,

  insights: `${nav("insights")}
<div class="head"><div class="logo">⚡ INSIGHTS ⚡</div><div class="tag">SMART TIPS FOR YOU</div></div>
<div class="card glow">
  <h3 class="ct">PERSONAL INSIGHTS</h3>
  <p class="muted">Real-time advice based on your data, streaks, and patterns.</p>
</div>
<div id="insights-list">
  <div class="card muted">Analyzing your data...</div>
</div>
<div class="card">
  <a href="/analyze" class="btn">NEW ANALYSIS</a>
</div>`,

  learn: `${nav("learn")}
<div class="head"><div class="logo">⚡ LEARN ⚡</div></div>
<div class="card"><h3 class="ct">VALUE BETTING</h3><p class="txt">Find odds higher than true probability.</p></div>
<div class="card"><h3 class="ct">BANKROLL</h3><p class="txt">Never bet more than 2-5% per game.</p></div>
<div class="card"><h3 class="ct">STREAKS</h3><p class="txt">3+ losses = take a break. 3+ wins = stay disciplined.</p></div>`,

  about: `${nav("about")}
<div class="head"><div class="logo">⚡ ABOUT ⚡</div></div>
<div class="card glow"><h2 class="ct">MISSION</h2><p class="txt">Smarter, safer, more disciplined betting.</p></div>
<div class="card"><h3 class="ct">DISCLAIMER</h3><p class="txt">Betting carries risk. <b class="warn-text">Bet responsibly.</b></p></div>`,

  admin: `${nav("admin")}
<div class="head"><div class="logo">⚡ ADMIN ⚡</div></div>
<div class="card" id="login-card">
  <h3 class="ct">ACCESS REQUIRED</h3>
  <input type="password" id="pass" placeholder="Enter admin password" style="margin-top:15px">
  <button class="btn" onclick="adminLogin()">UNLOCK</button>
</div>
<div id="panel" style="display:none">
  <div class="card"><h3 class="ct">STATS</h3><div id="a-stats" class="muted">Loading...</div></div>
  <div class="card">
    <h3 class="ct">CORE ENGINE</h3>
    <div class="muted">Status: <b class="hl">ACTIVE</b></div>
    <div class="muted">Modules: <b class="hl">Pattern + Streak + Insights</b></div>
  </div>
</div>`
};

function layout(content, active) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>INSTANT PICKS</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--green:#00ff88;--dark-green:#00cc6a;--black:#0a0a0a;--card:#161616;--red:#ff3333;--gray:#888;--yellow:#ffaa00;--orange:#ff8800}
body{font-family:'Courier New',monospace;background:var(--black);color:#fff;min-height:100vh;overflow-x:hidden;-webkit-tap-highlight-color:transparent}
canvas#matrix{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;opacity:.15}
.lightning{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,255,136,.05);z-index:1;pointer-events:none;animation:flash 6s infinite}
@keyframes flash{0%,95%,100%{opacity:0}96%{opacity:1;background:rgba(0,255,136,.2)}97%{opacity:0}98%{opacity:.8;background:rgba(0,255,136,.1)}}
.scan{position:fixed;top:0;left:0;width:100%;height:2px;background:var(--green);box-shadow:0 0 10px var(--green);animation:scan 4s linear infinite;z-index:5;pointer-events:none}
@keyframes scan{0%{top:0}100%{top:100%}}
.c{position:relative;z-index:2;max-width:560px;margin:0 auto;padding:12px;padding-bottom:80px}
.nav{display:flex;gap:3px;margin-bottom:18px;flex-wrap:wrap;background:rgba(0,0,0,.7);padding:5px;border-radius:10px;border:1px solid rgba(0,255,136,.2);backdrop-filter:blur(10px);position:sticky;top:8px;z-index:10}
.nav a{flex:1;min-width:48px;text-align:center;padding:8px 3px;color:var(--gray);text-decoration:none;font-size:8px;font-weight:700;letter-spacing:1px;border-radius:5px;transition:.3s;display:flex;flex-direction:column;align-items:center;gap:2px}
.nav a .icon{width:16px;height:16px;display:block}
.nav a .icon svg{width:100%;height:100%;stroke:var(--gray);transition:.3s}
.nav a.active,.nav a:hover{background:rgba(0,255,136,.15);color:var(--green)}
.nav a.active .icon svg,.nav a:hover .icon svg{stroke:var(--green);filter:drop-shadow(0 0 5px var(--green))}
.nav a.admin-btn{background:rgba(255,51,51,.1)}
.nav a.admin-btn .icon svg{stroke:var(--red)}
.nav a.admin-btn.active{background:rgba(255,51,51,.3);color:var(--red)}
.head{text-align:center;padding:18px 0 12px;border-bottom:1px solid rgba(0,255,136,.2);margin-bottom:18px}
.logo{font-size:24px;font-weight:900;color:var(--green);text-shadow:0 0 20px var(--green);letter-spacing:2px;animation:glow 2s infinite alternate}
@keyframes glow{from{text-shadow:0 0 10px var(--green)}to{text-shadow:0 0 30px var(--green),0 0 50px var(--green)}}
.tag{color:var(--gray);font-size:9px;margin-top:5px;letter-spacing:2px}
.card{background:linear-gradient(135deg,rgba(0,255,136,.03),var(--card));border:1px solid rgba(0,255,136,.2);border-radius:12px;padding:16px;margin:10px 0;backdrop-filter:blur(10px);transition:.3s}
.card:hover{border-color:rgba(0,255,136,.3)}
.card.glow{box-shadow:0 0 30px rgba(0,255,136,.1);border-color:rgba(0,255,136,.4)}
.card.warn{border-color:rgba(255,51,51,.3);background:linear-gradient(135deg,rgba(255,51,51,.05),var(--card))}
.streak-msg{background:linear-gradient(135deg,rgba(255,170,0,.1),var(--card));border:1px solid var(--yellow);border-radius:10px;padding:12px;margin:10px 0;text-align:center;font-weight:700;color:var(--yellow);font-size:13px}
.ct{color:var(--green);margin-bottom:10px;font-size:14px;letter-spacing:1px}
.txt{color:#ccc;line-height:1.6;font-size:13px;white-space:pre-wrap}
.hl{color:var(--green);text-shadow:0 0 5px var(--green);text-decoration:none}
.warn-text{color:var(--red);text-shadow:0 0 5px var(--red)}
.muted{color:var(--gray);font-size:12px;line-height:1.6;margin:4px 0;display:flex;align-items:center;gap:6px}
.check-icon{width:14px;height:14px;display:inline-block;flex-shrink:0}
.check-icon svg{width:100%;height:100%;stroke:var(--green);filter:drop-shadow(0 0 3px var(--green))}
label{display:block;color:var(--green);font-size:10px;font-weight:700;margin:12px 0 5px;letter-spacing:2px}
.optional-label{color:var(--yellow);font-size:9px}
input,select,textarea{width:100%;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:8px;font-size:14px;font-family:inherit;transition:.3s}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--green);box-shadow:0 0 10px rgba(0,255,136,.3)}
textarea{resize:vertical;min-height:60px}
.row{display:flex;gap:8px;margin-top:5px}.row>div{flex:1}
.btn{width:100%;padding:14px;background:linear-gradient(135deg,var(--green),var(--dark-green));color:#000;font-weight:900;font-size:13px;border:none;border-radius:8px;margin-top:14px;cursor:pointer;text-transform:uppercase;letter-spacing:2px;font-family:inherit;box-shadow:0 0 20px rgba(0,255,136,.4);transition:.3s;text-decoration:none;display:inline-block;text-align:center}
.btn:hover{box-shadow:0 0 40px rgba(0,255,136,.7);transform:translateY(-1px)}
.btn:active{transform:scale(.98)}
.btn:disabled{opacity:.5;cursor:wait;transform:none}
.hero{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:12px 0}
.hero-stat{background:var(--card);border:1px solid rgba(0,255,136,.2);border-radius:10px;padding:10px;text-align:center}
.hero-stat .num{font-size:20px;font-weight:900;color:var(--green);text-shadow:0 0 10px var(--green)}
.hero-stat .lbl{font-size:8px;color:var(--gray);letter-spacing:2px;margin-top:3px}
.stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:10px 0}
.stat-card{background:var(--card);border:1px solid rgba(0,255,136,.2);border-radius:10px;padding:14px;text-align:center}
.stat-card.highlight{border-color:var(--green);box-shadow:0 0 20px rgba(0,255,136,.2)}
.stat-num{font-size:26px;font-weight:900;color:var(--green);text-shadow:0 0 10px var(--green)}
.stat-lbl{font-size:9px;color:var(--gray);letter-spacing:2px;margin-top:3px}
.toggle-row{display:flex;gap:5px;margin:6px 0}
.toggle{flex:1;text-align:center;padding:11px;background:rgba(0,0,0,.5);border:1px solid #333;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;letter-spacing:1px;color:var(--gray);transition:.3s}
.toggle.active{background:rgba(0,255,136,.15);border-color:var(--green);color:var(--green);box-shadow:0 0 10px rgba(0,255,136,.2)}
.qt-row{display:flex;gap:5px;margin:6px 0}
.qt{flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700;font-size:13px;transition:.2s}
.qt:hover,.qt:active{background:rgba(0,255,136,.2);border-color:var(--green)}
.tag2{display:inline-block;background:var(--green);color:#000;padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900;letter-spacing:1px}
.risk-low{background:#003300;color:var(--green);border:1px solid var(--green)}
.risk-medium{background:#332200;color:var(--yellow);border:1px solid var(--yellow)}
.risk-high{background:#330000;color:var(--red);border:1px solid var(--red)}
.name{font-size:16px;font-weight:800;margin:8px 0 4px}
.conf{font-size:34px;font-weight:900;color:var(--green);text-shadow:0 0 15px var(--green)}
.why{color:var(--gray);font-size:11px;margin:6px 0;line-height:1.5}
.btns{display:flex;gap:6px;margin-top:10px}
.btns form{flex:1;display:flex;gap:6px}
button.w,button.l{flex:1;padding:11px;border:none;border-radius:8px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;letter-spacing:1px;transition:.2s}
button.w{background:var(--green);color:#000;box-shadow:0 0 15px rgba(0,255,136,.5)}
button.w:hover{box-shadow:0 0 25px rgba(0,255,136,.8)}
button.l{background:#1a0000;color:var(--red);border:1px solid var(--red)}
button.l:hover{background:#220000}
.pattern-item{background:rgba(0,255,136,.05);border-left:3px solid var(--green);padding:10px;margin:6px 0;border-radius:6px}
.insight-item{padding:12px;margin:8px 0;border-radius:8px;font-size:12px;line-height:1.5}
.insight-good{background:rgba(0,255,136,.08);border-left:3px solid var(--green);color:#aaffcc}
.insight-warn{background:rgba(255,170,0,.08);border-left:3px solid var(--yellow);color:#ffd699}
.insight-info{background:rgba(0,170,255,.08);border-left:3px solid #00aaff;color:#99ddff}
</style></head><body>
<canvas id="matrix"></canvas>
<div class="lightning"></div>
<div class="scan"></div>
<div class="c">${content}</div>
<script>
const c=document.getElementById('matrix'),x=c.getContext('2d');
function rs(){c.width=window.innerWidth;c.height=window.innerHeight}
rs();window.addEventListener('resize',rs);
const ch='01アイウエオカキクケコサシスセソタチツテト<>{}[]/\\\\$#@!%&*+=';
const fs=14;let cols=Math.floor(c.width/fs);let drops=Array(cols).fill(1);
setInterval(()=>{x.fillStyle='rgba(0,0,0,0.05)';x.fillRect(0,0,c.width,c.height);
x.fillStyle='#00ff88';x.font=fs+'px monospace';
for(let i=0;i<drops.length;i++){const t=ch[Math.floor(Math.random()*ch.length)];
x.fillText(t,i*fs,drops[i]*fs);if(drops[i]*fs>c.height&&Math.random()>.975)drops[i]=0;drops[i]++}},33);
window.addEventListener('resize',()=>{cols=Math.floor(c.width/fs);drops=Array(cols).fill(1)});
</script>
<script>
document.querySelectorAll('.qt-row').forEach(row=>{
  const target=document.getElementById(row.dataset.target);
  row.querySelectorAll('.qt').forEach(b=>{
    b.addEventListener('click',()=>{
      const cur=target.value?target.value.split(','):[];
      if(cur.length>=5){alert('Max 5 results');return}
      cur.push(b.dataset.v);
      target.value=cur.join(',');
    });
  });
});
document.querySelectorAll('.toggle').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.toggle').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('typeInput').value=t.dataset.type;
    const sel=document.getElementById('platformSel');
    const platforms=${JSON.stringify(PLATFORMS)};
    sel.innerHTML=platforms[t.dataset.type].map(p=>'<option value="'+p.id+'">'+p.name+' — '+(p.game||p.country)+'</option>').join('');
  });
});
function showStreak(msg){const el=document.getElementById('streak-msg');if(el&&msg){el.textContent=msg;el.style.display='block';}else if(el){el.style.display='none';}}
async function loadStats(){
  try{
    const r=await fetch('/api/stats');const s=await r.json();
    const rate=s.total>0?Math.round(s.wins/s.total*1000)/10:0;
    const h=document.getElementById('h-total');if(h)h.textContent=s.total;
    const hr=document.getElementById('h-rate');if(hr)hr.textContent=rate+'%';
    const dt=document.getElementById('d-total');if(dt)dt.textContent=s.total;
    const dw=document.getElementById('d-wins');if(dw)dw.textContent=s.wins;
    const dt2=document.getElementById('d-today');if(dt2)dt2.textContent=s.todayTotal||0;
    const dr=document.getElementById('d-rate');if(dr)dr.textContent=rate+'%';
    if(s.total>0){
      const r2=await fetch('/api/predictions');const p=await r2.json();
      const recent=p.slice(0,10).filter(x=>x.status==='win'||x.status==='lose');
      let cur=0,type=recent[0]?recent[0].status:'none';
      for(const x of recent){if(x.status===type)cur++;else break;}
      const hs=document.getElementById('h-streak');if(hs)hs.textContent=cur+(type==='win'?'W':type==='lose'?'L':'');
      if(type==='lose'&&cur>=3)showStreak(cur+' losses in a row — take a break');
      else if(type==='win'&&cur>=3)showStreak(cur+' wins hot streak — stay disciplined');
    }
  }catch(e){}}
loadStats();
async function loadPatterns(){
  try{
    const r=await fetch('/api/patterns');const p=await r.json();
    const list=document.getElementById('patterns-list');
    if(!list)return;
    const rules=p.rules||{};
    const active=Object.entries(rules).filter(([k,v])=>v.total>=10).sort((a,b)=>b[1].confidence-a[1].confidence);
    if(!active.length){list.innerHTML='Log 10+ results to see patterns';return}
    list.innerHTML=active.slice(0,10).map(([key,r])=>{
      const readable=key.replace(/_/g,' ').replace(/\\d+/g,'').toUpperCase();
      return '<div class="pattern-item"><b class="hl">'+readable+'</b><br><span class="muted">'+r.hits+'/'+r.total+' = <b class="hl">'+r.confidence+'%</b></span></div>';
    }).join('');
  }catch(e){}}
loadPatterns();
async function loadHistory(){
  try{const r=await fetch('/api/predictions');const p=await r.json();
  const h=document.getElementById('hist');if(!h)return;
  if(!p.length){h.innerHTML='No predictions yet.';return}
  h.innerHTML=p.map(x=>'<div style="padding:10px;border-bottom:1px solid #222"><div style="display:flex;justify-content:space-between"><b class="hl">'+x.match+'</b><span style="color:var(--gray);font-size:9px">'+x.platform.toUpperCase()+'</span></div><div style="color:var(--gray);font-size:10px;margin-top:2px">'+new Date(x.time).toLocaleString()+'</div><div style="font-size:10px;margin-top:3px">'+(x.status==='win'?'<b class="hl">WIN</b>':x.status==='lose'?'<b class="warn-text">LOSE</b>':'<span class="muted">PENDING</span>')+'</div></div>').join('');
  }catch(e){}}
loadHistory();
async function loadInsights(){
  try{
    const r=await fetch('/api/insights');const d=await r.json();
    const list=document.getElementById('insights-list');
    if(!list)return;
    if(!d.insights.length){
      list.innerHTML='<div class="card muted">No insights yet — make some analyses to get personalized tips.</div>';
      return;
    }
    list.innerHTML=d.insights.map(i=>{
      const cls=i.type==='good'?'insight-good':i.type==='warn'?'insight-warn':'insight-info';
      return '<div class="insight-item '+cls+'">'+i.text+'</div>';
    }).join('');
  }catch(e){}}
loadInsights();
const af=document.getElementById('af');
if(af)af.addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=af.querySelector('button[type=submit]');
  const orig=btn.textContent;btn.disabled=true;btn.textContent='ANALYZING...';
  const fd=new FormData(af);
  try{
    const r=await fetch('/api/analyze',{method:'POST',body:fd});
    const d=await r.json();
    if(d.ok){
      if(d.streaks&&d.streaks.message)showStreak(d.streaks.message);else showStreak('');
      const res=document.getElementById('result');
      res.innerHTML='<div class="head"><div style="font-size:17px;font-weight:800">'+d.teamA+' <span class="hl">VS</span> '+d.teamB+'</div><div style="color:var(--gray);font-size:9px;letter-spacing:2px;margin-top:4px">'+d.platform.toUpperCase()+' • '+d.type.toUpperCase()+'</div></div>'+d.picks.map((p,i)=>'<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><span class="tag2">PICK #'+(i+1)+'</span><span class="risk-'+p.risk+'" style="padding:2px 8px;border-radius:15px;font-size:9px;font-weight:900">'+p.risk.toUpperCase()+'</span></div><div class="name">'+p.pick+'</div><div class="conf">'+p.conf+'%</div><div class="why">'+p.why+'</div><div class="btns"><form><input type="hidden" value="'+d.predId+'" name="pid"><input type="hidden" value="'+d.teamA+' vs '+d.teamB+'" name="m"><input type="hidden" value="'+p.pick+'" name="p"><button class="w" name="o" value="win">WIN</button><button class="l" name="o" value="lose">LOSE</button></form></div></div>').join('')+'<a href="/analyze" class="btn">NEW ANALYSIS</a>';
      res.scrollIntoView({behavior:'smooth'});
      res.querySelectorAll('form').forEach(f=>f.addEventListener('submit',async ev=>{
        ev.preventDefault();
        const fd=new FormData();
        fd.append('predId',f.querySelector('[name=pid]').value);
        fd.append('match',f.querySelector('[name=m]').value);
        fd.append('pick',f.querySelector('[name=p]').value);
        fd.append('outcome',ev.submitter.value);
        await fetch('/api/result',{method:'POST',body:fd});
        alert('Logged! Engines updated.');
        loadStats();loadHistory();loadPatterns();loadInsights();
      }));
    }
  }catch(e){alert('Error: '+e.message)}
  btn.disabled=false;btn.textContent=orig;
});
const askBtn=document.getElementById('askBtn');
if(askBtn)askBtn.addEventListener('click',async()=>{
  const q=document.getElementById('aiQuestion').value.trim();
  if(!q){alert('Please ask a question');return}
  askBtn.disabled=true;askBtn.textContent='THINKING...';
  const fd=new FormData();fd.append('question',q);
  try{
    const r=await fetch('/api/ask',{method:'POST',body:fd});
    const d=await r.json();
    const box=document.getElementById('aiResponse');
    const txt=document.getElementById('aiText');
    const mod=document.getElementById('aiModel');
    if(d.ok){
      txt.textContent=d.reply;
      mod.textContent='Core Engine v1.0';
      box.style.display='block';
      box.scrollIntoView({behavior:'smooth'});
    }else alert('Error: '+d.error);
  }catch(e){alert('Error: '+e.message)}
  askBtn.disabled=false;askBtn.textContent='⚡ ASK CORE ⚡';
});
async function adminLogin(){
  const p=document.getElementById('pass').value;
  const fd=new FormData();fd.append('password',p);
  const r=await fetch('/api/admin/login',{method:'POST',body:fd});
  const d=await r.json();
  if(d.ok){
    document.getElementById('login-card').style.display='none';
    document.getElementById('panel').style.display='block';
    const sr=await fetch('/api/stats');const ss=await sr.json();
    const rate=ss.total>0?Math.round(ss.wins/ss.total*1000)/10:0;
    document.getElementById('a-stats').innerHTML='<div style="margin:6px 0"><b class="hl">Total:</b> '+ss.total+'</div><div style="margin:6px 0"><b class="hl">Wins:</b> '+ss.wins+'</div><div style="margin:6px 0"><b class="hl">Today:</b> '+(ss.todayTotal||0)+'</div><div style="margin:6px 0"><b class="hl">Win Rate:</b> '+rate+'%</div>';
  }else alert('Wrong password');
}
</script>
</body></html>`;
}
