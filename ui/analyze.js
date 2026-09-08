import { getNav, buildPage } from "./shared.js";
import { getAllPlatforms } from "../engines/platforms.js";

export function renderAnalyze() {
  const nav = getNav("analyze");
  const platforms = getAllPlatforms();
  const platformOptions = platforms.map(p => '<option value="' + p.id + '">' + p.name + ' — ' + p.game + '</option>').join("");

  const buildFullMatch = (n, isFirst) => {
    var removeBtn = isFirst ? '' : '<button type="button" onclick="removeMatch(' + n + ')" style="background:#1a0000;color:#ff3333;border:1px solid #ff3333;border-radius:5px;padding:4px 8px;cursor:pointer;font-size:10px;float:right">REMOVE</button>';
    return '<div class="card" id="match_' + n + '">' + removeBtn + '<h3 class="ct">MATCH ' + n + (isFirst ? ' (Required)' : ' (Optional)') + '</h3>' +
      '<div class="row"><div><label>TEAM A NAME</label><input id="m' + n + '_team_a" placeholder="e.g. Chelsea"></div>' +
      '<div><label>TEAM B NAME</label><input id="m' + n + '_team_b" placeholder="e.g. Tottenham"></div></div>' +
      '<div class="row"><div><label>TEAM A SIZE</label><select id="m' + n + '_team_a_size"><option value="MEDIUM">MEDIUM</option><option value="BIG">BIG TEAM</option><option value="SMALL">SMALL TEAM</option></select></div>' +
      '<div><label>TEAM B SIZE</label><select id="m' + n + '_team_b_size"><option value="MEDIUM">MEDIUM</option><option value="BIG">BIG TEAM</option><option value="SMALL">SMALL TEAM</option></select></div></div>' +
      '<div class="row"><div><label>WHO IS HOME?</label><select id="m' + n + '_home_team"><option value="A">TEAM A HOME</option><option value="B">TEAM B HOME</option><option value="NEUTRAL">NEUTRAL</option></select></div></div>' +
      '<div class="row"><div><label>TEAM A TABLE POS</label><input id="m' + n + '_pos_a" type="number" placeholder="3"></div>' +
      '<div><label>TEAM B TABLE POS</label><input id="m' + n + '_pos_b" type="number" placeholder="7"></div></div>' +
      '<div class="row"><div><label>HOME WIN ODDS</label><input id="m' + n + '_odds_home" type="number" step="0.01" placeholder="1.90"></div>' +
      '<div><label>DRAW ODDS</label><input id="m' + n + '_odds_draw" type="number" step="0.01" placeholder="3.40"></div>' +
      '<div><label>AWAY WIN ODDS</label><input id="m' + n + '_odds_away" type="number" step="0.01" placeholder="4.50"></div></div>' +
      '<label style="margin-top:10px;display:block">TEAM A FORM (tap W/D/L buttons)</label>' +
      '<div style="display:flex;gap:5px;margin:8px 0">' +
      '<button type="button" onclick="addForm(' + n + ',\'a\',\'W\')" style="flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700">W</button>' +
      '<button type="button" onclick="addForm(' + n + ',\'a\',\'D\')" style="flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700">D</button>' +
      '<button type="button" onclick="addForm(' + n + ',\'a\',\'L\')" style="flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700">L</button>' +
      '</div>' +
      '<input id="m' + n + '_form_a" placeholder="W,L,D,W,W">' +
      '<label style="margin-top:10px;display:block">TEAM B FORM</label>' +
      '<div style="display:flex;gap:5px;margin:8px 0">' +
      '<button type="button" onclick="addForm(' + n + ',\'b\',\'W\')" style="flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700">W</button>' +
      '<button type="button" onclick="addForm(' + n + ',\'b\',\'D\')" style="flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700">D</button>' +
      '<button type="button" onclick="addForm(' + n + ',\'b\',\'L\')" style="flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700">L</button>' +
      '</div>' +
      '<input id="m' + n + '_form_b" placeholder="L,W,L,D,W">' +
      '<div class="row" style="margin-top:10px"><div><label>H2H MEETINGS</label><input id="m' + n + '_h2h_meetings" type="number" placeholder="10"></div>' +
      '<div><label>H2H AVG GOALS</label><input id="m' + n + '_h2h_avg" type="number" step="0.1" placeholder="2.5"></div></div>' +
      '<div><label>H2H A WINS</label><input id="m' + n + '_h2h_a" type="number" placeholder="4"></div></div>' +
      '<div><label>H2H DRAWS</label><input id="m' + n + '_h2h_d" type="number" placeholder="3"></div></div>' +
      '<div><label>H2H B WINS</label><input id="m' + n + '_h2h_b" type="number" placeholder="3"></div></div></div>' +
      '<label style="margin-top:10px;display:block">TEAM A SCORES (optional, e.g. 2-1,0-0,3-1)</label>' +
      '<input id="m' + n + '_scores_a" placeholder="2-1,0-0,3-1,1-2,2-0">' +
      '<label style="margin-top:10px;display:block">TEAM B SCORES (optional)</label>' +
      '<input id="m' + n + '_scores_b" placeholder="1-1,0-2,2-2,1-0,0-1">' +
      '<label style="margin-top:10px;display:block">HOW IS THE MATCH PLAYING? (optional)</label>' +
      '<textarea id="m' + n + '_conv" rows="2" placeholder="e.g. Team A pressing high, Team B defensive..."></textarea>' +
      '</div>';
  };

  const body = '<div class="head"><div class="logo">⚡ ANALYZE ⚡</div><div class="tag">SMART MATCH ANALYSIS</div></div>' +
    '<div class="card"><label>PLATFORM</label><select id="platform">' + platformOptions + '</select></div>' +
    '<div id="matches">' + buildFullMatch(1, true) + '</div>' +
    '<button class="btn" id="addBtn" style="background:linear-gradient(135deg,#00cc6a,#009955)">+ ADD MATCH (Optional - for Accumulator)</button>' +
    '<button class="btn" id="goBtn" style="margin-top:10px">⚡ ANALYZE ⚡</button>' +
    '<div id="result"></div>' +
    '<script>' +
    'var matchCount=1;' +
    'function addForm(n,t,v){var el=document.getElementById("m"+n+"_form_"+t);if(!el)return;var cur=el.value?el.value.split(","):[];if(cur.length>=5)return;cur.push(v);el.value=cur.join(",");}' +
    'function removeMatch(n){var el=document.getElementById("match_"+n);if(el)el.remove();}' +
    'function addMatch(){matchCount++;var removeBtn="<button type=\"button\" onclick=\"removeMatch("+matchCount+")\" style=\"background:#1a0000;color:#ff3333;border:1px solid #ff3333;border-radius:5px;padding:4px 8px;cursor:pointer;font-size:10px;float:right\">REMOVE</button>";' +
    'var h="<div class=\"card\" id=\"match_"+matchCount+"\">"+removeBtn+"<h3 class=\"ct\">MATCH "+matchCount+" (Optional)</h3>";' +
    'h+="<div class=\"row\"><div><label>TEAM A NAME</label><input id=\"m"+matchCount+"_team_a\" placeholder=\"e.g. Chelsea\"></div>";' +
    'h+="<div><label>TEAM B NAME</label><input id=\"m"+matchCount+"_team_b\" placeholder=\"e.g. Tottenham\"></div></div>";' +
    'h+="<div class=\"row\"><div><label>TEAM A SIZE</label><select id=\"m"+matchCount+"_team_a_size\"><option value=\"MEDIUM\">MEDIUM</option><option value=\"BIG\">BIG</option><option value=\"SMALL\">SMALL</option></select></div>";' +
    'h+="<div><label>TEAM B SIZE</label><select id=\"m"+matchCount+"_team_b_size\"><option value=\"MEDIUM\">MEDIUM</option><option value=\"BIG\">BIG</option><option value=\"SMALL\">SMALL</option></select></div></div>";' +
    'h+="<div class=\"row\"><div><label>HOME?</label><select id=\"m"+matchCount+"_home_team\"><option value=\"A\">A HOME</option><option value=\"B\">B HOME</option><option value=\"NEUTRAL\">NEUTRAL</option></select></div></div>";' +
    'h+="<div class=\"row\"><div><label>A POS</label><input id=\"m"+matchCount+"_pos_a\" type=\"number\" placeholder=\"3\"></div>";' +
    'h+="<div><label>B POS</label><input id=\"m"+matchCount+"_pos_b\" type=\"number\" placeholder=\"7\"></div></div>";' +
    'h+="<div class=\"row\"><div><label>HOME ODDS</label><input id=\"m"+matchCount+"_odds_home\" type=\"number\" step=\"0.01\" placeholder=\"1.90\"></div>";' +
    'h+="<div><label>DRAW</label><input id=\"m"+matchCount+"_odds_draw\" type=\"number\" step=\"0.01\" placeholder=\"3.40\"></div>";' +
    'h+="<div><label>AWAY</label><input id=\"m"+matchCount+"_odds_away\" type=\"number\" step=\"0.01\" placeholder=\"4.50\"></div></div>";' +
    'h+="<label style=\"margin-top:10px;display:block\">A FORM</label><div style=\"display:flex;gap:5px;margin:8px 0\"><button type=\"button\" onclick=\"addForm("+matchCount+",\\\'a\\\',\\\'W\\\') \" style=\"flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">W</button><button type=\"button\" onclick=\"addForm("+matchCount+",\\\'a\\\',\\\'D\\\') \" style=\"flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">D</button><button type=\"button\" onclick=\"addForm("+matchCount+",\\\'a\\\',\\\'L\\\') \" style=\"flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">L</button></div>";' +
    'h+="<input id=\"m"+matchCount+"_form_a\" placeholder=\"W,L,D,W,W\">";' +
    'h+="<label style=\"margin-top:10px;display:block\">B FORM</label><div style=\"display:flex;gap:5px;margin:8px 0\"><button type=\"button\" onclick=\"addForm("+matchCount+",\\\'b\\\',\\\'W\\\') \" style=\"flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">W</button><button type=\"button\" onclick=\"addForm("+matchCount+",\\\'b\\\',\\\'D\\\') \" style=\"flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">D</button><button type=\"button\" onclick=\"addForm("+matchCount+",\\\'b\\\',\\\'L\\\') \" style=\"flex:1;padding:10px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">L</button></div>";' +
    'h+="<input id=\"m"+matchCount+"_form_b\" placeholder=\"L,W,L,D,W\">";' +
    'h+="<label style=\"margin-top:10px;display:block\">MATCH (optional)</label><textarea id=\"m"+matchCount+"_conv\" rows=\"2\" placeholder=\"e.g. pressing high...\"></textarea></div>";' +
    'document.getElementById("matches").insertAdjacentHTML("beforeend",h);}' +
    'document.getElementById("addBtn").addEventListener("click",addMatch);' +
    'document.getElementById("goBtn").addEventListener("click",async function(){' +
    'var btn=this;btn.disabled=true;btn.textContent="ANALYZING...";' +
    'var results=[];' +
    'for(var i=1;i<=50;i++){var ta=document.getElementById("m"+i+"_team_a");if(ta&&ta.value){var fd=new FormData();fd.append("platform",document.getElementById("platform").value);fd.append("team_a",ta.value);fd.append("team_b",document.getElementById("m"+i+"_team_b").value);fd.append("form_a",document.getElementById("m"+i+"_form_a").value);fd.append("form_b",document.getElementById("m"+i+"_form_b").value);fd.append("pos_a",document.getElementById("m"+i+"_pos_a").value);fd.append("pos_b",document.getElementById("m"+i+"_pos_b").value);fd.append("odds_home",document.getElementById("m"+i+"_odds_home").value);fd.append("odds_draw",document.getElementById("m"+i+"_odds_draw").value);fd.append("odds_away",document.getElementById("m"+i+"_odds_away").value);fd.append("home_team",document.getElementById("m"+i+"_home_team").value);fd.append("team_a_size",document.getElementById("m"+i+"_team_a_size").value);fd.append("team_b_size",document.getElementById("m"+i+"_team_b_size").value);fd.append("h2h_meetings",document.getElementById("m"+i+"_h2h_meetings").value);fd.append("h2h_avg_goals",document.getElementById("m"+i+"_h2h_avg").value);fd.append("h2h_home",document.getElementById("m"+i+"_h2h_a").value);fd.append("h2h_draw",document.getElementById("m"+i+"_h2h_d").value);fd.append("h2h_away",document.getElementById("m"+i+"_h2h_b").value);fd.append("scores_a",document.getElementById("m"+i+"_scores_a").value);fd.append("scores_b",document.getElementById("m"+i+"_scores_b").value);fd.append("conversation",document.getElementById("m"+i+"_conv").value);try{var r=await fetch("/api/analyze",{method:"POST",body:fd});var d=await r.json();if(d.ok)results.push(d);}catch(e){}}}' +
    'btn.disabled=false;btn.textContent="⚡ ANALYZE ⚡";' +
    'if(!results.length){alert("Please fill in Match 1 at least");return;}' +
    'var html="<div class=\"head\"><div class=\"logo\" style=\"font-size:20px\">⚡ RESULTS ⚡</div></div>";' +
    'var totalConf=1;' +
    'results.forEach(function(d){' +
    'html+="<div style=\"text-align:center;font-size:17px;font-weight:800;margin:15px 0 5px;color:#00ff88\">"+d.teamA+" VS "+d.teamB+"</div>";' +
    'html+="<div style=\"text-align:center;font-size:9px;color:#888;letter-spacing:2px;margin-bottom:10px\">"+d.platform.toUpperCase()+"</div>";' +
    'if(d.picks[0])totalConf*=d.picks[0].conf/100;' +
    'd.picks.forEach(function(p,i){' +
    'var risk="med";if(p.category==="goals_over"||p.category==="goals_under")risk="low";else if(p.category==="correct_score"||p.category==="combo")risk="high";' +
    'html+="<div class=\"card\" style=\"border-left:4px solid #00ff88;padding:14px;margin:10px 0;border-radius:8px\"><div style=\"display:flex;justify-content:space-between;align-items:center\"><span style=\"background:#00ff88;color:#000;padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900\">PICK #"+(i+1)+"</span><span style=\"padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900;background:#332200;color:#ffaa00;border:1px solid #ffaa00\">"+risk.toUpperCase()+"</span></div><div style=\"font-size:16px;font-weight:800;margin:6px 0\">"+p.name+"</div><div style=\"font-size:34px;font-weight:900;color:#00ff88;text-shadow:0 0 15px #00ff88;font-family:monospace\">"+p.conf+"%</div><div style=\"display:flex;gap:6px;margin-top:10px\"><form style=\"flex:1;display:flex;gap:6px\"><input type=\"hidden\" name=\"predId\" value=\""+d.predId+"\"><input type=\"hidden\" name=\"pick\" value=\""+p.name+"\"><button type=\"submit\" name=\"outcome\" value=\"win\" style=\"flex:1;padding:11px;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;background:#00ff88;color:#000\">WIN</button><button type=\"submit\" name=\"outcome\" value=\"lose\" style=\"flex:1;padding:11px;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;background:#1a0000;color:#ff3333;border:1px solid #ff3333\">LOSE</button></form></div></div>";' +
    '});' +
    '});' +
    'var combinedConf=Math.round(totalConf*100);' +
    'var accTitle=results.length>1?"COMBINED ACCUMULATOR ("+results.length+" matches)":"SINGLE MATCH ANALYSIS";' +
    'html+="<div style=\"background:rgba(0,255,136,.1);border:2px solid #00ff88;border-radius:12px;padding:16px;margin:12px 0;text-align:center\"><div style=\"color:#888;font-size:9px;letter-spacing:2px\">"+accTitle+"</div><div style=\"font-size:42px;font-weight:900;color:#00ff88;text-shadow:0 0 20px #00ff88\">"+combinedConf+"%</div><div style=\"color:#888;font-size:11px;margin-top:5px\">"+(results.length>1?"All picks must hit":"Confidence rating")+"</div></div>";' +
    'html+="<a href=\"/analyze\" class=\"btn\">NEW ANALYSIS</a>";' +
    'document.getElementById("result").innerHTML=html;' +
    'document.getElementById("result").scrollIntoView({behavior:"smooth"});' +
    'document.querySelectorAll("#result form").forEach(function(f){' +
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
