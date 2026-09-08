// ANALYZE PAGE - With all the new inputs you wanted
import { getNav, buildPage } from "./shared.js";
import { getAllPlatforms } from "../engines/platforms.js";

export function renderHome() {
  const nav = getNav("analyze");
  const platforms = getAllPlatforms();
  const platformOptions = platforms.map(p => '<option value="' + p.id + '">' + p.name + ' — ' + p.game + '</option>').join("");
  
  const body = 
    '<div class="head"><div class="logo">⚡ ANALYZE ⚡</div><div class="tag">SMART MATCH ANALYSIS</div></div>' +
    
    // PLATFORM SELECTOR
    '<div class="card">' +
      '<label>PLATFORM</label>' +
      '<select id="platform">' + platformOptions + '</select>' +
    '</div>' +
    
    // TEAMS & SIZE
    '<div class="card">' +
      '<h3 class="ct">MATCH TEAMS</h3>' +
      '<div class="row"><div><label>TEAM A NAME</label><input id="team_a" placeholder="e.g. Chelsea"></div><div><label>TEAM B NAME</label><input id="team_b" placeholder="e.g. Tottenham"></div></div>' +
      
      '<div class="section-title">TEAM SIZE (Matters!)</div>' +
      '<div class="row">' +
        '<div><label>TEAM A SIZE</label><select id="team_a_size"><option value="MEDIUM">MEDIUM</option><option value="BIG">BIG TEAM</option><option value="SMALL">SMALL TEAM</option></select></div>' +
        '<div><label>TEAM B SIZE</label><select id="team_b_size"><option value="MEDIUM">MEDIUM</option><option value="BIG">BIG TEAM</option><option value="SMALL">SMALL TEAM</option></select></div>' +
      '</div>' +
      
      '<div class="section-title">WHO IS HOME?</div>' +
      '<div class="row">' +
        '<div><label>HOME/AWAY</label><select id="home_team"><option value="A">TEAM A IS HOME</option><option value="B">TEAM B IS HOME</option><option value="NEUTRAL">NEUTRAL</option></select></div>' +
      '</div>' +
      
      '<div class="section-title">TABLE POSITION</div>' +
      '<div class="row"><div><label>TEAM A POS</label><input id="pos_a" type="number" placeholder="3"></div><div><label>TEAM B POS</label><input id="pos_b" type="number" placeholder="7"></div></div>' +
    '</div>' +
    
    // ODDS
    '<div class="card">' +
      '<h3 class="ct">ODDS (FROM BOOKMAKER)</h3>' +
      '<div class="row">' +
        '<div><label>HOME WIN ODDS</label><input id="odds_home" type="number" step="0.01" placeholder="1.90"></div>' +
        '<div><label>DRAW ODDS</label><input id="odds_draw" type="number" step="0.01" placeholder="3.40"></div>' +
        '<div><label>AWAY WIN ODDS</label><input id="odds_away" type="number" step="0.01" placeholder="4.50"></div>' +
      '</div>' +
    '</div>' +
    
    // FORM
    '<div class="card">' +
      '<h3 class="ct">TEAM A FORM (LAST 5)</h3>' +
      '<div class="qt-row">' +
        '<button type="button" class="qt" data-t="form_a" data-v="W">W</button>' +
        '<button type="button" class="qt" data-t="form_a" data-v="D">D</button>' +
        '<button type="button" class="qt" data-t="form_a" data-v="L">L</button>' +
      '</div>' +
      '<input id="form_a" placeholder="W,L,D,W,W">' +
    '</div>' +
    
    '<div class="card">' +
      '<h3 class="ct">TEAM B FORM (LAST 5)</h3>' +
      '<div class="qt-row">' +
        '<button type="button" class="qt" data-t="form_b" data-v="W">W</button>' +
        '<button type="button" class="qt" data-t="form_b" data-v="D">D</button>' +
        '<button type="button" class="qt" data-t="form_b" data-v="L">L</button>' +
      '</div>' +
      '<input id="form_b" placeholder="L,W,L,D,W">' +
    '</div>' +
    
    // H2H
    '<div class="card">' +
      '<h3 class="ct">HEAD-TO-HEAD</h3>' +
      '<div class="row"><div><label>TOTAL MEETINGS</label><input id="h2h_meetings" type="number" placeholder="10"></div><div><label>AVG GOALS</label><input id="h2h_avg_goals" type="number" step="0.1" placeholder="2.5"></div></div>' +
      '<div class="row">' +
        '<div><label>TEAM A H2H WINS</label><input id="h2h_home" type="number" placeholder="4"></div>' +
        '<div><label>H2H DRAWS</label><input id="h2h_draw" type="number" placeholder="3"></div>' +
        '<div><label>TEAM B H2H WINS</label><input id="h2h_away" type="number" placeholder="3"></div>' +
      '</div>' +
    '</div>' +
    
    // SCORES (Optional for correct score prediction)
    '<div class="card">' +
      '<h3 class="ct">RECENT SCORES (OPTIONAL)</h3>' +
      '<p class="muted" style="margin-bottom:10px">If you know last scores, enter them. Helps predict correct score.</p>' +
      '<div class="row">' +
        '<div><label>TEAM A LAST 5 SCORES</label><input id="scores_a" placeholder="2-1,0-0,3-1,1-2,2-0"></div>' +
        '<div><label>TEAM B LAST 5 SCORES</label><input id="scores_b" placeholder="1-1,0-2,2-2,1-0,0-1"></div>' +
      '</div>' +
    '</div>' +
    
    // CONVERSATION
    '<div class="card">' +
      '<h3 class="ct">HOW IS THE MATCH PLAYING? (OPTIONAL)</h3>' +
      '<textarea id="conv" rows="2" placeholder="e.g. Team A pressing high, Team B defensive, no goals yet..."></textarea>' +
      '<button class="btn" id="goBtn">⚡ ANALYZE ⚡</button>' +
    '</div>' +
    
    '<div id="result"></div>' +
    
    // SCRIPT
    '<script>' +
    'document.querySelectorAll(".qt").forEach(function(b){b.addEventListener("click",function(){' +
      'var t=document.getElementById(b.dataset.t);' +
      'var c=t.value?t.value.split(","):[];' +
      'if(c.length>=5)return;' +
      'c.push(b.dataset.v);' +
      't.value=c.join(",");' +
    '})});' +
    
    'var goBtn=document.getElementById("goBtn");' +
    'if(goBtn){goBtn.addEventListener("click",async function(){' +
      'var fd=new FormData();' +
      'fd.append("platform",document.getElementById("platform").value);' +
      'fd.append("team_a",document.getElementById("team_a").value);' +
      'fd.append("team_b",document.getElementById("team_b").value);' +
      'fd.append("team_a_size",document.getElementById("team_a_size").value);' +
      'fd.append("team_b_size",document.getElementById("team_b_size").value);' +
      'fd.append("home_team",document.getElementById("home_team").value);' +
      'fd.append("pos_a",document.getElementById("pos_a").value);' +
      'fd.append("pos_b",document.getElementById("pos_b").value);' +
      'fd.append("odds_home",document.getElementById("odds_home").value);' +
      'fd.append("odds_draw",document.getElementById("odds_draw").value);' +
      'fd.append("odds_away",document.getElementById("odds_away").value);' +
      'fd.append("form_a",document.getElementById("form_a").value);' +
      'fd.append("form_b",document.getElementById("form_b").value);' +
      'fd.append("h2h_meetings",document.getElementById("h2h_meetings").value);' +
      'fd.append("h2h_avg_goals",document.getElementById("h2h_avg_goals").value);' +
      'fd.append("h2h_home",document.getElementById("h2h_home").value);' +
      'fd.append("h2h_draw",document.getElementById("h2h_draw").value);' +
      'fd.append("h2h_away",document.getElementById("h2h_away").value);' +
      'fd.append("scores_a",document.getElementById("scores_a").value);' +
      'fd.append("scores_b",document.getElementById("scores_b").value);' +
      'fd.append("conversation",document.getElementById("conv").value);' +
      'goBtn.disabled=true;goBtn.textContent="ANALYZING...";' +
      'try{' +
        'var r=await fetch("/api/analyze",{method:"POST",body:fd});' +
        'var d=await r.json();' +
        'if(d.ok){' +
          'var res=document.getElementById("result");' +
          'var html="<div class=\\"mt\\">"+d.teamA+" <span class=\\"hl\\">VS</span> "+d.teamB+"</div>";' +
          'html+="<div class=\\"ms\\">"+d.platform.toUpperCase()+"</div>";' +
          'if(d.streak&&d.streak.warning){html+="<div class=\\"warning\\">"+d.streak.warning+"</div>";}' +
          'html+="<div class=\\"card\\"><h3 class=\\"ct\\">TOP 6 PICKS</h3>";' +
          'd.picks.forEach(function(p,i){' +
            'var cat=p.category||"pick";' +
            'var risk="";if(cat==="btts"||cat==="btts_combo")risk="med";' +
            'else if(cat==="correct_score"||cat==="combo")risk="high";' +
            'else if(cat==="goals_over"||cat==="goals_under")risk="low";' +
            'else risk="med";' +
            'var rc=risk==="low"?"r-low":risk==="med"?"r-med":"r-high";' +
            'var pc=risk==="low"?"r-low":risk==="med"?"r-med":"r-high";' +
            'html+="<div class=\\"pc "+pc+"\\"><div class=\\"ph\\"><span class=\\"tg\\">PICK #"+(i+1)+"</span><span class=\\"tr "+rc+"\\">"+risk.toUpperCase()+"</span></div>";' +
            'html+="<div class=\\"pn\\">"+p.name+"</div>";' +
            'html+="<div class=\\"pc2\\">"+p.conf+"%</div>";' +
            'html+="<div class=\\"pw\\">Category: "+cat.replace(/_/g," ")+"</div>";' +
            'html+="<div class=\\"pb\\"><form><input type=\\"hidden\\" name=\\"pid\\" value=\\""+d.predId+"\\"><input type=\\"hidden\\" name=\\"p\\" value=\\""+p.name+"\\"><button type=\\"submit\\" name=\\"o\\" value=\\"win\\" class=\\"bw\\">WIN</button><button type=\\"submit\\" name=\\"o\\" value=\\"lose\\" class=\\"bl\\">LOSE</button></form></div></div>";' +
          '});' +
          'html+="</div>";' +
          'if(d.allOptions){' +
            'html+="<div class=\\"card\\"><h3 class=\\"ct\\">ALL "+d.allOptions.length+" OPTIONS (Sorted by confidence)</h3>";' +
            'html+="<div style=\\"max-height:400px;overflow-y:auto\\">";' +
            'd.allOptions.forEach(function(p){' +
              'var cat=p.category||"";' +
              'html+="<div class=\\"opt-list\\"><div class=\\"opt-name\\">"+p.name+"</div><div class=\\"opt-cat\\">"+cat.replace(/_/g," ")+"</div><div class=\\"opt-conf\\">"+p.conf+"%</div></div>";' +
            '});' +
            'html+="</div></div>";' +
          '}' +
          'html+="<a href=\\"/analyze\\" class=\\"btn\\">NEW ANALYSIS</a>";' +
          'res.innerHTML=html;' +
          'res.querySelectorAll("form").forEach(function(f){f.addEventListener("submit",async function(e){' +
            'e.preventDefault();' +
            'var fd=new FormData();' +
            'fd.append("predId",f.querySelector("[name=pid]").value);' +
            'fd.append("pick",f.querySelector("[name=p]").value);' +
            'fd.append("outcome",e.submitter.value);' +
            'await fetch("/api/result",{method:"POST",body:fd});' +
            'alert("Logged! System learned.");' +
          '})});' +
          'res.scrollIntoView({behavior:"smooth"});' +
        '}else{alert("Error: "+(d.error||"unknown"))}' +
      '}catch(e){alert("Error: "+e.message)}' +
      'goBtn.disabled=false;goBtn.textContent="⚡ ANALYZE ⚡";' +
    '})}' +
    '</script>';
  
  return buildPage("ANALYZE", nav, body);
}
