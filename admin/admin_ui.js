// ADMIN UI - The secret admin page
import { buildPage } from "../ui/shared.js";

export function renderAdmin(active = "main") {
  const body = 
    '<div class="admin-only">🔐 OWNER ACCESS — SECRET PANEL</div>' +
    '<div class="head"><div class="logo">⚡ OWNER PANEL ⚡</div><div class="tag">SYSTEM CONTROL</div></div>' +
    
    // TABS
    '<div class="nav">' +
      '<a href="/kawunlere-control-2024" class="' + (active === "main" ? "active" : "") + '"><span class="icon">⚙</span><span>MAIN</span></a>' +
      '<a href="/kawunlere-control-2024/chat" class="' + (active === "chat" ? "active" : "") + '"><span class="icon">💬</span><span>CHAT</span></a>' +
      '<a href="/kawunlere-control-2024/research" class="' + (active === "research" ? "active" : "") + '"><span class="icon">🔍</span><span>RESEARCH</span></a>' +
      '<a href="/kawunlere-control-2024/data" class="' + (active === "data" ? "active" : "") + '"><span class="icon">📊</span><span>DATA</span></a>' +
    '</div>' +
    
    renderAdminContent(active);
  
  return buildPage("ADMIN", "", body, '.admin-only{background:#1a0000;color:#ff6666;padding:10px;text-align:center;font-size:12px;letter-spacing:2px;font-weight:900;margin-bottom:15px;border-radius:5px;border:1px solid #ff3333}.admin-tabs{display:flex;gap:5px;margin-bottom:20px}.admin-tab{padding:12px;background:rgba(0,0,0,.5);border:1px solid #333;border-radius:6px;color:var(--gray);text-decoration:none;font-size:11px;font-weight:700;flex:1;text-align:center}.admin-tab.active{background:rgba(0,255,136,.15);border-color:var(--green);color:var(--green)}.section-card{background:rgba(0,0,0,.4);border:1px solid #333;border-radius:10px;padding:15px;margin:10px 0}');
}

