# AVIATOR PLAN - Locked In

## PLATFORM
SportyBet Aviator (Provably Fair version)

## HOW IT WORKS
1. User opens SportyBet aviator
2. User sees server seed BEFORE round starts
3. User pastes server seed into our app
4. When round starts, 3 client seeds appear
5. User pastes all 3 client seeds (within ~3 seconds)
6. Our system calculates SHA512 hash
7. Output: EXACT crash point (e.g., "2.45x")
8. User cashes out in SportyBet before crash

## USER INPUTS
- Server seed (16 chars)
- 3 client seeds
- (Optional) Last 10-20 crash multipliers for AI learning

## SYSTEM OUTPUT
- Predicted crash multiplier
- Confidence %
- Safe cashout suggestion
- Skip signal if too risky

## MATH
SHA512(server + client1 + client2 + client3) → multiplier

## AI LEARNING
- Track past predictions vs actual
- Detect patterns (low streak → high, high streak → low)
- Improve confidence over time

## FILES TO BUILD (LATER)
- engines/aviator.js (math brain)
- ui/aviator.js (input page)
- Update worker.js (add routes)
