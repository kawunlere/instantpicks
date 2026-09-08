// WORKER.JS - Main entry that IMPORTS from separate engine files
// Each engine is in its own file: engines/ai_brain.js, engines/analysis.js, etc.

import { renderHome } from "./ui/home.js";
import { renderAnalyze } from "./ui/analyze.js";
import { renderAsk } from "./ui/ask.js";
import { renderStats } from "./ui/stats.js";
import { renderHistory } from "./ui/history.js";
import { renderAdmin, renderAdminLogin } from "./admin/admin_ui_v2.js";

import { analyzeMatch } from "./engines/analysis.js";
import { askAI } from "./engines/ai_brain.js";
import { recordResult, getStreakInfo } from "./engines/patterns.js";
import { runResearch, getAllResearch } from "./engines/research.js";
import { getAllPlatforms } from "./engines/platforms.js";

const ADMIN_PASS = "kawunlere2024";
const ADMIN_SECRET_PATH = "/kawunlere-control-2024";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // ============ PUBLIC PAGES ============
    if (path === "/" || path === "/home") return html(renderHome());
    if (path === "/analyze") {
      const platforms = getAllPlatforms();
      const platformOptions = platforms.map(p => 
        `<option value="${p.id}">${p.name} — ${p.game}</option>`
      ).join("");
      return html(renderAnalyze(platformOptions));
    }
    if (path === "/ask") return html(renderAsk());
    if (path === "/dashboard" || path === "/stats") return html(renderStats());
    if (path === "/history") return html(renderHistory());
    
    // ============ ADMIN SECRET ROUTES ============
    if (path === "/kawunlere-control-2024" || path === "/kawunlere-control-2024/") {
      return checkAdmin(request, "main", env);
    }
    if (path === "/kawunlere-control-2024/chat") return checkAdmin(request, "chat", env);
    if (path === "/kawunlere-control-2024/research") return checkAdmin(request, "research", env);
    if (path === "/kawunlere-control-2024/data") return checkAdmin(request, "data", env);
    if (path === "/kawunlere-control-2024/login" && request.method === "POST") {
      return await adminLogin(request);
    }
    
    // ============ PUBLIC APIs ============
    if (path === "/api/analyze" && request.method === "POST") return json(await apiAnalyze(request, env));
    if (path === "/api/result" && request.method === "POST") return json(await apiResult(request, env));
    if (path === "/api/stats") return await apiStats(env);
    if (path === "/api/predictions") return await apiPredictions(env);
    if (path === "/api/ask" && request.method === "POST") return json(await apiAsk(request, env));
    
    // ============ ADMIN APIs ============
    if (path === "/admin/api/health") return json(await adminHealth(env));
    if (path === "/admin/api/research" && request.method === "POST") return json(await runResearch(env));
    if (path === "/admin/api/research/list") return json({ results: await getAllResearch(env) });
    if (path === "/admin/api/chat" && request.method === "POST") return json(await adminChat(request, env));
    if (path === "/admin/api/reset" && request.method === "POST") return json(await adminReset(request, env));
    if (path === "/admin/api/all-data") return json(await adminAllData(env));
    
    return new Response("404", { status: 404 });
  }
};

// ============ API HANDLERS ============

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
      h2hMeetings: parseInt(form.get("h2h_meetings")) || 0,
      h2hHome: parseInt(form.get("h2h_home")) || 0,
      h2hDraw: parseInt(form.get("h2h_draw")) || 0,
      h2hAway: parseInt(form.get("h2h_away")) || 0,
      goalsForA: parseFloat(form.get("goals_for_a")) || 7,
      goalsForB: parseFloat(form.get("goals_for_b")) || 7,
      platform: form.get("platform") || "sportybet"
    };
    
    if (input.formA.length === 0 || input.formB.length === 0) {
      return { ok: false, error: "Please enter form for both teams" };
    }
    
    const result = await analyzeMatch(env, input);
    const predId = "p_" + Date.now();
    if (env.PICKS_KV) {
      await env.PICKS_KV.put(predId, JSON.stringify({
        id: predId, time: new Date().toISOString(), platform: input.platform,
        match: input.teamA + " vs " + input.teamB, teamA: input.teamA, teamB: input.teamB,
        formA: input.formA, formB: input.formB, posA: input.posA, posB: input.posB,
        picks: result.top6, status: "pending"
      }));
    }
    return { ok: true, predId, teamA: input.teamA, teamB: input.teamB, platform: input.platform, picks: result.top6, allOptions: result.allOptions, streak: result.streak };
  } catch (e) {
    return { ok: false, error: e.message };
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
        if (s.todayDate !== new Date().toDateString()) { s.todayTotal = 0; s.todayWins = 0; s.todayDate = new Date().toDateString(); }
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
          await recordResult(env, { platform: pred.platform, match: pred.match, pick, outcome, formA: pred.formA, formB: pred.formB, posA: pred.posA, posB: pred.posB });
        }
      }
    }
    return { ok: true, stats: s };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function apiStats(env) {
  if (!env.PICKS_KV) return json({ total: 0, wins: 0 });
  const s = await env.PICKS_KV.get("stats") || '{"total":0,"wins":0}';
  return new Response(s, { headers: { "Content-Type": "application/json" } });
}

