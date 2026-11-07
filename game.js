// REBORN BEYOND - Stage 1.1: title, gender choice, dramatic death scenes, loading
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
  const debris = Array.from({length: 40}, () => ({x: Math.random()*520, y: Math.random()*900, vx: (Math.random()-0.5)*3, vy: 2+Math.random()*6, s: 2+Math.random()*6, r: Math.random()*6}));
  let t = 0;
  function frame(){
    t++;
    drawDeath(ctx, c.width, c.height, d.id, t, debris);
    if(t < 260) requestAnimationFrame(frame); else showLoading();
  }
  frame();
}

// Original anime-style hero: spiky hair, big eyes, scarf, jacket. Pose drives limbs.
function hero(ctx, x, y, s, rot, pose){
  const female = state.gender === 'female';
  const hair = female ? '#ff7eb6' : '#3a6bff';
  const hairDark = female ? '#c4437f' : '#1f3fa6';
  const jacket = female ? '#7c5cff' : '#f5c542';
  const skin = '#ffd9bf';
  const sw = (pose.swing || 0), arm = (pose.arm || 0), leg = (pose.leg || 0);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s);
  // scarf tail flowing
  ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-6, -44); ctx.quadraticCurveTo(-34 - sw*20, -38 + sw*8, -62 - sw*30, -52 + sw*18); ctx.stroke();
  // legs
  ctx.strokeStyle = '#23244a'; ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-10 - leg*10, 34 + leg*6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(12 + leg*10, 34 - leg*6); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillRect(-18 - leg*10, 32 + leg*6, 16, 7); ctx.fillRect(4 + leg*10, 32 - leg*6, 16, 7);
  // arms
  ctx.strokeStyle = skin; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(-14, -30); ctx.lineTo(-30, -10 - arm*40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -30); ctx.lineTo(30, -10 - arm*40); ctx.stroke();
  // torso jacket
  ctx.fillStyle = jacket; ctx.beginPath(); ctx.moveTo(-18, -42); ctx.lineTo(18, -42); ctx.lineTo(14, 4); ctx.lineTo(-14, 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(-3, -42, 6, 46);
  // head
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(0, -62, 17, 19, 0, 0, 7); ctx.fill();
  // back hair spikes
  ctx.fillStyle = hairDark;
  ctx.beginPath(); ctx.moveTo(-20, -66); ctx.lineTo(-34 - sw*12, -50 + sw*10); ctx.lineTo(-16, -52); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(20, -66); ctx.lineTo(34 + sw*12, -50 + sw*10); ctx.lineTo(16, -52); ctx.closePath(); ctx.fill();
  // front hair
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.moveTo(-20, -64); ctx.lineTo(-14, -90); ctx.lineTo(-5, -72); ctx.lineTo(2, -96); ctx.lineTo(9, -72); ctx.lineTo(20, -88); ctx.lineTo(20, -64); ctx.quadraticCurveTo(0, -78, -20, -64); ctx.fill();
  if(female){ ctx.beginPath(); ctx.moveTo(-18, -62); ctx.lineTo(-26 - sw*14, -30 + sw*10); ctx.lineTo(-12, -48); ctx.fill(); ctx.beginPath(); ctx.moveTo(18, -62); ctx.lineTo(26 + sw*14, -30 + sw*10); ctx.lineTo(12, -48); ctx.fill(); }
  // eyes: big anime eyes, shocked when pose.shock
  const er = pose.shock ? 6.5 : 5;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-7, -61, er, er + 2, 0, 0, 7); ctx.ellipse(7, -61, er, er + 2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = female ? '#d6368f' : '#1c6bff'; ctx.beginPath(); ctx.arc(-7, -60, pose.shock ? 2.2 : 3.5, 0, 7); ctx.arc(7, -60, pose.shock ? 2.2 : 3.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(-8, -63, 2, 2); ctx.fillRect(6, -63, 2, 2);
  // mouth
  ctx.strokeStyle = '#7a3b3b'; ctx.lineWidth = 2; ctx.beginPath();
  if(pose.shock){ ctx.ellipse(0, -50, 3, 5, 0, 0, 7); } else { ctx.arc(0, -52, 3, 0, 3.14); }
  ctx.stroke();
  ctx.restore();
}

function speedLines(ctx, w, h, t, dir){
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
  for(let i = 0; i < 28; i++){
    const x = (i * 53 + t * 17 * dir) % w; const len = 80 + (i * 37) % 160;
    const y = ((i * 97) + t * 29) % h;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
  }
}

function shake(ctx, amt){ ctx.translate((Math.random()-0.5)*amt, (Math.random()-0.5)*amt); }

function drawDeath(ctx, w, h, id, t, debris){
  ctx.save();
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1a1040'); sky.addColorStop(0.6, '#3b2a7a'); sky.addColorStop(1, '#0a0a16');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  // moon
  ctx.fillStyle = '#fff6c9'; ctx.beginPath(); ctx.arc(w*0.78, h*0.14, 34, 0, 7); ctx.fill();
  const gy = h * 0.62;

  if(id === 'fall'){
    // camera zooms in, ground cracks, then shatters; hero falls with speed lines
    const z = 1 + Math.min(0.5, t / 300);
    ctx.translate(w/2, h/2); ctx.scale(z, z); ctx.translate(-w/2, -h/2);
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, gy, w, h - gy);
    if(t < 90){ hero(ctx, w/2, gy, 1.9, 0, {swing: 0, shock: t > 60}); }
    // cracks spreading
    if(t > 50){ ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; const L = Math.min(1, (t - 50) / 40);
      ctx.beginPath(); ctx.moveTo(w/2, gy + 6); ctx.lineTo(w/2 - 90*L, gy + 40*L); ctx.moveTo(w/2, gy + 6); ctx.lineTo(w/2 + 80*L, gy + 50*L); ctx.moveTo(w/2, gy + 6); ctx.lineTo(w/2 + 10*L, gy + 80*L); ctx.stroke(); }
    if(t >= 90){
      // hole opens, void glow
      const open = Math.min(1, (t - 90) / 30);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(w/2, gy + 10, 130*open, 36*open, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(124,92,255,' + 0.4*open + ')'; ctx.beginPath(); ctx.ellipse(w/2, gy + 10, 160*open, 50*open, 0, 0, 7); ctx.fill();
      const fy = gy - 10 + Math.max(0, t - 105) * 9;
      hero(ctx, w/2 + Math.sin(t*0.2)*6, fy, 1.9, Math.sin(t * 0.12) * 0.9, {swing: 1, arm: 1, leg: Math.sin(t*0.4), shock: true});
      speedLines(ctx, w, h, t, 1);
      // ground chunks falling with him
      debris.forEach(d => { ctx.fillStyle = '#2b2b4a'; ctx.fillRect(d.x*0.5 + w*0.25, (d.y + t*d.vy) % h, d.s, d.s); });
    }
    ctx.restore();
    ctx.save();
    if(t > 110 && t < 125){ ctx.fillStyle = 'rgba(255,255,255,' + (1-(t-110)/15)*0.7 + ')'; ctx.fillRect(0, 0, w, h); }
    if(t > 215){ ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, (t - 215) / 40) + ')'; ctx.fillRect(0, 0, w, h); }
    ctx.restore(); return;
  }

  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, gy, w, h - gy);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, gy, w, 3);

  if(id === 'truck'){
    const tx = -320 + t * 5;
    const hit = tx + 230 > w/2 - 20;
    const hx = hit ? w/2 + (tx + 230 - (w/2 - 20)) * 1.1 : w/2;
    const hy = hit ? gy - Math.min(220, (tx + 230 - (w/2 - 20)) * 0.6) : gy;
    if(hit) shake(ctx, 10);
    hero(ctx, hx, hy, 1.9, hit ? (tx + 230 - (w/2 - 20)) * 0.012 : 0, {swing: hit ? 1 : 0, arm: hit ? 1 : 0, leg: hit ? Math.sin(t) : 0, shock: tx > -80});
    // truck
    ctx.fillStyle = '#c9283e'; ctx.fillRect(tx - 120, gy - 130, 230, 130);
    ctx.fillStyle = '#9d1c2f'; ctx.fillRect(tx + 110, gy - 100, 90, 100);
    ctx.fillStyle = '#bfe8ff'; ctx.fillRect(tx + 130, gy - 90, 50, 40);
    ctx.fillStyle = '#111'; [tx - 70, tx + 20, tx + 150].forEach(wx => { ctx.beginPath(); ctx.arc(wx, gy, 24, 0, 7); ctx.fill(); ctx.fillStyle = '#777'; ctx.beginPath(); ctx.arc(wx, gy, 9, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; });
    // headlight beam
    const bg = ctx.createLinearGradient(tx + 200, 0, tx + 480, 0); bg.addColorStop(0, 'rgba(255,240,150,0.6)'); bg.addColorStop(1, 'rgba(255,240,150,0)');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(tx + 200, gy - 40); ctx.lineTo(tx + 480, gy - 90); ctx.lineTo(tx + 480, gy + 10); ctx.closePath(); ctx.fill();
    if(hit) speedLines(ctx, w, h, t, -1);
  } else if(id === 'stab'){
    const phase = t > 110 ? Math.min(1, (t - 110) / 30) : 0;
    hero(ctx, w/2, gy + (phase > 0.5 ? (phase - 0.5) * 30 : 0), 1.9, phase * 0.7, {swing: phase, arm: phase, leg: 0, shock: t > 80});
    // shadowy attacker lunge with a blade
    const ax = -80 + Math.min(1, t / 105) * (w/2 - 130);
    ctx.fillStyle = '#05050a'; ctx.beginPath(); ctx.ellipse(ax, gy - 70, 28, 70, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff2b4d'; ctx.fillRect(ax - 12, gy - 112, 8, 4); ctx.fillRect(ax + 4, gy - 112, 8, 4);
    ctx.strokeStyle = '#eaf6ff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ax + 24, gy - 70); ctx.lineTo(ax + 100, gy - 76); ctx.stroke();
    if(t > 105 && t < 125){ ctx.fillStyle = 'rgba(255,255,255,' + (1 - (t - 105)/20) + ')'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(w/2 - 140, gy - 160); ctx.lineTo(w/2 + 140, gy - 20); ctx.stroke(); }
  } else if(id === 'lightning'){
    hero(ctx, w/2, gy, 1.9, 0, {swing: 0, shock: t > 70});
    if(t > 60 && t < 100){ ctx.fillStyle = 'rgba(180,200,255,' + 0.25 + ')'; ctx.fillRect(0, 0, w, h); }
    if(t >= 100 && t < 140){
      shake(ctx, 14);
      ctx.fillStyle = 'rgba(255,255,255,' + (1 - (t - 100)/40) + ')'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 9; ctx.shadowColor = '#9fd0ff'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.moveTo(w/2 + 20, 0); ctx.lineTo(w/2 - 30, gy*0.3); ctx.lineTo(w/2 + 25, gy*0.5); ctx.lineTo(w/2 - 10, gy*0.75); ctx.lineTo(w/2, gy - 70); ctx.stroke();
    }
  } else { // summon circle
    const r = 30 + t * 1.5; const cy2 = gy + 30;
    ctx.strokeStyle = '#a58bff'; ctx.lineWidth = 4; ctx.shadowColor = '#7c5cff'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.ellipse(w/2, cy2, r, r*0.32, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(w/2, cy2, r*0.6, r*0.19, 0, 0, 7); ctx.stroke();
    for(let i = 0; i < 8; i++){ const a = t*0.05 + i*0.785; ctx.fillStyle = '#fff'; ctx.fillRect(w/2 + Math.cos(a)*r*0.8, cy2 + Math.sin(a)*r*0.25, 5, 5); }
    ctx.shadowBlur = 0;
    const rise = Math.max(0, t - 110);
    hero(ctx, w/2, gy - rise * 2.2, 1.9 * Math.max(0.05, 1 - Math.max(0, t - 150)/110), rise * 0.02, {swing: 0.6, arm: 1, shock: true});
    if(t > 100){ const beam = ctx.createLinearGradient(0, 0, 0, gy); beam.addColorStop(0, 'rgba(165,139,255,0)'); beam.addColorStop(1, 'rgba(165,139,255,0.5)'); ctx.fillStyle = beam; ctx.fillRect(w/2 - 70, 0, 140, gy); }
  }
  ctx.restore();
  if(t > 205){ ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, (t - 205) / 45) + ')'; ctx.fillRect(0, 0, w, h); }
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
    motes.forEach(m => {
      m.a += m.s * (1 + t/120); m.r -= 0.45; if(m.r < 6){ m.r = 260 + Math.random()*60; }
      const x = cx + Math.cos(m.a) * m.r, y = cy + Math.sin(m.a) * m.r * 0.8;
      ctx.fillStyle = `hsla(${m.h},100%,70%,0.9)`; ctx.beginPath(); ctx.arc(x, y, m.z, 0, 7); ctx.fill();
    });
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 70 + Math.sin(t*0.1)*10);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.4, 'rgba(124,92,255,0.5)'); g.addColorStop(1, 'rgba(124,92,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 90, 0, 7); ctx.fill();
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
