import { getNav, buildPage } from "./shared.js";
import { getAllPlatforms } from "../engines/platforms.js";

export function renderAnalyze() {
  const nav = getNav("analyze");
  const platforms = getAllPlatforms();
  const platformOptions = platforms.map(p => '<option value="' + p.id + '">' + p.name + ' — ' + p.game + '</option>').join("");
  
  const buildMatch = (num) => `
    <div class="card">
      <h3 class="ct">MATCH ${num}</h3>
      <div class="row">
        <div><label>TEAM A</label><input id="m${num}_team_a" placeholder="e.g. Chelsea"></div>
        <div><label>TEAM B</label><input id="m${num}_team_b" placeholder="e.g. Tottenham"></div>
      </div>
      <div class="row">
        <div><label>TEAM A POS</label><input id="m${num}_pos_a" type="number" placeholder="3"></div>
        <div><label>TEAM B POS</label><input id="m${num}_pos_b" type="number" placeholder="7"></div>
      </div>
      <label>TEAM A FORM (tap W/D/L buttons)</label>
      <div style="display:flex;gap:5px;margin:8px 0">
        <button type="button" onclick="addForm(${num},'a','W')" style="flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700">W</button>
        <button type="button" onclick="addForm(${num},'a','D')" style="flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700">D</button>
        <button type="button" onclick="addForm(${num},'a','L')" style="flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700">L</button>
      </div>
      <input id="m${num}_form_a" placeholder="W,L,D,W,W">
      <label>TEAM B FORM</label>
      <div style="display:flex;gap:5px;margin:8px 0">
        <button type="button" onclick="addForm(${num},'b','W')" style="flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700">W</button>
        <button type="button" onclick="addForm(${num},'b','D')" style="flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700">D</button>
        <button type="button" onclick="addForm(${num},'b','L')" style="flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700">L</button>
      </div>
      <input id="m${num}_form_b" placeholder="L,W,L,D,W">
    </div>`;

  const body = '<div class="head"><div class="logo">⚡ ANALYZE ⚡</div><div class="tag">UP TO 3 MATCHES (ACCUMULATOR)</div></div>' +
    '<div class="card"><label>PLATFORM</label><select id="platform"><option value="">' + platformOptions + '</select></div>' +
    buildMatch(1) + buildMatch(2) + buildMatch(3) +
    '<button class="btn" id="goBtn">⚡ ANALYZE ALL 3 MATCHES ⚡</button>' +
    '<div id="result"></div>' +
    '<script>' +
    'function addForm(num,team,val){' +
      'var id="m"+num+"_form_"+team;' +
      'var el=document.getElementById(id);' +
      'var cur=el.value?el.value.split(","):[];' +
      'if(cur.length>=5)return;' +
      'cur.push(val);' +
      'el.value=cur.join(",");' +
    '}' +
    'document.getElementById("goBtn").addEventListener("click",async function(){' +
      'this.disabled=true;this.textContent="ANALYZING...";' +
      'var results=[];' +
      'for(var i=1;i<=3;i++){' +
        'var ta=document.getElementById("m"+i+"_team_a");' +
        'if(!ta||!ta.value)continue;' +
        'var fd=new FormData();' +
        'fd.append("platform",document.getElementById("platform").value);' +
        'fd.append("team_a",ta.value);' +
        'fd.append("team_b",document.getElementById("m"+i+"_team_b").value);' +
        'fd.append("form_a",document.getElementById("m"+i+"_form_a").value);' +
        'fd.append("form_b",document.getElementById("m"+i+"_form_b").value);' +
        'fd.append("pos_a",document.getElementById("m"+i+"_pos_a").value);' +
        'fd.append("pos_b",document.getElementById("m"+i+"_pos_b").value);' +
        'try{' +
          'var r=await fetch("/api/analyze",{method:"POST",body:fd});' +
          'var d=await r.json();' +
          'if(d.ok)results.push(d);' +
        '}catch(e){}' +
      '}' +
      'this.disabled=false;this.textContent="⚡ ANALYZE ALL 3 MATCHES ⚡";' +
      'if(!results.length){alert("Please fill in at least one match");return;}' +
      'var html="<div class=\\"head\\"><div class=\\"logo\\" style=\\"font-size:20px\\">⚡ RESULTS ⚡</div></div>";' +
      'var totalConf=1;' +
      'results.forEach(function(d){' +
        'html+="<div style=\\"text-align:center;font-size:17px;font-weight:800;margin:15px 0 5px;color:#00ff88\\">"+d.teamA+" VS "+d.teamB+"</div>";' +
        'html+="<div style=\\"text-align:center;font-size:9px;color:#888;letter-spacing:2px;margin-bottom:10px\\">"+d.platform.toUpperCase()+"</div>";' +
        'if(d.picks[0])totalConf*=d.picks[0].conf/100;' +
        'd.picks.forEach(function(p,i){' +
          'var risk="med";' +
          'if(p.category==="goals_over"||p.category==="goals_under")risk="low";' +
          'else if(p.category==="correct_score"||p.category==="combo")risk="high";' +
          'var rc="r-"+risk;' +
          'html+="<div class=\\"card\\" style=\\"border-left:4px solid #00ff88;padding:14px;margin:10px 0;border-radius:8px\\"><div style=\\"display:flex;justify-content:space-between;align-items:center\\"><span style=\\"background:#00ff88;color:#000;padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900\\">PICK #"+(i+1)+"</span><span style=\\"padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900;background:#332200;color:#ffaa00;border:1px solid #ffaa00\\">"+risk.toUpperCase()+"</span></div><div style=\\"font-size:16px;font-weight:800;margin:6px 0\\">"+p.name+"</div><div style=\\"font-size:34px;font-weight:900;color:#00ff88;text-shadow:0 0 15px #00ff88;font-family:monospace\\">"+p.conf+"%</div><div style=\\"display:flex;gap:6px;margin-top:10px\\"><form style=\\"flex:1;display:flex;gap:6px\\"><input type=\\"hidden\\" name=\\"pid\\" value=\\""+d.predId+"\"><input type=\\"hidden\\" name=\\"p\\" value=\\""+p.name+"\"><button type=\\"submit\\" name=\\"o\\" value=\\"win\\" style=\\"flex:1;padding:11px;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;background:#00ff88;color:#000\\">WIN</button><button type=\\"submit\\" name=\\"o\\" value=\\"lose\\" style=\\"flex:1;padding:11px;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;background:#1a0000;color:#ff3333;border:1px solid #ff3333\\">LOSE</button></form></div></div>";' +
        '});' +
        'html+="<form id=\\"winForm"+i+"\\" style=\\"display:none\\"><input name=\\"predId\\" value=\\""+d.predId+"\"><input name=\\"pick\\" value=\\"x\\"><input name=\\"outcome\\" value=\\"win\\"></form>";' +
      '});' +
      'var combinedConf=Math.round(totalConf*100);' +
      'html+="<div style=\\"background:rgba(0,255,136,.1);border:2px solid #00ff88;border-radius:12px;padding:16px;margin:12px 0;text-align:center\\"><div style=\\"color:#888;font-size:9px;letter-spacing:2px\\">COMBINED ACCUMULATOR</div><div style=\\"font-size:42px;font-weight:900;color:#00ff88;text-shadow:0 0 20px #00ff88\\">"+combinedConf+"%</div><div style=\\"color:#888;font-size:11px;margin-top:5px\\">All picks must hit</div></div>";' +
      'html+="<a href=\\"/analyze\\" class=\\"btn\\">NEW ANALYSIS</a>";' +
      'document.getElementById("result").innerHTML=html;' +
      'document.getElementById("result").scrollIntoView({behavior:"smooth"});' +
      'document.querySelectorAll("form").forEach(function(f){' +
        'f.addEventListener("submit",async function(e){' +
          'e.preventDefault();' +
          'var fd=new FormData(f);' +
          'await fetch("/api/result",{method:"POST",body:fd});' +
          'alert("Logged!");' +
        '});' +
      '});' +
    '});' +
    '</script>';

  return buildPage("ANALYZE", nav, body);
}
