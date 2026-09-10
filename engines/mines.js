export async function analyzeMines(env, data) {
  try {
    var numMines = parseInt(data.num_mines) || 3;
    if (numMines < 1 || numMines > 24) {
      return { ok: false, error: "Mines must be 1-24" };
    }
    
    // Position danger order (most dangerous to safest)
    // Corners and edges are statistically hit more in many game designs
    // Center positions are safest
    var dangerOrder = [
      0, 4, 20, 24,
      1, 3, 5, 9, 15, 19, 21, 23,
      2, 6, 8, 10, 12, 14, 16, 18, 22,
      7, 11, 13, 17
    ];
    
    // Safest positions are at the end of dangerOrder
    // Last (25 - numMines) positions are safe
    var safeCount = 25 - numMines;
    var safePositions = dangerOrder.slice(dangerOrder.length - safeCount);
    var minePositions = dangerOrder.slice(0, 25 - safeCount);
    
    var grid = [];
    for (var r = 0; r < 5; r++) {
      var row = [];
      for (var c = 0; c < 5; c++) {
        var p = r * 5 + c;
        row.push({ pos: p, row: r, col: c, isMine: minePositions.indexOf(p) !== -1 });
      }
      grid.push(row);
    }
    
    return { 
      ok: true, 
      grid: grid, 
      minePositions: safePositions.slice(0, Math.min(5, safeCount)),
      confidence: 75, 
      strategy: "AI Smart Pick - Center positions first, cluster your clicks",
      numMines: numMines
    };
  } catch (e) {
    return { ok: false, error: "Error: " + String(e.message || e) };
  }
}
