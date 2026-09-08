// STATS PAGE
import { getNav, buildPage } from "./shared.js";

export function renderStats() {
  const nav = getNav("dashboard");
  const body = 
    '<div class="head"><div class="logo">⚡ STATS ⚡</div><div class="tag">YOUR PERFORMANCE</div></div>' +
    '<div class="stats-grid">' +
      '<div class="stat-card"><div class="stat-num" id="d-total">0</div><div class="stat-lbl">TOTAL</div></div>' +
      '<div class="stat-card"><div class="stat-num" id="d-wins">0</div><div class="stat-lbl">WINS</div></div>' +
      '<div class="stat-card"><div class="stat-num" id="d-today">0</div><div class="stat-lbl">TODAY</div></div>' +
      '<div class="stat-card highlight"><div class="stat-num" id="d-rate">0%</div><div class="stat-lbl">RATE</div></div>' +
    '</div>' +
    '<div id="warning-box"></div>' +
    '<div class="card"><h3 class="ct">DISCIPLINE ALERTS</h3><div id="alerts" class="muted">All clear. Keep being disciplined.</div></div>' +
    '<div class="card"><a href="/analyze" class="btn">NEW ANALYSIS</a></div>' +
    '<script>' +
    'async function loadStats(){' +
      'try{' +
        'var r=await fetch("/api/stats");var s=await r.json();' +
        'var rate=s.total>0?Math.round(s.wins/s.total*1000)/10:0;' +
        'var dt=document.getElementById("d-total");if(dt)dt.textContent=s.total;' +
        'var dw=document.getElementById("d-wins");if(dw)dw.textContent=s.wins;' +
        'var dt2=document.getElementById("d-today");if(dt2)dt2.textContent=s.todayTotal||0;' +
        'var dr=document.getElementById("d-rate");if(dr)dr.textContent=rate+"%";' +
        'if(s.total>0){' +
          'var r2=await fetch("/api/predictions");var p=await r2.json();' +
          'var recent=p.slice(0,10).filter(function(x){return x.status==="win"||x.status==="lose"});' +
          'var cur=0,type=recent[0]?recent[0].status:"none";' +
          'for(var x of recent){if(x.status===type)cur++;else break;}' +
          'var al=document.getElementById("alerts");' +
          'if(type==="lose"&&cur>=3){' +
            'al.innerHTML="<b class=\\"warn-text\\">"+cur+" losses in a row</b> — Take a break or reduce stakes.";' +
            'document.getElementById("warning-box").innerHTML="<div class=\\"warning\\">"+cur+" LOSSES IN A ROW — Consider stopping</div>";' +
          '}else if(type==="win"&&cur>=3){' +
            'al.innerHTML="<b class=\\"hl\\">"+cur+" wins hot streak!</b> Stay disciplined.";' +
            'document.getElementById("warning-box").innerHTML="<div class=\\"warning\\">"+cur+" WINS STREAK — Stay disciplined</div>";' +
          '}' +
          'if(s.todayTotal>=5){' +
            'var todayRate=Math.round(s.todayWins/s.todayTotal*100);' +
            'if(todayRate<40){' +
              'al.innerHTML+="<br><b class=\\"warn-text\\">Today rough ("+todayRate+%)</b> — Consider stopping.";' +
            '}' +
          '}' +
        '}' +
      '}catch(e){}' +
    '}' +
    'loadStats();setInterval(loadStats, 3000);' +
    '</script>';
  
  return buildPage("STATS", nav, body);
}
