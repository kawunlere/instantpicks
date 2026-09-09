import { renderHome } from "./ui/home.js";
import { renderAnalyze } from "./ui/analyze.js";
import { renderAsk } from "./ui/ask.js";
import { renderStats } from "./ui/stats.js";
import { renderHistory } from "./ui/history.js";
import { renderMines } from "./ui/mines.js";
import { analyzeMatch } from "./engines/analysis.js";
import { askAI } from "./engines/ai_brain.js";
import { recordResult, getStreakInfo } from "./engines/patterns.js";
import { runResearch, getAllResearch } from "./engines/research.js";
import { getAllPlatforms } from "./engines/platforms.js";
import { analyzeMines } from "./engines/mines.js";

const ADMIN_PASS = "kawunlere2024";
const ADMIN_SECRET_PATH = "/kawunlere-control-2024";

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    var path = url.pathname;

    if (path === "/" || path === "/home") return html(renderHome());
    if (path === "/analyze") {
      var platforms = getAllPlatforms();
      var platformOptions = platforms.map(function(p) { return "<option value=\"" + p.id + "\">" + p.name + " - " + p.game + "</option>"; }).join("");
      return html(renderAnalyze(platformOptions));
    }
    if (path === "/ask") return html(renderAsk());
    if (path === "/dashboard" || path === "/stats") return html(renderStats());
    if (path === "/history") return html(renderHistory());
    if (path === "/mines") return html(renderMines());
    if (path === "/kawunlere-control-2024" || path === "/kawunlere-control-2024/") return checkAdmin(request, "main");
    if (path === "/kawunlere-control-2024/chat") return checkAdmin(request, "chat");
    if (path === "/kawunlere-control-2024/research") return checkAdmin(request, "research");
    if (path === "/kawunlere-control-2024/data") return checkAdmin(request, "data");
    if (path === "/kawunlere-control-2024/login" && request.method === "POST") return await adminLogin(request);

    if (path === "/api/analyze" && request.method === "POST") return json(await apiAnalyze(request, env));
    if (path === "/api/result" && request.method === "POST") return json(await apiResult(request, env));
    if (path === "/api/stats") return await apiStats(env);
    if (path === "/api/predictions") return await apiPredictions(env);
    if (path === "/api/ask" && request.method === "POST") return json(await apiAsk(request, env));
    if (path === "/api/mines" && request.method === "POST") return json(await apiMines(request, env));

    if (path === "/admin/api/health") return json(await adminHealth(env));
    if (path === "/admin/api/research" && request.method === "POST") return json(await runResearch(env));
    if (path === "/admin/api/research/list") return json({ results: await getAllResearch(env) });
    if (path === "/admin/api/chat" && request.method === "POST") return json(await adminChat(request, env));
    if (path === "/admin/api/reset" && request.method === "POST") return json(await adminReset(request, env));
    if (path === "/admin/api/all-data") return json(await adminAllData(env));

    return new Response("404", { status: 404 });
  }
};

async function apiMines(request, env) {
  try {
    var form = await request.formData();
    var data = {
      server_seed: form.get("server_seed") || "",
      client_seed: form.get("client_seed") || "",
      num_mines: form.get("num_mines") || "3"
    };
    var result = await analyzeMines(env, data);
    return json(result);
  } catch (e) {
    return json({ ok: false, error: e.message });
  }
}

