// REBORN BEYOND - Stage 1: title, gender choice, random death scene, loading
const screen = document.getElementById('screen');
const state = { gender: null, death: null };

function showTitle(){
  let sparks = '';
  for(let i=0;i<24;i++){
    sparks += `<div class="sparkle" style="left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*2}s"></div>`;
  }
  screen.innerHTML = `<div id="titleWrap">${sparks}
    <div class="titleHalf a">REBORN<br>BEYOND</div>
    <div class="titleHalf b">REBORN<br>BEYOND</div>
    <div class="slash"></div><div class="flash"></div><div class="fadeBlack"></div></div>`;
  setTimeout(showGender, 4200);
}

function showGender(){
  screen.innerHTML = `<div class="center"><h1 style="color:var(--gold)">Before the end...</h1>
    <p>Who were you?</p>
    <button class="btn" data-g="male">Male</button>
    <button class="btn alt" data-g="female">Female</button></div>`;
  screen.querySelectorAll('button').forEach(b => b.onclick = () => { state.gender = b.dataset.g; showDeath(); });
}

function showDeath(){
  const d = DEATHS[Math.floor(Math.random()*DEATHS.length)];
  state.death = d;
  screen.innerHTML = `<div id="scene"><canvas id="sceneCanvas"></canvas><div id="caption">${d.text}</div></div>`;
  const c = document.getElementById('sceneCanvas');
  c.width = 520; c.height = 900;
  const ctx = c.getContext('2d');
  const cap = document.getElementById('caption');
  setTimeout(() => cap.classList.add('show'), 400);
  let t = 0;
  function frame(){
    t++;
    drawDeath(ctx, c.width, c.height, d.id, t);
    if(t < 240) requestAnimationFrame(frame); else showLoading();
  }
  frame();
}

function person(ctx, x, y, s, fall){
  ctx.save(); ctx.translate(x, y); ctx.rotate(fall||0); ctx.scale(s, s);
  ctx.fillStyle = state.gender === 'female' ? '#ffb3c7' : '#9ad1ff';
  ctx.beginPath(); ctx.arc(0, -52, 14, 0, 7); ctx.fill();
  ctx.fillRect(-10, -36, 20, 38);
  ctx.fillRect(-10, 2, 8, 30); ctx.fillRect(2, 2, 8, 30);
  ctx.restore();
}

function drawDeath(ctx, w, h, id, t){
  ctx.fillStyle = '#0a0a16'; ctx.fillRect(0, 0, w, h);
  const groundY = h * 0.62;
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, groundY, w, h - groundY);
  if(id === 'truck'){
    const tx = -300 + t * 4.2;
    ctx.fillStyle = '#fff'; ctx.fillRect(w/2-3, groundY+30, 6, 14);
    person(ctx, w/2 + Math.max(0, tx - w/2 + 120) * 0.6, groundY, 1.6, Math.max(0, (tx - w/2) * 0.01));
    ctx.fillStyle = '#d33'; ctx.fillRect(tx, groundY - 120, 230, 120);
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(tx + 40, groundY, 22, 0, 7); ctx.arc(tx + 180, groundY, 22, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffe97a'; ctx.fillRect(tx + 222, groundY - 40, 14, 14);
  } else if(id === 'stab'){
    person(ctx, w/2, groundY, 1.6, t > 120 ? Math.min(1.5, (t - 120) * 0.02) : 0);
    if(t > 100){ ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w/2 - 160 + (t-100)*3, groundY - 60); ctx.lineTo(w/2 - 20, groundY - 50); ctx.stroke(); }
  } else if(id === 'fall'){
    const fy = groundY - 40 + Math.max(0, t - 60) * 7;
    ctx.fillStyle = '#000'; ctx.fillRect(w/2 - 70, groundY, 140, h);
    person(ctx, w/2, Math.min(fy, h + 100), 1.6, (t - 60) * 0.03);
  } else if(id === 'lightning'){
    person(ctx, w/2, groundY, 1.6, 0);
    if(t > 90 && t < 130){ ctx.fillStyle = 'rgba(255,255,255,' + (1 - (t-90)/40) + ')'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2 - 30, groundY/2); ctx.lineTo(w/2 + 20, groundY/2 + 20); ctx.lineTo(w/2, groundY - 60); ctx.stroke(); }
  } else {
    const r = 20 + t * 1.4;
    ctx.strokeStyle = '#7c5cff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(w/2, groundY + 20, r, r * 0.35, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(w/2, groundY + 20, r * 0.6, r * 0.2, 0, 0, 7); ctx.stroke();
    person(ctx, w/2, groundY - Math.max(0, t - 100) * 2, 1.6 * Math.max(0.05, 1 - Math.max(0, t - 140) / 100), 0);
  }
  if(t > 190){ ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, (t - 190) / 50) + ')'; ctx.fillRect(0, 0, w, h); }
}

function showLoading(){
  screen.innerHTML = `<div id="loadWrap"><canvas id="loadCanvas"></canvas>
    <div id="loadText">REINCARNATING...</div><div id="loadBar"><div id="loadFill"></div></div>
    <div id="loadTip">${TIPS[Math.floor(Math.random()*TIPS.length)]}</div></div>`;
  const c = document.getElementById('loadCanvas'); c.width = 520; c.height = 900;
  const ctx = c.getContext('2d'); const fill = document.getElementById('loadFill');
  const motes = Array.from({length: 90}, () => ({a: Math.random()*7, r: 30 + Math.random()*260, s: 0.004 + Math.random()*0.012, z: 1 + Math.random()*2.5, h: 200 + Math.random()*120}));
  let t = 0;
  function frame(){
    t++;
    ctx.fillStyle = 'rgba(4,4,12,0.22)'; ctx.fillRect(0, 0, c.width, c.height);
    const cx = c.width/2, cy = c.height*0.42;
    // spiralling light motes pulled into a glowing rift
    motes.forEach(m => {
      m.a += m.s * (1 + t/120); m.r -= 0.45; if(m.r < 6){ m.r = 260 + Math.random()*60; }
      const x = cx + Math.cos(m.a) * m.r, y = cy + Math.sin(m.a) * m.r * 0.8;
      ctx.fillStyle = `hsla(${m.h},100%,70%,0.9)`; ctx.beginPath(); ctx.arc(x, y, m.z, 0, 7); ctx.fill();
    });
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 70 + Math.sin(t*0.1)*10);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.4, 'rgba(124,92,255,0.5)'); g.addColorStop(1, 'rgba(124,92,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 90, 0, 7); ctx.fill();
    // rotating rune ring
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.02); ctx.strokeStyle = 'rgba(245,197,66,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 120, 0, 7); ctx.stroke();
    for(let i = 0; i < 12; i++){ ctx.rotate(Math.PI/6); ctx.strokeRect(116, -5, 10, 10); }
    ctx.restore();
    fill.style.width = Math.min(100, t / 3.2) + '%';
    if(t < 330) requestAnimationFrame(frame); else showStageEnd();
  }
  frame();
}

function showStageEnd(){
  screen.innerHTML = `<div class="center"><h1 style="color:var(--gold)">You open your eyes...</h1>
    <p>The new world awaits.<br>(Next stage: life loop, battles and evolutions are being built.)</p>
    <button class="btn" onclick="showTitle()">Restart</button></div>`;
}

showTitle();
