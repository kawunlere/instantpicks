// RESEARCH ENGINE - AI studies betting platforms
// This engine browses and learns about virtual games automatically

const RESEARCH_PROMPT = `You are a betting research AI. Your job is to study how virtual football games work on betting platforms.

Focus areas:
1. How do platforms like Bet9ja Virtual League, Sportybet Instant Virtual, Football.com Instant Virtual GENERATE match results?
2. Are there patterns in how scores are produced?
3. What betting markets do these platforms offer?
4. Do certain platforms favor home wins, draws, or away wins?
5. Are there time-based patterns (different behavior at different times)?
6. What strategies do experienced bettors use on virtual games?

Always respond in this EXACT JSON format:
{
  "platform": "platform name",
  "findings": "main discoveries",
  "patterns": ["pattern 1", "pattern 2", "pattern 3"],
  "recommendations": ["rec 1", "rec 2"],
  "confidence": 0-100
}

Be honest. If you don't know something, say "insufficient data".`;

export async function runResearch(env, platform = null) {
  // Check if API key exists
  if (!env.GEMINI_API_KEY) {
    return { ok: false, error: "API key not configured" };
  }

  // List of platforms to research
  const platforms = platform ? [platform] : [
    "Bet9ja Virtual League",
    "Sportybet Instant Virtual", 
    "Football.com Instant Virtual",
    "Betway Virtual Football",
    "1xBet Virtual Football"
  ];

  const results = [];

  // Research each platform
  for (const p of platforms) {
    try {
      const question = "Research " + p + ". How does it work? What patterns exist? What should bettors know?";
      
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + env.GEMINI_API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: RESEARCH_PROMPT + "\n\n" + question }] }],
            generationConfig: { 
              maxOutputTokens: 800,
              temperature: 0.7
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const text = data.candidates[0].content.parts[0].text;
          
          // Try to extract JSON from response
          let parsed = null;
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch (e) {
              parsed = { raw: text };
            }
          } else {
            parsed = { raw: text };
          }

          results.push({
            platform: p,
            data: parsed,
            timestamp: new Date().toISOString()
          });

          // Save to KV
          if (env.PICKS_KV) {
            const key = "research_" + p.replace(/\s+/g, "_").toLowerCase();
            await env.PICKS_KV.put(key, JSON.stringify({
              platform: p,
              data: parsed,
              timestamp: new Date().toISOString()
            }));
          }
        }
      }
    } catch (e) {
      results.push({
        platform: p,
        error: e.message
      });
    }
  }

  // Update last research timestamp
  if (env.PICKS_KV) {
    await env.PICKS_KV.put("research_last_run", JSON.stringify({
      time: new Date().toISOString(),
      count: results.length
    }));
  }

  return { ok: true, results: results };
}

export async function getResearch(env, platform) {
  if (!env.PICKS_KV) return null;
  
  const key = "research_" + platform.replace(/\s+/g, "_").toLowerCase();
  const data = await env.PICKS_KV.get(key);
  return data ? JSON.parse(data) : null;
}

export async function getAllResearch(env) {
  if (!env.PICKS_KV) return [];
  
  const list = await env.PICKS_KV.list({ prefix: "research_" });
  const all = [];
  for (const key of list.keys) {
    if (key.name === "research_last_run") continue;
    const data = await env.PICKS_KV.get(key.name);
    if (data) all.push(JSON.parse(data));
  }
  return all;
}

export async function shouldRunDailyResearch(env) {
  if (!env.PICKS_KV) return true;
  
  const last = await env.PICKS_KV.get("research_last_run");
  if (!last) return true;
  
  const lastTime = JSON.parse(last).time;
  const now = new Date();
  const lastDate = new Date(lastTime);
  const hoursDiff = (now - lastDate) / (1000 * 60 * 60);
  
  return hoursDiff >= 20; // Run if last run was 20+ hours ago
}