async function apiAnalyze(request, env) {
  try {
    var form = await request.formData();
    var input = {
      teamA: form.get("team_a") || "Team A",
      teamB: form.get("team_b") || "Team B",
      formA: (form.get("form_a") || "").toUpperCase().replace(/\s/g, "").split(",").filter(function(x) { return x; }),
      formB: (form.get("form_b") || "").toUpperCase().replace(/\s/g, "").split(",").filter(function(x) { return x; }),
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
      goalsForA: parseFloat(form.get("goals_for_a")) || 7,
      goalsForB: parseFloat(form.get("goals_for_b")) || 7,
      platform: form.get("platform") || "sportybet"
    };
    if (input.formA.length === 0 || input.formB.length === 0) return json({ ok: false, error: "Need form" });
    var result = await analyzeMatch(env, input);
    var predId = "p_" + Date.now();
    if (env.PICKS_KV) {
      await env.PICKS_KV.put(predId, JSON.stringify({
        id: predId, time: new Date().toISOString(), platform: input.platform,
        match: input.teamA + " vs " + input.teamB, teamA: input.teamA, teamB: input.teamB,
        formA: input.formA, formB: input.formB, posA: input.posA, posB: input.posB,
        picks: result.top6, status: "pending"
      }));
    }
    return json({ ok: true, predId: predId, teamA: input.teamA, teamB: input.teamB, platform: input.platform, picks: result.top6, allOptions: result.allOptions, streak: result.streak });
  } catch (e) {
    return json({ ok: false, error: e.message });
  }
}

async function apiResult(request, env) {
  try {
    var form = await request.formData();
    var predId = form.get("predId") || "";
    var pick = form.get("pick") || "";
    var outcome = form.get("outcome") || "";
    var s = { total: 0, wins: 0, todayTotal: 0, todayWins: 0, todayDate: new Date().toDateString() };
    if (env.PICKS_KV) {
      var stored = await env.PICKS_KV.get("stats");
      if (stored) {
        s = JSON.parse(stored);
        if (s.todayDate !== new Date().toDateString()) { s.todayTotal = 0; s.todayWins = 0; s.todayDate = new Date().toDateString(); }
      }
      s.total++; s.todayTotal++;
      if (outcome === "win") { s.wins++; s.todayWins++; }
      await env.PICKS_KV.put("stats", JSON.stringify(s));
    }
    return json({ ok: true, stats: s });
  } catch (e) {
    return json({ ok: false, error: e.message });
  }
}

async function apiStats(env) {
  if (!env.PICKS_KV) return json({ total: 0, wins: 0 });
  var s = await env.PICKS_KV.get("stats") || '{"total":0,"wins":0}';
  return new Response(s, { headers: { "Content-Type": "application/json" } });
}

async function apiPredictions(env) {
  if (!env.PICKS_KV) return json([]);
  var list = await env.PICKS_KV.list({ prefix: "p_" });
  var preds = [];
  for (var i = 0; i < list.keys.length; i++) {
    var v = await env.PICKS_KV.get(list.keys[i].name);
    if (v) preds.push(JSON.parse(v));
  }
  return json(preds.slice(-20).reverse());
}

async function apiAsk(request, env) {
  try {
    var form = await request.formData();
    var question = form.get("question") || "";
    if (!question.trim()) return json({ ok: false, error: "Empty" });
    var context = "You are the INSTANT PICKS assistant. Only discuss betting analysis. Keep under 200 words.";
    var result = await askAI(env, question, context);
    if (result.ok) return json({ ok: true, reply: result.reply });
    return json({ ok: false, error: result.error });
  } catch (e) { return json({ ok: false, error: e.message }); }
}

async function adminHealth(env) {
  var stats = { total: 0, wins: 0, todayTotal: 0, todayWins: 0 };
  if (env.PICKS_KV) {
    var s = await env.PICKS_KV.get("stats");
    if (s) stats = JSON.parse(s);
  }
  var research = await getAllResearch(env);
  return json({ stats: stats, platforms: research.length, patterns: 0, research: research.length, lastResearch: research[0] ? research[0].timestamp : "Never" });
}

async function adminChat(request, env) {
  try {
    var body = await request.json();
    var question = body.question || "";
    if (!question.trim()) return json({ ok: false, error: "Empty" });
    var result = await askAI(env, question, "You are the system assistant for the owner. Be direct.");
    if (result.ok) return json({ ok: true, reply: result.reply });
    return json({ ok: false, error: result.error });
  } catch (e) { return json({ ok: false, error: e.message }); }
}

