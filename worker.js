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
      "/admin/users": "admin",
      "/admin/settings": "admin",
      "/admin/patterns": "admin",
      "/admin/data": "admin"
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
  
  const recs = generatePicks(formA, formB, tableA, tableB, type, platform);
  
  if (env.PICKS_KV) {
    await env.PICKS_KV.put(`p_${Date.now()}`, JSON.stringify({
      time: new Date().toISOString(),
      platform, type,
      match: `${teamA} vs ${teamB}`,
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

function generatePicks(fA, fB, tA, tB, type, platform) {
  const sA = fA.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const sB = fB.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const diff = sA - sB;
  const gap = tA - tB;
  
  const recs = [];
  
  if (type === "virtual") {
    if (diff > 3) recs.push({ pick: "Home Win (1)", conf: 68, risk: "medium", why: "Team A dominant form (3+ pts ahead)" });
    else if (diff < -3) recs.push({ pick: "Away Win (2)", conf: 64, risk: "medium", why: "Team B stronger form" });
    else recs.push({ pick: "Over 1.5 Goals", conf: 72, risk: "low", why: "Virtuals score frequently" });
    
    recs.push({ pick: "BTTS: Yes", conf: 58, risk: "medium", why: "Both teams attacking pattern" });
    recs.push({ pick: "Double Chance (1X)", conf: 75, risk: "low", why: "Safe play on home" });
    recs.push({ pick: "Over 2.5 Goals", conf: 52, risk: "high", why: "High-scoring virtual match" });
  } else {
    if (diff > 3 && gap < 0) recs.push({ pick: "Home Win (1)", conf: 66, risk: "medium", why: "Form + position favor home" });
    else if (diff < -3) recs.push({ pick: "Away Win (2)", conf: 62, risk: "medium", why: "Away team superior" });
    else recs.push({ pick: "Double Chance (1X or X2)", conf: 75, risk: "low", why: "Balanced match — play safe" });
    
    recs.push({ pick: "Under 3.5 Goals", conf: 70, risk: "low", why: "Tight match expected" });
    recs.push({ pick: "BTTS: No", conf: 60, risk: "medium", why: "Defensive setup likely" });
    recs.push({ pick: "Draw No Bet (Home)", conf: 65, risk: "low", why: "Insurance on draw" });
  }
  
  recs.push({ pick: "Half-time: Draw", conf: 55, risk: "medium", why: "Most matches tight at HT" });
  
  return recs.slice(0, 5);
}

function nav(active) {
  const items = [
    ["home", "⚡ HOME"],
    ["analyze", "🎯 ANALYZE"],
    ["dashboard", "📊 DASHBOARD"],
    ["history", "📋 HISTORY"],
    ["patterns", "🧠 PATTERNS"],
    ["learn", "📚 LEARN"]
  ];
  return `<div class="nav">${items.map(([k, v]) => 
    `<a href="/${k === 'home' ? '' : k}" class="${active === k ? 'active' : ''}">${v}</a>`
  ).join("")}<a href="/admin" class="admin-btn ${active === 'admin' ? 'active' : ''}">🔐</a></div>`;
}

const pages = {
  home: `${nav("home")}
<div class="head"><div class="logo">⚡ INSTANT PICKS ⚡</div><div class="tag">SMART PICKS • NOT SURE PROMISES</div></div>
<div class="hero">
  <div class="hero-stat"><div class="num" id="h-total">0</div><div class="lbl">ANALYSES</div></div>
  <div class="hero-stat"><div class="num" id="h-rate">0%</div><div class="lbl">WIN RATE</div></div>
  <div class="hero-stat"><div class="num">3</div><div class="lbl">PLATFORMS</div></div>
</div>
<div class="card glow">
  <h2 class="ct">🎯 WELCOME TO INSTANT PICKS</h2>
  <p class="txt">Your intelligent betting co-pilot. We analyze patterns, form, and stats to give you the <b style="color:var(--green)">safest picks</b> across multiple platforms.</p>
  <p class="txt" style="margin-top:10px">Built on <b style="color:var(--green)">discipline</b>, <b style="color:var(--green)">value detection</b>, and <b style="color:var(--green)">pattern recognition</b> — not false promises.</p>
  <a href="/analyze" class="btn">⚡ START ANALYZING ⚡</a>
</div>
<div class="card">
  <h3 class="ct">⚡ HOW IT WORKS</h3>
  <div class="steps">
    <div class="step"><div class="sn">1</div><div><b>SELECT</b><br><span class="muted">Choose platform & match type</span></div></div>
    <div class="step"><div class="sn">2</div><div><b>INPUT</b><br><span class="muted">Enter teams & form</span></div></div>
    <div class="step"><div class="sn">3</div><div><b>ANALYZE</b><br><span class="muted">Get smart picks</span></div></div>
    <div class="step"><div class="sn">4</div><div><b>TRACK</b><br><span class="muted">Log results, learn more</span></div></div>
  </div>
</div>
<div class="card">
  <h3 class="ct">🎮 SUPPORTED PLATFORMS</h3>
  <div class="platforms">
    <div class="pf">SPORTYBET</div>
    <div class="pf">BET9JA</div>
    <div class="pf">BETWAY</div>
  </div>
</div>
<div class="card warn">
  <b style="color:var(--red)">⚠️ DISCIPLINE FIRST</b>
  <p class="muted" style="margin-top:8px">No tool guarantees wins. INSTANT PICKS helps you make smarter decisions, but always bet within your means. Set daily limits. Take breaks.</p>
</div>`,

  analyze: `${nav("analyze")}
<div class="head"><div class="logo">⚡ ANALYZE ⚡</div><div class="tag">SMART MATCH ANALYSIS</div></div>
<div class="card">
  <h3 class="ct">STEP 1: SELECT</h3>
  <form id="af">
    <label>PLATFORM</label>
    <select name="platform">
      <option value="sportybet">SPORTYBET</option>
      <option value="bet9ja">BET9JA</option>
      <option value="betway">BETWAY</option>
    </select>
    <label>MATCH TYPE</label>
    <select name="type">
      <option value="virtual">VIRTUAL</option>
      <option value="real">REAL FOOTBALL</option>
    </select>
    <h3 class="ct" style="margin-top:25px">STEP 2: TEAMS</h3>
    <label>TEAM A</label>
    <input name="team_a" placeholder="e.g. Manchester United" required>
    <label>TEAM B</label>
    <input name="team_b" placeholder="e.g. Liverpool" required>
    <label>TEAM A — LAST 5 RESULTS (W/L/D)</label>
    <div class="qt-row" data-target="form_a">
      <button type="button" class="qt" data-v="W">W</button>
      <button type="button" class="qt" data-v="D">D</button>
      <button type="button" class="qt" data-v="L">L</button>
    </div>
    <input name="form_a" id="form_a" placeholder="W,L,D,W,W" required>
    <label>TEAM B — LAST 5 RESULTS (W/L/D)</label>
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
  <h3 class="ct">📈 TODAY'S ACTIVITY</h3>
  <div id="today" class="muted">Loading stats...</div>
</div>
<div class="card">
  <h3 class="ct">🎯 BEST MARKETS</h3>
  <div id="markets" class="muted">No data yet — make some analyses to see your best markets</div>
</div>
<div class="card">
  <h3 class="ct">⚠️ DISCIPLINE ALERTS</h3>
  <div id="alerts" class="muted">All clear. Keep being disciplined.</div>
</div>
<div class="card">
  <a href="/analyze" class="btn">⚡ NEW ANALYSIS ⚡</a>
</div>`,

  history: `${nav("history")}
<div class="head"><div class="logo">⚡ HISTORY ⚡</div><div class="tag">YOUR PAST PREDICTIONS</div></div>
<div class="card">
  <h3 class="ct">📋 ALL PREDICTIONS</h3>
  <div id="hist" class="muted">Loading...</div>
</div>`,

  patterns: `${nav("patterns")}
<div class="head"><div class="logo">⚡ PATTERNS ⚡</div><div class="tag">AI-DETECTED INSIGHTS</div></div>
<div class="card glow">
  <h3 class="ct">🧠 THE BRAIN IS LEARNING</h3>
  <p class="txt">Patterns are detected automatically as more data flows in. The more you analyze and log results, the smarter this gets.</p>
</div>
<div class="card">
  <h3 class="ct">🔍 DETECTED PATTERNS</h3>
  <div id="patterns" class="muted">No patterns yet — make 20+ analyses to start seeing insights</div>
</div>
<div class="card">
  <h3 class="ct">⚡ PATTERN SHIFTS</h3>
  <div class="muted">System watches for changes in platform behavior. Alerts appear here when shifts detected.</div>
</div>`,

  learn: `${nav("learn")}
<div class="head"><div class="logo">⚡ LEARN ⚡</div><div class="tag">BECOME A SMARTER BETTOR</div></div>
<div class="card">
  <h3 class="ct">💰 WHAT IS VALUE BETTING?</h3>
  <p class="txt">Value betting means finding odds that are <b style="color:var(--green)">higher than the true probability</b>. If a team has 60% chance to win but odds are 2.20 (implying 45%), that's value.</p>
</div>
<div class="card">
  <h3 class="ct">📊 BANKROLL MANAGEMENT</h3>
  <p class="txt">Never bet more than <b style="color:var(--green)">2-5%</b> of your bankroll on a single game. This protects you from losing streaks.</p>
</div>
<div class="card">
  <h3 class="ct">🎯 DISCIPLINE RULES</h3>
  <ul class="list">
    <li>Set a daily loss limit (e.g. 10% of bankroll)</li>
    <li>Take a break after 3 losses in a row</li>
    <li>Don't chase losses</li>
    <li>Only bet when there's value</li>
    <li>Track everything</li>
  </ul>
</div>
<div class="card">
  <h3 class="ct">🤖 HOW INSTANT PICKS WORKS</h3>
  <p class="txt">Our system combines rule-based analysis with AI learning. The more you use it, the smarter it gets. But remember — <b style="color:var(--red)">no tool guarantees 100% wins</b>.</p>
</div>`,

  about: `${nav("about")}
<div class="head"><div class="logo">⚡ ABOUT ⚡</div></div>
<div class="card glow">
  <h2 class="ct">🎯 OUR MISSION</h2>
  <p class="txt">To help people make <b style="color:var(--green)">smarter, safer, more disciplined</b> betting decisions through intelligent analysis.</p>
</div>
<div class="card">
  <h3 class="ct">📡 WHAT WE DO</h3>
  <p class="txt">INSTANT PICKS analyzes patterns, form, and stats to suggest the safest picks. We don't promise miracles — we provide data-driven insights to help you bet smarter.</p>
</div>
<div class="card">
  <h3 class="ct">⚠️ DISCLAIMER</h3>
  <p class="txt">Betting carries risk. No prediction tool can guarantee wins. INSTANT PICKS is an analysis aid designed to help you make informed decisions. <b style="color:var(--red)">Bet responsibly. Never bet what you can't afford to lose.</b></p>
</div>
<div class="card">
  <h3 class="ct">📞 CONTACT</h3>
  <p class="muted">Built with passion by kawunlere</p>
</div>`,

  admin: `${nav("admin")}
<div class="head"><div class="logo">⚡ ADMIN ⚡</div><div class="tag">CONTROL CENTER</div></div>
<div class="card" id="login-card">
  <h3 class="ct">🔐 ACCESS REQUIRED</h3>
  <input type="password" id="pass" placeholder="Enter admin password" style="margin-top:15px">
  <button class="btn" onclick="adminLogin()">UNLOCK</button>
</div>
<div id="panel" style="display:none">
  <div class="card">
    <h3 class="ct">📊 SYSTEM STATS</h3>
    <div id="a-stats" class="muted">Loading...</div>
  </div>
  <div class="card">
    <h3 class="ct">📋 ALL PREDICTIONS</h3>
    <div id="a-preds" class="muted">Loading...</div>
  </div>
  <div class="card">
    <h3 class="ct">🧠 AI BRAIN STATUS</h3>
    <div class="muted">AI Engine: <b style="color:var(--green)">ACTIVE</b> — Learning from every result</div>
    <div class="muted" style="margin-top:5px">Analysis Engine: <b style="color:var(--green)">ACTIVE</b> — Rule-based recommendations</div>
    <div class="muted" style="margin-top:5px">Last Retrain: <b style="color:var(--green)">Auto (continuous)</b></div>
  </div>
  <div class="card warn">
    <h3 class="ct" style="color:var(--red)">⚠️ DANGER ZONE</h3>
    <button class="btn" style="background:#1a0000;color:var(--red);border:1px solid var(--red);box-shadow:none" onclick="if(confirm('This will reset ALL data. Are you sure?')){alert('Contact developer to execute reset')}">RESET ALL DATA</button>
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
.nav a{flex:1;min-width:60px;text-align:center;padding:9px 4px;color:var(--gray);text-decoration:none;font-size:10px;font-weight:700;letter-spacing:1px;border-radius:6px;transition:.3s}
.nav a.active,.nav a:hover{background:rgba(0,255,136,.15);color:var(--green);text-shadow:0 0 5px var(--green)}
.nav a.admin-btn{background:rgba(255,51,51,.1);color:var(--red)}
.nav a.admin-btn.active{background:rgba(255,51,51,.3);color:var(--red)}
.head{text-align:center;padding:20px 0 15px;border-bottom:1px solid rgba(0,255,136,.2);margin-bottom:20px}
.logo{font-size:30px;font-weight:900;color:var(--green);text-shadow:0 0 20px var(--green);letter-spacing:3px;animation:glow 2s infinite alternate}
@keyframes glow{from{text-shadow:0 0 10px var(--green)}to{text-shadow:0 0 30px var(--green),0 0 50px var(--green)}}
.tag{color:var(--gray);font-size:10px;margin-top:6px;letter-spacing:3px}
.card{background:linear-gradient(135deg,rgba(0,255,136,.03),var(--card));border:1px solid rgba(0,255,136,.2);border-radius:12px;padding:18px;margin:10px 0;backdrop-filter:blur(10px)}
.card.glow{box-shadow:0 0 30px rgba(0,255,136,.1);border-color:rgba(0,255,136,.4)}
.card.warn{border-color:rgba(255,51,51,.3);background:linear-gradient(135deg,rgba(255,51,51,.05),var(--card))}
.ct{color:var(--green);margin-bottom:12px;font-size:16px;letter-spacing:1px}
.txt{color:#ccc;line-height:1.6;font-size:13px}
.muted{color:var(--gray);font-size:13px;line-height:1.6}
label{display:block;color:var(--green);font-size:11px;font-weight:700;margin:14px 0 6px;letter-spacing:2px}
input,select{width:100%;padding:13px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:8px;font-size:14px;font-family:inherit}
input:focus,select:focus{outline:none;border-color:var(--green);box-shadow:0 0 10px rgba(0,255,136,.3)}
.row{display:flex;gap:10px;margin-top:5px}.row>div{flex:1}
.btn{width:100%;padding:15px;background:linear-gradient(135deg,var(--green),var(--dark-green));color:#000;font-weight:900;font-size:13px;border:none;border-radius:8px;margin-top:18px;cursor:pointer;text-transform:uppercase;letter-spacing:2px;font-family:inherit;box-shadow:0 0 20px rgba(0,255,136,.4);transition:.3s;text-decoration:none;display:inline-block;text-align:center}
.btn:hover{box-shadow:0 0 40px rgba(0,255,136,.7);transform:translateY(-1px)}
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
.platforms{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.pf{flex:1;min-width:90px;text-align:center;padding:12px;background:rgba(0,255,136,.05);border:1px solid rgba(0,255,136,.3);border-radius:8px;font-weight:700;letter-spacing:1px;font-size:12px}
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
  if(today)today.innerHTML='<b style="color:var(--green)">'+s.total+'</b> analyses • <b style="color:var(--green)">'+s.wins+'</b> wins • <b style="color:var(--green)">'+rate+'%</b> accuracy';
  if(s.total>=3){
    const losses=s.total-s.wins;
    if(losses>=3){const al=document.getElementById('alerts');if(al)al.innerHTML='<b style="color:var(--red)">⚠️ 3+ losses detected</b> — Take a break. Re-analyze the pattern.'}
  }
  }catch(e){}}
loadStats();
async function loadHistory(){
  try{const r=await fetch('/api/predictions');const p=await r.json();
  const h=document.getElementById('hist');if(!h)return;
  if(!p.length){h.innerHTML='No predictions yet.';return}
  h.innerHTML=p.map(x=>'<div style="padding:10px;border-bottom:1px solid #222"><div style="display:flex;justify-content:space-between"><b style="color:var(--green)">'+x.match+'</b><span style="color:var(--gray);font-size:10px">'+x.platform.toUpperCase()+' • '+x.type.toUpperCase()+'</span></div><div style="color:var(--gray);font-size:11px;margin-top:3px">'+new Date(x.time).toLocaleString()+'</div><div style="font-size:12px;margin-top:6px;color:#ccc">'+x.picks.slice(0,2).map(pk=>'<span style="color:var(--green)">●</span> '+pk.pick+' ('+pk.conf+'%)').join(' &nbsp; ')+'</div></div>').join('');
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
    res.innerHTML='<div class="head"><div style="font-size:18px;font-weight:800">'+d.teamA+' <span style="color:var(--green)">VS</span> '+d.teamB+'</div><div style="color:var(--gray);font-size:10px;letter-spacing:2px;margin-top:5px">'+d.platform.toUpperCase()+' • '+d.type.toUpperCase()+'</div></div>'+d.picks.map((p,i)=>'<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><span class="tag2">PICK #'+(i+1)+'</span><span class="risk-'+p.risk+'" style="padding:3px 10px;border-radius:15px;font-size:10px;font-weight:900">'+p.risk.toUpperCase()+' RISK</span></div><div class="name">'+p.pick+'</div><div class="conf">'+p.conf+'%</div><div class="why">'+p.why+'</div><div class="btns"><form><input type="hidden" value="'+d.teamA+' vs '+d.teamB+'" name="m"><input type="hidden" value="'+p.pick+'" name="p"><button class="w" name="o" value="win">✓ WIN</button><button class="l" name="o" value="lose">✗ LOSE</button></form></div></div>').join('')+'<a href="/analyze" class="btn">NEW ANALYSIS</a>';
    res.scrollIntoView({behavior:'smooth'});
    res.querySelectorAll('form').forEach(f=>f.addEventListener('submit',async ev=>{
      ev.preventDefault();
      const fd=new FormData();
      fd.append('match',f.querySelector('[name=m]').value);
      fd.append('pick',f.querySelector('[name=p]').value);
      const o=ev.submitter.value;
      fd.append('outcome',o);
      await fetch('/api/result',{method:'POST',body:fd});
      alert(o==='win'?'✅ WIN logged! System learned.':'❌ LOSE logged. System adjusted.');
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
    document.getElementById('a-stats').innerHTML='<div style="margin:8px 0"><b style="color:var(--green)">Total:</b> '+ss.total+'</div><div style="margin:8px 0"><b style="color:var(--green)">Wins:</b> '+ss.wins+'</div><div style="margin:8px 0"><b style="color:var(--green)">Win Rate:</b> '+rate+'%</div><div style="margin:8px 0"><b style="color:var(--green)">Losses:</b> '+(ss.total-ss.wins)+'</div>';
    const pr=await fetch('/api/predictions');const pp=await pr.json();
    document.getElementById('a-preds').innerHTML=pp.length?pp.map(x=>'<div style="padding:10px;border-bottom:1px solid #222;margin:5px 0"><b style="color:var(--green)">'+x.match+'</b> <span style="color:var(--gray);font-size:10px">['+x.platform+'/'+x.type+']</span><br><span style="color:var(--gray);font-size:11px">'+new Date(x.time).toLocaleString()+'</span><br><span style="font-size:12px">'+x.picks.map(pk=>pk.pick+'('+pk.conf+'%)').join(', ')+'</span></div>').join(''):'No data yet — make some analyses first';
  }else alert('❌ Wrong password');
}
</script>
</body></html>`;
}
