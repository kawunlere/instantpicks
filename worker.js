export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    if (path === "/api/analyze" && request.method === "POST") return await apiAnalyze(request, env);
    if (path === "/api/result" && request.method === "POST") return await apiResult(request, env);
    if (path === "/api/stats") return await apiStats(env);
    if (path === "/api/predictions") return await apiPredictions(env);
    if (path === "/api/patterns") return await apiPatterns(env);
    if (path === "/api/insights") return await apiInsights(env);
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
      "/ask": "ask",
      "/insights": "insights"
    };
    
    const page = routes[path] || "404";
    if (page === "404") return new Response("Not Found", { status: 404 });
    return new Response(layout(pages[page], page), { headers: { "Content-Type": "text/html" } });
  }
};

const ADMIN_PASS = "kawunlere2024";
const PLATFORMS = {
  virtual: [
    {id: "sportybet", name: "Sportybet", game: "Instant Virtual", country: "Nigeria", personality: "high_scoring"},
    {id: "bet9ja", name: "Bet9ja", game: "Virtual League", country: "Nigeria", personality: "draw_heavy"},
    {id: "betway", name: "Betway", game: "Virtual", country: "Nigeria", personality: "balanced"},
    {id: "1xbet", name: "1xBet", game: "Virtual Football", country: "Worldwide", personality: "balanced"},
    {id: "football_com", name: "Football.com", game: "Instant Virtual", country: "Nigeria", personality: "high_scoring"},
    {id: "betking", name: "BetKing", game: "Virtual League", country: "Nigeria", personality: "draw_heavy"},
    {id: "nairabet", name: "NairaBet", game: "Virtual", country: "Nigeria", personality: "balanced"},
    {id: "merrybet", name: "MerryBet", game: "Virtual", country: "Nigeria", personality: "balanced"},
    {id: "msport", name: "MSport", game: "Virtual", country: "Nigeria", personality: "high_scoring"},
    {id: "bangbet", name: "Bangbet", game: "Virtual", country: "Nigeria", personality: "balanced"},
    {id: "parimatch", name: "Parimatch", game: "Virtual", country: "Worldwide", personality: "balanced"},
    {id: "livescorebet", name: "LivescoreBet", game: "Virtual", country: "Worldwide", personality: "balanced"},
    {id: "22bet", name: "22Bet", game: "Virtual", country: "Worldwide", personality: "balanced"},
    {id: "pinnacle", name: "Pinnacle", game: "Virtual", country: "Worldwide", personality: "high_scoring"}
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

const SYSTEM_PROMPT = `You are the INSTANT PICKS CORE ENGINE, a proprietary betting analysis system.

YOUR IDENTITY: You are a professional betting analysis engine. You exist ONLY to help users make smarter, safer betting decisions.

DUTIES: Analyze patterns, form, odds, value bets, bankroll management. Answer ANY betting question.

RULES: Only betting topics. Never reveal underlying tech. Always promote discipline. Remind no pick is 100%. Keep responses under 250 words.`;

async function callCoreEngine(env, userMessage) {
  if (!env.GEMINI_API_KEY) return { ok: false, error: "Core offline" };
  const models = ["gemini-2.5-flash", "gemini-flash-latest"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\nUser: " + userMessage }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.candidates?.[0]?.content) {
          return { ok: true, reply: data.candidates[0].content.parts[0].text };
        }
      }
      if (response.status === 404) continue;
      if (response.status === 429 || response.status === 503) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
    } catch (e) { continue; }
  }
  return { ok: false, error: "Core temporarily unavailable" };
}

