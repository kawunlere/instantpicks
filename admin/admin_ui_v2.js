import { buildPage } from "../ui/shared.js";

function adminNav(active) {
  const tabs = [['main','MAIN'],['chat','CHAT'],['research','RESEARCH'],['data','DATA']];
  return '<div class="admin-nav">' + tabs.map(t => 
    '<a href="/kawunlere-control-2024/' + (t[0]==='main'?'':t[0]) + '" class="' + (active===t[0]?'active':'') + '">' + t[1] + '</a>'
  ).join("") + '</div>';
}

export function renderAdmin(active, env) {
  let body = '<div class="admin-only">OWNER ACCESS</div><div class="head"><div class="logo">OWNER PANEL</div><div class="tag">SYSTEM CONTROL</div></div>' + adminNav(active);
  
  if (active === 'main') {
    body += '<div class="section-card"><h3 class="ct">STATUS</h3><div id="health">Loading...</div></div><div class="section-card"><button class="btn" onclick="runResearch()">RESEARCH NOW</button></div><script>async function loadHealth(){try{var r=await fetch("/admin/api/health");var h=await r.json();document.getElementById("health").innerHTML="<div>Total: "+h.stats.total+"</div><div>Win: "+(h.stats.total>0?Math.round(h.stats.wins/h.stats.total*100):0)+"%</div>";}catch(e){}}async function runResearch(){await fetch("/admin/api/research",{method:"POST"});alert("Research started");}loadHealth();</script>';
  } else if (active === 'chat') {
    body += '<div class="section-card"><h3 class="ct">CHAT</h3><textarea id="cmd" rows="3" placeholder="Ask anything"></textarea><button class="btn" onclick="sendCmd()">SEND</button><div id="response"></div></div><script>async function sendCmd(){var q=document.getElementById("cmd").value.trim();if(!q)return;document.getElementById("response").innerHTML="Thinking...";try{var r=await fetch("/admin/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q})});var d=await r.json();document.getElementById("response").innerHTML=d.ok?d.reply:"Error";}catch(e){}}</script>';
  } else if (active === 'research') {
    body += '<div class="section-card"><h3 class="ct">RESEARCH</h3><div id="rl">Loading...</div></div><script>async function l(){try{var r=await fetch("/admin/api/research/list");var d=await r.json();document.getElementById("rl").innerHTML=d.results.length?d.results.map(function(r){return "<div>"+r.platform+" - "+new Date(r.timestamp).toLocaleString()+"</div>";}).join(""):"No research yet";}catch(e){}}l();</script>';
  } else if (active === 'data') {
    body += '<div class="section-card"><h3 class="ct">DATA</h3><div id="ad">Loading...</div></div><script>async function l(){try{var r=await fetch("/admin/api/all-data");var d=await r.json();document.getElementById("ad").innerHTML=d.predictions.length?d.predictions.map(function(p){return "<div>"+(p.match||"?")+" - "+(p.status||"pending")+"</div>";}).join(""):"No data";}catch(e){}}l();</script>';
  }
  
  return buildPage("ADMIN", "", body);
}

export function renderAdminLogin() {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin</title><style>body{font-family:monospace;background:#0a0a0a;color:#fff;padding:20px;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.box{max-width:400px;width:100%;background:#161616;border:1px solid #00ff88;padding:30px;border-radius:10px;text-align:center}h1{color:#00ff88}input{width:100%;padding:12px;background:#000;color:#fff;border:1px solid #333;border-radius:6px;margin:15px 0;font-size:14px;box-sizing:border-box}button{width:100%;padding:12px;background:#00ff88;color:#000;border:none;border-radius:6px;font-weight:900;cursor:pointer;text-transform:uppercase}</style></head><body><div class="box"><h1>ADMIN</h1><p>Enter password</p><input type="password" id="p"><button onclick="login()">LOGIN</button><p id="err" style="color:#ff3333;margin-top:15px"></p></div><script>async function login(){var p=document.getElementById("p").value;var fd=new FormData();fd.append("password",p);var r=await fetch("/kawunlere-control-2024/login",{method:"POST",body:fd});var d=await r.json();if(d.ok){document.cookie="admin=1;path=/;max-age=86400";window.location="/kawunlere-control-2024";}else{document.getElementById("err").textContent="Wrong password";}}</script></body></html>';
}
