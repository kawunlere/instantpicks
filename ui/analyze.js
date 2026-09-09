import { getNav, buildPage } from "./shared.js";
import { getAllPlatforms } from "../engines/platforms.js";

export function renderAnalyze() {
  const nav = getNav("analyze");
  const platforms = getAllPlatforms();
  const platformOptions = platforms.map(p => "<option value=\"" + p.id + "\">" + p.name + " - " + p.game + "</option>").join("");

  var buildMatch = function(n) {
    return "<div class=\"card\"><h3 class=\"ct\">MATCH " + n + (n === 1 ? " (Main Match)" : " (Optional)") + "</h3>"
      + "<div class=\"row\"><div><label>TEAM A</label><input id=\"team_a" + n + "\" placeholder=\"e.g. Chelsea\"></div>"
      + "<div><label>TEAM B</label><input id=\"team_b" + n + "\" placeholder=\"e.g. Tottenham\"></div></div>"
      + "<div class=\"row\"><div><label>TEAM A SIZE</label><select id=\"size_a" + n + "\"><option value=\"MEDIUM\">MEDIUM</option><option value=\"BIG\">BIG</option><option value=\"SMALL\">SMALL</option></select></div>"
      + "<div><label>TEAM B SIZE</label><select id=\"size_b" + n + "\"><option value=\"MEDIUM\">MEDIUM</option><option value=\"BIG\">BIG</option><option value=\"SMALL\">SMALL</option></select></div></div>"
      + "<div class=\"row\"><div><label>HOME</label><select id=\"home" + n + "\"><option value=\"A\">A HOME</option><option value=\"B\">B HOME</option><option value=\"NEUTRAL\">NEUTRAL</option></select></div></div>"
      + "<div class=\"row\"><div><label>TEAM A POS</label><input id=\"pos_a" + n + "\" type=\"number\" placeholder=\"3\"></div>"
      + "<div><label>TEAM B POS</label><input id=\"pos_b" + n + "\" type=\"number\" placeholder=\"7\"></div></div>"
      + "<div class=\"row\"><div><label>HOME ODDS</label><input id=\"odds_h" + n + "\" type=\"number\" step=\"0.01\" placeholder=\"1.90\"></div>"
      + "<div><label>DRAW ODDS</label><input id=\"odds_d" + n + "\" type=\"number\" step=\"0.01\" placeholder=\"3.40\"></div>"
      + "<div><label>AWAY ODDS</label><input id=\"odds_a" + n + "\" type=\"number\" step=\"0.01\" placeholder=\"4.50\"></div></div>"
      + "<label style=\"margin-top:10px;display:block\">TEAM A FORM (tap W/D/L)</label><div style=\"display:flex;gap:5px;margin:8px 0\">"
      + "<button type=\"button\" onclick=\"addF(" + n + ",'a','W')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">W</button>"
      + "<button type=\"button\" onclick=\"addF(" + n + ",'a','D')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">D</button>"
      + "<button type=\"button\" onclick=\"addF(" + n + ",'a','L')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">L</button></div>"
      + "<input id=\"form_a" + n + "\" placeholder=\"W,L,D,W,W\">"
      + "<label style=\"margin-top:10px;display:block\">TEAM B FORM (tap W/D/L)</label><div style=\"display:flex;gap:5px;margin:8px 0\">"
      + "<button type=\"button\" onclick=\"addF(" + n + ",'b','W')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">W</button>"
      + "<button type=\"button\" onclick=\"addF(" + n + ",'b','D')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">D</button>"
      + "<button type=\"button\" onclick=\"addF(" + n + ",'b','L')\" style=\"flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700\">L</button></div>"
      + "<input id=\"form_b" + n + "\" placeholder=\"L,W,L,D,W\">"
      + "<div class=\"row\" style=\"margin-top:10px\"><div><label>H2H MTG</label><input id=\"h2h_mtg" + n + "\" type=\"number\" placeholder=\"10\"></div>"
      + "<div><label>H2H AVG G</label><input id=\"h2h_avg" + n + "\" type=\"number\" step=\"0.1\" placeholder=\"2.5\"></div>"
      + "<div><label>H2H A WINS</label><input id=\"h2h_a" + n + "\" type=\"number\" placeholder=\"4\"></div>"
      + "<div><label>H2H D</label><input id=\"h2h_d" + n + "\" type=\"number\" placeholder=\"3\"></div>"
      + "<div><label>H2H B WINS</label><input id=\"h2h_b" + n + "\" type=\"number\" placeholder=\"3\"></div></div>"
      + "<label style=\"margin-top:10px;display:block\">TEAM A SCORES (optional, e.g. 2-1,0-0,3-1)</label>"
      + "<input id=\"scores_a" + n + "\" placeholder=\"2-1,0-0,3-1,1-2,2-0\">"
      + "<label style=\"margin-top:10px;display:block\">TEAM B SCORES (optional)</label>"
      + "<input id=\"scores_b" + n + "\" placeholder=\"1-1,0-2,2-2,1-0,0-1\">"
      + "<label style=\"margin-top:10px;display:block\">HOW IS MATCH PLAYING? (optional)</label>"
      + "<textarea id=\"conv" + n + "\" rows=\"2\" placeholder=\"e.g. Team A pressing high...\"></textarea>"
      + "</div>";
  };

  var html = "<div class=\"head\"><div class=\"logo\">ANALYZE</div><div class=\"tag\">SMART MATCH ANALYSIS</div></div>";
  html += "<div class=\"card\"><label>PLATFORM</label><select id=\"platform\">" + platformOptions + "</select></div>";
  html += buildMatch(1) + buildMatch(2);
  html += "<button class=\"btn\" id=\"goBtn\">⚡ ANALYZE ⚡</button>";
  html += "<div id=\"result\"></div>";
  html += "<script>function addF(n,t,v){var el=document.getElementById(\"form_\"+t+n);if(!el)return;var cur=el.value?el.value.split(\",\"):[];if(cur.length>=5)return;cur.push(v);el.value=cur.join(\",\");}";
  html += "document.getElementById(\"goBtn\").addEventListener(\"click\",async function(){var btn=this;btn.disabled=true;btn.textContent=\"ANALYZING...\";var results=[];var plat=document.getElementById(\"platform\").value;";
  html += "for(var n=1;n<=2;n++){var ta=document.getElementById(\"team_a\"+n);if(ta&&ta.value){var fd=new FormData();fd.append(\"platform\",plat);fd.append(\"team_a\",ta.value);fd.append(\"team_b\",document.getElementById(\"team_b\"+n).value);fd.append(\"team_a_size\",document.getElementById(\"size_a\"+n).value);fd.append(\"team_b_size\",document.getElementById(\"size_b\"+n).value);fd.append(\"home_team\",document.getElementById(\"home\"+n).value);fd.append(\"form_a\",document.getElementById(\"form_a\"+n).value);fd.append(\"form_b\",document.getElementById(\"form_b\"+n).value);fd.append(\"pos_a\",document.getElementById(\"pos_a\"+n).value);fd.append(\"pos_b\",document.getElementById(\"pos_b\"+n).value);fd.append(\"odds_home\",document.getElementById(\"odds_h\"+n).value);fd.append(\"odds_draw\",document.getElementById(\"odds_d\"+n).value);fd.append(\"odds_away\",document.getElementById(\"odds_a\"+n).value);fd.append(\"h2h_meetings\",document.getElementById(\"h2h_mtg\"+n).value);fd.append(\"h2h_avg_goals\",document.getElementById(\"h2h_avg\"+n).value);fd.append(\"h2h_home\",document.getElementById(\"h2h_a\"+n).value);fd.append(\"h2h_draw\",document.getElementById(\"h2h_d\"+n).value);fd.append(\"h2h_away\",document.getElementById(\"h2h_b\"+n).value);fd.append(\"scores_a\",document.getElementById(\"scores_a\"+n).value);fd.append(\"scores_b\",document.getElementById(\"scores_b\"+n).value);fd.append(\"conversation\",document.getElementById(\"conv\"+n).value);try{var r=await fetch(\"/api/analyze\",{method:\"POST\",body:fd});var d=await r.json();if(d.ok)results.push(d);}catch(e){}}}";
  html += "btn.disabled=false;btn.textContent=\"⚡ ANALYZE ⚡\";if(!results.length){alert(\"Please fill Match 1\");return;}";
  html += "var res=\"<div class='head'><div class='logo' style='font-size:20px'>RESULTS</div></div>\";results.forEach(function(d){res+=\"<div style='text-align:center;font-size:17px;font-weight:800;margin:15px 0 5px;color:#00ff88'>\"+d.teamA+\" VS \"+d.teamB+\"</div>\";res+=\"<div style='text-align:center;font-size:9px;color:#888;letter-spacing:2px;margin-bottom:10px'>\"+d.platform.toUpperCase()+\"</div>\";d.picks.forEach(function(p,i){var risk='med';if(p.category==='goals_over'||p.category==='goals_under')risk='low';else if(p.category==='correct_score')risk='high';res+=\"<div class='card' style='border-left:4px solid #00ff88;padding:14px;margin:10px 0;border-radius:8px'><div style='display:flex;justify-content:space-between;align-items:center'><span style='background:#00ff88;color:#000;padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900'>PICK #\"+(i+1)+\"</span><span style='padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900;background:#332200;color:#ffaa00;border:1px solid #ffaa00'>\"+risk.toUpperCase()+\"</span></div><div style='font-size:16px;font-weight:800;margin:6px 0'>\"+p.name+\"</div><div style='font-size:34px;font-weight:900;color:#00ff88;text-shadow:0 0 15px #00ff88;font-family:monospace'>\"+p.conf+\"%</div><div style='display:flex;gap:6px;margin-top:10px'><form style='flex:1;display:flex;gap:6px'><input type='hidden' name='predId' value='\"+d.predId+\"'><input type='hidden' name='pick' value='\"+p.name+\"'><button type='submit' name='outcome' value='win' style='flex:1;padding:11px;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;background:#00ff88;color:#000'>WIN</button><button type='submit' name='outcome' value='lose' style='flex:1;padding:11px;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;background:#1a0000;color:#ff3333;border:1px solid #ff3333'>LOSE</button></form></div></div>\";});});";
  html += "res+=\"<a href='/analyze' class='btn'>NEW ANALYSIS</a>\";document.getElementById('result').innerHTML=res;document.getElementById('result').scrollIntoView({behavior:'smooth'});document.querySelectorAll('#result form').forEach(function(f){f.addEventListener('submit',async function(e){e.preventDefault();var fd=new FormData(f);await fetch('/api/result',{method:'POST',body:fd});alert('Logged!');});});});";
  html += "</" + "script>";

  return buildPage("ANALYZE", nav, html);
}