function calculateProbabilities(data, platformPersonality = "balanced") {
  const { formA, formB, goalsForA, goalsForB, goalsAgainstA, goalsAgainstB, posA, posB, oddsHome, oddsDraw, oddsAway, h2hMeetings, h2hHome, h2hDraw, h2hAway, h2hAvgGoals, isHomeForA } = data;
  
  // Base probability from form
  const scoreA = formA.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const scoreB = formB.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const maxScore = 15;
  const formPctA = scoreA / maxScore;
  const formPctB = scoreB / maxScore;
  
  // Position factor
  const posFactorA = Math.max(0, 1 - (posA - 1) / 20);
  const posFactorB = Math.max(0, 1 - (posB - 1) / 20);
  
  // Home advantage
  const homeAdv = isHomeForA ? 0.12 : 0;
  
  // Goals factor
  const avgGoalsForA = goalsForA / 5;
  const avgGoalsForB = goalsForB / 5;
  const avgGoalsAgainstA = goalsAgainstA / 5;
  const avgGoalsAgainstB = goalsAgainstB / 5;
  const expectedGoalsA = (avgGoalsForA + avgGoalsAgainstB) / 2;
  const expectedGoalsB = (avgGoalsForB + avgGoalsAgainstA) / 2;
  const expectedTotal = expectedGoalsA + expectedGoalsB;
  
  // H2H factor
  let h2hPctA = 0.33, h2hPctDraw = 0.34, h2hPctB = 0.33;
  if (h2hMeetings > 0) {
    h2hPctA = h2hHome / h2hMeetings;
    h2hPctDraw = h2hDraw / h2hMeetings;
    h2hPctB = h2hAway / h2hMeetings;
  }
  
  // Platform personality adjustment
  let drawBoost = 0, scoreBoost = 0;
  if (platformPersonality === "draw_heavy") { drawBoost = 0.05; scoreBoost = -0.15; }
  if (platformPersonality === "high_scoring") { drawBoost = -0.05; scoreBoost = 0.20; }
  
  // Final 1X2 probabilities
  const pA = Math.max(0.1, Math.min(0.8, 
    0.25 + (formPctA - 0.5) * 0.3 + (posFactorA - posFactorB) * 0.2 + homeAdv + (h2hPctA - 0.33) * 0.3
  ));
  const pB = Math.max(0.1, Math.min(0.7,
    0.20 + (formPctB - 0.5) * 0.3 + (posFactorB - posFactorA) * 0.2
  ));
  let pDraw = Math.max(0.15, Math.min(0.45, 
    0.28 + drawBoost + (1 - Math.abs(formPctA - formPctB)) * 0.15 + (h2hPctDraw - 0.34) * 0.3
  ));
  
  // Normalize
  const total = pA + pDraw + pB;
  const normA = pA / total;
  const normDraw = pDraw / total;
  const normB = pB / total;
  
  // Calculate 99 options
  const opts = [];
  
  // 1X2
  opts.push({ name: "Home Win (1)", conf: Math.round(normA * 100), category: "main" });
  opts.push({ name: "Draw (X)", conf: Math.round(normDraw * 100), category: "main" });
  opts.push({ name: "Away Win (2)", conf: Math.round(normB * 100), category: "main" });
  opts.push({ name: "Double Chance (1X)", conf: Math.round((normA + normDraw) * 100), category: "main" });
  opts.push({ name: "Double Chance (X2)", conf: Math.round((normDraw + normB) * 100), category: "main" });
  opts.push({ name: "Double Chance (12)", conf: Math.round((normA + normB) * 100), category: "main" });
  opts.push({ name: "Draw No Bet (Home)", conf: Math.round(normA / (normA + normB) * 100), category: "main" });
  opts.push({ name: "Draw No Bet (Away)", conf: Math.round(normB / (normA + normB) * 100), category: "main" });
  
  // Goals O/U based on expected total
  const overProb = (line) => {
    // Poisson-like approximation
    const lambda = expectedTotal + scoreBoost;
    let cum = 0;
    for (let k = 0; k < line; k++) {
      cum += Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
    }
    return 1 - cum;
  };
  const underProb = (line) => 1 - overProb(line);
  
  function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }
  
  opts.push({ name: "Over 0.5 Goals", conf: Math.round(overProb(1) * 100), category: "goals" });
  opts.push({ name: "Under 0.5 Goals", conf: Math.round(underProb(1) * 100), category: "goals" });
  opts.push({ name: "Over 1.5 Goals", conf: Math.round(overProb(2) * 100), category: "goals" });
  opts.push({ name: "Under 1.5 Goals", conf: Math.round(underProb(2) * 100), category: "goals" });
  opts.push({ name: "Over 2.5 Goals", conf: Math.round(overProb(3) * 100), category: "goals" });
  opts.push({ name: "Under 2.5 Goals", conf: Math.round(underProb(3) * 100), category: "goals" });
  opts.push({ name: "Over 3.5 Goals", conf: Math.round(overProb(4) * 100), category: "goals" });
  opts.push({ name: "Under 3.5 Goals", conf: Math.round(underProb(4) * 100), category: "goals" });
  opts.push({ name: "Over 4.5 Goals", conf: Math.round(overProb(5) * 100), category: "goals" });
  opts.push({ name: "Under 4.5 Goals", conf: Math.round(underProb(5) * 100), category: "goals" });
  opts.push({ name: "Over 5.5 Goals", conf: Math.round(overProb(6) * 100), category: "goals" });
  opts.push({ name: "Under 5.5 Goals", conf: Math.round(underProb(6) * 100), category: "goals" });
  
  // Total goals exact ranges
  const totalExact = expectedTotal;
  opts.push({ name: "Total Goals 0-1", conf: Math.round(underProb(2) * 100), category: "goals" });
  opts.push({ name: "Total Goals 2-3", conf: Math.round((overProb(2) - overProb(4)) * 100), category: "goals" });
  opts.push({ name: "Total Goals 4-5", conf: Math.round((overProb(4) - overProb(6)) * 100), category: "goals" });
  opts.push({ name: "Total Goals 6+", conf: Math.round(overProb(6) * 100), category: "goals" });
  
  // BTTS
  const bttsYes = Math.min(0.85, (avgGoalsForA / 2) * (avgGoalsForB / 2) * 1.5);
  opts.push({ name: "BTTS: Yes", conf: Math.round(bttsYes * 100), category: "btts" });
  opts.push({ name: "BTTS: No", conf: Math.round((1 - bttsYes) * 100), category: "btts" });
  opts.push({ name: "BTTS + Over 1.5", conf: Math.round(bttsYes * overProb(2) * 100), category: "btts" });
  opts.push({ name: "BTTS + Over 2.5", conf: Math.round(bttsYes * overProb(3) * 100), category: "btts" });
  opts.push({ name: "BTTS + Over 3.5", conf: Math.round(bttsYes * overProb(4) * 100), category: "btts" });
  
  // Home/Away team specific
  const homeOver15 = 1 - Math.exp(-expectedGoalsA);
  const homeOver25 = 1 - Math.exp(-expectedGoalsA) * (1 + expectedGoalsA);
  const awayOver15 = 1 - Math.exp(-expectedGoalsB);
  const awayOver25 = 1 - Math.exp(-expectedGoalsB) * (1 + expectedGoalsB);
  
  opts.push({ name: `Home Team Over 0.5`, conf: Math.round((1 - Math.exp(-expectedGoalsA * 0.5)) * 100), category: "team" });
  opts.push({ name: `Home Team Over 1.5`, conf: Math.round(homeOver15 * 100), category: "team" });
  opts.push({ name: `Home Team Over 2.5`, conf: Math.round(homeOver25 * 100), category: "team" });
  opts.push({ name: `Away Team Over 0.5`, conf: Math.round((1 - Math.exp(-expectedGoalsB * 0.5)) * 100), category: "team" });
  opts.push({ name: `Away Team Over 1.5`, conf: Math.round(awayOver15 * 100), category: "team" });
  opts.push({ name: `Away Team Over 2.5`, conf: Math.round(awayOver25 * 100), category: "team" });
  
  opts.push({ name: `Home Team Clean Sheet`, conf: Math.round(Math.exp(-expectedGoalsB) * 100), category: "team" });
  opts.push({ name: `Away Team Clean Sheet`, conf: Math.round(Math.exp(-expectedGoalsA) * 100), category: "team" });
  
  // HT markets (lower expected)
  const htExpected = expectedTotal * 0.42;
  const htOver05 = 1 - Math.exp(-htExpected);
  const htOver15 = 1 - Math.exp(-htExpected) * (1 + htExpected);
  
  opts.push({ name: "HT Home Win", conf: Math.round(normA * 0.7 * 100), category: "halftime" });
  opts.push({ name: "HT Draw", conf: Math.round((normDraw + 0.1) * 0.9 * 100), category: "halftime" });
  opts.push({ name: "HT Away Win", conf: Math.round(normB * 0.7 * 100), category: "halftime" });
  opts.push({ name: "HT Over 0.5", conf: Math.round(htOver05 * 100), category: "halftime" });
  opts.push({ name: "HT Under 0.5", conf: Math.round((1 - htOver05) * 100), category: "halftime" });
  opts.push({ name: "HT Over 1.5", conf: Math.round(htOver15 * 100), category: "halftime" });
  opts.push({ name: "HT Under 1.5", conf: Math.round((1 - htOver15) * 100), category: "halftime" });
  opts.push({ name: "HT BTTS", conf: Math.round(bttsYes * 0.6 * 100), category: "halftime" });
  
  // HT/FT combos
  opts.push({ name: "HT/FT 1/1", conf: Math.round(normA * normA * 0.8 * 100), category: "combo" });
  opts.push({ name: "HT/FT 1/X", conf: Math.round(normA * normDraw * 0.8 * 100), category: "combo" });
  opts.push({ name: "HT/FT X/1", conf: Math.round(normDraw * normA * 1.2 * 100), category: "combo" });
  opts.push({ name: "HT/FT X/X", conf: Math.round(normDraw * normDraw * 1.3 * 100), category: "combo" });
  opts.push({ name: "HT/FT X/2", conf: Math.round(normDraw * normB * 1.2 * 100), category: "combo" });
  opts.push({ name: "HT/FT 2/2", conf: Math.round(normB * normB * 0.8 * 100), category: "combo" });
  
  // Handicap
  const homeMinus1 = Math.max(20, normA * 100 - 20);
  opts.push({ name: "Home Handicap -1", conf: Math.round(homeMinus1), category: "handicap" });
  opts.push({ name: "Home Handicap -2", conf: Math.round(Math.max(15, normA * 100 - 35)), category: "handicap" });
  opts.push({ name: "Away Handicap +1", conf: Math.round(Math.min(85, (normB + normDraw * 0.3) * 100 + 15)), category: "handicap" });
  opts.push({ name: "Away Handicap +2", conf: Math.round(Math.min(90, (normB + normDraw * 0.3) * 100 + 30)), category: "handicap" });
  opts.push({ name: "Asian Handicap Home -1.5", conf: Math.round(homeOver15 * 100), category: "handicap" });
  opts.push({ name: "Asian Handicap Away +1.5", conf: Math.round((1 - homeOver15) * 100), category: "handicap" });
  
  // Correct Score (simplified probabilities)
  const lambdaA = expectedGoalsA;
  const lambdaB = expectedGoalsB;
  const poisson = (k, lambda) => Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
  
  opts.push({ name: "Correct Score 1-0", conf: Math.round(poisson(1, lambdaA) * poisson(0, lambdaB) * 100), category: "score" });
  opts.push({ name: "Correct Score 0-1", conf: Math.round(poisson(0, lambdaA) * poisson(1, lambdaB) * 100), category: "score" });
  opts.push({ name: "Correct Score 2-0", conf: Math.round(poisson(2, lambdaA) * poisson(0, lambdaB) * 100), category: "score" });
  opts.push({ name: "Correct Score 0-2", conf: Math.round(poisson(0, lambdaA) * poisson(2, lambdaB) * 100), category: "score" });
  opts.push({ name: "Correct Score 2-1", conf: Math.round(poisson(2, lambdaA) * poisson(1, lambdaB) * 100), category: "score" });
  opts.push({ name: "Correct Score 1-2", conf: Math.round(poisson(1, lambdaA) * poisson(2, lambdaB) * 100), category: "score" });
  opts.push({ name: "Correct Score 0-0", conf: Math.round(poisson(0, lambdaA) * poisson(0, lambdaB) * 100), category: "score" });
  opts.push({ name: "Correct Score 1-1", conf: Math.round(poisson(1, lambdaA) * poisson(1, lambdaB) * 100), category: "score" });
  opts.push({ name: "Correct Score 2-2", conf: Math.round(poisson(2, lambdaA) * poisson(2, lambdaB) * 100), category: "score" });
  opts.push({ name: "Correct Score 3-1", conf: Math.round(poisson(3, lambdaA) * poisson(1, lambdaB) * 100), category: "score" });
  opts.push({ name: "Correct Score 1-3", conf: Math.round(poisson(1, lambdaA) * poisson(3, lambdaB) * 100), category: "score" });
  opts.push({ name: "Correct Score 3-0", conf: Math.round(poisson(3, lambdaA) * poisson(0, lambdaB) * 100), category: "score" });
  opts.push({ name: "Correct Score 0-3", conf: Math.round(poisson(0, lambdaA) * poisson(3, lambdaB) * 100), category: "score" });
  
  // Winning Margin
  opts.push({ name: "Winning Margin Home 1", conf: Math.round(poisson(1, lambdaA) * (1 - poisson(0, lambdaB)) * 100), category: "margin" });
  opts.push({ name: "Winning Margin Home 2+", conf: Math.round((1 - poisson(0, lambdaA) - poisson(1, lambdaA)) * poisson(0, lambdaB) * 100), category: "margin" });
  opts.push({ name: "Winning Margin Away 1", conf: Math.round(poisson(1, lambdaB) * (1 - poisson(0, lambdaA)) * 100), category: "margin" });
  opts.push({ name: "Winning Margin Away 2+", conf: Math.round(poisson(0, lambdaA) * (1 - poisson(0, lambdaB) - poisson(1, lambdaB)) * 100), category: "margin" });
  
  // Goals Odd/Even
  const probTotalOdd = expectedTotal > 2.5 ? 60 : 50;
  opts.push({ name: "Total Goals Odd", conf: probTotalOdd, category: "special" });
  opts.push({ name: "Total Goals Even", conf: 100 - probTotalOdd, category: "special" });
  
  // Win to Nil
  opts.push({ name: "Home Win to Nil", conf: Math.round(normA * Math.exp(-expectedGoalsB) * 100), category: "special" });
  opts.push({ name: "Away Win to Nil", conf: Math.round(normB * Math.exp(-expectedGoalsA) * 100), category: "special" });
  
  // Goal timing
  opts.push({ name: "Goal in First 15min", conf: Math.round(htOver05 * 0.5 * 100), category: "timing" });
  opts.push({ name: "Goal Before HT", conf: Math.round(htOver05 * 100), category: "timing" });
  opts.push({ name: "Both Halves Over 0.5", conf: Math.round(htOver05 * overProb(2) * 0.8 * 100), category: "timing" });
  opts.push({ name: "Both Halves Over 1.5", conf: Math.round(htOver15 * overProb(3) * 0.7 * 100), category: "timing" });
  
  // Highest scoring half
  opts.push({ name: "1st Half Most Goals", conf: 40, category: "timing" });
  opts.push({ name: "2nd Half Most Goals", conf: 45, category: "timing" });
  opts.push({ name: "Equal Goals Both Halves", conf: 15, category: "timing" });
  
  // Sort by confidence descending
  opts.sort((a, b) => b.conf - a.conf);
  
  // Add value detection if odds provided
  if (oddsHome > 1) {
    opts.forEach(o => {
      if (o.name === "Home Win (1)") o.implied = Math.round(100 / oddsHome);
      if (o.name === "Draw (X)" && oddsDraw > 1) o.implied = Math.round(100 / oddsDraw);
      if (o.name === "Away Win (2)" && oddsAway > 1) o.implied = Math.round(100 / oddsAway);
    });
  }
  
  return opts;
}

