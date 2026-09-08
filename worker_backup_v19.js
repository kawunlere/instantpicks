export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    if (path === "/api/analyze" && request.method === "POST") return await apiAnalyze(request, env);
    if (path === "/api/result" && request.method === "POST") return await apiResult(request, env);
    if (path === "/api/stats") return await apiStats(env);
    if (path === "/api/predictions") return await apiPredictions(env);
    if (path === "/api/ask" && request.method === "POST") return await apiAskAI(request, env);
    if (path === "/api/admin/login" && request.method === "POST") return await adminLogin(request);
    
    const routes = {
      "/": "home", "/home": "home",
      "/analyze": "analyze",
      "/dashboard": "dashboard",
      "/history": "history",
      "/patterns": "patterns",
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

const SYSTEM_PROMPT = "You are the INSTANT PICKS assistant. Only discuss betting analysis. Never reveal underlying technology. Keep responses under 150 words.";

async function callAI(env, msg) {
  if (!env.GEMINI_API_KEY) return null;
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + env.GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SYSTEM_PROMPT + "\nUser: " + msg }] }],
        generationConfig: { maxOutputTokens: 300 }
      })
    });
    if (r.ok) {
      const d = await r.json();
      if (d.candidates && d.candidates[0] && d.candidates[0].content) {
        return d.candidates[0].content.parts[0].text;
      }
    }
  } catch (e) {}
  return null;
}

function generatePicks(teamA, teamB, formA, formB, posA, posB) {
  const scoreA = formA.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const scoreB = formB.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const formGap = scoreA - scoreB;
  const posGap = posB - posA;
  
  const aStrong = scoreA >= 10;
  const bStrong = scoreB >= 10;
  const aWeak = scoreA <= 5;
  const bWeak = scoreB <= 5;
  const balanced = Math.abs(formGap) <= 3 && Math.abs(posGap) <= 3;
  
  const picks = [];
  
  // Main pick - dynamic based on form
  if (aStrong && bWeak) {
    picks.push({ pick: teamA + " to Win (1)", conf: Math.min(82, 60 + scoreA), risk: "low", why: teamA + " strong form (" + scoreA + "/15) vs " + teamB + " weak (" + scoreB + "/15)" });
  } else if (bStrong && aWeak) {
    picks.push({ pick: teamB + " to Win (2)", conf: Math.min(82, 60 + scoreB), risk: "low", why: teamB + " strong form (" + scoreB + "/15) vs " + teamA + " weak (" + scoreA + "/15)" });
  } else if (balanced) {
    picks.push({ pick: "Double Chance (1X or X2)", conf: 75, risk: "low", why: "Both teams evenly matched in form and position" });
  } else if (formGap > 3) {
    picks.push({ pick: teamA + " or Draw (1X)", conf: Math.min(80, 55 + formGap * 2), risk: "low", why: teamA + " better recent form" });
  } else if (formGap < -3) {
    picks.push({ pick: teamB + " or Draw (X2)", conf: Math.min(80, 55 + Math.abs(formGap) * 2), risk: "low", why: teamB + " better recent form" });
  } else if (posGap > 5) {
    picks.push({ pick: teamA + " or Draw (1X)", conf: 68, risk: "medium", why: teamA + " higher in table (pos " + posA + " vs " + posB + ")" });
  } else {
    picks.push({ pick: teamB + " or Draw (X2)", conf: 68, risk: "medium", why: teamB + " higher in table (pos " + posB + " vs " + posA + ")" });
  }
  
  // Goals picks - dynamic
  if (aStrong && bStrong) {
    picks.push({ pick: "Over 1.5 Goals", conf: 78, risk: "low", why: "Both teams strong - goals likely" });
    picks.push({ pick: "BTTS: Yes", conf: 68, risk: "medium", why: "Both teams can score" });
    picks.push({ pick: "Over 2.5 Goals", conf: 60, risk: "medium", why: "Strong attacks suggest high scoring" });
  } else if (aWeak && bWeak) {
    picks.push({ pick: "Under 2.5 Goals", conf: 72, risk: "low", why: "Both weak attacks - low scoring expected" });
    picks.push({ pick: "BTTS: No", conf: 65, risk: "medium", why: "Both teams struggle to score" });
    picks.push({ pick: "Under 1.5 Goals", conf: 55, risk: "medium", why: "Could be goalless draw" });
  } else if (aStrong || bStrong) {
    picks.push({ pick: "Over 1.5 Goals", conf: 72, risk: "low", why: "Strong team will likely score" });
    picks.push({ pick: "BTTS: Yes", conf: 58, risk: "medium", why: "One strong team should score" });
  } else {
    picks.push({ pick: "Over 1.5 Goals", conf: 68, risk: "low", why: "At least 2 goals expected" });
    picks.push({ pick: "Under 3.5 Goals", conf: 70, risk: "low", why: "Not extreme scoring" });
  }
  
  // Safe pick
  if (Math.abs(posGap) >= 6) {
    const fav = posA < posB ? teamA : teamB;
    picks.push({ pick: fav + " or Draw", conf: 72, risk: "low", why: "Big position gap (pos " + Math.min(posA, posB) + " vs " + Math.max(posA, posB) + ") favors " + fav });
  } else {
    picks.push({ pick: "Half-time: Draw", conf: 55, risk: "medium", why: "First half usually tight" });
  }
  
  picks.sort((a, b) => b.conf - a.conf);
  return picks.slice(0, 5);
}