function renderAdminContent(active) {
  if (active === "main") {
    return '<div class="section-card"><h3 class="ct">SYSTEM STATUS</h3><div id="health">Loading...</div></div>' +
      '<div class="section-card"><h3 class="ct">QUICK ACTIONS</h3>' +
        '<button class="btn" onclick="runResearchNow()">🔍 RESEARCH ALL PLATFORMS NOW</button>' +
        '<button class="btn" style="background:#332200;color:var(--yellow);margin-top:10px" onclick="researchOne()">🔍 RESEARCH SPECIFIC PLATFORM</button>' +
      '</div>' +
      '<div class="section-card"><h3 class="ct">DANGER ZONE</h3>' +
        '<button class="btn" style="background:#330000;color:var(--red);border:1px solid var(--red);box-shadow:none" onclick="resetData(\'stats\')">RESET STATS</button>' +
        '<button class="btn" style="background:#330000;color:var(--red);border:1px solid var(--red);box-shadow:none;margin-top:10px" onclick="resetData(\'patterns\')">RESET PATTERNS</button>' +
        '<button class="btn" style="background:#330000;color:var(--red);border:1px solid var(--red);box-shadow:none;margin-top:10px" onclick="resetData(\'research\')">CLEAR RESEARCH</button>' +
      '</div>' +
      '<script>' +
      'async function loadHealth(){' +
        'try{' +
          'var r=await fetch("/admin/api/health");var h=await r.json();' +
          'var html="<div class=\\"muted\\">Total Analyses: "+h.stats.total+"</div>";' +
          'html+="<div class=\\"muted\\">Win Rate: "+(h.stats.total>0?Math.round(h.stats.wins/h.stats.total*100):0)+"%</div>";' +
          'html+="<div class=\\"muted\\">Today: "+h.stats.todayTotal+" ("+h.stats.todayWins+" wins)</div>";' +
          'html+="<div class=\\"muted\\">Platforms: "+h.platforms+"</div>";' +
          'html+="<div class=\\"muted\\">Patterns Learned: "+h.patterns+"</div>";' +
          'html+="<div class=\\"muted\\">Research Records: "+h.research+"</div>";' +
          'html+="<div class=\\"muted\\">Last Research: "+h.lastResearch+"</div>";' +
          'if(h.needsResearch)html+="<div class=\\"warning\\">⚠ Daily research needed</div>";' +
          'if(h.streak.warning)html+="<div class=\\"warning\\">"+h.streak.warning+"</div>";' +
          'document.getElementById("health").innerHTML=html;' +
        '}catch(e){}' +
      '}' +
      'async function runResearchNow(){if(!confirm("Research all platforms now?"))return;alert("Starting research... may take 30 seconds");await fetch("/admin/api/research",{method:"POST"});loadHealth();}' +
      'async function researchOne(){var p=prompt("Which platform? (sportybet, bet9ja, betway, 1xbet, football_com)");if(!p)return;await fetch("/admin/api/research?platform="+p,{method:"POST"});loadHealth();}' +
      'async function resetData(type){if(!confirm("Reset "+type+"? Cannot undo!"))return;await fetch("/admin/api/reset?type="+type,{method:"POST"});loadHealth();}' +
      'loadHealth();' +
      '</script>';
  }
  
  if (active === "chat") {
    return '<div class="section-card"><h3 class="ct">CHAT WITH SYSTEM</h3>' +
      '<p class="muted">Ask about system, command research, get reports. You are the owner.</p>' +
      '<textarea id="cmd" rows="3" placeholder="Example: How is the system doing? Or: Research Bet9ja"></textarea>' +
      '<button class="btn" onclick="sendCmd()">⚡ SEND ⚡</button>' +
      '<div id="response" style="margin-top:15px"></div>' +
    '</div>' +
    '<script>' +
    'async function sendCmd(){' +
      'var q=document.getElementById("cmd").value.trim();' +
      'if(!q)return;' +
      'document.getElementById("response").innerHTML="<div class=\\"muted\\">Thinking...</div>";' +
      'try{' +
        'var r=await fetch("/admin/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q})});' +
        'var d=await r.json();' +
        'if(d.ok){document.getElementById("response").innerHTML="<div class=\\"txt\\">"+d.reply+"</div>";}' +
        'else{document.getElementById("response").innerHTML="<div class=\\"warn-text\\">Error: "+d.error+"</div>";}' +
      '}catch(e){document.getElementById("response").innerHTML="<div class=\\"warn-text\\">Error: "+e.message+"</div>";}' +
    '}' +
    '</script>';
  }
  
  if (active === "research") {
    return '<div class="section-card"><h3 class="ct">RESEARCH FINDINGS</h3>' +
      '<div id="research-list">Loading...</div>' +
    '</div>' +
    '<script>' +
    'async function loadResearch(){' +
      'try{' +
        'var r=await fetch("/admin/api/research/list");var d=await r.json();' +
        'if(!d.results.length){document.getElementById("research-list").innerHTML="<p class=\\"muted\\">No research yet. Click RESEARCH in MAIN tab to start.</p>";return}' +
        'var html="";' +
        'd.results.forEach(function(r){' +
          'html+="<div class=\\"section-card\\"><b class=\\"hl\\">"+r.platform+"</b><br><span class=\\"muted\\">Last: "+new Date(r.timestamp).toLocaleString()+"</span>";' +
          'if(r.data){' +
            'if(r.data.findings)html+="<div class=\\"txt\\" style=\\"margin-top:8px\\"><b>Findings:</b> "+r.data.findings+"</div>";' +
            'if(r.data.patterns&&r.data.patterns.length){html+="<div class=\\"muted\\"><b>Patterns:</b> "+r.data.patterns.join(", ")+"</div>";}' +
            'if(r.data.recommendations&&r.data.recommendations.length){html+="<div class=\\"muted\\"><b>Recommendations:</b> "+r.data.recommendations.join(", ")+"</div>";}' +
            'if(r.data.confidence)html+="<div class=\\"muted\\">Confidence: "+r.data.confidence+"%</div>";' +
          '}' +
          'html+="</div>";' +
        '});' +
        'document.getElementById("research-list").innerHTML=html;' +
      '}catch(e){}' +
    '}' +
    'loadResearch();' +
    '</script>';
  }
  
  if (active === "data") {
    return '<div class="section-card"><h3 class="ct">ALL PREDICTIONS</h3>' +
      '<div id="all-data">Loading...</div>' +
    '</div>' +
    '<script>' +
    'async function loadData(){' +
      'try{' +
        'var r=await fetch("/admin/api/all-data");var d=await r.json();' +
        'if(!d.predictions.length){document.getElementById("all-data").innerHTML="<p class=\\"muted\\">No predictions yet.</p>";return}' +
        'var html="";' +
        'd.predictions.forEach(function(p){' +
          'var status=p.status==="win"?"<span class=\\"hl\\">WIN</span>":p.status==="lose"?"<span class=\\"warn-text\\">LOSE</span>":"<span class=\\"muted\\">PENDING</span>";' +
          'var topPick=p.picks&&p.picks[0]?p.picks[0].name+" ("+p.picks[0].conf+"%)":"none";' +
          'html+="<div class=\\"section-card\\"><div style=\\"display:flex;justify-content:space-between\\"><b class=\\"hl\\">"+(p.match||"?")+"</b>"+status+"</div>";' +
          'html+="<div class=\\"muted\\" style=\\"font-size:11px\\">"+new Date(p.time).toLocaleString()+" | "+(p.platform||"")+"</div>";' +
          'html+="<div class=\\"muted\\" style=\\"font-size:12px\\">Top: "+topPick+"</div></div>";' +
        '});' +
        'document.getElementById("all-data").innerHTML=html;' +
      '}catch(e){}' +
    '}' +
    'loadData();' +
    '</script>';
  }
}

