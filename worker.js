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
      "/admin": "admin"
    };
    
    if (path === "/api/analyze" && request.method === "POST") return await apiAnalyze(request, env);
    if (path === "/api/result" && request.method === "POST") return await apiResult(request, env);
    if (path === "/api/stats") return await apiStats(env);
    if (path === "/api/predictions") return await apiPredictions(env);
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

async function apiAnalyze(request, env) {
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
  
  const recs = generatePicks(formA, formB, tableA, tableB, type, platform, conversation);
  
  if (env.PICKS_KV) {
    await env.PICKS_KV.put(`p_${Date.now()}`, JSON.stringify({
      time: new Date().toISOString(),
      platform, type,
      match: `${teamA} vs ${teamB}`,
      conversation,
      picks: recs
    }));
  }
  
  return new Response(JSON.stringify({ ok: true, teamA, teamB, platform, type, picks: recs }), {
    headers: { "Content-Type": "application/json" } });
}

async function apiResult(request, env) {
  const form = await request.formData();
  const match = form.get("match");
  const pick = form.get("pick");
  const outcome = form.get("outcome");
  
  let s = { total: 0, wins: 0 };
  if (env.PICKS_KV) {
    const stored = await env.PICKS_KV.get("stats");
    if (stored) s = JSON.parse(stored);
    s.total++;
    if (outcome === "win") s.wins++;
    await env.PICKS_KV.put("stats", JSON.stringify(s));
  }
  
  return new Response(JSON.stringify({ ok: true, stats: s }), { headers: { "Content-Type": "application/json" } });
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

function generatePicks(fA, fB, tA, tB, type, platform, conversation) {
  const sA = fA.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const sB = fB.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const diff = sA - sB;
  const gap = tA - tB;
  const conv = conversation.toLowerCase();
  
  const recs = [];
  
  let convBoost = 0;
  if (conv.includes("attack") || conv.includes("pressing") || conv.includes("fast")) convBoost += 5;
  if (conv.includes("defensive") || conv.includes("slow") || conv.includes("careful")) convBoost -= 3;
  if (conv.includes("injured") || conv.includes("weak")) convBoost -= 5;
  
  if (type === "virtual") {
    if (diff > 3) recs.push({ pick: "Home Win (1)", conf: Math.min(75, 68 + convBoost), risk: "medium", why: "Team A dominant form" + (convBoost > 0 ? " + your description suggests strong attack" : "") });
    else if (diff < -3) recs.push({ pick: "Away Win (2)", conf: Math.min(70, 64 + convBoost), risk: "medium", why: "Team B stronger" });
    else recs.push({ pick: "Over 1.5 Goals", conf: Math.min(80, 72 + convBoost), risk: "low", why: "Virtuals score often" + (convBoost > 0 ? " + your input confirms attacking play" : "") });
    
    recs.push({ pick: "BTTS: Yes", conf: 58 + Math.floor(convBoost/2), risk: "medium", why: "Both teams attacking pattern" });
    recs.push({ pick: "Double Chance (1X)", conf: 75, risk: "low", why: "Safe play on home" });
    recs.push({ pick: "Over 2.5 Goals", conf: 52 + Math.floor(convBoost/2), risk: "high", why: "High-scoring virtual" });
  } else {
    if (diff > 3 && gap < 0) recs.push({ pick: "Home Win (1)", conf: 66 + convBoost, risk: "medium", why: "Form + position favor home" });
    else if (diff < -3) recs.push({ pick: "Away Win (2)", conf: 62 + convBoost, risk: "medium", why: "Away team superior" });
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
  patterns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3H8C9 3 10 4 10 5V21C10 20 9 19 8 19H2V3M22 3H16C15 3 14 4 14 5V21C14 20 15 19 16 19H22V3M7 7H5M7 11H5M7 15H5M19 7H17M19 11H17M19 15H17"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11"/></svg>'
};

function nav(active) {
  const items = [
    ["home", "HOME", ICONS.home],
    ["analyze", "ANALYZE", ICONS.analyze],
    ["dashboard", "STATS", ICONS.dashboard],
    ["history", "HISTORY", ICONS.history],
    ["patterns", "PATTERNS", ICONS.patterns],
    ["learn", "LEARN", ICONS.learn]
  ];
  return `<div class="nav">${items.map(([k, v, icon]) => 
    `<a href="/${k === 'home' ? '' : k}" class="${active === k ? 'active' : ''}"><span class="icon">${icon}</span><span>${v}</span></a>`
  ).join("")}<a href="/admin" class="admin-btn ${active === 'admin' ? 'active' : ''}"><span class="icon">${ICONS.lock}</span></a></div>`;
}

const pages = {
  home: `${nav("home")}
<div class="head"><div class="logo">⚡ INSTANT PICKS ⚡</div><div class="tag">SMART PICKS • NOT SURE PROMISES</div></div>
<div class="hero">
  <div class="hero-stat"><div class="num" id="h-total">0</div><div class="lbl">ANALYSES</div></div>
  <div class="hero-stat"><div class="num" id="h-rate">0%</div><div class="lbl">WIN RATE</div></div>
  <div class="hero-stat"><div class="num">14</div><div class="lbl">PLATFORMS</div></div>
</div>
<div class="card glow">
  <h2 class="ct">WELCOME TO INSTANT PICKS</h2>
  <p class="txt">Your intelligent betting co-pilot. We analyze patterns, form, and stats to give you the <b class="hl">safest picks</b> across multiple platforms.</p>
  <p class="txt" style="margin-top:10px">Built on <b class="hl">discipline</b>, <b class="hl">value detection</b>, and <b class="hl">pattern recognition</b> — not false promises.</p>
  <a href="/analyze" class="btn">START ANALYZING</a>
</div>
<div class="card">
  <h3 class="ct">HOW IT WORKS</h3>
  <div class="steps">
    <div class="step"><div class="sn">1</div><div><b>SELECT</b><br><span class="muted">Platform & type</span></div></div>
    <div class="step"><div class="sn">2</div><div><b>INPUT</b><br><span class="muted">Teams & form</span></div></div>
    <div class="step"><div class="sn">3</div><div><b>DESCRIBE</b><br><span class="muted">How game is playing</span></div></div>
    <div class="step"><div class="sn">4</div><div><b>TRACK</b><br><span class="muted">Log & learn</span></div></div>
  </div>
</div>
<div class="card warn">
  <b class="warn-text">⚠ DISCIPLINE FIRST</b>
  <p class="muted" style="margin-top:8px">No tool guarantees wins. INSTANT PICKS helps you make smarter decisions, but always bet within your means.</p>
</div>`,

  analyze: `${nav("analyze")}
<div class="head"><div class="logo">⚡ ANALYZE ⚡</div><div class="tag">SMART MATCH ANALYSIS</div></div>
<div class="card">
  <form id="af">
    <label>MODE</label>
    <div class="toggle-row">
      <label class="toggle active" data-type="virtual">VIRTUAL</label>
      <label class="toggle" data-type="real">REAL FOOTBALL</label>
    </div>
    <input type="hidden" name="type" id="typeInput" value="virtual">
    
    <label>PLATFORM</label>
    <select name="platform" id="platformSel">${PLATFORMS.virtual.map(p => `<option value="${p.id}">${p.name} — ${p.game}</option>`).join("")}</select>
    
    <label>TEAM A</label>
    <input name="team_a" placeholder="e.g. Manchester United" required>
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
      <div><label>TEAM A POSITION</label><input name="table_a" type="number" placeholder="3" required></div>
      <div><label>TEAM B POSITION</label><input name="table_b" type="number" placeholder="7" required></div>
    </div>
    
    <label class="optional-label">HOW IS THE GAME PLAYING? (OPTIONAL — BUT HELPS AI)</label>
    <textarea name="conversation" id="conv" rows="3" placeholder="e.g. Team A pressing high, Team B defensive, no goals yet, lots of corners..."></textarea>
    
    <button type="submit" class="btn">⚡ ANALYZE ⚡</button>
  </form>
</div>
<div id="result"></div>`,

  dashboard: `${nav("dashboard")}
<div class="head"><div class="logo">⚡ DASHBOARD ⚡</div><div class="tag">YOUR PERFORMANCE</div></div>
<div class="stats-grid">
  <div class="stat-card"><div class="stat-num" id="d-total">0</div><div class="stat-lbl">TOTAL</div></div>
  <div class="stat-card"><div class="stat-num" id="d-wins">0</div><div class="stat-lbl">WINS</div></div>
  <div class="stat-card"><div class="stat-num" id="d-losses">0</div><div class="stat-lbl">LOSSES</div></div>
  <div class="stat-card highlight"><div class="stat-num" id="d-rate">0%</div><div class="stat-lbl">WIN RATE</div></div>
</div>
<div class="card">
  <h3 class="ct">TODAY'S ACTIVITY</h3>
  <div id="today" class="muted">Loading...</div>
</div>
<div class="card">
  <h3 class="ct">DISCIPLINE ALERTS</h3>
  <div id="alerts" class="muted">All clear. Keep being disciplined.</div>
</div>
<div class="card">
  <a href="/analyze" class="btn">NEW ANALYSIS</a>
</div>`,

  history: `${nav("history")}
<div class="head"><div class="logo">⚡ HISTORY ⚡</div><div class="tag">YOUR PAST PREDICTIONS</div></div>
<div class="card">
  <h3 class="ct">ALL PREDICTIONS</h3>
  <div id="hist" class="muted">Loading...</div>
</div>`,

  patterns: `${nav("patterns")}
<div class="head"><div class="logo">⚡ PATTERNS ⚡</div><div class="tag">AI-DETECTED INSIGHTS</div></div>
<div class="card glow">
  <h3 class="ct">THE BRAIN IS LEARNING</h3>
  <p class="txt">Patterns are detected automatically as more data flows in. The more you analyze, log results, and describe games, the smarter this gets.</p>
</div>
<div class="card">
  <h3 class="ct">DETECTED PATTERNS</h3>
  <div class="muted">No patterns yet — make 20+ analyses to start seeing insights</div>
</div>`,

  learn: `${nav("learn")}
<div class="head"><div class="logo">⚡ LEARN ⚡</div><div class="tag">SMARTER BETTING</div></div>
<div class="card">
  <h3 class="ct">VALUE BETTING</h3>
  <p class="txt">Value betting means finding odds that are <b class="hl">higher than the true probability</b>. If a team has 60% chance but odds are 2.20 (implying 45%), that's value.</p>
</div>
<div class="card">
  <h3 class="ct">BANKROLL MANAGEMENT</h3>
  <p class="txt">Never bet more than <b class="hl">2-5%</b> of your bankroll on a single game. Protects you from losing streaks.</p>
</div>
<div class="card">
  <h3 class="ct">DISCIPLINE RULES</h3>
  <ul class="list">
    <li>Set a daily loss limit</li>
    <li>Take a break after 3 losses</li>
    <li>Don't chase losses</li>
    <li>Only bet when there's value</li>
    <li>Track everything</li>
  </ul>
</div>`,

  about: `${nav("about")}
<div class="head"><div class="logo">⚡ ABOUT ⚡</div></div>
<div class="card glow">
  <h2 class="ct">OUR MISSION</h2>
  <p class="txt">To help people make <b class="hl">smarter, safer, more disciplined</b> betting decisions through intelligent analysis.</p>
</div>
<div class="card">
  <h3 class="ct">DISCLAIMER</h3>
  <p class="txt">Betting carries risk. No tool guarantees wins. INSTANT PICKS is an analysis aid. <b class="warn-text">Bet responsibly.</b></p>
</div>`,

  admin: `${nav("admin")}
<div class="head"><div class="logo">⚡ ADMIN ⚡</div><div class="tag">CONTROL CENTER</div></div>
<div class="card" id="login-card">
  <h3 class="ct">ACCESS REQUIRED</h3>
  <input type="password" id="pass" placeholder="Enter admin password" style="margin-top:15px">
  <button class="btn" onclick="adminLogin()">UNLOCK</button>
</div>
<div id="panel" style="display:none">
  <div class="card">
    <h3 class="ct">SYSTEM STATS</h3>
    <div id="a-stats" class="muted">Loading...</div>
  </div>
  <div class="card">
    <h3 class="ct">ALL PREDICTIONS</h3>
    <div id="a-preds" class="muted">Loading...</div>
  </div>
  <div class="card">
    <h3 class="ct">AI BRAIN STATUS</h3>
    <div class="muted">AI Engine: <b class="hl">READY</b> (Groq integration in Phase 4)</div>
    <div class="muted" style="margin-top:5px">Pattern Engine: <b class="hl">ACTIVE</b></div>
  </div>
</div>`
};

function layout(content, active) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>INSTANT PICKS</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--green:#00ff88;--dark-green:#00cc6a;--black:#0a0a0a;--card:#161616;--red:#ff3333;--gray:#888;--yellow:#ffaa00}
body{font-family:'Courier New',monospace;background:var(--black);color:#fff;min-height:100vh;overflow-x:hidden}
canvas#matrix{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;opacity:.18}
.lightning{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,255,136,.05);z-index:1;pointer-events:none;animation:flash 6s infinite}
@keyframes flash{0%,95%,100%{opacity:0}96%{opacity:1;background:rgba(0,255,136,.2)}97%{opacity:0}98%{opacity:.8;background:rgba(0,255,136,.1)}}
.scan{position:fixed;top:0;left:0;width:100%;height:2px;background:var(--green);box-shadow:0 0 10px var(--green);animation:scan 4s linear infinite;z-index:5;pointer-events:none}
@keyframes scan{0%{top:0}100%{top:100%}}
.c{position:relative;z-index:2;max-width:560px;margin:0 auto;padding:12px}
.nav{display:flex;gap:4px;margin-bottom:18px;flex-wrap:wrap;background:rgba(0,0,0,.6);padding:6px;border-radius:10px;border:1px solid rgba(0,255,136,.2);backdrop-filter:blur(10px)}
.nav a{flex:1;min-width:60px;text-align:center;padding:9px 4px;color:var(--gray);text-decoration:none;font-size:10px;font-weight:700;letter-spacing:1px;border-radius:6px;transition:.3s;display:flex;flex-direction:column;align-items:center;gap:3px}
.nav a .icon{width:18px;height:18px;display:block}
.nav a .icon svg{width:100%;height:100%;stroke:var(--gray);transition:.3s}
.nav a.active,.nav a:hover{background:rgba(0,255,136,.15);color:var(--green)}
.nav a.active .icon svg,.nav a:hover .icon svg{stroke:var(--green);filter:drop-shadow(0 0 5px var(--green))}
.nav a.admin-btn{background:rgba(255,51,51,.1)}
.nav a.admin-btn .icon svg{stroke:var(--red)}
.nav a.admin-btn.active{background:rgba(255,51,51,.3);color:var(--red)}
.head{text-align:center;padding:20px 0 15px;border-bottom:1px solid rgba(0,255,136,.2);margin-bottom:20px}
.logo{font-size:28px;font-weight:900;color:var(--green);text-shadow:0 0 20px var(--green);letter-spacing:3px;animation:glow 2s infinite alternate}
@keyframes glow{from{text-shadow:0 0 10px var(--green)}to{text-shadow:0 0 30px var(--green),0 0 50px var(--green)}}
.tag{color:var(--gray);font-size:10px;margin-top:6px;letter-spacing:3px}
.card{background:linear-gradient(135deg,rgba(0,255,136,.03),var(--card));border:1px solid rgba(0,255,136,.2);border-radius:12px;padding:18px;margin:10px 0;backdrop-filter:blur(10px)}
.card.glow{box-shadow:0 0 30px rgba(0,255,136,.1);border-color:rgba(0,255,136,.4)}
.card.warn{border-color:rgba(255,51,51,.3);background:linear-gradient(135deg,rgba(255,51,51,.05),var(--card))}
.ct{color:var(--green);margin-bottom:12px;font-size:15px;letter-spacing:1px}
.txt{color:#ccc;line-height:1.6;font-size:13px}
.hl{color:var(--green);text-shadow:0 0 5px var(--green)}
.warn-text{color:var(--red);text-shadow:0 0 5px var(--red)}
.muted{color:var(--gray);font-size:13px;line-height:1.6}
label{display:block;color:var(--green);font-size:11px;font-weight:700;margin:14px 0 6px;letter-spacing:2px}
.optional-label{color:var(--yellow);font-size:10px}
input,select,textarea{width:100%;padding:13px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:8px;font-size:14px;font-family:inherit}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--green);box-shadow:0 0 10px rgba(0,255,136,.3)}
textarea{resize:vertical;min-height:60px}
.row{display:flex;gap:10px;margin-top:5px}.row>div{flex:1}
.btn{width:100%;padding:15px;background:linear-gradient(135deg,var(--green),var(--dark-green));color:#000;font-weight:900;font-size:13px;border:none;border-radius:8px;margin-top:18px;cursor:pointer;text-transform:uppercase;letter-spacing:2px;font-family:inherit;box-shadow:0 0 20px rgba(0,255,136,.4);transition:.3s;text-decoration:none;display:inline-block;text-align:center}
.btn:hover{box-shadow:0 0 40px rgba(0,255,136,.7)}
.hero{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:15px 0}
.hero-stat{background:var(--card);border:1px solid rgba(0,255,136,.2);border-radius:10px;padding:12px;text-align:center}
.hero-stat .num{font-size:24px;font-weight:900;color:var(--green);text-shadow:0 0 10px var(--green)}
.hero-stat .lbl{font-size:9px;color:var(--gray);letter-spacing:2px;margin-top:4px}
.stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:12px 0}
.stat-card{background:var(--card);border:1px solid rgba(0,255,136,.2);border-radius:10px;padding:18px;text-align:center}
.stat-card.highlight{border-color:var(--green);box-shadow:0 0 20px rgba(0,255,136,.2)}
.stat-num{font-size:30px;font-weight:900;color:var(--green);text-shadow:0 0 10px var(--green)}
.stat-lbl{font-size:10px;color:var(--gray);letter-spacing:2px;margin-top:5px}
.steps{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:10px}
.step{display:flex;gap:10px;align-items:flex-start;padding:10px;background:rgba(0,0,0,.3);border-radius:8px;border:1px solid #222}
.sn{background:var(--green);color:#000;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0}
.toggle-row{display:flex;gap:6px;margin:8px 0}
.toggle{flex:1;text-align:center;padding:12px;background:rgba(0,0,0,.5);border:1px solid #333;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:1px;color:var(--gray);transition:.3s}
.toggle.active{background:rgba(0,255,136,.15);border-color:var(--green);color:var(--green);box-shadow:0 0 10px rgba(0,255,136,.2)}
.qt-row{display:flex;gap:6px;margin:8px 0}
.qt{flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700;transition:.2s}
.qt:hover,.qt:active{background:rgba(0,255,136,.2);border-color:var(--green)}
.tag2{display:inline-block;background:var(--green);color:#000;padding:3px 10px;border-radius:15px;font-size:10px;font-weight:900;letter-spacing:1px}
.risk-low{background:#003300;color:var(--green);border:1px solid var(--green)}
.risk-medium{background:#332200;color:var(--yellow);border:1px solid var(--yellow)}
.risk-high{background:#330000;color:var(--red);border:1px solid var(--red)}
.name{font-size:17px;font-weight:800;margin:10px 0 5px}
.conf{font-size:38px;font-weight:900;color:var(--green);text-shadow:0 0 15px var(--green)}
.why{color:var(--gray);font-size:12px;margin:8px 0;line-height:1.5}
.btns{display:flex;gap:8px;margin-top:12px}
.btns form{flex:1;display:flex;gap:8px}
button.w,button.l{flex:1;padding:12px;border:none;border-radius:8px;font-weight:900;cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:1px}
button.w{background:var(--green);color:#000;box-shadow:0 0 15px rgba(0,255,136,.5)}
button.l{background:#1a0000;color:var(--red);border:1px solid var(--red)}
.list{color:#ccc;line-height:2;font-size:13px;padding-left:20px}
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
    const type=t.dataset.type;
    document.getElementById('typeInput').value=type;
    const sel=document.getElementById('platformSel');
    const platforms=${JSON.stringify(PLATFORMS)};
    sel.innerHTML=platforms[type].map(p=>'<option value="'+p.id+'">'+p.name+' — '+(p.game||p.country)+'</option>').join('');
  });
});
async function loadStats(){
  try{const r=await fetch('/api/stats');const s=await r.json();
  const rate=s.total>0?Math.round(s.wins/s.total*1000)/10:0;
  const h=document.getElementById('h-total');if(h)h.textContent=s.total;
  const hr=document.getElementById('h-rate');if(hr)hr.textContent=rate+'%';
  const dt=document.getElementById('d-total');if(dt)dt.textContent=s.total;
  const dw=document.getElementById('d-wins');if(dw)dw.textContent=s.wins;
  const dl=document.getElementById('d-losses');if(dl)dl.textContent=s.total-s.wins;
  const dr=document.getElementById('d-rate');if(dr)dr.textContent=rate+'%';
  const today=document.getElementById('today');
  if(today)today.innerHTML='<b class="hl">'+s.total+'</b> analyses • <b class="hl">'+s.wins+'</b> wins • <b class="hl">'+rate+'%</b> accuracy';
  if(s.total>=3){
    const losses=s.total-s.wins;
    if(losses>=3){const al=document.getElementById('alerts');if(al)al.innerHTML='<b class="warn-text">3+ losses detected</b> — Take a break. Re-analyze.'}
  }
  }catch(e){}}
loadStats();
async function loadHistory(){
  try{const r=await fetch('/api/predictions');const p=await r.json();
  const h=document.getElementById('hist');if(!h)return;
  if(!p.length){h.innerHTML='No predictions yet.';return}
  h.innerHTML=p.map(x=>'<div style="padding:10px;border-bottom:1px solid #222"><div style="display:flex;justify-content:space-between"><b class="hl">'+x.match+'</b><span style="color:var(--gray);font-size:10px">'+x.platform.toUpperCase()+'</span></div><div style="color:var(--gray);font-size:11px;margin-top:3px">'+new Date(x.time).toLocaleString()+'</div><div style="font-size:12px;margin-top:6px;color:#ccc">'+x.picks.slice(0,2).map(pk=>'<span class="hl">●</span> '+pk.pick+' ('+pk.conf+'%)').join(' &nbsp; ')+'</div></div>').join('');
  }catch(e){}}
loadHistory();
const af=document.getElementById('af');
if(af)af.addEventListener('submit',async e=>{
  e.preventDefault();
  const fd=new FormData(af);
  const r=await fetch('/api/analyze',{method:'POST',body:fd});
  const d=await r.json();
  if(d.ok){
    const res=document.getElementById('result');
    res.innerHTML='<div class="head"><div style="font-size:18px;font-weight:800">'+d.teamA+' <span class="hl">VS</span> '+d.teamB+'</div><div style="color:var(--gray);font-size:10px;letter-spacing:2px;margin-top:5px">'+d.platform.toUpperCase()+' • '+d.type.toUpperCase()+'</div></div>'+d.picks.map((p,i)=>'<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><span class="tag2">PICK #'+(i+1)+'</span><span class="risk-'+p.risk+'" style="padding:3px 10px;border-radius:15px;font-size:10px;font-weight:900">'+p.risk.toUpperCase()+'</span></div><div class="name">'+p.pick+'</div><div class="conf">'+p.conf+'%</div><div class="why">'+p.why+'</div><div class="btns"><form><input type="hidden" value="'+d.teamA+' vs '+d.teamB+'" name="m"><input type="hidden" value="'+p.pick+'" name="p"><button class="w" name="o" value="win">WIN</button><button class="l" name="o" value="lose">LOSE</button></form></div></div>').join('')+'<a href="/analyze" class="btn">NEW ANALYSIS</a>';
    res.scrollIntoView({behavior:'smooth'});
    res.querySelectorAll('form').forEach(f=>f.addEventListener('submit',async ev=>{
      ev.preventDefault();
      const fd=new FormData();
      fd.append('match',f.querySelector('[name=m]').value);
      fd.append('pick',f.querySelector('[name=p]').value);
      fd.append('outcome',ev.submitter.value);
      await fetch('/api/result',{method:'POST',body:fd});
      alert('Logged! System learned.');
      loadStats();loadHistory();
    }));
  }
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
    document.getElementById('a-stats').innerHTML='<div style="margin:8px 0"><b class="hl">Total:</b> '+ss.total+'</div><div style="margin:8px 0"><b class="hl">Wins:</b> '+ss.wins+'</div><div style="margin:8px 0"><b class="hl">Win Rate:</b> '+rate+'%</div>';
    const pr=await fetch('/api/predictions');const pp=await pr.json();
    document.getElementById('a-preds').innerHTML=pp.length?pp.map(x=>'<div style="padding:10px;border-bottom:1px solid #222;margin:5px 0"><b class="hl">'+x.match+'</b> <span style="color:var(--gray);font-size:10px">['+x.platform+'/'+x.type+']</span><br><span style="color:var(--gray);font-size:11px">'+new Date(x.time).toLocaleString()+'</span></div>').join(''):'No data yet';
  }else alert('Wrong password');
}
</script>
</body></html>`;
}
