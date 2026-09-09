import { getNav, buildPage } from "./shared.js";

export function renderMines() {
  var nav = getNav("mines");
  var html = '<div class="head"><div class="logo">MINES</div><div class="tag">PROVABLY FAIR ANALYZER</div></div>';
  html += '<div class="card glow"><h3 class="ct">MINES PREDICTOR</h3><p class="muted">Paste seeds from SportyBet. Grid shows safe tiles in GREEN.</p></div>';
  html += '<div class="card"><h3 class="ct">5x5 MINE GRID</h3><div id="mineGrid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:10px;background:linear-gradient(135deg,#1e90ff,#0066cc);padding:15px;border-radius:12px">';
  for (var i = 0; i < 25; i++) {
    html += '<div id="tile' + i + '" style="aspect-ratio:1;background:#2a5a8a;border-radius:6px;display:flex;align-items:center;justify-content:center;border:1px solid #1e3a5f"><div style="width:18px;height:18px;background:#4a7ab5;border-radius:50%;box-shadow:inset 0 2px 4px rgba(0,0,0,0.3)"></div></div>';
  }
  html += '</div><p class="muted" style="margin-top:10px;text-align:center">Click ANALYZE to see safe tiles (GREEN)</p></div>';
  html += '<div class="card"><label>SERVER SEED SHA256</label><input id="server_seed" placeholder="e.g. bC6NHLluM9ohcJUxo7VYSfJuwyzUcsEbHhactD89"></div>';
  html += '<div class="card"><label>CLIENT SEED</label><input id="client_seed" placeholder="e.g. IV3PnZCfIdjrBxBUgok4-1"></div>';
  html += '<div class="card"><label>NUMBER OF MINES (1-24)</label><input id="num_mines" type="number" min="1" max="24" value="3"></div>';
  html += '<button class="btn" id="goBtn">⚡ ANALYZE MINES ⚡</button>';
  html += '<div id="result"></div>';
  html += "<script>document.getElementById('goBtn').addEventListener('click',async function(){var btn=this;btn.disabled=true;btn.textContent='CALCULATING...';for(var i=0;i<25;i++){var t=document.getElementById('tile'+i);if(t){t.style.background='#2a5a8a';t.innerHTML='<div style=\"width:18px;height:18px;background:#4a7ab5;border-radius:50%;box-shadow:inset 0 2px 4px rgba(0,0,0,0.3)\"></div>';}}var fd=new FormData();fd.append('server_seed',document.getElementById('server_seed').value);fd.append('client_seed',document.getElementById('client_seed').value);fd.append('num_mines',document.getElementById('num_mines').value);try{var r=await fetch('/api/mines',{method:'POST',body:fd});var d=await r.json();if(d.ok){showResult(d);}else{alert('Error: '+d.error);}}catch(e){alert('Error: '+e.message);}btn.disabled=false;btn.textContent='⚡ ANALYZE MINES ⚡';});function showResult(d){for(var i=0;i<25;i++){var t=document.getElementById('tile'+i);if(t){var isMine=d.minePositions.indexOf(i)!==-1;if(isMine){t.style.background='#1a0000';t.innerHTML='<div style=\"width:14px;height:14px;background:#660000;border-radius:50%;border:1px solid #ff0000\"></div>';}else{t.style.background='#003300';t.innerHTML='<div style=\"width:18px;height:18px;background:#00ff66;border-radius:50%;box-shadow:0 0 8px #00ff66\"></div>';}}}var html='<div class=\"card glow\"><h3 class=\"ct\">'+d.confidence+'% CONFIDENCE</h3><p class=\"muted\">GREEN = Safe to click in SportyBet</p><p class=\"muted\">RED = DO NOT CLICK (mines)</p>';if(d.hash){html+='<p class=\"muted\" style=\"font-size:10px\">SHA512: '+d.hash+'</p>';}html+='<button class=\"btn\" onclick=\"location.reload()\">NEW GAME</button></div>';document.getElementById('result').innerHTML=html;document.getElementById('result').scrollIntoView({behavior:'smooth'});}</script>";
  return buildPage("MINES", nav, html);
}