export function renderAdminLogin() {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Login</title><style>body{font-family:monospace;background:#0a0a0a;color:#fff;padding:20px;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.box{max-width:400px;width:100%;background:#161616;border:1px solid #00ff88;padding:30px;border-radius:10px;text-align:center}h1{color:#00ff88;text-shadow:0 0 10px #00ff88}input{width:100%;padding:12px;background:#000;color:#fff;border:1px solid #333;border-radius:6px;margin:15px 0;font-size:14px;box-sizing:border-box}button{width:100%;padding:12px;background:#00ff88;color:#000;border:none;border-radius:6px;font-weight:900;cursor:pointer;text-transform:uppercase}</style></head><body><div class="box"><h1>🔐 ADMIN</h1><p>Enter password to access</p><input type="password" id="p" placeholder="Password"><button onclick="login()">LOGIN</button><p id="err" style="color:#ff3333;margin-top:15px"></p></div><script>async function login(){var p=document.getElementById("p").value;var fd=new FormData();fd.append("password",p);var r=await fetch("/kawunlere-control-2024/login",{method:"POST",body:fd});var d=await r.json();if(d.ok){document.cookie="admin=1;path=/;max-age=86400";window.location="/kawunlere-control-2024";}else{document.getElementById("err").textContent="Wrong password";}}</script></body></html>';
}

export function renderAdminLogin() {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Login</title><style>body{font-family:monospace;background:#0a0a0a;color:#fff;padding:20px;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.box{max-width:400px;width:100%;background:#161616;border:1px solid #00ff88;padding:30px;border-radius:10px;text-align:center}h1{color:#00ff88;text-shadow:0 0 10px #00ff88}input{width:100%;padding:12px;background:#000;color:#fff;border:1px solid #333;border-radius:6px;margin:15px 0;font-size:14px;box-sizing:border-box}button{width:100%;padding:12px;background:#00ff88;color:#000;border:none;border-radius:6px;font-weight:900;cursor:pointer;text-transform:uppercase}</style></head><body><div class="box"><h1>🔐 ADMIN</h1><p>Enter password to access</p><input type="password" id="p" placeholder="Password"><button onclick="login()">LOGIN</button><p id="err" style="color:#ff3333;margin-top:15px"></p></div><script>async function login(){var p=document.getElementById("p").value;var fd=new FormData();fd.append("password",p);var r=await fetch("/kawunlere-control-2024/login",{method:"POST",body:fd});var d=await r.json();if(d.ok){document.cookie="admin=1;path=/;max-age=86400";window.location="/kawunlere-control-2024";}else{document.getElementById("err").textContent="Wrong password";}}</script></body></html>';
}