async function apiAnalyze(request, env) {
  try {
    const form = await request.formData();
    const teamA = form.get("team_a") || "Team A";
    const teamB = form.get("team_b") || "Team B";
    const platform = form.get("platform") || "sportybet";
    const conversation = form.get("conversation") || "";
    
    const formA = (form.get("form_a") || "").toUpperCase().replace(/\s/g, "").split(",").filter(x => x);
    const formB = (form.get("form_b") || "").toUpperCase().replace(/\s/g, "").split(",").filter(x => x);
    const posA = parseInt(form.get("pos_a")) || 5;
    const posB = parseInt(form.get("pos_b")) || 5;
    
    if (formA.length === 0 || formB.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "Please enter form for both teams (W,L,D,W,W)" }), { headers: { "Content-Type": "application/json" } });
    }
    
    let picks = generatePicks(teamA, teamB, formA, formB, posA, posB);
    
    if (conversation && env.GEMINI_API_KEY) {
      const aiPrompt = "Match: " + teamA + " vs " + teamB + ". User says: \"" + conversation + "\". Current picks: " + picks.map(p => p.pick + " (" + p.conf + "%)").join(", ") + ". Adjust confidence (40-85) for each based on observation. Format: PICK1: [name]|[conf]|PICK2: [name]|[conf]|PICK3: [name]|[conf]|PICK4: [name]|[conf]|PICK5: [name]|[conf]";
      const aiResponse = await callAI(env, aiPrompt);
      if (aiResponse) {
        const lines = aiResponse.split("\n").filter(l => l.includes("PICK"));
        lines.forEach((line, i) => {
          if (i < picks.length) {
            const match = line.match(/(\d+)/g);
            if (match && match[1]) {
              const newConf = parseInt(match[1]);
              if (newConf >= 40 && newConf <= 85) {
                picks[i].conf = newConf;
              }
            }
          }
        });
      }
    }
    
    const predId = "p_" + Date.now();
    if (env.PICKS_KV) {
      await env.PICKS_KV.put(predId, JSON.stringify({
        id: predId,
        time: new Date().toISOString(),
        platform: platform,
        match: teamA + " vs " + teamB,
        teamA: teamA, teamB: teamB,
        formA: formA, formB: formB,
        posA: posA, posB: posB,
        picks: picks,
        status: "pending"
      }));
    }
    
    return new Response(JSON.stringify({
      ok: true,
      predId: predId,
      teamA: teamA, teamB: teamB,
      platform: platform,
      picks: picks
    }), { headers: { "Content-Type": "application/json" } });
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
          s.todayTotal = 0;
          s.todayWins = 0;
          s.todayDate = new Date().toDateString();
        }
      }
      s.total++;
      s.todayTotal++;
      if (outcome === "win") {
        s.wins++;
        s.todayWins++;
      }
      await env.PICKS_KV.put("stats", JSON.stringify(s));
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
    if (!question.trim()) {
      return new Response(JSON.stringify({ ok: false, error: "Please ask a question" }), { headers: { "Content-Type": "application/json" } });
    }
    const reply = await callAI(env, question);
    if (reply) {
      return new Response(JSON.stringify({ ok: true, reply: reply }), { headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: false, error: "AI temporarily unavailable" }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function apiStats(env) {
  if (!env.PICKS_KV) return new Response('{"total":0,"wins":0}', { headers: { "Content-Type": "application/json" } });
  return new Response(await env.PICKS_KV.get("stats") || '{"total":0,"wins":0}', { headers: { "Content-Type": "application/json" } });
}

async function apiPredictions(env) {
  if (!env.PICKS_KV) return new Response('[]', { headers: { "Content-Type": "application/json" } });
  const list = await env.PICKS_KV.list({ prefix: "p_" });
  const preds = [];
  for (const key of list.keys.slice(-20).reverse()) {
    const v = await env.PICKS_KV.get(key.name);
    if (v) preds.push(JSON.parse(v));
  }
  return new Response(JSON.stringify(preds), { headers: { "Content-Type": "application/json" } });
}

async function adminLogin(request) {
  const form = await request.formData();
  return new Response(JSON.stringify({ ok: form.get("password") === ADMIN_PASS }), { headers: { "Content-Type": "application/json" } });
}

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12L12 3L21 12M5 10V21H19V10"/></svg>',
  analyze: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21L16.65 16.65M11 8V14M8 11H14"/></svg>',
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3V21H21M7 16L12 11L15 14L21 8"/></svg>',
  ask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12C21 16.97 16.97 21 12 21C10.18 21 8.5 20.41 7.13 19.4L3 21L4.6 16.87C3.59 15.5 3 13.82 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11"/></svg>'
};

function nav(active) {
  const items = [["home", "HOME", ICONS.home], ["analyze", "ANALYZE", ICONS.analyze], ["ask", "ASK", ICONS.ask], ["dashboard", "STATS", ICONS.dashboard], ["history", "HISTORY", ICONS.history]];
  return '<div class="nav">' + items.map(function(item) {
    return '<a href="/' + (item[0] === 'home' ? '' : item[0]) + '" class="' + (active === item[0] ? 'active' : '') + '"><span class="icon">' + item[2] + '</span><span>' + item[1] + '</span></a>';
  }).join("") + '<a href="/admin" class="admin-btn ' + (active === 'admin' ? 'active' : '') + '"><span class="icon">' + ICONS.lock + '</span></a></div>';
}

const pages = {
  home: nav("home") +
    '<div class="head"><div class="logo">⚡ INSTANT PICKS ⚡</div><div class="tag">SMART PICKS • NOT SURE PROMISES</div></div>' +
    '<div class="hero">' +
      '<div class="hero-stat"><div class="num" id="h-total">0</div><div class="lbl">ANALYSES</div></div>' +
      '<div class="hero-stat"><div class="num" id="h-rate">0%</div><div class="lbl">WIN RATE</div></div>' +
      '<div class="hero-stat"><div class="num" id="h-streak">0</div><div class="lbl">STREAK</div></div>' +
    '</div>' +
    '<div class="card glow"><h2 class="ct">SMART BETTING ANALYSIS</h2><p class="txt">Quick form input. Smart picks. Real learning from every game. Built for discipline, not false promises.</p><a href="/analyze" class="btn">START ANALYZING</a></div>' +
    '<div class="card warn"><b class="warn-text">⚠ DISCIPLINE FIRST</b><p class="muted">No pick is 100% guaranteed. Bet within your means. Set daily limits.</p></div>',

  analyze: nav("analyze") +
    '<div class="head"><div class="logo">⚡ ANALYZE ⚡</div><div class="tag">SMART MATCH ANALYSIS</div></div>' +
    '<div class="card">' +
      '<label>PLATFORM</label>' +
      '<select id="platform">' + PLATFORMS.virtual.map(function(p) { return '<option value="' + p.id + '">' + p.name + ' — ' + p.game + '</option>'; }).join("") + '</select>' +
      '<div class="row"><div><label>TEAM A</label><input id="team_a" placeholder="e.g. Chelsea"></div><div><label>TEAM B</label><input id="team_b" placeholder="e.g. Tottenham"></div></div>' +
      '<div class="row"><div><label>TEAM A POSITION</label><input id="pos_a" type="number" placeholder="3"></div><div><label>TEAM B POSITION</label><input id="pos_b" type="number" placeholder="7"></div></div>' +
    '</div>' +
    '<div class="card">' +
      '<h3 class="ct">TEAM A FORM (LAST 5)</h3>' +
      '<div class="qt-row">' +
        '<button type="button" class="qt" data-t="form_a" data-v="W">W</button>' +
        '<button type="button" class="qt" data-t="form_a" data-v="D">D</button>' +
        '<button type="button" class="qt" data-t="form_a" data-v="L">L</button>' +
      '</div>' +
      '<input id="form_a" placeholder="W,L,D,W,W">' +
    '</div>' +
    '<div class="card">' +
      '<h3 class="ct">TEAM B FORM (LAST 5)</h3>' +
      '<div class="qt-row">' +
        '<button type="button" class="qt" data-t="form_b" data-v="W">W</button>' +
        '<button type="button" class="qt" data-t="form_b" data-v="D">D</button>' +
        '<button type="button" class="qt" data-t="form_b" data-v="L">L</button>' +
      '</div>' +
      '<input id="form_b" placeholder="L,W,L,D,W">' +
    '</div>' +
    '<div class="card">' +
      '<h3 class="ct">HOW IS THE GAME PLAYING? (OPTIONAL)</h3>' +
      '<textarea id="conv" rows="2" placeholder="e.g. Team A pressing high, Team B defensive..."></textarea>' +
      '<button class="btn" id="goBtn">⚡ ANALYZE ⚡</button>' +
    '</div>' +
    '<div id="result"></div>',

  ask: nav("ask") +
    '<div class="head"><div class="logo">⚡ ASK ⚡</div></div>' +
    '<div class="card glow"><h3 class="ct">BETTING ASSISTANT</h3><p class="muted">Ask about picks, strategy, bankroll management.</p></div>' +
    '<div class="card"><textarea id="aiQ" rows="3" placeholder="Ask anything betting..."></textarea><button class="btn" id="askBtn">⚡ ASK ⚡</button></div>' +
    '<div id="aiR" class="card" style="display:none"><h3 class="ct">RESPONSE</h3><div id="aiT" class="txt"></div></div>',

  dashboard: nav("dashboard") +
    '<div class="head"><div class="logo">⚡ STATS ⚡</div></div>' +
    '<div class="stats-grid">' +
      '<div class="stat-card"><div class="stat-num" id="d-total">0</div><div class="stat-lbl">TOTAL</div></div>' +
      '<div class="stat-card"><div class="stat-num" id="d-wins">0</div><div class="stat-lbl">WINS</div></div>' +
      '<div class="stat-card"><div class="stat-num" id="d-today">0</div><div class="stat-lbl">TODAY</div></div>' +
      '<div class="stat-card highlight"><div class="stat-num" id="d-rate">0%</div><div class="stat-lbl">RATE</div></div>' +
    '</div>' +
    '<div class="card"><a href="/analyze" class="btn">NEW ANALYSIS</a></div>',

  history: nav("history") +
    '<div class="head"><div class="logo">⚡ HISTORY ⚡</div></div>' +
    '<div class="card"><div id="hist" class="muted">Loading...</div></div>',

  patterns: nav("patterns") +
    '<div class="head"><div class="logo">⚡ PATTERNS ⚡</div></div>' +
    '<div class="card"><p class="muted">Pattern detection active. Log 10+ results to see insights.</p></div>'
};

function layout(content, active) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>INSTANT PICKS</title>' +
    '<style>' +
    '*{box-sizing:border-box;margin:0;padding:0}' +
    ':root{--green:#00ff88;--dark-green:#00cc6a;--black:#0a0a0a;--card:#161616;--red:#ff3333;--gray:#888;--yellow:#ffaa00}' +
    'body{font-family:"Courier New",monospace;background:var(--black);color:#fff;min-height:100vh;-webkit-tap-highlight-color:transparent}' +
    'canvas#m{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;opacity:.12}' +
    '.c{position:relative;z-index:2;max-width:560px;margin:0 auto;padding:12px;padding-bottom:80px}' +
    '.nav{display:flex;gap:3px;margin-bottom:18px;flex-wrap:wrap;background:rgba(0,0,0,.7);padding:5px;border-radius:10px;border:1px solid rgba(0,255,136,.2);position:sticky;top:8px;z-index:10}' +
    '.nav a{flex:1;min-width:48px;text-align:center;padding:8px 3px;color:var(--gray);text-decoration:none;font-size:8px;font-weight:700;border-radius:5px;display:flex;flex-direction:column;align-items:center;gap:2px}' +
    '.nav a .icon{width:16px;height:16px}' +
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
    '.ct{color:var(--green);margin-bottom:10px;font-size:14px;letter-spacing:1px}' +
    '.txt{color:#ccc;line-height:1.6;font-size:13px;white-space:pre-wrap}' +
    '.hl{color:var(--green)}' +
    '.warn-text{color:var(--red)}' +
    '.muted{color:var(--gray);font-size:12px;margin:4px 0}' +
    'label{display:block;color:var(--green);font-size:10px;font-weight:700;margin:12px 0 5px;letter-spacing:2px}' +
    'input,select,textarea{width:100%;padding:11px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:8px;font-size:14px;font-family:inherit;box-sizing:border-box}' +
    'input:focus,select:focus,textarea:focus{outline:none;border-color:var(--green)}' +
    'textarea{resize:vertical}' +
    '.row{display:flex;gap:8px;margin-top:5px;flex-wrap:wrap}.row>div{flex:1;min-width:100px}' +
    '.btn{display:block;width:100%;padding:14px;background:linear-gradient(135deg,var(--green),var(--dark-green));color:#000;font-weight:900;font-size:13px;border:none;border-radius:8px;margin-top:14px;cursor:pointer;text-transform:uppercase;letter-spacing:2px;font-family:inherit;box-shadow:0 0 20px rgba(0,255,136,.4);text-align:center;text-decoration:none}' +
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
    '.qt{flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700;font-size:14px;letter-spacing:1px}' +
    '.qt:hover,.qt:active{background:rgba(0,255,136,.2);border-color:var(--green);color:var(--green)}' +
    '.mt{font-size:17px;font-weight:800;margin:15px 0 5px;text-align:center;color:var(--green)}' +
    '.ms{font-size:9px;color:var(--gray);text-align:center;letter-spacing:2px;margin-bottom:10px}' +
    '.pc{background:linear-gradient(135deg,rgba(0,255,136,.05),var(--card));border-left:4px solid var(--green);padding:14px;margin:10px 0;border-radius:8px}' +
    '.pc.r-low{border-left-color:var(--green)}' +
    '.pc.r-med{border-left-color:var(--yellow)}' +
    '.pc.r-high{border-left-color:var(--red)}' +
    '.ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}' +
    '.tg{background:var(--green);color:#000;padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900;letter-spacing:1px}' +
    '.tr{padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900;letter-spacing:1px}' +
    '.r-low{background:#003300;color:var(--green);border:1px solid var(--green)}' +
    '.r-med{background:#332200;color:var(--yellow);border:1px solid var(--yellow)}' +
    '.r-high{background:#330000;color:var(--red);border:1px solid var(--red)}' +
    '.pn{font-size:16px;font-weight:800;margin:6px 0}' +
    '.pc2{font-size:34px;font-weight:900;color:var(--green);text-shadow:0 0 15px var(--green);font-family:monospace}' +
    '.pw{color:var(--gray);font-size:12px;margin:6px 0;line-height:1.5}' +
    '.pb{display:flex;gap:6px;margin-top:10px}' +
    '.pb form{flex:1;display:flex;gap:6px}' +
    '.pb button{flex:1;padding:11px;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;letter-spacing:1px}' +
    '.bw{background:var(--green);color:#000;box-shadow:0 0 10px rgba(0,255,136,.4)}' +
    '.bl{background:#1a0000;color:var(--red);border:1px solid var(--red)}' +
    '</style></head><body>' +
    '<canvas id="m"></canvas>' +
    '<div class="c">' + content + '</div>' +
    '<script>' +
    'var c=document.getElementById("m"),x=c.getContext("2d");' +
    'function r(){c.width=window.innerWidth;c.height=window.innerHeight}r();window.addEventListener("resize",r);' +
    'var ch="01<>{}[]/\\\\$#@!%&*+=",fs=14,cols=Math.floor(c.width/fs),drops=Array(cols).fill(1);' +
    'setInterval(function(){x.fillStyle="rgba(0,0,0,0.05)";x.fillRect(0,0,c.width,c.height);x.fillStyle="#00ff88";x.font=fs+"px monospace";for(var i=0;i<drops.length;i++){var t=ch[Math.floor(Math.random()*ch.length)];x.fillText(t,i*fs,drops[i]*fs);if(drops[i]*fs>c.height&&Math.random()>.975)drops[i]=0;drops[i]++}},33);' +
    '</script>' +
    '<script>' +
    'document.querySelectorAll(".qt").forEach(function(b){b.addEventListener("click",function(){' +
      'var t=document.getElementById(b.dataset.t);' +
      'var c=t.value?t.value.split(","):[];' +
      'if(c.length>=5)return;' +
      'c.push(b.dataset.v);' +
      't.value=c.join(",");' +
    '})});' +
    'async function loadStats(){' +
      'try{' +
        'var r=await fetch("/api/stats");var s=await r.json();' +
        'var rate=s.total>0?Math.round(s.wins/s.total*1000)/10:0;' +
        'var h=document.getElementById("h-total");if(h)h.textContent=s.total;' +
        'var hr=document.getElementById("h-rate");if(hr)hr.textContent=rate+"%";' +
        'var dt=document.getElementById("d-total");if(dt)dt.textContent=s.total;' +
        'var dw=document.getElementById("d-wins");if(dw)dw.textContent=s.wins;' +
        'var dt2=document.getElementById("d-today");if(dt2)dt2.textContent=s.todayTotal||0;' +
        'var dr=document.getElementById("d-rate");if(dr)dr.textContent=rate+"%";' +
        'if(s.total>0){' +
          'var r2=await fetch("/api/predictions");var p=await r2.json();' +
          'var recent=p.slice(0,10).filter(function(x){return x.status==="win"||x.status==="lose"});' +
          'var cur=0,type=recent[0]?recent[0].status:"none";' +
          'for(var x of recent){if(x.status===type)cur++;else break;}' +
          'var hs=document.getElementById("h-streak");if(hs)hs.textContent=cur+(type==="win"?"W":type==="lose"?"L":"");' +
        '}' +
      '}catch(e){}' +
    '}' +
    'loadStats();' +
    'var goBtn=document.getElementById("goBtn");' +
    'if(goBtn){goBtn.addEventListener("click",async function(){' +
      'var fd=new FormData();' +
      'fd.append("platform",document.getElementById("platform").value);' +
      'fd.append("team_a",document.getElementById("team_a").value);' +
      'fd.append("team_b",document.getElementById("team_b").value);' +
      'fd.append("pos_a",document.getElementById("pos_a").value);' +
      'fd.append("pos_b",document.getElementById("pos_b").value);' +
      'fd.append("form_a",document.getElementById("form_a").value);' +
      'fd.append("form_b",document.getElementById("form_b").value);' +
      'fd.append("conversation",document.getElementById("conv").value);' +
      'goBtn.disabled=true;goBtn.textContent="ANALYZING...";' +
      'try{' +
        'var r=await fetch("/api/analyze",{method:"POST",body:fd});' +
        'var d=await r.json();' +
        'if(d.ok&&d.picks){' +
          'var res=document.getElementById("result");' +
          'var html="<div class=\\"mt\\">"+d.teamA+" <span class=\\"hl\\">VS</span> "+d.teamB+"</div>";' +
          'html+="<div class=\\"ms\\">"+d.platform.toUpperCase()+"</div>";' +
          'd.picks.forEach(function(p,i){' +
            'var rc=p.risk==="low"?"r-low":p.risk==="medium"?"r-med":"r-high";' +
            'var pc=p.risk==="low"?"r-low":p.risk==="medium"?"r-med":"r-high";' +
            'html+="<div class=\\"pc "+pc+"\\"><div class=\\"ph\\"><span class=\\"tg\\">PICK #"+(i+1)+"</span><span class=\\"tr "+rc+"\\">"+p.risk.toUpperCase()+"</span></div>";' +
            'html+="<div class=\\"pn\\">"+p.pick+"</div>";' +
            'html+="<div class=\\"pc2\\">"+p.conf+"%</div>";' +
            'html+="<div class=\\"pw\\">"+p.why+"</div>";' +
            'html+="<div class=\\"pb\\"><form><input type=\\"hidden\\" name=\\"pid\\" value=\\""+d.predId+"\\"><input type=\\"hidden\\" name=\\"p\\" value=\\""+p.pick+"\\"><button type=\\"submit\\" name=\\"o\\" value=\\"win\\" class=\\"bw\\">WIN</button><button type=\\"submit\\" name=\\"o\\" value=\\"lose\\" class=\\"bl\\">LOSE</button></form></div></div>";' +
          '});' +
          'html+="<a href=\\"/analyze\\" class=\\"btn\\">NEW ANALYSIS</a>";' +
          'res.innerHTML=html;' +
          'res.querySelectorAll("form").forEach(function(f){f.addEventListener("submit",async function(e){' +
            'e.preventDefault();' +
            'var fd=new FormData();' +
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
      'goBtn.disabled=false;goBtn.textContent="⚡ ANALYZE ⚡";' +
    '})}' +
    'async function loadHistory(){' +
      'try{' +
        'var r=await fetch("/api/predictions");' +
        'var p=await r.json();' +
        'var h=document.getElementById("hist");' +
        'if(!h)return;' +
        'if(!p.length){h.innerHTML="<p>No predictions yet.</p>";return}' +
        'h.innerHTML=p.map(function(x){' +
          'return "<div style=\\"padding:10px;border-bottom:1px solid #222\\"><b class=\\"hl\\">"+(x.match||"Match")+"</b><br><span style=\\"font-size:10px;color:var(--gray)\\">"+new Date(x.time).toLocaleString()+"</span><br><span style=\\"font-size:10px\\">"+(x.status==="win"?"<span class=\\"hl\\">WIN</span>":x.status==="lose"?"<span class=\\"warn-text\\">LOSE</span>":"<span class=\\"muted\\">PENDING</span>")+"</span></div>";' +
        '}).join("");' +
      '}catch(e){}' +
    '}' +
    'loadHistory();' +
    'var askBtn=document.getElementById("askBtn");' +
    'if(askBtn){askBtn.addEventListener("click",async function(){' +
      'var q=document.getElementById("aiQ").value.trim();' +
      'if(!q){alert("Ask a question");return}' +
      'var fd=new FormData();fd.append("question",q);' +
      'var r=await fetch("/api/ask",{method:"POST",body:fd});' +
      'var d=await r.json();' +
      'if(d.ok){document.getElementById("aiR").style.display="block";document.getElementById("aiT").textContent=d.reply;}' +
      'else alert("Error: "+d.error);' +
    '})}' +
    '</script>' +
    '</body></html>';
}
