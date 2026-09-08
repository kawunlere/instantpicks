// ANALYSIS ENGINE - The main brain
// Calculates 99+ betting options, picks top 6, ADAPTS based on patterns

import { getAdjustmentFactors, getPlatform } from "./platforms.js";
import { getAdjustment as getPatternAdjustment, getStreakInfo } from "./patterns.js";

function calculateFormScore(form) {
  if (!form || !Array.isArray(form)) return 0;
  return form.reduce((sum, r) => sum + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
}

function poisson(lambda, k) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let result = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) result *= lambda / i;
  return result;
}

function overProbability(lambda, line) {
  let cumProb = 0;
  for (let k = 0; k < line; k++) {
    cumProb += poisson(lambda, k);
  }
  return Math.max(0, Math.min(1, 1 - cumProb));
}

export async function analyzeMatch(env, input) {
  // input = { teamA, teamB, formA, formB, posA, posB, 
  //           teamASize, teamBSize, homeTeam, oddsHome, oddsDraw, oddsAway,
  //           h2hMeetings, h2hHome, h2hDraw, h2hAway, h2hAvgGoals,
  //           scoresA: [score1, score2...], scoresB: [...],
  //           platform, conversation }
  
  const platformId = input.platform || "sportybet";
  const platform = getPlatform(platformId);
  const platformFactors = getAdjustmentFactors(platformId);
  
  // Calculate base values from form
  const scoreA = calculateFormScore(input.formA);
  const scoreB = calculateFormScore(input.formB);
  const formGap = scoreA - scoreB;
  const posGap = (input.posB || 5) - (input.posA || 5);
  
  // Team size matters (BIG teams more consistent)
  const teamASizeBoost = input.teamASize === "BIG" ? 5 : (input.teamASize === "SMALL" ? -3 : 0);
  const teamBSizeBoost = input.teamBSize === "BIG" ? 5 : (input.teamBSize === "SMALL" ? -3 : 0);
  
  // Home advantage
  const homeAdv = input.homeTeam === "A" ? 0.10 : (input.homeTeam === "B" ? -0.10 : 0);
  
  // Base 1X2 probabilities (no hardcoded favoring)
  const baseHome = 0.40;
  const baseDraw = 0.28;
  const baseAway = 0.32;
  
  // Calculate WITHOUT favoring either team initially
  let pHome = baseHome + (formGap / 30) + (posGap / 40) + homeAdv + (teamASizeBoost / 100) - (teamBSizeBoost / 100) + platformFactors.drawBoost * 0.3;
  let pAway = baseAway - (formGap / 30) - (posGap / 40) - homeAdv - (teamASizeBoost / 100) + (teamBSizeBoost / 100) + platformFactors.drawBoost * 0.3;
  let pDraw = baseDraw + platformFactors.drawBoost - Math.abs(formGap / 50);
  
  // Clamp to valid range
  pHome = Math.max(0.15, Math.min(0.70, pHome));
  pAway = Math.max(0.15, Math.min(0.65, pAway));
  pDraw = Math.max(0.18, Math.min(0.45, pDraw));
  
  // Normalize
  const total = pHome + pDraw + pAway;
  pHome /= total;
  pDraw /= total;
  pAway /= total;
  
  // Expected goals calculation
  const avgGoalsForA = ((input.goalsForA || 7) / 5);
  const avgGoalsForB = ((input.goalsForB || 7) / 5);
  const expectedGoalsA = (avgGoalsForA + (platformFactors.avgGoals || 2.5) - avgGoalsForB) / 2 + (homeAdv / 4);
  const expectedGoalsB = (avgGoalsForB + (platformFactors.avgGoals || 2.5) - avgGoalsForA) / 2 - (homeAdv / 4);
  const expectedTotal = expectedGoalsA + expectedGoalsB + (platformFactors.scoreBoost || 0);
  
  // H2H adjustment
  let h2hBoostHome = 0, h2hBoostDraw = 0, h2hBoostAway = 0;
  if (input.h2hMeetings && input.h2hMeetings > 0) {
    h2hBoostHome = (input.h2hHome / input.h2hMeetings - 0.33) * 0.2;
    h2hBoostDraw = (input.h2hDraw / input.h2hMeetings - 0.34) * 0.2;
    h2hBoostAway = (input.h2hAway / input.h2hMeetings - 0.33) * 0.2;
  }
  
  pHome += h2hBoostHome;
  pDraw += h2hBoostDraw;
  pAway += h2hBoostAway;
  
  // Get adaptive adjustments from patterns engine
  const patternAdj = await getPatternAdjustment(
    env, platformId, "win", formGap, posGap
  );
  
  pHome += patternAdj.boost * 0.01;
  pAway += patternAdj.boost * 0.01;
  
  // Final clamp and normalize
  pHome = Math.max(0.15, Math.min(0.70, pHome));
  pAway = Math.max(0.15, Math.min(0.65, pAway));
  pDraw = Math.max(0.18, Math.min(0.45, pDraw));
  const finalTotal = pHome + pDraw + pAway;
  pHome /= finalTotal;
  pDraw /= finalTotal;
  pAway /= finalTotal;
  
  // Now calculate all 99+ options
  const options = [];
  
  // === 1X2 OPTIONS ===
  options.push({ name: input.teamA + " to Win (1)", conf: Math.round(pHome * 100), category: "result" });
  options.push({ name: "Draw (X)", conf: Math.round(pDraw * 100), category: "result" });
  options.push({ name: input.teamB + " to Win (2)", conf: Math.round(pAway * 100), category: "result" });
  
  // === DOUBLE CHANCE ===
  options.push({ name: input.teamA + " or Draw (1X)", conf: Math.round((pHome + pDraw) * 100), category: "double_chance" });
  options.push({ name: input.teamB + " or Draw (X2)", conf: Math.round((pAway + pDraw) * 100), category: "double_chance" });
  options.push({ name: input.teamA + " or " + input.teamB + " (12)", conf: Math.round((pHome + pAway) * 100), category: "double_chance" });
  
  // === DRAW NO BET ===
  options.push({ name: "Draw No Bet: " + input.teamA, conf: Math.round(pHome / (pHome + pAway) * 100), category: "draw_no_bet" });
  options.push({ name: "Draw No Bet: " + input.teamB, conf: Math.round(pAway / (pHome + pAway) * 100), category: "draw_no_bet" });
  
  // === GOALS OVER/UNDER ===
  const lines = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];
  for (const line of lines) {
    const overP = overProbability(expectedTotal, Math.ceil(line));
    const underP = 1 - overP;
    options.push({ name: "Over " + line + " Goals", conf: Math.round(overP * 100), category: "goals_over" });
    options.push({ name: "Under " + line + " Goals", conf: Math.round(underP * 100), category: "goals_under" });
  }
  
  // === TOTAL GOALS RANGE ===
  options.push({ name: "Total Goals 0-1", conf: Math.round((1 - overProbability(expectedTotal, 2)) * 100), category: "goals_range" });
  options.push({ name: "Total Goals 2-3", conf: Math.round((overProbability(expectedTotal, 2) - overProbability(expectedTotal, 4)) * 100), category: "goals_range" });
  options.push({ name: "Total Goals 4-5", conf: Math.round((overProbability(expectedTotal, 4) - overProbability(expectedTotal, 6)) * 100), category: "goals_range" });
  options.push({ name: "Total Goals 6+", conf: Math.round(overProbability(expectedTotal, 6) * 100), category: "goals_range" });
  
  // === BTTS ===
  const bttsYesProb = (1 - Math.exp(-expectedGoalsA)) * (1 - Math.exp(-expectedGoalsB));
  options.push({ name: "BTTS: Yes", conf: Math.round(bttsYesProb * 100), category: "btts" });
  options.push({ name: "BTTS: No", conf: Math.round((1 - bttsYesProb) * 100), category: "btts" });
  
  // === BTTS COMBOS ===
  options.push({ name: "BTTS + Over 1.5", conf: Math.round(bttsYesProb * overProbability(expectedTotal, 2) * 100), category: "btts_combo" });
  options.push({ name: "BTTS + Over 2.5", conf: Math.round(bttsYesProb * overProbability(expectedTotal, 3) * 100), category: "btts_combo" });
  
  // === TEAM-SPECIFIC GOALS ===
  options.push({ name: input.teamA + " Over 0.5", conf: Math.round((1 - Math.exp(-expectedGoalsA * 0.7)) * 100), category: "team_goals" });
  options.push({ name: input.teamA + " Over 1.5", conf: Math.round((1 - Math.exp(-expectedGoalsA)) * 100), category: "team_goals" });
  options.push({ name: input.teamA + " Over 2.5", conf: Math.round((1 - Math.exp(-expectedGoalsA) * (1 + expectedGoalsA)) * 100), category: "team_goals" });
  options.push({ name: input.teamB + " Over 0.5", conf: Math.round((1 - Math.exp(-expectedGoalsB * 0.7)) * 100), category: "team_goals" });
  options.push({ name: input.teamB + " Over 1.5", conf: Math.round((1 - Math.exp(-expectedGoalsB)) * 100), category: "team_goals" });
  options.push({ name: input.teamB + " Over 2.5", conf: Math.round((1 - Math.exp(-expectedGoalsB) * (1 + expectedGoalsB)) * 100), category: "team_goals" });
  
  // === CLEAN SHEETS ===
  options.push({ name: input.teamA + " Clean Sheet", conf: Math.round(Math.exp(-expectedGoalsB) * 100), category: "clean_sheet" });
  options.push({ name: input.teamB + " Clean Sheet", conf: Math.round(Math.exp(-expectedGoalsA) * 100), category: "clean_sheet" });
  
  // === HALF-TIME MARKETS ===
  const htExpected = expectedTotal * 0.42;
  options.push({ name: "HT: " + input.teamA, conf: Math.round(pHome * 0.7 * 100), category: "halftime" });
  options.push({ name: "HT: Draw", conf: Math.round((pDraw + 0.05) * 0.95 * 100), category: "halftime" });
  options.push({ name: "HT: " + input.teamB, conf: Math.round(pAway * 0.7 * 100), category: "halftime" });
  options.push({ name: "HT Over 0.5", conf: Math.round(overProbability(htExpected, 1) * 100), category: "halftime" });
  options.push({ name: "HT Under 0.5", conf: Math.round((1 - overProbability(htExpected, 1)) * 100), category: "halftime" });
  options.push({ name: "HT Over 1.5", conf: Math.round(overProbability(htExpected, 2) * 100), category: "halftime" });
  options.push({ name: "HT Under 1.5", conf: Math.round((1 - overProbability(htExpected, 2)) * 100), category: "halftime" });
  options.push({ name: "HT BTTS", conf: Math.round(bttsYesProb * 0.5 * 100), category: "halftime" });
  
  // === HT/FT COMBOS ===
  options.push({ name: "HT/FT 1/1", conf: Math.round(pHome * pHome * 0.75 * 100), category: "combo" });
  options.push({ name: "HT/FT X/1", conf: Math.round(pDraw * pHome * 1.1 * 100), category: "combo" });
  options.push({ name: "HT/FT X/X", conf: Math.round(pDraw * pDraw * 1.2 * 100), category: "combo" });
  options.push({ name: "HT/FT X/2", conf: Math.round(pDraw * pAway * 1.1 * 100), category: "combo" });
  options.push({ name: "HT/FT 2/2", conf: Math.round(pAway * pAway * 0.75 * 100), category: "combo" });
  
  // === HANDICAP ===
  options.push({ name: input.teamA + " Handicap -1", conf: Math.round(Math.max(20, pHome * 100 - 20)), category: "handicap" });
  options.push({ name: input.teamA + " Handicap -2", conf: Math.round(Math.max(15, pHome * 100 - 35)), category: "handicap" });
  options.push({ name: input.teamB + " Handicap +1", conf: Math.round(Math.min(85, pAway * 100 + pDraw * 30 + 15)), category: "handicap" });
  options.push({ name: input.teamB + " Handicap +2", conf: Math.round(Math.min(90, pAway * 100 + pDraw * 30 + 30)), category: "handicap" });
  options.push({ name: "Asian Handicap " + input.teamA + " -1.5", conf: Math.round((1 - Math.exp(-expectedGoalsA)) * 100), category: "handicap" });
  options.push({ name: "Asian Handicap " + input.teamB + " +1.5", conf: Math.round(Math.exp(-expectedGoalsA) * 100), category: "handicap" });
  
  // === CORRECT SCORE (based on Poisson distribution) ===
  const lambdaA = expectedGoalsA;
  const lambdaB = expectedGoalsB;
  for (let scoreA = 0; scoreA <= 3; scoreA++) {
    for (let scoreB = 0; scoreB <= 3; scoreB++) {
      if (scoreA === 3 && scoreB === 3) continue;
      const prob = poisson(lambdaA, scoreA) * poisson(lambdaB, scoreB);
      options.push({ name: "Correct Score " + scoreA + "-" + scoreB, conf: Math.round(prob * 100), category: "correct_score" });
    }
  }
  
  // === SPECIAL MARKETS ===
  options.push({ name: "Total Goals Odd", conf: expectedTotal > 2.5 ? 58 : 50, category: "special" });
  options.push({ name: "Total Goals Even", conf: expectedTotal > 2.5 ? 42 : 50, category: "special" });
  options.push({ name: input.teamA + " Win to Nil", conf: Math.round(pHome * Math.exp(-expectedGoalsB) * 100), category: "special" });
  options.push({ name: input.teamB + " Win to Nil", conf: Math.round(pAway * Math.exp(-expectedGoalsA) * 100), category: "special" });
  options.push({ name: "Goal in First 15min", conf: Math.round(overProbability(htExpected * 0.3, 1) * 100), category: "timing" });
  options.push({ name: "Both Halves Over 0.5", conf: Math.round(overProbability(htExpected, 1) * overProbability(expectedTotal, 2) * 0.7 * 100), category: "timing" });
  options.push({ name: "Both Halves Over 1.5", conf: Math.round(overProbability(htExpected, 2) * overProbability(expectedTotal, 3) * 0.6 * 100), category: "timing" });
  
  // Get streak info
  const streak = await getStreakInfo(env);
  
  // Apply streak penalty if on losing streak
  if (streak.type === "lose" && streak.current >= 3) {
    const penalty = Math.min(5, streak.current - 2);
    options.forEach(opt => {
      opt.conf = Math.max(30, opt.conf - penalty);
    });
  }
  
  // Apply AI conversation adjustment if provided
  if (input.conversation && env.GEMINI_API_KEY) {
    // Will be enhanced by ai_brain engine later
  }
  
  // Sort by confidence
  options.sort((a, b) => b.conf - a.conf);
  
  // Return top 6 picks
  return {
    top6: options.slice(0, 6),
    allOptions: options,
    streak: streak,
    platform: platform,
    debug: {
      pHome: pHome.toFixed(3),
      pDraw: pDraw.toFixed(3),
      pAway: pAway.toFixed(3),
      expectedGoalsA: expectedGoalsA.toFixed(2),
      expectedGoalsB: expectedGoalsB.toFixed(2),
      formGap: formGap,
      posGap: posGap
    }
  };
}
