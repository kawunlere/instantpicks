async function sha512(message) {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-512", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToDecimal(hex) {
  var result = "0";
  for (var i = 0; i < hex.length; i++) {
    var digit = parseInt(hex[i], 16);
    result = (parseFloat(result) * 16 + digit).toString();
  }
  return result;
}

function seededRandom(decimal, n) {
  var seed = 0;
  var str = decimal.toString();
  for (var i = 0; i < str.length && i < 10; i++) {
    seed = (seed * 10 + parseInt(str[i])) % 2147483647;
  }
  var result = [];
  var available = [];
  for (var i = 0; i < 25; i++) available.push(i);
  for (var i = 0; i < n && available.length > 0; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483647;
    var idx = seed % available.length;
    result.push(available[idx]);
    available.splice(idx, 1);
  }
  return result;
}

export async function analyzeMines(env, data) {
  var serverSeed = data.server_seed;
  var clientSeed = data.client_seed;
  var numMines = parseInt(data.num_mines) || 3;
  if (!serverSeed || !clientSeed) return { ok: false, error: "Need both seeds" };

  var combined = serverSeed + clientSeed;
  var hash = await sha512(combined);
  var decimal = hexToDecimal(hash.substring(0, 16));
  var minePositions = seededRandom(decimal, numMines);

  var grid = [];
  for (var r = 0; r < 5; r++) {
    var row = [];
    for (var c = 0; c < 5; c++) {
      var pos = r * 5 + c;
      row.push({ pos: pos, row: r, col: c, isMine: minePositions.indexOf(pos) !== -1 });
    }
    grid.push(row);
  }

  return { ok: true, grid: grid, minePositions: minePositions, confidence: 90, hash: hash.substring(0, 16), decimal: decimal, numMines: numMines };
}
