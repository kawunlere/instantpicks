export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/") return home();
    if (path === "/analyze" && request.method === "POST") return await analyze(request, env);
    if (path === "/result" && request.method === "POST") return await result(request, env);
    if (path === "/stats") return await stats(env);
    return new Response("Not Found", { status: 404 });
  }
};

async function analyze(request, env) {
  const form = await request.formData();
  const teamA = form.get("team_a");
  const teamB = form.get("team_b");
  const formA = form.get("form_a").toUpperCase().replace(/\s/g, "").split(",");
  const formB = form.get("form_b").toUpperCase().replace(/\s/g, "").split(",");
  const tableA = parseInt(form.get("table_a"));
  const tableB = parseInt(form.get("table_b"));
  
  const recs = getPicks(formA, formB, tableA, tableB);
  
  if (env.PICKS_KV) {
    await env.PICKS_KV.put(`p_${Date.now()}`, JSON.stringify({
      time: new Date().toISOString(),
      match: `${teamA} vs ${teamB}`,
      picks: recs
    }));
  }
  
  return resultPage(teamA, teamB, recs);
}

async function result(request, env) {
  const form = await request.formData();
  const match = form.get("match");
  const pick = form.get("pick");
  const outcome = form.get("outcome");
  
  let s = { total: 0, wins: 0 };
  if (env.PICKS_KV) {
    const stored = await env.PICKS_KV.get("stats");
    if (stored) s = JSON.parse(stored);
    s.total++;
    if (outcome === "win") s.wins++;
    await env.PICKS_KV.put("stats", JSON.stringify(s));
  }
  
  const rate = s.total > 0 ? Math.round((s.wins / s.total) * 1000) / 10 : 0;
  return new Response(JSON.stringify({ ok: true, rate, total: s.total, wins: s.wins }), {
    headers: { "Content-Type": "application/json" }
  });
}

async function stats(env) {
  if (!env.PICKS_KV) return new Response("{}", { headers: { "Content-Type": "application/json" } });
  const s = await env.PICKS_KV.get("stats") || "{}";
  return new Response(s, { headers: { "Content-Type": "application/json" } });
}

function getPicks(fA, fB, tA, tB) {
  const scoreA = fA.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const scoreB = fB.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const diff = scoreA - scoreB;
  
  const recs = [];
  if (diff > 3) recs.push({ pick: "Home Win or Over 1.5", conf: 65, why: "Team A strong form" });
  else if (diff < -3) recs.push({ pick: "Away Win or Over 1.5", conf: 60, why: "Team B dominant" });
  else recs.push({ pick: "Over 1.5 or Draw No Bet", conf: 55, why: "Balanced match" });
  recs.push({ pick: "Over 1.5 Goals", conf: 70, why: "Virtuals favor goals" });
  return recs;
}

function resultPage(teamA, teamB, recs) {
  const cards = recs.map((r, i) => `
    <div class="card">
      <div class="tag">Pick #${i+1}</div>
      <div class="name">${r.pick}</div>
      <div class="conf">${r.conf}%</div>
      <div class="why">${r.why}</div>
      <div class="btns">
        <form action="/result" method="POST" style="display:flex;gap:8px;width:100%">
          <input type="hidden" name="match" value="${teamA} vs ${teamB}">
          <input type="hidden" name="pick" value="${r.pick}">
          <button name="outcome" value="win" class="w">WIN</button>
          <button name="outcome" value="lose" class="l">LOSE</button>
        </form>
      </div>
    </div>`).join("");
  
  return new Response(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>INSTANT PICKS</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:linear-gradient(135deg,#0f0f0f,#1a1a2e);color:#fff;min-height:100vh;padding:20px}
.c{max-width:500px;margin:0 auto}.head{text-align:center;padding:20px 0}
.logo{font-size:28px;font-weight:900;background:linear-gradient(135deg,#00ff88,#00cc6a);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.title{text-align:center;font-size:20px;margin:20px 0;font-weight:700}
.card{background:rgba(26,26,26,.9);padding:20px;border-radius:14px;margin:12px 0;border:1px solid rgba(0,255,136,.2);border-left:4px solid #00ff88}
.tag{background:#00ff88;color:#000;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;display:inline-block}
.name{font-size:18px;font-weight:800;margin:10px 0 5px}
.conf{font-size:32px;font-weight:900;color:#00ff88}
.why{color:#aaa;font-size:13px;margin:8px 0}
.btns{display:flex;gap:8px;margin-top:12px}
button{flex:1;padding:12px;border:none;border-radius:8px;font-weight:800;cursor:pointer;font-size:14px}
.w{background:#00ff88;color:#000}.l{background:#ff4444;color:#fff}
.back{display:block;text-align:center;color:#00ff88;text-decoration:none;margin-top:25px;padding:15px}
</style></head><body><div class="c"><div class="head"><div class="logo">INSTANT PICKS</div></div>
<div class="title">${teamA} VS ${teamB}</div>${cards}<a href="/" class="back">New Analysis</a></div></body></html>`,
  { headers: { "Content-Type": "text/html" } });
}

function home() {
  return new Response(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>INSTANT PICKS</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:linear-gradient(135deg,#0f0f0f,#1a1a2e);color:#fff;min-height:100vh;padding:20px}
.c{max-width:500px;margin:0 auto}.head{text-align:center;padding:20px 0}
.logo{font-size:32px;font-weight:900;background:linear-gradient(135deg,#00ff88,#00cc6a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:2px}
.tag{color:#888;font-size:13px;margin-top:5px}
.card{background:rgba(26,26,26,.8);padding:25px;border-radius:14px;margin:15px 0;border:1px solid rgba(0,255,136,.1)}
label{display:block;color:#00ff88;font-size:12px;font-weight:600;margin:15px 0 6px;text-transform:uppercase;letter-spacing:1px}
input{width:100%;padding:14px;background:rgba(0,0,0,.4);color:#fff;border:1px solid #333;border-radius:10px;font-size:15px}
input:focus{outline:none;border-color:#00ff88}
.row{display:flex;gap:10px}.row>div{flex:1}
.btn{width:100%;padding:16px;background:linear-gradient(135deg,#00ff88,#00cc6a);color:#000;font-weight:800;font-size:15px;border:none;border-radius:12px;margin-top:20px;cursor:pointer;text-transform:uppercase}
.info{background:rgba(0,255,136,.1);border-left:3px solid #00ff88;padding:12px;border-radius:8px;font-size:12px;color:#aaa;margin-top:15px}
</style></head><body><div class="c"><div class="head"><div class="logo">INSTANT PICKS</div><div class="tag">Smart Picks, Not Sure Promises</div></div>
<div class="card"><form action="/analyze" method="POST">
<label>Team A</label><input name="team_a" placeholder="e.g. Manchester" required>
<label>Team B</label><input name="team_b" placeholder="e.g. Liverpool" required>
<label>Team A - Last 5 (W/L/D)</label><input name="form_a" placeholder="W,L,D,W,W" required>
<label>Team B - Last 5 (W/L/D)</label><input name="form_b" placeholder="L,W,L,D,W" required>
<div class="row"><div><label>Team A Position</label><input name="table_a" type="number" placeholder="3" required></div>
<div><label>Team B Position</label><input name="table_b" type="number" placeholder="7" required></div></div>
<button type="submit" class="btn">ANALYZE MATCH</button></form>
<div class="info">Enter W, L, or D for last 5 matches, separated by commas.</div></div></div></body></html>`,
  { headers: { "Content-Type": "text/html" } });
}
