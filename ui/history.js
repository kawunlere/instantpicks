// HISTORY PAGE
import { getNav, buildPage } from "./shared.js";

export function renderHistory() {
  const nav = getNav("history");
  const body = 
    '<div class="head"><div class="logo">⚡ HISTORY ⚡</div><div class="tag">YOUR PAST PREDICTIONS</div></div>' +
    '<div class="card"><div id="hist" class="muted">Loading...</div></div>' +
    '<script>' +
    'async function loadHistory(){' +
      'try{' +
        'var r=await fetch("/api/predictions");' +
        'var p=await r.json();' +
        'var h=document.getElementById("hist");' +
        'if(!h)return;' +
        'if(!p.length){h.innerHTML="<p>No predictions yet. Make your first analysis!</p>";return}' +
        'h.innerHTML=p.map(function(x){' +
          'var statusColor=x.status==="win"?"hl":x.status==="lose"?"warn-text":"muted";' +
          'var statusText=x.status==="win"?"WIN":x.status==="lose"?"LOSE":"PENDING";' +
          'var picks=(x.picks||[]).slice(0,3).map(function(pk){return pk.name+" ("+pk.conf+"%)";}).join(" • ");' +
          'return "<div style=\\"padding:12px;border-bottom:1px solid #222\\"><div style=\\"display:flex;justify-content:space-between\\"><b class=\\"hl\\">"+(x.match||"Match")+"</b><span class=\\"warn-text\\">"+statusText+"</span></div><div style=\\"font-size:10px;color:var(--gray);margin-top:3px\\">"+new Date(x.time).toLocaleString()+"</div><div style=\\"font-size:11px;margin-top:5px;color:#ccc\\">"+picks+"</div></div>";' +
        '}).join("");' +
      '}catch(e){}' +
    '}' +
    'loadHistory();' +
    '</script>';
  
  return buildPage("HISTORY", nav, body);
}
