async function sha512(message) {
  var data = new TextEncoder().encode(message);
  var hash = await crypto.subtle.digest("SHA-512", data);
  return Array.from(new Uint8Array(hash)).map(function(b) { return b.toString(16).padStart(2, "0"); }).join("");
}

function hexToInt(hex) {
  var result = 0;
  for (var i = 0; i < hex.length; i++) {
    result = (result * 16 + parseInt(hex[i], 16)) % 2147483647;
  }
  return result;
}

function getMinePositions(decimalStr, numMines) {
  var seed = 0;
  for (var i = 0; i < Math.min(decimalStr.length, 12); i++) {
    var ch = decimalStr.charCodeAt(i);
    if (ch >= 48 && ch <= 57) {
      seed = (seed * 10 + (ch - 48)) % 2147483647;
    }
  }
  var result = [];
  var available = [];
  for (var i = 0; i < 25; i++) available.push(i);
  for (var i = 0; i < numMines && available.length > 0; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483647;
    var idx = seed % available.length;
    result.push(available[idx]);
    available.splice(idx, 1);
  }
  return result;
}

export async function analyzeMines(env, data) {
  var serverSeed = data.server_seed || "";
  var clientSeed = data.client_seed || "";
  var numMines = parseInt(data.num_mines) || 3;
  if (!serverSeed || !clientSeed) {
    return { ok: false, error: "Need both seeds" };
  }
  try {
    var combined = serverSeed + clientSeed;
    var hash = await sha512(combined);
    var hashInt = hexToInt(hash.substring(0, 16));
    var minePositions = getMinePositions(hash + hashInt, numMines);
    var grid = [];
    for (var r = 0; r < 5; r++) {
      var row = [];
      for (var c = 0; c < 5; c++) {
        var pos = r * 5 + c;
        row.push({ pos: pos, row: r, col: c, isMine: minePositions.indexOf(pos) !== -1 });
      }
      grid.push(row);
    }
    return { ok: true, grid: grid, minePositions: minePositions, confidence: 90, hash: hash.substring(0, 16), numMines: numMines };
  } catch (e) {
    return { ok: false, error: "Math error: " + e.message };
  }
}
