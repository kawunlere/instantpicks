// PLATFORMS ENGINE - Information about each betting platform
// Stores platform personalities, game types, and behavior

const PLATFORMS_DATA = {
  sportybet: {
    name: "Sportybet",
    game: "Instant Virtual",
    country: "Nigeria",
    personality: "high_scoring",
    typical_odds: { home: 1.80, draw: 3.30, away: 4.20 },
    avg_goals: 2.7,
    draw_rate: 0.26,
    home_win_rate: 0.46,
    away_win_rate: 0.28,
    notes: "Tends to have higher scoring games. Home advantage moderate.",
    last_updated: null
  },
  bet9ja: {
    name: "Bet9ja",
    game: "Virtual League",
    country: "Nigeria",
    personality: "draw_heavy",
    typical_odds: { home: 2.10, draw: 3.00, away: 3.60 },
    avg_goals: 2.2,
    draw_rate: 0.32,
    home_win_rate: 0.42,
    away_win_rate: 0.26,
    notes: "Higher draw frequency. Lower scoring on average.",
    last_updated: null
  },
  betway: {
    name: "Betway",
    game: "Virtual Football",
    country: "Nigeria",
    personality: "balanced",
    typical_odds: { home: 1.95, draw: 3.20, away: 3.90 },
    avg_goals: 2.5,
    draw_rate: 0.28,
    home_win_rate: 0.44,
    away_win_rate: 0.28,
    notes: "Balanced statistics. Standard virtual football.",
    last_updated: null
  },
  "1xbet": {
    name: "1xBet",
    game: "Virtual Football",
    country: "Worldwide",
    personality: "balanced",
    typical_odds: { home: 1.90, draw: 3.25, away: 4.00 },
    avg_goals: 2.4,
    draw_rate: 0.29,
    home_win_rate: 0.43,
    away_win_rate: 0.28,
    notes: "International platform. Similar to European averages.",
    last_updated: null
  },
  football_com: {
    name: "Football.com",
    game: "Instant Virtual",
    country: "Nigeria",
    personality: "high_scoring",
    typical_odds: { home: 1.75, draw: 3.40, away: 4.50 },
    avg_goals: 2.8,
    draw_rate: 0.25,
    home_win_rate: 0.48,
    away_win_rate: 0.27,
    notes: "Nigerian platform. High scoring games.",
    last_updated: null
  },
  betking: {
    name: "BetKing",
    game: "Virtual League",
    country: "Nigeria",
    personality: "draw_heavy",
    typical_odds: { home: 2.05, draw: 3.05, away: 3.70 },
    avg_goals: 2.3,
    draw_rate: 0.31,
    home_win_rate: 0.41,
    away_win_rate: 0.28,
    notes: "Similar to Bet9ja. Draws more common.",
    last_updated: null
  },
  nairabet: {
    name: "NairaBet",
    game: "Virtual",
    country: "Nigeria",
    personality: "balanced",
    typical_odds: { home: 1.95, draw: 3.20, away: 3.85 },
    avg_goals: 2.5,
    draw_rate: 0.28,
    home_win_rate: 0.44,
    away_win_rate: 0.28,
    notes: "Nigerian platform. Balanced behavior.",
    last_updated: null
  },
  merrybet: {
    name: "MerryBet",
    game: "Virtual",
    country: "Nigeria",
    personality: "balanced",
    typical_odds: { home: 1.95, draw: 3.20, away: 3.85 },
    avg_goals: 2.5,
    draw_rate: 0.28,
    home_win_rate: 0.44,
    away_win_rate: 0.28,
    notes: "Standard Nigerian virtual platform.",
    last_updated: null
  },
  msport: {
    name: "MSport",
    game: "Virtual",
    country: "Nigeria",
    personality: "high_scoring",
    typical_odds: { home: 1.80, draw: 3.35, away: 4.30 },
    avg_goals: 2.7,
    draw_rate: 0.26,
    home_win_rate: 0.47,
    away_win_rate: 0.27,
    notes: "Mobile-focused. High scoring games.",
    last_updated: null
  },
  bangbet: {
    name: "Bangbet",
    game: "Virtual",
    country: "Nigeria",
    personality: "balanced",
    typical_odds: { home: 1.95, draw: 3.20, away: 3.85 },
    avg_goals: 2.5,
    draw_rate: 0.28,
    home_win_rate: 0.44,
    away_win_rate: 0.28,
    notes: "Standard virtual platform.",
    last_updated: null
  },
  parimatch: {
    name: "Parimatch",
    game: "Virtual",
    country: "Worldwide",
    personality: "balanced",
    typical_odds: { home: 1.90, draw: 3.25, away: 4.00 },
    avg_goals: 2.5,
    draw_rate: 0.28,
    home_win_rate: 0.44,
    away_win_rate: 0.28,
    notes: "International platform. Standard behavior.",
    last_updated: null
  },
  livescorebet: {
    name: "LivescoreBet",
    game: "Virtual",
    country: "Worldwide",
    personality: "balanced",
    typical_odds: { home: 1.95, draw: 3.20, away: 3.85 },
    avg_goals: 2.5,
    draw_rate: 0.28,
    home_win_rate: 0.44,
    away_win_rate: 0.28,
    notes: "Standard platform.",
    last_updated: null
  },
  "22bet": {
    name: "22Bet",
    game: "Virtual",
    country: "Worldwide",
    personality: "balanced",
    typical_odds: { home: 1.90, draw: 3.25, away: 4.00 },
    avg_goals: 2.5,
    draw_rate: 0.28,
    home_win_rate: 0.44,
    away_win_rate: 0.28,
    notes: "International platform.",
    last_updated: null
  },
  pinnacle: {
    name: "Pinnacle",
    game: "Virtual",
    country: "Worldwide",
    personality: "high_scoring",
    typical_odds: { home: 1.85, draw: 3.40, away: 4.10 },
    avg_goals: 2.7,
    draw_rate: 0.26,
    home_win_rate: 0.47,
    away_win_rate: 0.27,
    notes: "Professional platform. High quality odds.",
    last_updated: null
  }
};

