// ADMIN PANEL FUNCTIONS - Backend logic for admin operations
import { askAI } from "../engines/ai_brain.js";
import { runResearch, getAllResearch, shouldRunDailyResearch } from "../engines/research.js";
import { getAllPatterns, getStreakInfo } from "../engines/patterns.js";
import { getAllPlatforms } from "../engines/platforms.js";

const ADMIN_CONTEXT = "You are the INSTANT PICKS system assistant for the owner. You can: explain how the analysis engine works, research betting patterns, give system health updates, and execute commands. Be direct, technical, and helpful. The owner is asking about their own system.";

export async function chatWithAdmin(env, question) {
  // Add admin context
  return await askAI(env, question, ADMIN_CONTEXT);
}

export async function commandResearch(env, platform = null) {
  // Run research immediately
  const result = await runResearch(env, platform);
  return result;
}

export async function getSystemHealth(env) {
  let stats = { total: 0, wins: 0, todayTotal: 0, todayWins: 0 };
  if (env.PICKS_KV) {
    const stored = await env.PICKS_KV.get("stats");
    if (stored) stats = JSON.parse(stored);
  }
  
  const allResearch = await getAllResearch(env);
  const allPatterns = await getAllPatterns(env);
  const platforms = getAllPlatforms();
  const streak = await getStreakInfo(env);
  
  const lastResearch = allResearch.length > 0 ? allResearch[0].timestamp : "Never";
  const shouldResearch = await shouldRunDailyResearch(env);
  
  return {
    stats: stats,
    platforms: platforms.length,
    patterns: allPatterns.length,
    research: allResearch.length,
    lastResearch: lastResearch,
    needsResearch: shouldResearch,
    streak: streak
  };
}

export async function resetData(env, type) {
  if (!env.PICKS_KV) return { ok: false, error: "No KV" };
  
  if (type === "stats") {
    await env.PICKS_KV.put("stats", JSON.stringify({ total: 0, wins: 0, todayTotal: 0, todayWins: 0, todayDate: new Date().toDateString() }));
    return { ok: true, message: "Stats reset" };
  }
  
  if (type === "patterns") {
    await env.PICKS_KV.put("patterns", JSON.stringify({ rules: {}, lastUpdate: null, totalRecorded: 0 }));
    return { ok: true, message: "Patterns reset" };
  }
  
  if (type === "research") {
    const list = await env.PICKS_KV.list({ prefix: "research_" });
    for (const key of list.keys) {
      await env.PICKS_KV.delete(key.name);
    }
    return { ok: true, message: "Research data cleared" };
  }
  
  return { ok: false, error: "Unknown reset type" };
}

export async function getAllPredictions(env) {
  if (!env.PICKS_KV) return [];
  
  const list = await env.PICKS_KV.list({ prefix: "p_" });
  const preds = [];
  for (const key of list.keys) {
    const v = await env.PICKS_KV.get(key.name);
    if (v) preds.push(JSON.parse(v));
  }
  return preds.reverse(); // Newest first
}
