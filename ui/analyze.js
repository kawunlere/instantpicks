import { getNav, buildPage } from "./shared.js";
import { getAllPlatforms } from "../engines/platforms.js";

export function renderAnalyze() {
  const nav = getNav("analyze");
  const platforms = getAllPlatforms();
  const platformOptions = platforms.map(p => "<option value=\"" + p.id + "\">" + p.name + " - " + p.game + "</option>").join("");

  var html = "<div class=\"head\"><div class=\"logo\">ANALYZE</div><div class=\"tag\">SMART MATCH ANALYSIS</div></div>";
  html += "<div class=\"card\"><label>PLATFORM</label><select id=\"platform\">" + platformOptions + "</select></div>";
  html += "<div class=\"card\"><h3 class=\"ct\">MATCH 1 (Main Match)</h3>";
  html += "<div class=\"row\"><div><label>TEAM A</label><input id=\"team_a\" placeholder=\"e.g. Chelsea\"></div>";
  html += "<div><label>TEAM B</label><input id=\"team_b\" placeholder=\"e.g. Tottenham\"></div></div>";
  html += "<div class=\"row\"><div><label>TEAM A POS</label><input id=\"pos_a\" type=\"number\" placeholder=\"3\"></div>";
  html += "<div><label>TEAM B POS</label><input id=\"pos_b\" type=\"number\" placeholder=\"7\"></div></div>";
  html += "<label>TEAM A FORM (tap buttons)</label><div style=\"display:flex;gap:5px;margin:8px 0\">";
  html += "<button type=\"button\" onclick=\"addForm('a','W')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">W</button>";
  html += "<button type=\"button\" onclick=\"addForm('a','D')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">D</button>";
  html += "<button type=\"button\" onclick=\"addForm('a','L')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">L</button></div>";
  html += "<input id=\"form_a\" placeholder=\"W,L,D,W,W\">";
  html += "<label style=\"margin-top:10px;display:block\">TEAM B FORM (tap buttons)</label><div style=\"display:flex;gap:5px;margin:8px 0\">";
  html += "<button type=\"button\" onclick=\"addForm('b','W')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">W</button>";
  html += "<button type=\"button\" onclick=\"addForm('b','D')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">D</button>";
  html += "<button type=\"button\" onclick=\"addForm('b','L')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">L</button></div>";
  html += "<input id=\"form_b\" placeholder=\"L,W,L,D,W\">";
  html += "<label style=\"margin-top:10px;display:block\">MATCH DESCRIPTION (optional)</label>";
  html += "<textarea id=\"conv\" rows=\"2\" placeholder=\"e.g. Team A pressing high...\"></textarea></div>";
  html += "<div class=\"card\"><h3 class=\"ct\">MATCH 2 (Optional - only if you want)</h3>";
  html += "<div class=\"row\"><div><label>TEAM A</label><input id=\"team_a2\" placeholder=\"e.g. Arsenal\"></div>";
  html += "<div><label>TEAM B</label><input id=\"team_b2\" placeholder=\"e.g. Chelsea\"></div></div>";
  html += "<div class=\"row\"><div><label>TEAM A POS</label><input id=\"pos_a2\" type=\"number\" placeholder=\"5\"></div>";
  html += "<div><label>TEAM B POS</label><input id=\"pos_b2\" type=\"number\" placeholder=\"2\"></div></div>";
  html += "<label>TEAM A FORM</label><div style=\"display:flex;gap:5px;margin:8px 0\">";
  html += "<button type=\"button\" onclick=\"addForm2('a','W')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">W</button>";
  html += "<button type=\"button\" onclick=\"addForm2('a','D')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">D</button>";
  html += "<button type=\"button\" onclick=\"addForm2('a','L')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">L</button></div>";
  html += "<input id=\"form_a2\" placeholder=\"W,L,W,D,L\">";
  html += "<label style=\"margin-top:10px;display:block\">TEAM B FORM</label><div style=\"display:flex;gap:5px;margin:8px 0\">";
  html += "<button type=\"button\" onclick=\"addForm2('b','W')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">W</button>";
  html += "<button type=\"button\" onclick=\"addForm2('b','D')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">D</button>";
  html += "<button type=\"button\" onclick=\"addForm2('b','L')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">L</button></div>";
  html += "<input id=\"form_b2\" placeholder=\"D,L,W,L,W\"></div>";
  html += "<button class=\"btn\" id=\"goBtn\">⚡ ANALYZE ⚡</button>";
  html += "<div id=\"result\"></div>";
  html += "<script>function addForm(t,v){var el=document.getElementById(\"form_\"+t);if(!el)return;var cur=el.value?el.value.split(\",\"):[];if(cur.length>=5)return;cur.push(v);el.value=cur.join(\",\");}function addForm2(t,v){var el=document.getElementById(\"form_\"+t+\"2\");if(!el)return;var cur=el.value?el.value.split(\",\"):[];if(cur.length>=5)return;cur.push(v);el.value=cur.join(\",\");}";
  html += "document.getElementById(\"goBtn\").addEventListener(\"click\",async function(){var btn=this;btn.disabled=true;btn.textContent=\"ANALYZING...\";var results=[];var plat=document.getElementById(\"platform\").value;";
  html += "var ta1=document.getElementById(\"team_a\");if(ta1&&ta1.value){var fd=new FormData();fd.append(\"platform\",plat);fd.append(\"team_a\",ta1.value);fd.append(\"team_b\",document.getElementById(\"team_b\").value);fd.append(\"form_a\",document.getElementById(\"form_a\").value);fd.append(\"form_b\",document.getElementById(\"form_b\").value);fd.append(\"pos_a\",document.getElementById(\"pos_a\").value);fd.append(\"pos_b\",document.getElementById(\"pos_b\").value);fd.append(\"conversation\",document.getElementById(\"conv\").value);try{var r=await fetch(\"/api/analyze\",{method:\"POST\",body:fd});var d=await r.json();if(d.ok)results.push(d);}catch(e){}}";
  html += "var ta2=document.getElementById(\"team_a2\");if(ta2&&ta2.value){var fd2=new FormData();fd2.append(\"platform\",plat);fd2.append(\"team_a\",ta2.value);fd2.append(\"team_b\",document.getElementById(\"team_b2\").value);fd2.append(\"form_a\",document.getElementById(\"form_a2\").value);fd2.append(\"form_b\",document.getElementById(\"form_b2\").value);fd2.append(\"pos_a\",document.getElementById(\"pos_a2\").value);fd2.append(\"pos_b\",document.getElementById(\"pos_b2\").value);try{var r2=await fetch(\"/api/analyze\",{method:\"POST\",body:fd2});var d2=await r2.json();if(d2.ok)results.push(d2);}catch(e){}}";
  html += "btn.disabled=false;btn.textContent=\"⚡ ANALYZE ⚡\";if(!results.length){alert(\"Please fill Match 1\");return;}";
  html += "var html=\"<div class='head'><div class='logo' style='font-size:20px'>RESULTS</div></div>\";results.forEach(function(d){html+=\"<div style='text-align:center;font-size:17px;font-weight:800;margin:15px 0 5px;color:#00ff88'>\"+d.teamA+\" VS \"+d.teamB+\"</div>\";html+=\"<div style='text-align:center;font-size:9px;color:#888;letter-spacing:2px;margin-bottom:10px'>\"+d.platform.toUpperCase()+\"</div>\";d.picks.forEach(function(p,i){var risk='med';if(p.category==='goals_over'||p.category==='goals_under')risk='low';else if(p.category==='correct_score')risk='high';html+=\"<div class='card' style='border-left:4px solid #00ff88;padding:14px;margin:10px 0;border-radius:8px'><div style='display:flex;justify-content:space-between;align-items:center'><span style='background:#00ff88;color:#000;padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900'>PICK #\"+(i+1)+\"</span><span style='padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900;background:#332200;color:#ffaa00;border:1px solid #ffaa00'>\"+risk.toUpperCase()+\"</span></div><div style='font-size:16px;font-weight:800;margin:6px 0'>\"+p.name+\"</div><div style='font-size:34px;font-weight:900;color:#00ff88;text-shadow:0 0 15px #00ff88;font-family:monospace'>\"+p.conf+\"%</div><div style='display:flex;gap:6px;margin-top:10px'><form style='flex:1;display:flex;gap:6px'><input type='hidden' name='predId' value='\"+d.predId+\"'><input type='hidden' name='pick' value='\"+p.name+\"'><button type='submit' name='outcome' value='win' style='flex:1;padding:11px;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;background:#00ff88;color:#000'>WIN</button><button type='submit' name='outcome' value='lose' style='flex:1;padding:11px;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;background:#1a0000;color:#ff3333;border:1px solid #ff3333'>LOSE</button></form></div></div>\";});});";
  html += "html+=\"<a href='/analyze' class='btn'>NEW ANALYSIS</a>\";document.getElementById('result').innerHTML=html;document.getElementById('result').scrollIntoView({behavior:'smooth'});document.querySelectorAll('#result form').forEach(function(f){f.addEventListener('submit',async function(e){e.preventDefault();var fd=new FormData(f);await fetch('/api/result',{method:'POST',body:fd});alert('Logged!');});});});";
  html += "</" + "script>";

  return buildPage("ANALYZE", nav, html);
}
