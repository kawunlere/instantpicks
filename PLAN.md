# INSTANT PICKS - PROJECT PLAN

## WHAT WE'RE BUILDING
A smart betting analysis platform that helps users make safer picks
across 14+ betting platforms (Bet9ja, Sportybet, Football.com, etc.)

## FILE STRUCTURE (Separate Engines)

## ENGINES (Independent, Each in Own File)

### Engine 1: ANALYSIS (analysis.js)
- Calculates probabilities for 99+ betting options
- Inputs: form, position, odds, H2H, goals, team size
- Outputs: top 6 picks with confidence
- Updates: when user logs WIN/LOSE
- NOT fixed code - uses math to calculate

### Engine 2: PATTERNS (patterns.js)
- Learns from every result
- Detects what works on which platform
- Stores in KV
- Updates: continuous
- Outputs: pattern insights

### Engine 3: PLATFORMS (platforms.js)
- Each platform has personality
- Bet9ja = draw_heavy
- Sportybet = high_scoring
- Different math per platform
- Updates: as we learn more

### Engine 4: RESEARCH (research.js)
- AI browses betting sites
- Learns how virtual games work
- Updates system knowledge
- Runs: daily automatic + admin command
- Stores findings in KV

### Engine 5: AI BRAIN (ai_brain.js)
- Connects to Gemini
- Has strict prompt: betting only
- Assists all other engines
- Powers admin chat
- Has admin override

## USER INPUTS (Analysis Form)
- Platform (dropdown)
- Team A + Team B names
- Team A size: BIG or SMALL
- Team B size: BIG or SMALL
- Home/Away for each team
- Table position (A, B)
- Odds (Home, Draw, Away)
- Form last 5 (A, B) - W/L/D buttons
- H2H meetings, wins, draws, losses
- Last 2-5 scores (optional) - for correct score
- Conversation (optional)

## OUTPUT (6 Best Picks)
After all 99+ options calculated, system picks TOP 6:
1. Match Result (1X2 or Double Chance)
2. Goals (Over/Under)
3. BTTS
4. Correct Score
5. Handicap
6. Special (HT, etc.)

## ADMIN PANEL (Secret)
- Different URL (not /admin)
- Only you know the link
- Has chat with AI
- Can command AI to research
- Sees all data
- Can reset, configure, update

## NEXT STEPS (Small, One at a Time)
1. Create folder structure
2. Build analysis.js (the math)
3. Test with one match
4. Build patterns.js (learning)
5. Test learning
6. Build platforms.js
7. Build research.js
8. Build ai_brain.js
9. Build UI files
10. Build admin panel
11. Connect everything in worker.js
12. Deploy and test

## CURRENT STATUS
- v19 deployed (simple version, working but limited)
- Need to split into separate files
- Need to add research capability
- Need to fix prediction logic (not favor one team)