async function adminReset(request, env) {
  var url = new URL(request.url);
  var type = url.searchParams.get("type") || "stats";
  if (!env.PICKS_KV) return json({ ok: false });
  if (type === "stats") {
    await env.PICKS_KV.put("stats", JSON.stringify({ total: 0, wins: 0, todayTotal: 0, todayWins: 0, todayDate: new Date().toDateString() }));
    return json({ ok: true, message: "Stats reset" });
  }
  return json({ ok: false });
}

async function adminAllData(env) {
  if (!env.PICKS_KV) return json({ predictions: [] });
  var list = await env.PICKS_KV.list({ prefix: "p_" });
  var preds = [];
  for (var i = 0; i < list.keys.length; i++) {
    var v = await env.PICKS_KV.get(list.keys[i].name);
    if (v) preds.push(JSON.parse(v));
  }
  return json({ predictions: preds.reverse() });
}

function html(content) {
  return new Response(content, { headers: { "Content-Type": "text/html" } });
}

function json(data) {
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

function checkAdmin(request, active) {
  var cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("admin=1")) {
    var html = "<!DOCTYPE html><html><head><title>Admin</title><style>body{font-family:monospace;background:#0a0a0a;color:#fff;padding:20px;margin:0}.c{max-width:600px;margin:0 auto}.card{background:#161616;border:1px solid #00ff88;border-radius:8px;padding:15px;margin:10px 0}h2{color:#00ff88;text-shadow:0 0 10px #00ff88}.btn{background:#00ff88;color:#000;border:none;padding:10px 20px;border-radius:5px;font-weight:900;cursor:pointer;margin:5px 0;display:inline-block;text-decoration:none}</style></head><body><div class=\"c\"><h2>ADMIN PANEL</h2><div class=\"card\"><p>Tabs: <a href=\"/kawunlere-control-2024\" class=\"btn\">MAIN</a> <a href=\"/kawunlere-control-2024/chat\" class=\"btn\">CHAT</a> <a href=\"/kawunlere-control-2024/research\" class=\"btn\">RESEARCH</a> <a href=\"/kawunlere-control-2024/data\" class=\"btn\">DATA</a></p><p>Tab: " + active + "</p></div><div class=\"card\" id=\"content\">Loading...</div><script>fetch(\"/admin/api/health\").then(r=>r.json()).then(d=>{document.getElementById(\"content\").innerHTML=\"<p>Total: \"+d.stats.total+\"</p><p>Wins: \"+d.stats.wins+\"</p><p>Today: \"+d.stats.todayTotal+\"</p><p>Research: \"+d.research+\"</p>\";});</script></div></body></html>";
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }
  return new Response("<!DOCTYPE html><html><head><title>Admin</title><style>body{font-family:monospace;background:#0a0a0a;color:#fff;padding:20px;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.box{max-width:400px;width:100%;background:#161616;border:1px solid #00ff88;padding:30px;border-radius:10px;text-align:center}h1{color:#00ff88}input{width:100%;padding:12px;background:#000;color:#fff;border:1px solid #333;border-radius:6px;margin:15px 0;font-size:14px;box-sizing:border-box}button{width:100%;padding:12px;background:#00ff88;color:#000;border:none;border-radius:6px;font-weight:900;cursor:pointer;text-transform:uppercase}</style></head><body><div class=\"box\"><h1>ADMIN</h1><input type=\"password\" id=\"p\"><button onclick=\"login()\">LOGIN</button></div><script>async function login(){var p=document.getElementById(\"p\").value;var fd=new FormData();fd.append(\"password\",p);var r=await fetch(\"/kawunlere-control-2024/login\",{method:\"POST\",body:fd});var d=await r.json();if(d.ok){document.cookie=\"admin=1;path=/;max-age=86400\";location.reload();}else alert(\"Wrong password\");}</script></body></html>", { headers: { "Content-Type": "text/html" } });
}

async function adminLogin(request) {
  var form = await request.formData();
  return new Response(JSON.stringify({ ok: form.get("password") === ADMIN_PASS }), { status: form.get("password") === ADMIN_PASS ? 200 : 401, headers: { "Content-Type": "application/json" } });
}
 
