// REBORN BEYOND - evolution transformation scene (original effects)
window.EVOFX = (function(){
function play(oldTitle, newTitle, gender, done){
  const screen = document.getElementById('screen');
  const oldSvg = (window.SPR && SPR.draw(oldTitle, gender)) || '';
  const newSvg = (window.SPR && SPR.draw(newTitle, gender)) || '';
  screen.innerHTML = `<div id="evoWrap" style="position:relative;width:100%;height:100%;overflow:hidden;background:#05050d">
    <canvas id="evoCv" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
    <div id="evoOld" style="position:absolute;left:50%;top:42%;width:220px;height:220px;transform:translate(-50%,-50%)">${oldSvg}</div>
    <div id="evoNew" style="position:absolute;left:50%;top:42%;width:250px;height:250px;transform:translate(-50%,-50%) scale(0.2);opacity:0">${newSvg}</div>
    <div id="evoTxt" style="position:absolute;left:0;right:0;bottom:14%;text-align:center;font-size:26px;font-weight:900;letter-spacing:2px;color:#f5c542;text-shadow:0 0 18px #ff9d00;opacity:0"></div>
    <div id="evoFlash" style="position:absolute;inset:0;background:#fff;opacity:0"></div></div>`;
  const cv = document.getElementById('evoCv'); cv.width = 520; cv.height = 900;
  const ctx = cv.getContext('2d');
  const oldEl = document.getElementById('evoOld'), newEl = document.getElementById('evoNew');
  const txt = document.getElementById('evoTxt'), flash = document.getElementById('evoFlash');
  const cx = 260, cy = 378;
  const motes = Array.from({length: 120}, () => ({a: Math.random()*6.28, r: 120 + Math.random()*300, s: 0.02 + Math.random()*0.04, h: 40 + Math.random()*260, z: 1.5 + Math.random()*2.5}));
  const rings = [];
  let t = 0;
  const T_CHARGE = 150, T_FLASH = 175, T_END = 330;
  function frame(){
    t++;
    ctx.fillStyle = 'rgba(5,5,13,0.28)'; ctx.fillRect(0, 0, 520, 900);
    // charging: particles spiral in, old form glows and shakes harder
    if(t < T_FLASH){
      const k = Math.min(1, t / T_CHARGE);
      motes.forEach(m => {
        m.a += m.s * (1 + k * 3); m.r = Math.max(8, m.r - (1.2 + k * 5));
        if(m.r <= 8 && t < T_CHARGE){ m.r = 200 + Math.random()*250; }
        ctx.fillStyle = `hsla(${m.h},100%,70%,0.9)`;
        ctx.beginPath(); ctx.arc(cx + Math.cos(m.a)*m.r, cy + Math.sin(m.a)*m.r*0.85, m.z, 0, 7); ctx.fill();
      });
      const g = ctx.createRadialGradient(cx, cy, 5, cx, cy, 60 + k*160);
      g.addColorStop(0, `rgba(255,255,255,${0.35 + k*0.6})`); g.addColorStop(0.5, `rgba(124,92,255,${0.3 + k*0.3})`); g.addColorStop(1, 'rgba(124,92,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 60 + k*160, 0, 7); ctx.fill();
      const sh = k * 9;
      oldEl.style.transform = `translate(calc(-50% + ${(Math.random()-0.5)*sh}px), calc(-50% + ${(Math.random()-0.5)*sh}px)) scale(${1 + k*0.12})`;
      oldEl.style.filter = `brightness(${1 + k*3}) drop-shadow(0 0 ${10 + k*40}px #fff)`;
      if(t === 5){ txt.style.opacity = 1; txt.textContent = 'Something is awakening...'; }
    }
    // flash and swap
    if(t >= T_FLASH && t < T_FLASH + 30){
      flash.style.opacity = Math.max(0, 1 - (t - T_FLASH) / 30);
      if(t === T_FLASH){ oldEl.style.display = 'none'; flash.style.opacity = 1; newEl.style.opacity = 1; txt.textContent = ''; rings.push({r: 10, a: 1}, {r: -30, a: 1}, {r: -70, a: 1}); }
    }
    // reveal: new form pops in with shockwave rings and rotating light rays
    if(t >= T_FLASH){
      const p = Math.min(1, (t - T_FLASH) / 40);
      const sc = 0.2 + 0.8 * (1 - Math.pow(1 - p, 3)) + (t < T_FLASH + 60 ? Math.sin((t - T_FLASH) * 0.3) * 0.04 : 0);
      newEl.style.transform = `translate(-50%,-50%) scale(${sc})`;
      newEl.style.filter = `drop-shadow(0 0 ${30 - p*14}px #f5c542)`;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.01);
      for(let i = 0; i < 14; i++){ ctx.rotate(Math.PI / 7); ctx.fillStyle = 'rgba(255,230,140,0.10)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, -420); ctx.lineTo(18, -420); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      rings.forEach(r => { r.r += 9; r.a *= 0.97; if(r.r > 0){ ctx.strokeStyle = `rgba(255,240,160,${r.a})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, r.r, 0, 7); ctx.stroke(); } });
      if(t % 3 === 0){ const a = Math.random()*6.28, rr = 60 + Math.random()*140; ctx.fillStyle = `hsla(${40 + Math.random()*40},100%,75%,0.9)`; ctx.fillRect(cx + Math.cos(a)*rr, cy + Math.sin(a)*rr, 4, 4); }
      if(t > T_FLASH + 35){ txt.style.opacity = 1; txt.textContent = 'EVOLVED INTO ' + newTitle.toUpperCase() + '!'; }
    }
    if(t < T_END) requestAnimationFrame(frame); else done();
  }
  frame();
}
return {play};
})();
