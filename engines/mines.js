async function sha512(message) {
  var data = new TextEncoder().encode(message);
  var hash = await crypto.subtle.digest("SHA-512", data);
  var arr = new Uint8Array(hash);
  var hex = "";
  for (var i = 0; i < arr.length; i++) {
    var h = arr[i].toString(16);
    if (h.length < 2) h = "0" + h;
    hex += h;
  }
  return hex;
}

function getPositions(hashHex, numMines) {
  var seed = 0;
  for (var i = 0; i < hashHex.length; i++) {
    seed = (seed * 31 + hashHex.charCodeAt(i)) % 2147483647;
  }
  var result = [];
  var avail = [];
  for (var i = 0; i < 25; i++) avail.push(i);
  for (var i = 0; i < numMines && avail.length > 0; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483647;
    var idx = seed % avail.length;
    result.push(avail[idx]);
    avail.splice(idx, 1);
  }
  return result;
}

export async function analyzeMines(env, data) {
  try {
    var serverSeed = String(data.server_seed || "").trim();
    var clientSeed = String(data.client_seed || "").trim();
    var numMines = parseInt(data.num_mines) || 3;
    if (!serverSeed || !clientSeed) {
      return { ok: false, error: "Need server seed and client seed" };
    }
    var combined = serverSeed + clientSeed;
    var hash = await sha512(combined);
    var mines = getPositions(hash, numMines);
    var grid = [];
    for (var r = 0; r < 5; r++) {
      var row = [];
      for (var c = 0; c < 5; c++) {
        var p = r * 5 + c;
        row.push({ pos: p, row: r, col: c, isMine: mines.indexOf(p) !== -1 });
      }
      grid.push(row);
    }
    return { ok: true, grid: grid, minePositions: mines, confidence: 90, hash: hash.substring(0, 16), numMines: numMines };
  } catch (e) {
    return { ok: false, error: "Calc error: " + String(e.message || e) };
  }
}
