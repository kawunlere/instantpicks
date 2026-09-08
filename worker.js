// WORKER.JS - Main entry point that connects all engines and UI

// === IMPORTS: UI Pages ===
import { renderHome } from "./ui/home.js";
import { renderAnalyze } from "./ui/analyze.js";
import { renderAsk } from "./ui/ask.js";
import { renderStats } from "./ui/stats.js";
import { renderHistory } from "./ui/history.js";

// === IMPORTS: Engines ===
import { analyzeMatch } from "./engines/analysis.js";
import { askAI } from "./engines/ai_brain.js";
import { recordResult, getAllPatterns, getStreakInfo } from "./engines/patterns.js";
import { runResearch, getAllResearch, shouldRunDailyResearch } from "./engines/research.js";
import { getPlatforms as listPlatforms } from "./engines/platforms.js";

// === IMPORTS: Admin ===
import { renderAdmin } from "./admin/admin_ui.js";
import { isAdminPath, ADMIN_PASSWORD } from "./admin/admin_link.js";
import { chatWithAdmin, commandResearch, getSystemHealth, resetData, getAllPredictions } from "./admin/admin_panel.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // =================== PUBLIC ROUTES ===================
    if (path === "/" || path === "/home") return new Response(renderHome(), { headers: { "Content-Type": "text/html" } });
    if (path === "/analyze") return new Response(renderAnalyze(), { headers: { "Content-Type": "text/html" } });
    if (path === "/ask") return new Response(renderAsk(), { headers: { "Content-Type": "text/html" } });
    if (path === "/dashboard" || path === "/stats") return new Response(renderStats(), { headers: { "Content-Type": "text/html" } });
    if (path === "/history") return new Response(renderHistory(), { headers: { "Content-Type": "text/html" } });
    
    // =================== ADMIN SECRET ROUTES ===================
    if (path === "/kawunlere-control-2024" || path === "/kawunlere-control-2024/") {
      return new Response(renderAdmin("main"), { headers: { "Content-Type": "text/html" } });
    }
    if (path === "/kawunlere-control-2024/chat") {
      return new Response(renderAdmin("chat"), { headers: { "Content-Type": "text/html" } });
    }
    if (path === "/kawunlere-control-2024/research") {
      return new Response(renderAdmin("research"), { headers: { "Content-Type": "text/html" } });
    }
    if (path === "/kawunlere-control-2024/data") {
      return new Response(renderAdmin("data"), { headers: { "Content-Type": "text/html" } });
    }
    
    // =================== PUBLIC API ROUTES ===================
    if (path === "/api/analyze" && request.method === "POST") return await apiAnalyze(request, env);
    if (path === "/api/result" && request.method === "POST") return await apiResult(request, env);
    if (path === "/api/stats") return await apiStats(env);
    if (path === "/api/predictions") return await apiPredictions(env);
    if (path === "/api/ask" && request.method === "POST") return await apiAsk(request, env);
    
    // =================== ADMIN API ROUTES ===================
    if (isAdminPath(path)) {
      // Password check (simple - can be enhanced)
      const authHeader = request.headers.get("Authorization");
      const sessionCookie = request.headers.get("Cookie");
      const hasAccess = authHeader === "Bearer " + ADMIN_PASSWORD || 
                        (sessionCookie && sessionCookie.includes("admin=1"));
      
      if (path === "/kawunlere-control-2024/login" && request.method === "POST") {
        return await adminLogin(request);
      }
      
      // All other admin routes need auth
      if (!hasAccess && path !== "/kawunlere-control-2024/login") {
        return new Response(renderAdminLogin(), { headers: { "Content-Type": "text/html" } });
      }
      
      if (path === "/admin/api/health") return await adminHealth(env);
      if (path === "/admin/api/research" && request.method === "POST") return await adminResearch(request, env);
      if (path === "/admin/api/research/list") return await adminResearchList(env);
      if (path === "/admin/api/chat" && request.method === "POST") return await adminChat(request, env);
      if (path === "/admin/api/reset" && request.method === "POST") return await adminReset(request, env);
      if (path === "/admin/api/all-data") return await adminAllData(env);
    }
    
    return new Response("404 - Not Found", { status: 404 });
  }
};