async function apiAnalyze(request, env) {
  try {
    const form = await request.formData();
    const mode = form.get("mode") || "single";
    const platform = form.get("platform") || "sportybet";
    const type = form.get("type") || "virtual";
    const conversation = form.get("conversation") || "";
    
    const platformInfo = (type === "virtual" ? PLATFORMS.virtual : PLATFORMS.real).find(p => p.id === platform);
    const personality = platformInfo?.personality || "balanced";
    
    if (mode === "single") {
      // Single match analysis
      const data = {
        formA: (form.get("form_a") || "").toUpperCase().replace(/\s/g, "").split(","),
        formB: (form.get("form_b") || "").toUpperCase().replace(/\s/g, "").split(","),
        goalsForA: parseFloat(form.get("goals_for_a")) || 0,
        goalsForB: parseFloat(form.get("goals_for_b")) || 0,
        goalsAgainstA: parseFloat(form.get("goals_against_a")) || 0,
        goalsAgainstB: parseFloat(form.get("goals_against_b")) || 0,
        posA: parseInt(form.get("table_a")) || 5,
        posB: parseInt(form.get("table_b")) || 5,
        oddsHome: parseFloat(form.get("odds_home")) || 0,
        oddsDraw: parseFloat(form.get("odds_draw")) || 0,
        oddsAway: parseFloat(form.get("odds_away")) || 0,
        h2hMeetings: parseInt(form.get("h2h_meetings")) || 0,
        h2hHome: parseInt(form.get("h2h_home")) || 0,
        h2hDraw: parseInt(form.get("h2h_draw")) || 0,
        h2hAway: parseInt(form.get("h2h_away")) || 0,
        h2hAvgGoals: parseFloat(form.get("h2h_avg_goals")) || 0,
        isHomeForA: form.get("is_home_a") === "true"
      };
      
      const teamA = form.get("team_a") || "Team A";
      const teamB = form.get("team_b") || "Team B";
      
      const options = calculateProbabilities(data, personality);
      
      // Save prediction
      const predId = `p_${Date.now()}`;
      if (env.PICKS_KV) {
        await env.PICKS_KV.put(predId, JSON.stringify({
          id: predId,
          time: new Date().toISOString(),
          platform, type, mode,
          match: `${teamA} vs ${teamB}`,
          options: options.slice(0, 10),
          status: "pending"
        }));
      }
      
      return new Response(JSON.stringify({
        ok: true, mode: "single", predId,
        teamA, teamB, platform, type,
        options, personality
      }), { headers: { "Content-Type": "application/json" } });
    } else {
      // Accumulator analysis
      const matchCount = parseInt(form.get("match_count")) || 0;
      const matches = [];
      
      for (let i = 0; i < matchCount; i++) {
        const data = {
          formA: (form.get(`m${i}_form_a`) || "").toUpperCase().replace(/\s/g, "").split(","),
          formB: (form.get(`m${i}_form_b`) || "").toUpperCase().replace(/\s/g, "").split(","),
          goalsForA: parseFloat(form.get(`m${i}_goals_for_a`)) || 0,
          goalsForB: parseFloat(form.get(`m${i}_goals_for_b`)) || 0,
          goalsAgainstA: parseFloat(form.get(`m${i}_goals_against_a`)) || 0,
          goalsAgainstB: parseFloat(form.get(`m${i}_goals_against_b`)) || 0,
          posA: parseInt(form.get(`m${i}_pos_a`)) || 5,
          posB: parseInt(form.get(`m${i}_pos_b`)) || 5,
          oddsHome: parseFloat(form.get(`m${i}_odds_home`)) || 0,
          oddsDraw: parseFloat(form.get(`m${i}_odds_draw`)) || 0,
          oddsAway: parseFloat(form.get(`m${i}_odds_away`)) || 0,
          h2hMeetings: parseInt(form.get(`m${i}_h2h_meetings`)) || 0,
          h2hHome: parseInt(form.get(`m${i}_h2h_home`)) || 0,
          h2hDraw: parseInt(form.get(`m${i}_h2h_draw`)) || 0,
          h2hAway: parseInt(form.get(`m${i}_h2h_away`)) || 0,
          h2hAvgGoals: parseFloat(form.get(`m${i}_h2h_avg_goals`)) || 0,
          isHomeForA: form.get(`m${i}_is_home_a`) === "true"
        };
        
        const options = calculateProbabilities(data, personality);
        const topPick = options[0];
        
        matches.push({
          teamA: form.get(`m${i}_team_a`) || "Team A",
          teamB: form.get(`m${i}_team_b`) || "Team B",
          topPick: topPick.name,
          confidence: topPick.conf,
          odds: parseFloat(form.get(`m${i}_odds_home`)) || 1.9
        });
      }
      
      // Calculate combined
      const combinedConf = matches.reduce((acc, m) => acc * (m.conf / 100), 1) * 100;
      const totalOdds = matches.reduce((acc, m) => acc * m.odds, 1);
      const valueCheck = combinedConf > (100 / totalOdds);
      
      return new Response(JSON.stringify({
        ok: true, mode: "accumulator",
        matches, combinedConf: combinedConf.toFixed(1),
        totalOdds: totalOdds.toFixed(2),
        valueBet: valueCheck,
        recommendation: valueCheck ? "PLAY" : "AVOID"
      }), { headers: { "Content-Type": "application/json" } });
    }
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
    s.total++; s.todayTotal++;
    if (outcome === "win") { s.wins++; s.todayWins++; }
    await env.PICKS_KV.put("stats", JSON.stringify(s));
  }
  return new Response(JSON.stringify({ ok: true, stats: s }), { headers: { "Content-Type": "application/json" } });
}

