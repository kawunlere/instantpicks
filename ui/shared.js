// SHARED UI - CSS, navigation, matrix effect
// Used by all pages

export const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12L12 3L21 12M5 10V21H19V10"/></svg>',
  analyze: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21L16.65 16.65M11 8V14M8 11H14"/></svg>',
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3V21H21M7 16L12 11L15 14L21 8"/></svg>',
  ask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12C21 16.97 16.97 21 12 21C10.18 21 8.5 20.41 7.13 19.4L3 21L4.6 16.87C3.59 15.5 3 13.82 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11"/></svg>'
};

export function getNav(active) {
  const items = [
    ["home", "HOME", ICONS.home],
    ["analyze", "ANALYZE", ICONS.analyze],
    ["ask", "ASK", ICONS.ask],
    ["dashboard", "STATS", ICONS.dashboard],
    ["history", "HISTORY", ICONS.history]
  ];
  return '<div class="nav">' + items.map(function(item) {
    return '<a href="/' + (item[0] === 'home' ? '' : item[0]) + '" class="' + (active === item[0] ? 'active' : '') + '"><span class="icon">' + item[2] + '</span><span>' + item[1] + '</span></a>';
  }).join("") + '</div>';
}

export const CSS = '*{box-sizing:border-box;margin:0;padding:0}' +
  ':root{--green:#00ff88;--dark-green:#00cc6a;--black:#0a0a0a;--card:#161616;--red:#ff3333;--gray:#888;--yellow:#ffaa00;--orange:#ff8800}' +
  'body{font-family:"Courier New",monospace;background:var(--black);color:#fff;min-height:100vh;overflow-x:hidden;-webkit-tap-highlight-color:transparent;margin:0}' +
  'canvas#m{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;opacity:.12}' +
  '.c{position:relative;z-index:2;max-width:560px;margin:0 auto;padding:12px;padding-bottom:80px}' +
  '.nav{display:flex;gap:3px;margin-bottom:18px;flex-wrap:wrap;background:rgba(0,0,0,.7);padding:5px;border-radius:10px;border:1px solid rgba(0,255,136,.2);position:sticky;top:8px;z-index:10}' +
  '.nav a{flex:1;min-width:48px;text-align:center;padding:8px 3px;color:var(--gray);text-decoration:none;font-size:8px;font-weight:700;border-radius:5px;display:flex;flex-direction:column;align-items:center;gap:2px}' +
  '.nav a .icon{width:16px;height:16px;display:block}' +
  '.nav a .icon svg{width:100%;height:100%;stroke:var(--gray)}' +
  '.nav a.active{background:rgba(0,255,136,.15);color:var(--green)}' +
  '.nav a.active .icon svg{stroke:var(--green);filter:drop-shadow(0 0 5px var(--green))}' +
  '.head{text-align:center;padding:18px 0 12px;border-bottom:1px solid rgba(0,255,136,.2);margin-bottom:18px}' +
  '.logo{font-size:24px;font-weight:900;color:var(--green);text-shadow:0 0 20px var(--green);letter-spacing:2px}' +
  '.tag{color:var(--gray);font-size:9px;margin-top:5px;letter-spacing:2px}' +
  '.card{background:linear-gradient(135deg,rgba(0,255,136,.03),var(--card));border:1px solid rgba(0,255,136,.2);border-radius:12px;padding:16px;margin:10px 0}' +
  '.card.glow{border-color:rgba(0,255,136,.4);box-shadow:0 0 30px rgba(0,255,136,.1)}' +
  '.card.warn{border-color:rgba(255,51,51,.3)}' +
  '.ct{color:var(--green);margin-bottom:10px;font-size:14px;letter-spacing:1px}' +
  '.txt{color:#ccc;line-height:1.6;font-size:13px;white-space:pre-wrap}' +
  '.hl{color:var(--green)}' +
  '.warn-text{color:var(--red)}' +
  '.muted{color:var(--gray);font-size:12px;margin:4px 0}' +
  'label{display:block;color:var(--green);font-size:10px;font-weight:700;margin:12px 0 5px;letter-spacing:2px}' +
  'input,select,textarea{width:100%;padding:11px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:8px;font-size:14px;font-family:inherit;box-sizing:border-box}' +
  'input:focus,select:focus,textarea:focus{outline:none;border-color:var(--green)}' +
  'textarea{resize:vertical}' +
  '.row{display:flex;gap:8px;margin-top:5px;flex-wrap:wrap}.row>div{flex:1;min-width:100px}' +
  '.btn{display:block;width:100%;padding:14px;background:linear-gradient(135deg,var(--green),var(--dark-green));color:#000;font-weight:900;font-size:13px;border:none;border-radius:8px;margin-top:14px;cursor:pointer;text-transform:uppercase;letter-spacing:2px;font-family:inherit;box-shadow:0 0 20px rgba(0,255,136,.4);text-align:center;text-decoration:none}' +
  '.btn:disabled{opacity:.5;cursor:wait}' +
  '.hero{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:12px 0}' +
  '.hero-stat{background:var(--card);border:1px solid rgba(0,255,136,.2);border-radius:10px;padding:10px;text-align:center}' +
  '.hero-stat .num{font-size:20px;font-weight:900;color:var(--green);text-shadow:0 0 10px var(--green)}' +
  '.hero-stat .lbl{font-size:8px;color:var(--gray);letter-spacing:2px;margin-top:3px}' +
  '.stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:10px 0}' +
  '.stat-card{background:var(--card);border:1px solid rgba(0,255,136,.2);border-radius:10px;padding:14px;text-align:center}' +
  '.stat-card.highlight{border-color:var(--green);box-shadow:0 0 20px rgba(0,255,136,.2)}' +
  '.stat-num{font-size:26px;font-weight:900;color:var(--green);text-shadow:0 0 10px var(--green)}' +
  '.stat-lbl{font-size:9px;color:var(--gray);letter-spacing:2px;margin-top:3px}' +
  '.qt-row{display:flex;gap:5px;margin:8px 0}' +
  '.qt{flex:1;padding:12px;background:rgba(0,0,0,.5);color:#fff;border:1px solid #333;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:700;font-size:14px;letter-spacing:1px}' +
  '.qt:hover,.qt:active{background:rgba(0,255,136,.2);border-color:var(--green);color:var(--green)}' +
  '.mt{font-size:17px;font-weight:800;margin:15px 0 5px;text-align:center;color:var(--green)}' +
  '.ms{font-size:9px;color:var(--gray);text-align:center;letter-spacing:2px;margin-bottom:10px}' +
  '.pc{background:linear-gradient(135deg,rgba(0,255,136,.05),var(--card));border-left:4px solid var(--green);padding:14px;margin:10px 0;border-radius:8px}' +
  '.pc.r-low{border-left-color:var(--green)}' +
  '.pc.r-med{border-left-color:var(--yellow)}' +
  '.pc.r-high{border-left-color:var(--red)}' +
  '.ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}' +
  '.tg{background:var(--green);color:#000;padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900;letter-spacing:1px}' +
  '.tr{padding:3px 10px;border-radius:15px;font-size:9px;font-weight:900;letter-spacing:1px}' +
  '.r-low{background:#003300;color:var(--green);border:1px solid var(--green)}' +
  '.r-med{background:#332200;color:var(--yellow);border:1px solid var(--yellow)}' +
  '.r-high{background:#330000;color:var(--red);border:1px solid var(--red)}' +
  '.pn{font-size:16px;font-weight:800;margin:6px 0}' +
  '.pc2{font-size:34px;font-weight:900;color:var(--green);text-shadow:0 0 15px var(--green);font-family:monospace}' +
  '.pw{color:var(--gray);font-size:12px;margin:6px 0;line-height:1.5}' +
  '.pb{display:flex;gap:6px;margin-top:10px}' +
  '.pb form{flex:1;display:flex;gap:6px}' +
  '.pb button{flex:1;padding:11px;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-family:inherit;font-size:11px;letter-spacing:1px}' +
  '.bw{background:var(--green);color:#000;box-shadow:0 0 10px rgba(0,255,136,.4)}' +
  '.bl{background:#1a0000;color:var(--red);border:1px solid var(--red)}' +
  '.opt-list{background:rgba(0,0,0,.3);border-left:3px solid var(--gray);padding:10px;margin:6px 0;border-radius:6px;display:flex;justify-content:space-between;align-items:center}' +
  '.opt-list:hover{border-left-color:var(--green)}' +
  '.opt-name{font-size:13px;font-weight:600;flex:1}' +
  '.opt-cat{font-size:9px;color:var(--gray);margin-left:8px}' +
  '.opt-conf{font-size:18px;font-weight:900;color:var(--green);min-width:60px;text-align:right}' +
  '.warning{background:linear-gradient(135deg,rgba(255,170,0,.1),var(--card));border:1px solid var(--yellow);border-radius:10px;padding:12px;margin:10px 0;text-align:center;font-weight:700;color:var(--yellow);font-size:13px}' +
  '.admin-only{background:#1a0000;color:#ff6666;padding:8px;text-align:center;font-size:11px;letter-spacing:2px;font-weight:900;margin-bottom:10px;border-radius:5px}' +
  'form .section-title{color:var(--yellow);font-size:10px;letter-spacing:2px;margin:15px 0 5px;font-weight:700}';

