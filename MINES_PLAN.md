# MINES PLAN - SportyBet Provably Fair

## HOW MINES WORKS
- 5x5 grid (25 tiles)
- User picks 1-24 mines
- Click tiles to reveal stars (safe) or hit mine (lose)
- Each safe reveal increases multiplier
- Provably Fair = Server seed (visible) + Client seed → hash → mine positions

## MATH (HMAC-SHA256)
- Combine: HMAC-SHA256(server_seed, client_seed)
- Each tile position generated from hash bytes
- byte % 25 = tile position
- Repeat until 25 unique positions
- First N positions = mines, rest = safe
- (N = number of mines user picked)

## USER INPUTS
1. Server seed SHA256 (from Provably Fair settings)
2. Client seed (also from settings)
3. Number of mines (1-24)
4. How many safe tiles to reveal (1-5)

## SYSTEM OUTPUT
- 5x5 grid with safe tiles marked GREEN
- Mines hidden (user can see but we mark them RED)
- Top 5 safe positions ranked
- Confidence score
- Calculation takes ~1 minute (deep math + AI enhancement)

## AI LEARNING
- Study how seeds translate to mine positions
- Detect patterns in the hash distribution
- Learn user's win/loss history
- Improve predictions over time
- AI must NOT sleep (continuous research)

## THE OUTSMART STRATEGY
- We replicate SportyBet's EXACT math
- When user pastes seeds, we calculate SAME as their server
- We show positions BEFORE they click
- Same as Mines predictor tools that exist (but with AI enhancement)

## FILES TO BUILD
1. engines/mines.js (math brain)
2. ui/mines.js (grid input/output)
3. Update worker.js (add /mines route)
4. Add to navigation
5. Test

## BUILD ORDER
1. Save this plan ✅
2. Build engines/mines.js (math)
3. Test math locally
4. Build ui/mines.js (input form + grid)
5. Connect to worker.js
6. Test full flow
7. Add AI enhancement
8. Deploy

## RULES (NON-NEGOTIABLE)
- NO fixed codes
- NO fixed predictions
- AI must work continuously
- System must be smart, not scripted
- Each prediction uses fresh math
- User feedback improves system