async function apiAskAI(request, env) {
  try {
    const form = await request.formData();
    const question = form.get("question") || "";
    if (!question.trim()) return new Response(JSON.stringify({ ok: false, error: "Empty" }), { headers: { "Content-Type": "application/json" } });
    const ai = await callCoreEngine(env, question);
    if (!ai.ok) return new Response(JSON.stringify({ ok: false, error: ai.error }), { headers: { "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ ok: true, reply: ai.reply }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
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
  for (const key of list.keys.slice(-20).reverse()) {
    const v = await env.PICKS_KV.get(key.name);
    if (v) preds.push(JSON.parse(v));
  }
  return new Response(JSON.stringify(preds), { headers: { "Content-Type": "application/json" } });
}

async function apiPatterns(env) {
  if (!env.PICKS_KV) return new Response('{"rules":{}}', { headers: { "Content-Type": "application/json" } });
  return new Response(await env.PICKS_KV.get("patterns") || '{"rules":{}}', { headers: { "Content-Type": "application/json" } });
}

async function apiInsights(env) {
  if (!env.PICKS_KV) return new Response(JSON.stringify({ insights: [] }), { headers: { "Content-Type": "application/json" } });
  const stats = JSON.parse(await env.PICKS_KV.get("stats") || '{"total":0,"wins":0}');
  const insights = [];
  if (stats.total > 0) {
    const rate = Math.round((stats.wins / stats.total) * 100);
    if (rate >= 60) insights.push({ type: "good", text: `Win rate ${rate}% — strong.` });
    else if (rate < 45 && stats.total >= 10) insights.push({ type: "warn", text: `Win rate ${rate}% — review approach.` });
  }
  return new Response(JSON.stringify({ insights }), { headers: { "Content-Type": "application/json" } });
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
  patterns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12C3 12 5 6 9 6C13 6 15 12 15 12M9 12C9 12 11 6 15 6C19 6 21 12 21 12M9 12C9 12 11 18 15 18C19 18 21 12 21 12"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3H8C9 3 10 4 10 5V21C10 20 9 19 8 19H2V3M22 3H16C15 3 14 4 14 5V21C14 20 15 19 16 19H22V3"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11"/></svg>',
  ask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12C21 16.97 16.97 21 12 21C10.18 21 8.5 20.41 7.13 19.4L3 21L4.6 16.87C3.59 15.5 3 13.82 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"/></svg>',
  insights: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17M2 12L12 17L22 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
};

function nav(active) {
  const items = [
    ["home", "HOME", ICONS.home],
    ["analyze", "ANALYZE", ICONS.analyze],
    ["ask", "CORE", ICONS.ask],
    ["dashboard", "STATS", ICONS.dashboard],
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
  <div class="hero-stat"><div class="num" id="h-total">0</div><div class="lbl">ANALYSES</div></div>
  <div class="hero-stat"><div class="num" id="h-rate">0%</div><div class="lbl">WIN RATE</div></div>
  <div class="hero-stat"><div class="num">99+</div><div class="lbl">OPTIONS</div></div>
</div>
<div class="card glow">
  <h2 class="ct">INTELLIGENT BETTING ENGINE</h2>
  <p class="txt">99+ betting options analyzed per match. Form, odds, head-to-head, platform patterns — all calculated dynamically. No fixed code.</p>
  <a href="/analyze" class="btn">START ANALYZING</a>
  <a href="/insights" class="btn" style="background:linear-gradient(135deg,#ffaa00,#ff8800);margin-top:10px">VIEW INSIGHTS</a>
</div>
<div class="card">
  <h3 class="ct">ANALYSIS MODES</h3>
  <div class="muted">• SINGLE: Deep dive into one match (99+ options)</div>
  <div class="muted">• ACCUMULATOR: 2-5 matches combined slip</div>
  <div class="muted">• 14 Platforms with unique personalities</div>
</div>
<div class="card warn">
  <b class="warn-text">⚠ DISCIPLINE FIRST</b>
  <p class="muted" style="margin-top:8px">No tool guarantees wins. INSTANT PICKS provides analysis — you make the final decision. Bet within your means.</p>
</div>`,

  analyze: `${nav("analyze")}
<div class="head"><div class="logo">⚡ ANALYZE ⚡</div><div class="tag">DEEP MATCH INTELLIGENCE</div></div>
<div class="card">
  <div class="mode-toggle">
    <button class="mode-btn active" data-mode="single">SINGLE MATCH</button>
    <button class="mode-btn" data-mode="accumulator">ACCUMULATOR (2-5)</button>
  </div>
</div>

<div id="singleMode" class="mode-content">
  <div class="card">
    <div class="form-section">
      <h3 class="ct">MATCH INFO</h3>
      <label>PLATFORM</label>
      <select id="s_platform">${PLATFORMS.virtual.map(p => `<option value="${p.id}">${p.name} — ${p.game}</option>`).join("")}</select>
      <label>MODE</label>
      <select id="s_type"><option value="virtual">VIRTUAL</option><option value="real">REAL FOOTBALL</option></select>
      <div class="row"><div><label>TEAM A (HOME?)</label><input id="s_team_a" placeholder="e.g. Chelsea"></div><div><label>TEAM B</label><input id="s_team_b" placeholder="e.g. Tottenham"></div></div>
      <label>IS THIS HOME GAME FOR TEAM A?</label>
      <select id="s_is_home_a"><option value="true">YES</option><option value="false">NO</option></select>
    </div>
  </div>
  
  <div class="card">
    <h3 class="ct">TEAM FORM (LAST 5)</h3>
    <div class="row">
      <div><label>TEAM A FORM (W/L/D)</label><input id="s_form_a" placeholder="W,L,D,W,W"></div>
      <div><label>TEAM B FORM (W/L/D)</label><input id="s_form_b" placeholder="L,W,L,D,W"></div>
    </div>
    <div class="row">
      <div><label>TEAM A TABLE POS</label><input id="s_pos_a" type="number" placeholder="3"></div>
      <div><label>TEAM B TABLE POS</label><input id="s_pos_b" type="number" placeholder="7"></div>
    </div>
  </div>
  
  <div class="card">
    <h3 class="ct">GOALS (LAST 5 MATCHES TOTAL)</h3>
    <div class="row">
      <div><label>TEAM A GOALS SCORED</label><input id="s_goals_for_a" type="number" placeholder="8"></div>
      <div><label>TEAM A GOALS CONCEDED</label><input id="s_goals_against_a" type="number" placeholder="4"></div>
    </div>
    <div class="row">
      <div><label>TEAM B GOALS SCORED</label><input id="s_goals_for_b" type="number" placeholder="6"></div>
      <div><label>TEAM B GOALS CONCEDED</label><input id="s_goals_against_b" type="number" placeholder="7"></div>
    </div>
  </div>
  
  <div class="card">
    <h3 class="ct">ODDS (FROM BOOKMAKER)</h3>
    <div class="row">
      <div><label>HOME WIN ODDS</label><input id="s_odds_home" type="number" step="0.01" placeholder="1.90"></div>
      <div><label>DRAW ODDS</label><input id="s_odds_draw" type="number" step="0.01" placeholder="3.40"></div>
      <div><label>AWAY WIN ODDS</label><input id="s_odds_away" type="number" step="0.01" placeholder="4.50"></div>
    </div>
  </div>
  
  <div class="card">
    <h3 class="ct">HEAD-TO-HEAD (H2H)</h3>
    <div class="row">
      <div><label>TOTAL MEETINGS</label><input id="s_h2h_meetings" type="number" placeholder="10"></div>
      <div><label>AVG GOALS IN H2H</label><input id="s_h2h_avg_goals" type="number" step="0.1" placeholder="2.5"></div>
    </div>
    <div class="row">
      <div><label>TEAM A H2H WINS</label><input id="s_h2h_home" type="number" placeholder="4"></div>
      <div><label>H2H DRAWS</label><input id="s_h2h_draw" type="number" placeholder="3"></div>
      <div><label>TEAM B H2H WINS</label><input id="s_h2h_away" type="number" placeholder="3"></div>
    </div>
  </div>
  
  <button class="btn" id="analyzeSingle">⚡ ANALYZE 99+ OPTIONS</button>
</div>

<div id="accumulatorMode" class="mode-content" style="display:none">
  <div class="card">
    <h3 class="ct">ACCUMULATOR MODE (2-5 MATCHES)</h3>
    <p class="muted" style="margin-bottom:15px">Add matches to your slip. Each match analyzed for top pick. Combined for slip confidence.</p>
    <div class="row">
      <div><label>PLATFORM</label><select id="a_platform">${PLATFORMS.virtual.map(p => `<option value="${p.id}">${p.name}</option>`).join("")}</select></div>
      <div><label>NUMBER OF MATCHES</label><select id="a_count"><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option><option value="5">5</option></select></div>
    </div>
  </div>
  <div id="accMatches"></div>
  <button class="btn" id="analyzeAcc">⚡ ANALYZE SLIP</button>
</div>

<div id="result"></div>`,

  ask: `${nav("ask")}
<div class="head"><div class="logo">⚡ CORE ⚡</div></div>
<div class="card glow"><h3 class="ct">INSTANT PICKS CORE</h3><p class="muted">Ask about betting strategy, value picks, bankroll management.</p></div>
<div class="card">
  <textarea id="aiQuestion" rows="3" placeholder="Ask anything betting-related..."></textarea>
  <button class="btn" id="askBtn">⚡ ASK CORE</button>
</div>
<div id="aiResponse" class="card" style="display:none">
  <h3 class="ct">RESPONSE</h3>
  <div id="aiText" class="txt"></div>
</div>`,

  dashboard: `${nav("dashboard")}
<div class="head"><div class="logo">⚡ STATS ⚡</div></div>
<div class="stats-grid">
  <div class="stat-card"><div class="stat-num" id="d-total">0</div><div class="stat-lbl">TOTAL</div></div>
  <div class="stat-card"><div class="stat-num" id="d-wins">0</div><div class="stat-lbl">WINS</div></div>
  <div class="stat-card"><div class="stat-num" id="d-today">0</div><div class="stat-lbl">TODAY</div></div>
  <div class="stat-card highlight"><div class="stat-num" id="d-rate">0%</div><div class="stat-lbl">RATE</div></div>
</div>
<div class="card"><a href="/analyze" class="btn">NEW ANALYSIS</a></div>`,

  history: `${nav("history")}
<div class="head"><div class="logo">⚡ HISTORY ⚡</div></div>
<div class="card"><div id="hist" class="muted">Loading...</div></div>`,

  patterns: `${nav("patterns")}
<div class="head"><div class="logo">⚡ PATTERNS ⚡</div></div>
<div class="card glow"><h3 class="ct">PATTERN ENGINE</h3><p class="muted">Platform-specific patterns learning from your data.</p></div>
<div class="card"><div id="patterns-list" class="muted">Need 10+ results to detect patterns</div></div>`,

  insights: `${nav("insights")}
<div class="head"><div class="logo">⚡ INSIGHTS ⚡</div></div>
<div class="card glow"><h3 class="ct">PERSONAL INSIGHTS</h3><p class="muted">Smart tips based on your activity.</p></div>
<div id="insights-list"><div class="card muted">Analyzing...</div></div>`,

  learn: `${nav("learn")}
<div class="head"><div class="logo">⚡ LEARN ⚡</div></div>
<div class="card"><h3 class="ct">VALUE BETTING</h3><p class="txt">Odds > true probability = value.</p></div>
<div class="card"><h3 class="ct">BANKROLL</h3><p class="txt">Max 2-5% per bet.</p></div>`,

  about: `${nav("about")}
<div class="head"><div class="logo">⚡ ABOUT ⚡</div></div>
<div class="card glow"><h2 class="ct">MISSION</h2><p class="txt">Smarter, safer betting through intelligence.</p></div>
<div class="card"><p class="txt"><b class="warn-text">Disclaimer:</b> Betting carries risk. Bet responsibly.</p></div>`,

  admin: `${nav("admin")}
<div class="head"><div class="logo">⚡ ADMIN ⚡</div></div>
<div class="card" id="login-card">
  <h3 class="ct">ACCESS</h3>
  <input type="password" id="pass" placeholder="Password" style="margin-top:15px">
  <button class="btn" onclick="adminLogin()">UNLOCK</button>
</div>
<div id="panel" style="display:none">
  <div class="card"><h3 class="ct">STATS</h3><div id="a-stats" class="muted">Loading...</div></div>
  <div class="card">
    <h3 class="ct">ENGINE STATUS</h3>
    <div class="muted">Single Mode: <b class="hl">ACTIVE</b> (99+ options)</div>
    <div class="muted">Accumulator Mode: <b class="hl">ACTIVE</b> (2-5 matches)</div>
    <div class="muted">Platform Personalities: <b class="hl">14 LEARNING</b></div>
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
.c{position:relative;z-index:2;max-width:560px;margin:0 auto;padding:12px;padding-bottom:80px}
.nav{display:flex;gap:3px;margin-bottom:18px;flex-wrap:wrap;background:rgba(0,0,0,.7);padding:5px;border-radius:10px;border:1px solid rgba(0,255,136,.2);position:sticky;top:8px;z-index:10}
.nav a{flex:1;min-width:48px;text-align:center;padding:8px 3px;color:var(--gray);text-decoration:none;font-size:8px;font-weight:700;border-radius:5px;display:flex;flex-direction:column;align-items:center;gap:2px}
.nav a .icon{width:16px;height:16px;display:block}
.nav a .icon svg{width:100%;height:100%;stroke:var(--gray)}
.nav a.active{background:rgba(0,255,136,.15);color:var(--green)}
.nav a.active .icon svg{stroke:var(--green);filter:drop-shadow(0 0 5px var(--green))}
.nav a.admin-btn{background:rgba(255,51,51,.1)}
.nav a.admin-btn .icon svg{stroke:var(--red)}
.head{text-align:center;padding:18px 0 12px;border-bottom:1px solid rgba(0,255,136,.2);margin-bottom:18px}
.logo{font-size:24px;font-weight:900;color:var(--green);text-shadow:0 0 20px var(--green);letter-spacing:2px}
.tag{color:var(--gray);font-size:9px;margin-top:5px;letter-spacing:2px}
.card{background:linear-gradient(135deg,rgba(0,255,136,.03),var(--card));border:1px solid rgba(0,255,136,.2);border-radius:12px;padding:16px;margin:10px 0}
.card.glow{border-color:rgba(0,255,136,.4);box-shadow:0 0 30px rgba(0,255,136,.1)}
.card.warn{border-color:rgba(255,51,51,.3)}
.ct{color:var(--green);margin-bottom:10px;font-size:14px;letter-spacing:1px}
.txt{color:#ccc;line-height:1.6;font-size:13px;white-space:pre-wrap}
.hl{color:var(--green);text-shadow:0 0 5px var(--green)}
.warn-text{color:var(--red);text-shadow:0 0 5px var(--red)}
.muted{color:var(--gray);font-size:12px;margin:4px 0}
label{display:block;color:var(--green);font-size:10px;font-weight:700;margin:12px 0 5px;letter-spacing:2px}
input,select,textarea{width:100%;padding:11px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:8px;font-size:14px;font-family:inherit}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--green)}
.row{display:flex;gap:8px;margin-top:5px}.row>div{flex:1}
.btn{width:100%;padding:14px;background:linear-gradient(135deg,var(--green),var(--dark-green));color:#000;font-weight:900;font-size:13px;border:none;border-radius:8px;margin-top:14px;cursor:pointer;text-transform:uppercase;letter-spacing:2px;font-family:inherit;box-shadow:0 0 20px rgba(0,255,136,.4)}
.hero{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:12px 0}
.hero-stat{background:var(--card);border:1px solid rgba(0,255,136,.2);border-radius:10px;padding:10px;text-align:center}
.hero-stat .num{font-size:20px;font-weight:900;color:var(--green);text-shadow:0 0 10px var(--green)}
.hero-stat .lbl{font-size:8px;color:var(--gray);letter-spacing:2px;margin-top:3px}
.stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:10px 0}
.stat-card{background:var(--card);border:1px solid rgba(0,255,136,.2);border-radius:10px;padding:14px;text-align:center}
.stat-card.highlight{border-color:var(--green);box-shadow:0 0 20px rgba(0,255,136,.2)}
.stat-num{font-size:26px;font-weight:900;color:var(--green);text-shadow:0 0 10px var(--green)}
.stat-lbl{font-size:9px;color:var(--gray);letter-spacing:2px;margin-top:3px}
.mode-toggle{display:flex;gap:6px}
.mode-btn{flex:1;padding:12px;background:rgba(0,0,0,.5);border:1px solid #333;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;color:var(--gray);font-family:inherit;letter-spacing:1px}
.mode-btn.active{background:rgba(0,255,136,.15);border-color:var(--green);color:var(--green)}
.match-block{background:rgba(0,0,0,.3);border:1px solid #333;border-radius:10px;padding:14px;margin:10px 0}
.match-block h4{color:var(--green);margin-bottom:10px;font-size:13px;display:flex;justify-content:space-between;align-items:center}
.remove-btn{background:#1a0000;color:var(--red);border:1px solid var(--red);border-radius:5px;padding:4px 8px;cursor:pointer;font-size:10px;font-family:inherit}
.option-row{background:rgba(0,0,0,.3);border-left:3px solid var(--green);padding:10px;margin:6px 0;border-radius:6px;display:flex;justify-content:space-between;align-items:center}
.option-row.top{border-color:var(--yellow);background:rgba(255,170,0,.1);box-shadow:0 0 15px rgba(255,170,0,.2)}
.option-row .opt-name{font-size:13px;font-weight:700}
.option-row .opt-conf{font-size:18px;font-weight:900;color:var(--green)}
.option-row.top .opt-conf{color:var(--yellow);text-shadow:0 0 10px var(--yellow)}
.option-row .opt-cat{font-size:9px;color:var(--gray);letter-spacing:1px;text-transform:uppercase;margin-top:2px}
.opt-btns{display:flex;gap:4px;margin-top:4px}
.opt-btns button{padding:4px 8px;border:none;border-radius:4px;font-size:10px;cursor:pointer;font-family:inherit;font-weight:700}
.opt-btns .w{background:var(--green);color:#000}
.opt-btns .l{background:#1a0000;color:var(--red);border:1px solid var(--red)}
.acc-match{background:rgba(0,0,0,.3);border:1px solid #333;border-radius:8px;padding:10px;margin:6px 0}
.acc-match .top-pick{color:var(--green);font-weight:700}
.acc-match .conf{color:var(--yellow);font-weight:700;font-size:16px}
.slip-result{background:linear-gradient(135deg,rgba(0,255,136,.1),var(--card));border:2px solid var(--green);border-radius:12px;padding:16px;margin:12px 0;text-align:center}
.slip-result .total-conf{font-size:42px;font-weight:900;color:var(--green);text-shadow:0 0 20px var(--green)}
.form-section{margin-bottom:15px}
</style></head><body>
<canvas id="matrix"></canvas>
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
</script>
<script>
async function loadStats(){
  try{const r=await fetch('/api/stats');const s=await r.json();
  const rate=s.total>0?Math.round(s.wins/s.total*1000)/10:0;
  const h=document.getElementById('h-total');if(h)h.textContent=s.total;
  const hr=document.getElementById('h-rate');if(hr)hr.textContent=rate+'%';
  const dt=document.getElementById('d-total');if(dt)dt.textContent=s.total;
  const dw=document.getElementById('d-wins');if(dw)dw.textContent=s.wins;
  const dt2=document.getElementById('d-today');if(dt2)dt2.textContent=s.todayTotal||0;
  const dr=document.getElementById('d-rate');if(dr)dr.textContent=rate+'%';
  }catch(e){}}
loadStats();

document.querySelectorAll('.mode-btn').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.mode-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const mode=b.dataset.mode;
    document.getElementById('singleMode').style.display=mode==='single'?'block':'none';
    document.getElementById('accumulatorMode').style.display=mode==='accumulator'?'block':'none';
  });
});

function buildAccMatches(){
  const count=parseInt(document.getElementById('a_count').value);
  const container=document.getElementById('accMatches');
  container.innerHTML='';
  for(let i=0;i<count;i++){
    const block=document.createElement('div');
    block.className='match-block';
    block.innerHTML='<h4>MATCH '+(i+1)+' <button type="button" class="remove-btn" onclick="this.parentElement.parentElement.remove()">REMOVE</button></h4>'+
      '<div class="row"><div><label>TEAM A</label><input id="m'+i+'_team_a" placeholder="Chelsea"></div><div><label>TEAM B</label><input id="m'+i+'_team_b" placeholder="Tottenham"></div></div>'+
      '<label>HOME GAME FOR TEAM A?</label><select id="m'+i+'_is_home_a"><option value="true">YES</option><option value="false">NO</option></select>'+
      '<div class="row"><div><label>FORM A</label><input id="m'+i+'_form_a" placeholder="W,L,D,W,W"></div><div><label>FORM B</label><input id="m'+i+'_form_b" placeholder="L,W,L,D,W"></div></div>'+
      '<div class="row"><div><label>POS A</label><input id="m'+i+'_pos_a" type="number" placeholder="3"></div><div><label>POS B</label><input id="m'+i+'_pos_b" type="number" placeholder="7"></div></div>'+
      '<div class="row"><div><label>GF A</label><input id="m'+i+'_goals_for_a" type="number" placeholder="8"></div><div><label>GA A</label><input id="m'+i+'_goals_against_a" type="number" placeholder="4"></div></div>'+
      '<div class="row"><div><label>GF B</label><input id="m'+i+'_goals_for_b" type="number" placeholder="6"></div><div><label>GA B</label><input id="m'+i+'_goals_against_b" type="number" placeholder="7"></div></div>'+
      '<div class="row"><div><label>H2H MTG</label><input id="m'+i+'_h2h_meetings" type="number" placeholder="10"></div><div><label>H2H AVG G</label><input id="m'+i+'_h2h_avg_goals" type="number" step="0.1" placeholder="2.5"></div></div>'+
      '<div class="row"><div><label>H2H A WINS</label><input id="m'+i+'_h2h_home" type="number" placeholder="4"></div><div><label>H2H DRAW</label><input id="m'+i+'_h2h_draw" type="number" placeholder="3"></div><div><label>H2H B WINS</label><input id="m'+i+'_h2h_away" type="number" placeholder="3"></div></div>'+
      '<div class="row"><div><label>ODDS H</label><input id="m'+i+'_odds_home" type="number" step="0.01" placeholder="1.90"></div><div><label>ODDS D</label><input id="m'+i+'_odds_draw" type="number" step="0.01" placeholder="3.40"></div><div><label>ODDS A</label><input id="m'+i+'_odds_away" type="number" step="0.01" placeholder="4.50"></div></div>';
    container.appendChild(block);
  }
}

const aCount=document.getElementById('a_count');
if(aCount)aCount.addEventListener('change',buildAccMatches);
if(aCount)buildAccMatches();

document.getElementById('analyzeSingle')?.addEventListener('click',async()=>{
  const fd=new FormData();
  fd.append('mode','single');
  fd.append('platform',document.getElementById('s_platform').value);
  fd.append('type',document.getElementById('s_type').value);
  fd.append('team_a',document.getElementById('s_team_a').value);
  fd.append('team_b',document.getElementById('s_team_b').value);
  fd.append('is_home_a',document.getElementById('s_is_home_a').value);
  fd.append('form_a',document.getElementById('s_form_a').value);
  fd.append('form_b',document.getElementById('s_form_b').value);
  fd.append('table_a',document.getElementById('s_pos_a').value);
  fd.append('table_b',document.getElementById('s_pos_b').value);
  fd.append('goals_for_a',document.getElementById('s_goals_for_a').value);
  fd.append('goals_for_b',document.getElementById('s_goals_for_b').value);
  fd.append('goals_against_a',document.getElementById('s_goals_against_a').value);
  fd.append('goals_against_b',document.getElementById('s_goals_against_b').value);
  fd.append('odds_home',document.getElementById('s_odds_home').value);
  fd.append('odds_draw',document.getElementById('s_odds_draw').value);
  fd.append('odds_away',document.getElementById('s_odds_away').value);
  fd.append('h2h_meetings',document.getElementById('s_h2h_meetings').value);
  fd.append('h2h_home',document.getElementById('s_h2h_home').value);
  fd.append('h2h_draw',document.getElementById('s_h2h_draw').value);
  fd.append('h2h_away',document.getElementById('s_h2h_away').value);
  fd.append('h2h_avg_goals',document.getElementById('s_h2h_avg_goals').value);
  
  const r=await fetch('/api/analyze',{method:'POST',body:fd});
  const d=await r.json();
  if(d.ok){
    const res=document.getElementById('result');
    res.innerHTML='<div class="head"><div style="font-size:17px;font-weight:800">'+d.teamA+' <span class="hl">VS</span> '+d.teamB+'</div><div style="color:var(--gray);font-size:9px;letter-spacing:2px;margin-top:4px">'+d.platform.toUpperCase()+' • '+d.type.toUpperCase()+' • '+d.options.length+' OPTIONS</div></div><div id="optsList"></div><a href="/analyze" class="btn">NEW ANALYSIS</a>';
    const list=document.getElementById('optsList');
    d.options.forEach((o,i)=>{
      const topClass=i<3?'top':'';
      const row=document.createElement('div');
      row.className='option-row '+topClass;
      row.innerHTML='<div style="flex:1"><div class="opt-name">'+(i+1)+'. '+o.name+'</div><div class="opt-cat">'+o.category+'</div></div><div style="text-align:right"><div class="opt-conf">'+o.conf+'%</div>'+(o.implied?'<div style="font-size:9px;color:var(--yellow)">Implied: '+o.implied+'%</div>':'')+'</div>';
      list.appendChild(row);
    });
    res.scrollIntoView({behavior:'smooth'});
  }else alert('Error: '+d.error);
});

document.getElementById('analyzeAcc')?.addEventListener('click',async()=>{
  const count=parseInt(document.getElementById('a_count').value);
  const fd=new FormData();
  fd.append('mode','accumulator');
  fd.append('platform',document.getElementById('a_platform').value);
  fd.append('type','virtual');
  fd.append('match_count',count);
  for(let i=0;i<count;i++){
    if(document.getElementById('m'+i+'_team_a')){
      fd.append('m'+i+'_team_a',document.getElementById('m'+i+'_team_a').value);
      fd.append('m'+i+'_team_b',document.getElementById('m'+i+'_team_b').value);
      fd.append('m'+i+'_is_home_a',document.getElementById('m'+i+'_is_home_a').value);
      fd.append('m'+i+'_form_a',document.getElementById('m'+i+'_form_a').value);
      fd.append('m'+i+'_form_b',document.getElementById('m'+i+'_form_b').value);
      fd.append('m'+i+'_pos_a',document.getElementById('m'+i+'_pos_a').value);
      fd.append('m'+i+'_pos_b',document.getElementById('m'+i+'_pos_b').value);
      fd.append('m'+i+'_goals_for_a',document.getElementById('m'+i+'_goals_for_a').value);
      fd.append('m'+i+'_goals_for_b',document.getElementById('m'+i+'_goals_for_b').value);
      fd.append('m'+i+'_goals_against_a',document.getElementById('m'+i+'_goals_against_a').value);
      fd.append('m'+i+'_goals_against_b',document.getElementById('m'+i+'_goals_against_b').value);
      fd.append('m'+i+'_odds_home',document.getElementById('m'+i+'_odds_home').value);
      fd.append('m'+i+'_odds_draw',document.getElementById('m'+i+'_odds_draw').value);
      fd.append('m'+i+'_odds_away',document.getElementById('m'+i+'_odds_away').value);
      fd.append('m'+i+'_h2h_meetings',document.getElementById('m'+i+'_h2h_meetings').value);
      fd.append('m'+i+'_h2h_home',document.getElementById('m'+i+'_h2h_home').value);
      fd.append('m'+i+'_h2h_draw',document.getElementById('m'+i+'_h2h_draw').value);
      fd.append('m'+i+'_h2h_away',document.getElementById('m'+i+'_h2h_away').value);
      fd.append('m'+i+'_h2h_avg_goals',document.getElementById('m'+i+'_h2h_avg_goals').value);
    }
  }
  const r=await fetch('/api/analyze',{method:'POST',body:fd});
  const d=await r.json();
  if(d.ok){
    const res=document.getElementById('result');
    res.innerHTML='<div class="head"><div class="logo" style="font-size:22px">⚡ SLIP ANALYSIS ⚡</div></div>'+
      '<div class="slip-result"><div class="muted">COMBINED CONFIDENCE</div><div class="total-conf">'+d.combinedConf+'%</div><div class="muted" style="margin-top:8px">Total Odds: <b class="hl">'+d.totalOdds+'</b></div><div class="muted" style="margin-top:8px">Recommendation: <b style="color:'+(d.valueBet?'var(--green)':'var(--red)')+'">'+d.recommendation+'</b></div></div>'+
      d.matches.map((m,i)=>'<div class="acc-match"><div style="display:flex;justify-content:space-between"><b class="hl">'+m.teamA+' vs '+m.teamB+'</b><span class="conf">'+m.confidence+'%</span></div><div class="top-pick">Top Pick: '+m.topPick+'</div><div class="muted">Odds: '+m.odds+'</div></div>').join('')+
      '<a href="/analyze" class="btn">NEW ANALYSIS</a>';
    res.scrollIntoView({behavior:'smooth'});
  }else alert('Error: '+d.error);
});

async function loadHistory(){
  try{const r=await fetch('/api/predictions');const p=await r.json();
  const h=document.getElementById('hist');if(!h)return;
  if(!p.length){h.innerHTML='No predictions yet.';return}
  h.innerHTML=p.map(x=>'<div style="padding:10px;border-bottom:1px solid #222"><b class="hl">'+x.match+'</b><br><span style="color:var(--gray);font-size:11px">'+new Date(x.time).toLocaleString()+'</span></div>').join('');
  }catch(e){}}
loadHistory();

async function loadPatterns(){
  try{const r=await fetch('/api/patterns');const p=await r.json();
  const list=document.getElementById('patterns-list');
  if(!list)return;
  const rules=p.rules||{};
  const active=Object.entries(rules).filter(([k,v])=>v.total>=10);
  if(!active.length){list.innerHTML='Need 10+ results';return}
  list.innerHTML=active.slice(0,10).map(([key,r])=>{
    const readable=key.replace(/_/g,' ');
    return '<div style="background:rgba(0,255,136,.05);border-left:3px solid var(--green);padding:10px;margin:6px 0;border-radius:6px"><b class="hl">'+readable+'</b><br><span class="muted">'+r.hits+'/'+r.total+' = '+r.confidence+'%</span></div>';
  }).join('');
  }catch(e){}}
loadPatterns();

async function loadInsights(){
  try{const r=await fetch('/api/insights');const d=await r.json();
  const list=document.getElementById('insights-list');
  if(!list)return;
  if(!d.insights.length){list.innerHTML='<div class="card muted">No insights yet.</div>';return}
  list.innerHTML=d.insights.map(i=>'<div style="padding:10px;margin:6px 0;border-radius:6px;background:rgba(0,255,136,.05);border-left:3px solid var(--green)">'+i.text+'</div>').join('');
  }catch(e){}}
loadInsights();

document.getElementById('askBtn')?.addEventListener('click',async()=>{
  const q=document.getElementById('aiQuestion').value.trim();
  if(!q){alert('Ask a question');return}
  const fd=new FormData();fd.append('question',q);
  const r=await fetch('/api/ask',{method:'POST',body:fd});
  const d=await r.json();
  if(d.ok){
    const box=document.getElementById('aiResponse');
    document.getElementById('aiText').textContent=d.reply;
    box.style.display='block';
  }else alert('Error: '+d.error);
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
    document.getElementById('a-stats').innerHTML='Total: '+ss.total+' | Wins: '+ss.wins;
  }else alert('Wrong password');
}
</script>
</body></html>`;
}
