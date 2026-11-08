// Original generated music and sound effects (WebAudio). No samples, no copyrighted material.
let ctx=null,musicG=null,sfxG=null,lp=null,running=false,mood=1,step=0,timer=null;
export const settings={music:0.6,sfx:0.7,hi:true};
export function loadSettings(){try{const s=JSON.parse(localStorage.getItem('rb_world_settings')||'null');if(s){if(typeof s.music==='number')settings.music=s.music;if(typeof s.sfx==='number')settings.sfx=s.sfx;if(typeof s.hi==='boolean')settings.hi=s.hi}}catch(e){}}
export function saveSettings(){try{localStorage.setItem('rb_world_settings',JSON.stringify(settings))}catch(e){}}
function applyVol(){if(musicG)musicG.gain.value=settings.music*0.55*mood;if(sfxG)sfxG.gain.value=settings.sfx}
export function setMood(m){mood=m;applyVol()}
export function setVolumes(){applyVol();saveSettings()}
export function initAudio(){
  if(ctx){if(ctx.state==='suspended')ctx.resume();return}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  ctx=new AC();const master=ctx.createGain();master.connect(ctx.destination);
  musicG=ctx.createGain();sfxG=ctx.createGain();sfxG.connect(master);
  lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1500;
  const len=Math.floor(ctx.sampleRate*2.6),buf=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.5)}
  const rev=ctx.createConvolver();rev.buffer=buf;const wet=ctx.createGain();wet.gain.value=0.6;
  lp.connect(musicG);musicG.connect(master);musicG.connect(rev);rev.connect(wet);wet.connect(master);
  applyVol();
}
const PROG=[[57,60,64,67],[53,57,60,64],[48,52,55,59],[55,59,62,64]];
const PENT=[69,72,74,76,79,81,84];
const hz=n=>440*Math.pow(2,(n-69)/12);
function pad(n,t,dur){[-5,5].forEach(det=>{const o=ctx.createOscillator();o.type='triangle';o.frequency.value=hz(n);o.detune.value=det;const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.05,t+3);g.gain.linearRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(lp);o.start(t);o.stop(t+dur+0.2)})}
function pluck(n,t){const o=ctx.createOscillator();o.type='sine';o.frequency.value=hz(n);const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.09,t+0.03);g.gain.exponentialRampToValueAtTime(0.0001,t+2.4);o.connect(g);g.connect(lp);o.start(t);o.stop(t+2.5)}
function chord(){
  if(!ctx)return;const t=ctx.currentTime+0.05,c=PROG[step%4];step++;
  c.forEach((n,i)=>pad(n,t+i*0.12,9.5));pad(c[0]-12,t,9.5);
  const k=2+Math.floor(Math.random()*3);
  for(let i=0;i<k;i++)pluck(PENT[Math.floor(Math.random()*PENT.length)],t+1+Math.random()*6.5);
}
export function startMusic(){if(!ctx||running)return;running=true;chord();timer=setInterval(chord,8000)}
const FX={hit:['square',220,90,0.18,0.5],swing:['sawtooth',520,180,0.12,0.25],pickup:['triangle',660,1000,0.18,0.45],skill:['sine',280,900,0.32,0.6],dash:['sawtooth',180,760,0.2,0.3],ui:['triangle',520,520,0.08,0.3],hurt:['square',170,60,0.25,0.55],level:['triangle',440,990,0.6,0.6]};
export function sfx(type){
  if(!ctx||settings.sfx<=0)return;const p=FX[type]||FX.ui,t=ctx.currentTime;
  const o=ctx.createOscillator(),g=ctx.createGain();o.type=p[0];
  o.frequency.setValueAtTime(p[1],t);o.frequency.exponentialRampToValueAtTime(Math.max(20,p[2]),t+p[3]);
  g.gain.setValueAtTime(p[4]*0.35,t);g.gain.exponentialRampToValueAtTime(0.0001,t+p[3]);
  o.connect(g);g.connect(sfxG);o.start(t);o.stop(t+p[3]+0.05);
}