export const MATRIX_SCRIPT = '<script>' +
  'var c=document.getElementById("m"),x=c.getContext("2d");' +
  'function r(){c.width=window.innerWidth;c.height=window.innerHeight}r();window.addEventListener("resize",r);' +
  'var ch="01<>{}[]/\\\\$#@!%&*+=",fs=14,cols=Math.floor(c.width/fs),drops=Array(cols).fill(1);' +
  'setInterval(function(){x.fillStyle="rgba(0,0,0,0.05)";x.fillRect(0,0,c.width,c.height);x.fillStyle="#00ff88";x.font=fs+"px monospace";for(var i=0;i<drops.length;i++){var t=ch[Math.floor(Math.random()*ch.length)];x.fillText(t,i*fs,drops[i]*fs);if(drops[i]*fs>c.height&&Math.random()>.975)drops[i]=0;drops[i]++}},33);' +
  '</script>';

export const SCAN_LINE_CSS = '.scan{position:fixed;top:0;left:0;width:100%;height:2px;background:var(--green);box-shadow:0 0 10px var(--green);animation:scan 4s linear infinite;z-index:5;pointer-events:none}@keyframes scan{0%{top:0}100%{top:100%}}';

export function buildPage(title, nav, body, extraCSS = '') {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + ' | INSTANT PICKS</title>' +
    '<style>' + CSS + extraCSS + SCAN_LINE_CSS + '</style></head><body>' +
    '<canvas id="m"></canvas>' +
    '<div class="scan"></div>' +
    '<div class="c">' + nav + body + '</div>' +
    MATRIX_SCRIPT +
    '</body></html>';
}