export function getPlatform(id) {
  return PLATFORMS_DATA[id] || null;
}

export function getAllPlatforms() {
  return Object.entries(PLATFORMS_DATA).map(([id, data]) => ({
    id: id,
    ...data
  }));
}

export function getPlatformsByCountry(country) {
  return Object.entries(PLATFORMS_DATA)
    .filter(([id, data]) => data.country === country)
    .map(([id, data]) => ({ id, ...data }));
}

export function getPlatformsByPersonality(personality) {
  return Object.entries(PLATFORMS_DATA)
    .filter(([id, data]) => data.personality === personality)
    .map(([id, data]) => ({ id, ...data }));
}

export function getAdjustmentFactors(platformId) {
  const platform = PLATFORMS_DATA[platformId];
  if (!platform) return { drawBoost: 0, scoreBoost: 0 };

  let drawBoost = 0;
  let scoreBoost = 0;

  if (platform.personality === "draw_heavy") {
    drawBoost = 0.08;
    scoreBoost = -0.20;
  } else if (platform.personality === "high_scoring") {
    drawBoost = -0.04;
    scoreBoost = 0.25;
  }

  return {
    drawBoost: drawBoost,
    scoreBoost: scoreBoost,
    avgGoals: platform.avg_goals,
    drawRate: platform.draw_rate,
    homeWinRate: platform.home_win_rate,
    awayWinRate: platform.away_win_rate
  };
}

// Update platform data from research findings
export async function updatePlatformFromResearch(env, platformId, findings) {
  if (!env.PICKS_KV) return;
  
  const key = "platform_" + platformId;
  const updated = {
    ...PLATFORMS_DATA[platformId],
    ...findings,
    last_updated: new Date().toISOString()
  };
  
  await env.PICKS_KV.put(key, JSON.stringify(updated));
}
