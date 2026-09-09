import { getNav, buildPage } from "./shared.js";

export function renderMines() {
  var nav = getNav("mines");
  var gridHtml = "";
  for (var i = 0; i < 25; i++) {
    gridHtml += '<div id="mt' + i + '" style="aspect-ratio:1;background:#1e3a5f;border-radius:6px;display:flex;align-items:center;justify-content:center"><div style="width:16px;height:16px;background:#4a7ab5;border-radius:50%"></div></div>';
  }
  var html = '<div class="head"><div class="logo">MINES</div><div class="tag">PROVABLY FAIR ANALYZER</div></div>';
  html += '<div class="card"><h3 class="ct">5x5 MINE GRID</h3><div id="mg" style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;background:#1e90ff;padding:12px;border-radius:10px;margin-top:10px">' + gridHtml + '</div><p class="muted" style="margin-top:8px;text-align:center">Click ANALYZE: Green=safe, Red=mine</p></div>';
  html += '<div class="card"><label>SERVER SEED</label><input id="ss" placeholder="bC6NHLluM9ohcJUxo7VYSfJuwyzUcsEbHhactD89"></div>';
  html += '<div class="card"><label>CLIENT SEED</label><input id="cs" placeholder="IV3PnZCfIdjrBxBUgok4-1"></div>';
  html += '<div class="card"><label>MINES (1-24)</label><input id="nm" type="number" min="1" max="24" value="3"></div>';
  html += '<button class="btn" id="go">⚡ ANALYZE ⚡</button>';
  html += '<div id="r"></div>';
  html += '<script>document.getElementById("go").addEventListener("click",async function(){var b=this;b.disabled=true;b.textContent="CALCULATING...";for(var i=0;i<25;i++){var t=document.getElementById("mt"+i);t.style.background="#1e3a5f";t.innerHTML="<div style=\\"width:16px;height:16px;background:#4a7ab5;border-radius:50%\\"></div>";}var fd=new FormData();fd.append("server_seed",document.getElementById("ss").value);fd.append("client_seed",document.getElementById("cs").value);fd.append("num_mines",document.getElementById("nm").value);try{var r=await fetch("/api/mines",{method:"POST",body:fd});var d=await r.json();if(d.ok&&d.grid){for(var i=0;i<25;i++){var t=document.getElementById("mt"+i);if(d.minePositions.indexOf(i)!==-1){t.style.background="#330000";t.innerHTML="<div style=\\"width:14px;height:14px;background:#ff0000;border-radius:50%\\"></div>";}else{t.style.background="#003300";t.innerHTML="<div style=\\"width:18px;height:18px;background:#00ff66;border-radius:50%;box-shadow:0 0 8px #00ff66\\"></div>";}}document.getElementById("r").innerHTML="<div class=\\"card glow\\"><h3 class=\\"ct\\">"+d.confidence+"% CONFIDENCE</h3><p class=\\"muted\\">Green = Safe in SportyBet</p><p class=\\"muted\\">Red = DO NOT CLICK</p><button class=\\"btn\\" onclick=\\"location.reload()\\">NEW</button></div>";}else{alert("Error: "+(d.error||"unknown"));}b.disabled=false;b.textContent="⚡ ANALYZE ⚡";}catch(e){alert("Error: "+e.message);b.disabled=false;b.textContent="⚡ ANALYZE ⚡";}});</script>';
  return buildPage("MINES", nav, html);
}