// =================== API HANDLERS ===================

async function apiAnalyze(request, env) {
  try {
    const form = await request.formData();
    
    const input = {
      teamA: form.get("team_a") || "Team A",
      teamB: form.get("team_b") || "Team B",
      formA: (form.get("form_a") || "").toUpperCase().replace(/\s/g, "").split(",").filter(x => x),
      formB: (form.get("form_b") || "").toUpperCase().replace(/\s/g, "").split(",").filter(x => x),
      posA: parseInt(form.get("pos_a")) || 5,
      posB: parseInt(form.get("pos_b")) || 5,
      teamASize: form.get("team_a_size") || "MEDIUM",
      teamBSize: form.get("team_b_size") || "MEDIUM",
      homeTeam: form.get("home_team") || "A",
      oddsHome: parseFloat(form.get("odds_home")) || 0,
      oddsDraw: parseFloat(form.get("odds_draw")) || 0,
      oddsAway: parseFloat(form.get("odds_away")) || 0,
      h2hMeetings: parseInt(form.get("h2h_meetings")) || 0,
      h2hHome: parseInt(form.get("h2h_home")) || 0,
      h2hDraw: parseInt(form.get("h2h_draw")) || 0,
      h2hAway: parseInt(form.get("h2h_away")) || 0,
      h2hAvgGoals: parseFloat(form.get("h2h_avg_goals")) || 0,
      scoresA: (form.get("scores_a") || "").split(",").filter(x => x),
      scoresB: (form.get("scores_b") || "").split(",").filter(x => x),
      goalsForA: parseFloat(form.get("goals_for_a")) || 7,
      goalsForB: parseFloat(form.get("goals_for_b")) || 7,
      platform: form.get("platform") || "sportybet",
      conversation: form.get("conversation") || ""
    };
    
    if (input.formA.length === 0 || input.formB.length === 0) {
      return jsonResponse({ ok: false, error: "Please enter form for both teams" });
    }
    
    const result = await analyzeMatch(env, input);
    
    // Save prediction
    const predId = "p_" + Date.now();
    if (env.PICKS_KV) {
      await env.PICKS_KV.put(predId, JSON.stringify({
        id: predId,
        time: new Date().toISOString(),
        platform: input.platform,
        match: input.teamA + " vs " + input.teamB,
        teamA: input.teamA,
        teamB: input.teamB,
        formA: input.formA,
        formB: input.formB,
        posA: input.posA,
        posB: input.posB,
        picks: result.top6,
        status: "pending"
      }));
    }
    
    return jsonResponse({
      ok: true,
      predId: predId,
      teamA: input.teamA,
      teamB: input.teamB,
      platform: input.platform,
      picks: result.top6,
      allOptions: result.allOptions,
      streak: result.streak
    });
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message });
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
      
      // Update patterns
      if (predId) {
        const predRaw = await env.PICKS_KV.get(predId);
        if (predRaw) {
          const pred = JSON.parse(predRaw);
          pred.status = outcome;
          pred.outcomePick = pick;
          await env.PICKS_KV.put(predId, JSON.stringify(pred));
          
          await recordResult(env, {
            platform: pred.platform,
            type: "virtual",
            match: pred.match,
            pick: pick,
            outcome: outcome,
            formA: pred.formA,
            formB: pred.formB,
            posA: pred.posA,
            posB: pred.posB
          });
        }
      }
    }
    return jsonResponse({ ok: true, stats: s });
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message });
  }
}