async function apiPredictions(env) {
  if (!env.PICKS_KV) return json([]);
  const list = await env.PICKS_KV.list({ prefix: "p_" });
  const preds = [];
  for (const key of list.keys.slice(-20).reverse()) {
    const v = await env.PICKS_KV.get(key.name);
    if (v) preds.push(JSON.parse(v));
  }
  return json(preds);
}

async function apiAsk(request, env) {
  try {
    const form = await request.formData();
    const question = form.get("question") || "";
    if (!question.trim()) return { ok: false, error: "Please ask a question" };
    const context = "You are the INSTANT PICKS assistant. Only discuss betting analysis. Keep under 200 words.";
    const result = await askAI(env, question, context);
    if (result.ok) return { ok: true, reply: result.reply };
    return { ok: false, error: result.error };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function adminHealth(env) {
  let stats = { total: 0, wins: 0, todayTotal: 0, todayWins: 0 };
  if (env.PICKS_KV) {
    const s = await env.PICKS_KV.get("stats");
    if (s) stats = JSON.parse(s);
  }
  const research = await getAllResearch(env);
  const patternsRaw = env.PICKS_KV ? await env.PICKS_KV.get("patterns") : null;
  const patterns = patternsRaw ? JSON.parse(patternsRaw) : { rules: {} };
  const streak = await getStreakInfo(env);
  return {
    stats, platforms: research.length, patterns: Object.keys(patterns.rules || {}).length,
    research: research.length, lastResearch: research[0]?.timestamp || "Never", streak
  };
}

async function adminChat(request, env) {
  try {
    const body = await request.json();
    const question = body.question || "";
    if (!question.trim()) return { ok: false, error: "Empty question" };
    const context = "You are the INSTANT PICKS system assistant for the owner. Be direct and technical.";
    const result = await askAI(env, question, context);
    if (result.ok) return { ok: true, reply: result.reply };
    return { ok: false, error: result.error };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function adminReset(request, env) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "stats";
  if (!env.PICKS_KV) return { ok: false, error: "No KV" };
  if (type === "stats") {
    await env.PICKS_KV.put("stats", JSON.stringify({ total: 0, wins: 0, todayTotal: 0, todayWins: 0, todayDate: new Date().toDateString() }));
    return { ok: true, message: "Stats reset" };
  }
  if (type === "patterns") {
    await env.PICKS_KV.put("patterns", JSON.stringify({ rules: {}, lastUpdate: null, totalRecorded: 0 }));
    return { ok: true, message: "Patterns reset" };
  }
  return { ok: false, error: "Unknown type" };
}

async function adminAllData(env) {
  if (!env.PICKS_KV) return { predictions: [] };
  const list = await env.PICKS_KV.list({ prefix: "p_" });
  const preds = [];
  for (const key of list.keys) {
    const v = await env.PICKS_KV.get(key.name);
    if (v) preds.push(JSON.parse(v));
  }
  return { predictions: preds.reverse() };
}

// ============ HELPERS ============

function html(content) {
  return new Response(content, { headers: { "Content-Type": "text/html" } });
}

function json(data) {
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

function checkAdmin(request, active, env) {
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("admin=1")) {
    return html(renderAdmin(active, env));
  }
  return html(renderAdminLogin());
}

async function adminLogin(request) {
  const form = await request.formData();
  const pass = form.get("password");
  if (pass === ADMIN_PASS) {
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
// Force rebuild Tue Sep  8 15:50:47 WAT 2026
