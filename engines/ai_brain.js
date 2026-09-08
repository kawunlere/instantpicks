// AI BRAIN ENGINE - Smart model rotation
// Prevents rate limit failures by rotating between 3 Gemini models

const MODELS = [
  { name: "gemini-2.5-flash", delay: 0, label: "Flash" },
  { name: "gemini-flash-lite-latest", delay: 500, label: "Flash Lite" },
  { name: "gemini-2.5-pro", delay: 1000, label: "Pro" }
];

// Track which model was used last to rotate fairly
let lastModelIndex = 0;

async function tryModel(env, modelName, prompt, maxTokens = 300) {
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7
          }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return {
          ok: true,
          reply: data.candidates[0].content.parts[0].text,
          model: modelName
        };
      }
    }

    // Rate limit - try next
    if (response.status === 429) {
      return { ok: false, error: "rate_limited", model: modelName };
    }

    // Model not found - try next
    if (response.status === 404) {
      return { ok: false, error: "not_found", model: modelName };
    }

    // Other error
    return { ok: false, error: "error_" + response.status, model: modelName };

  } catch (e) {
    return { ok: false, error: "exception", model: modelName };
  }
}

export async function askAI(env, prompt, systemContext = "") {
  // Check API key
  if (!env.GEMINI_API_KEY) {
    return { ok: false, error: "API key not configured" };
  }

  // Build full prompt
  const fullPrompt = systemContext ? systemContext + "\n\nUser: " + prompt : prompt;

  // Try models in rotation
  for (let i = 0; i < MODELS.length; i++) {
    // Rotate starting point
    const modelIndex = (lastModelIndex + i) % MODELS.length;
    const model = MODELS[modelIndex];

    // Add small delay before retry
    if (i > 0) {
      await new Promise(r => setTimeout(r, 500));
    }

    const result = await tryModel(env, model.name, fullPrompt);

    if (result.ok) {
      // Update last model index
      lastModelIndex = modelIndex;
      return result;
    }

    // If rate limited, continue to next
    // If not found, continue to next
    // If other error after last model, give up
    if (i === MODELS.length - 1) {
      return {
        ok: false,
        error: "All AI models busy. Please try again in 30 seconds.",
        tried: MODELS.map(m => m.label).join(", ")
      };
    }
  }

  return { ok: false, error: "AI unavailable" };
}

// For research - use longer max tokens
export async function askAIResearch(env, prompt) {
  return await askAI(env, prompt, RESEARCH_CONTEXT);
}

const RESEARCH_CONTEXT = "You are a betting research AI. Study virtual games on platforms like Bet9ja, Sportybet, Football.com. Respond in JSON format with findings, patterns, and recommendations.";
