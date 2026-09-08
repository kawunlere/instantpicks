// ASK PAGE - Chat with AI assistant
import { getNav, buildPage } from "./shared.js";

export function renderAsk() {
  const nav = getNav("ask");
  const body = 
    '<div class="head"><div class="logo">⚡ ASK ⚡</div><div class="tag">BETTING ASSISTANT</div></div>' +
    '<div class="card glow"><h3 class="ct">BETTING ASSISTANT</h3><p class="muted">Ask about picks, strategy, bankroll management, value betting.</p></div>' +
    '<div class="card">' +
      '<textarea id="aiQ" rows="3" placeholder="Ask anything betting-related..."></textarea>' +
      '<button class="btn" id="askBtn">⚡ ASK ⚡</button>' +
    '</div>' +
    '<div id="aiR" class="card" style="display:none">' +
      '<h3 class="ct">RESPONSE</h3>' +
      '<div id="aiT" class="txt"></div>' +
    '</div>' +
    '<div class="card"><h3 class="ct">TRY ASKING</h3>' +
      '<div class="muted">"What is value betting?"</div>' +
      '<div class="muted">"How do I manage my bankroll?"</div>' +
      '<div class="muted">"Should I chase my losses?"</div>' +
      '<div class="muted">"Explain BTTS betting"</div>' +
    '</div>' +
    '<script>' +
    'var askBtn=document.getElementById("askBtn");' +
    'if(askBtn){askBtn.addEventListener("click",async function(){' +
      'var q=document.getElementById("aiQ").value.trim();' +
      'if(!q){alert("Ask a question");return}' +
      'askBtn.disabled=true;askBtn.textContent="THINKING...";' +
      'var fd=new FormData();fd.append("question",q);' +
      'try{' +
        'var r=await fetch("/api/ask",{method:"POST",body:fd});' +
        'var d=await r.json();' +
        'if(d.ok){document.getElementById("aiR").style.display="block";document.getElementById("aiT").textContent=d.reply;}' +
        'else alert("Error: "+d.error);' +
      '}catch(e){alert("Error: "+e.message)}' +
      'askBtn.disabled=false;askBtn.textContent="⚡ ASK ⚡";' +
    '})}' +
    '</script>';
  
  return buildPage("ASK", nav, body);
}