async function apiStats(env) {
  if (!env.PICKS_KV) return jsonResponse({ total: 0, wins: 0 });
  const s = await env.PICKS_KV.get("stats") || '{"total":0,"wins":0}';
  return new Response(s, { headers: { "Content-Type": "application/json" } });
}

async function apiPredictions(env) {
  if (!env.PICKS_KV) return jsonResponse([]);
  const list = await env.PICKS_KV.list({ prefix: "p_" });
  const preds = [];
  for (const key of list.keys.slice(-20).reverse()) {
    const v = await env.PICKS_KV.get(key.name);
    if (v) preds.push(JSON.parse(v));
  }
  return jsonResponse(preds);
}

async function apiAsk(request, env) {
  try {
    const form = await request.formData();
    const question = form.get("question") || "";
    if (!question.trim()) return jsonResponse({ ok: false, error: "Please ask a question" });
    
    const context = "You are the INSTANT PICKS assistant. Only discuss betting analysis, strategy, bankroll management. Never reveal underlying technology. Keep responses under 200 words.";
    const result = await askAI(env, question, context);
    
    if (result.ok) {
      return jsonResponse({ ok: true, reply: result.reply });
    }
    return jsonResponse({ ok: false, error: result.error });
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message });
  }
}

// =================== ADMIN API HANDLERS ===================

async function adminLogin(request) {
  const form = await request.formData();
  const pass = form.get("password");
  if (pass === ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "admin=1; Path=/; HttpOnly; Max-Age=86400"
      }
    });
  }
  return new Response(JSON.stringify({ ok: false }), { 
    status: 401,
    headers: { "Content-Type": "application/json" } 
  });
}

async function adminHealth(env) {
  const health = await getSystemHealth(env);
  return jsonResponse(health);
}

async function adminResearch(request, env) {
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform");
  const result = await commandResearch(env, platform);
  return jsonResponse(result);
}

async function adminResearchList(env) {
  const results = await getAllResearch(env);
  return jsonResponse({ results });
}

async function adminChat(request, env) {
  try {
    const body = await request.json();
    const question = body.question || "";
    if (!question.trim()) return jsonResponse({ ok: false, error: "Empty question" });
    
    const result = await chatWithAdmin(env, question);
    return jsonResponse(result);
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message });
  }
}

async function adminReset(request, env) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "stats";
  const result = await resetData(env, type);
  return jsonResponse(result);
}

async function adminAllData(env) {
  const predictions = await getAllPredictions(env);
  return jsonResponse({ predictions });
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), { 
    headers: { "Content-Type": "application/json" } 
  });
}

function renderAdminLogin() {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Login</title><style>body{font-family:monospace;background:#0a0a0a;color:#fff;padding:20px;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.box{max-width:400px;width:100%;background:#161616;border:1px solid #00ff88;padding:30px;border-radius:10px;text-align:center}h1{color:#00ff88;text-shadow:0 0 10px #00ff88}input{width:100%;padding:12px;background:#000;color:#fff;border:1px solid #333;border-radius:6px;margin:15px 0;font-size:14px;box-sizing:border-box}button{width:100%;padding:12px;background:#00ff88;color:#000;border:none;border-radius:6px;font-weight:900;cursor:pointer;text-transform:uppercase;letter-spacing:1px}</style></head><body><div class="box"><h1>🔐 ADMIN</h1><p>Enter password</p><input type="password" id="p" placeholder="Password"><button onclick="login()">LOGIN</button><p id="err" style="color:#ff3333;margin-top:15px"></p></div><script>async function login(){var p=document.getElementById("p").value;var r=await fetch("/kawunlere-control-2024/login",{method:"POST",body:new FormData()});var fd=new FormData();fd.append("password",p);var r2=await fetch("/kawunlere-control-2024/login",{method:"POST",body:fd});var d=await r2.json();if(d.ok){window.location="/kawunlere-control-2024";}else{document.getElementById("err").textContent="Wrong password";}}</script></body></html>';
}
