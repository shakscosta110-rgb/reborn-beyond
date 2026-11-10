import * as THREE from 'three';
import {RARITY,ITEMS,RECIPES,SHOP,ELEMENTS,BIOMES,MOBS,DIALOGUE,KINGDOMS} from './data.js';
import {buildTerrain,scatter,heightAt,biomeAt,HALF,SEA} from './world.js';
import {makeHero,makeMob,makeNPC,makeLabel} from './models.js';
import {buildTown,WPS} from './town.js';
import * as AU from './audio.js';

const $=id=>document.getElementById(id);
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const clamp=THREE.MathUtils.clamp;
function angDiff(a,b){let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d}
function lerpAng(a,b,t){return a+angDiff(b,a)*t}
AU.loadSettings();

// ================= renderer / scene =================
const canvas=$('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new THREE.Scene();const HORIZON=0xdcefff;scene.fog=new THREE.Fog(HORIZON,70,280);
const camera=new THREE.PerspectiveCamera(60,1,0.1,700);
const hemi=new THREE.HemisphereLight(0xe6f2ff,0x4a5a3a,0.95);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0cf,1.7);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:200});sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.04;scene.add(sun,sun.target);
function resize(){const w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function applyQuality(){renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,AU.settings.hi?2:1));const s=AU.settings.hi?2048:1024;sun.shadow.mapSize.set(s,s);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}resize()}
window.addEventListener('resize',resize);applyQuality();

const sky=(()=>{const g=new THREE.SphereGeometry(500,24,16),pos=g.attributes.position,cols=[],top=new THREE.Color(0x4f9cf5),hor=new THREE.Color(HORIZON);
  for(let i=0;i<pos.count;i++){const t=clamp(pos.getY(i)/500,0,1);const c=hor.clone().lerp(top,Math.pow(t,0.6));cols.push(c.r,c.g,c.b)}
  g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));m.renderOrder=-1;scene.add(m);return m})();
const clouds=[];for(let i=0;i<16;i++){const c=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.8,fog:false,depthWrite:false}));
  c.scale.set(18+Math.random()*22,4+Math.random()*3,9+Math.random()*10);c.position.set((Math.random()-0.5)*700,110+Math.random()*50,(Math.random()-0.5)*700);scene.add(c);clouds.push(c)}

// ================= game state =================
const RCOL={common:'#cfd3e6',uncommon:'#6be07a',rare:'#5cb8ff',epic:'#c27bff',legendary:'#ffb347',mythic:'#ff5c8a'};
const DEF=()=>({lvl:1,xp:0,gold:20,hp:100,nx:60,inv:{},wpn:null,arm:null,quest:0,kills:0,chestsOpened:0,wps:{plaza:1},kingdom:null,element:'fire',x:0,z:18,chests:{},crafted:{},met:{},bossDead:false,dead:false});
const G=DEF();
const SAVE='rb_world_v1';
function save(){try{G.x=pl.x;G.z=pl.z;localStorage.setItem(SAVE,JSON.stringify(G))}catch(e){}}
function hasSave(){try{return !!localStorage.getItem(SAVE)}catch(e){return false}}
function loadSave(){try{const s=JSON.parse(localStorage.getItem(SAVE)||'null');if(!s)return false;Object.assign(G,DEF(),s);G.dead=false;return true}catch(e){return false}}
function resetGame(){Object.keys(G).forEach(k=>delete G[k]);Object.assign(G,DEF())}
const maxHP=()=>Math.round((100+G.lvl*15)*(G.kingdom==='dawn'?1.1:1));
const maxNX=()=>60+G.lvl*8+(G.kingdom==='moon'?20:0);
const atkPow=()=>Math.round((8+G.lvl*2+(G.wpn?ITEMS[G.wpn].atk:0))*(G.kingdom==='ember'?1.1:1));
const defense=()=>G.arm?ITEMS[G.arm].def:0;
const xpNeed=()=>25+G.lvl*15;
const has=(id,n=1)=>(G.inv[id]||0)>=n;
const give=(id,n=1)=>{if(!(G.inv[id]>0)){const types=Object.keys(G.inv).filter(k=>G.inv[k]>0).length;if(types>=slotCap()){toast('Your bag is full! Craft a Backpack for more slots.','#ff8a8a',2600);return false}}G.inv[id]=(G.inv[id]||0)+n;return true};
const take=(id,n=1)=>{G.inv[id]=Math.max(0,(G.inv[id]||0)-n)};
const nm=id=>ITEMS[id]?ITEMS[id].n:id;

const pl={x:0,z:18,y:0,vy:0,jump:false,face:0,dashT:0,dx:0,dz:0,dashCd:0,inv:0,atkCd:0,swing:0,combo:0,comboT:0,veil:0,moving:false,sprinting:false,sleeping:false,inside:false,lx:0,lz:18,lastHit:99,edgeT:0,ix:0,iz:1};
const mv={x:0,y:0};const keys={};let attackHeld=false;
const cam={yaw:0,pitch:0.5,dist:9,curP:0.5,shake:0};
let mode='boot',time=0,hero=null,town=null;
const nodes=[],enemies=[],inter=[],floaters=[],projs=[],fxs=[];
const ui={panel:false};let dlg=null;
const NPCDEF={
  elder:{name:'Elder Maren',type:'elder',robe:0x5b4fd6,x:2,z:8,rot:Math.PI},
  smith:{name:'Smith Dova',type:'smith',robe:0x7a4a22,x:15,z:12,rot:Math.PI},
  merchant:{name:'Trader Quill',type:'merchant',robe:0x2f7a6a,x:-12,z:7.5,rot:Math.PI},
  captain:{name:'Captain Roswen',type:'captain',robe:0x2a4fb0,x:0,z:-15,rot:0},
  healer:{name:'Sister Elowyn',type:'elf',robe:0xeaeaff,x:-6,z:-8,rot:0},
  steward:{name:'Steward Aurelian',type:'merchant',robe:0x6a1f5a,x:21,z:-5,rot:Math.PI},
  elf:{name:'Sylvaris the Elf Ranger',type:'elf',robe:0x2f7a3a,x:-90,z:6,rot:0}
};
let BOSS=null,BOSSPOS={x:0,z:140};

// ================= helpers =================
function toast(t,col,ms){const el=$('toast');el.textContent=t;el.style.color=col||'#fff';el.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>el.classList.remove('on'),ms||2400)}
function findDry(x,z){for(let r=0;r<=24;r+=2)for(let k=0;k<8;k++){const a=k/8*6.283,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(heightAt(px,pz)>SEA+1.1)return {x:px,z:pz}}return {x,z}}
function groundY(x,z){const f=town?town.floorAt(x,z):null;return f!==null?f:heightAt(x,z)}
function fadeTo(o,ms){const f=$('fade');f.style.transition='opacity '+ms+'ms ease';f.style.opacity=o;return new Promise(r=>setTimeout(r,ms))}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ================= UI: panels / dialogue =================
function showPanel(html){const p=$('panel');p.innerHTML=html;p.classList.remove('hidden');ui.panel=true}
function closePanel(){$('panel').classList.add('hidden');ui.panel=false}
function needStr(need){return Object.entries(need).map(([k,v])=>`<span style='color:${has(k,v)?'#9be7a0':'#ff8a8a'}'>${nm(k)} ${(G.inv[k]||0)}/${v}</span>`).join(', ')}
function speak(name,lines,after){dlg={name,lines,i:0,after,shown:0};$('dName').textContent=name;$('dText').textContent='';$('dialog').classList.remove('hidden')}
function updateDlg(dt){if(!dlg)return;const full=dlg.lines[dlg.i];dlg.shown=Math.min(full.length,dlg.shown+dt*60);$('dText').textContent=full.slice(0,Math.floor(dlg.shown))}
function advanceDlg(){if(!dlg)return;const full=dlg.lines[dlg.i];if(dlg.shown<full.length){dlg.shown=full.length;return}dlg.i++;dlg.shown=0;AU.sfx('ui');if(dlg.i>=dlg.lines.length){const a=dlg.after;dlg=null;$('dialog').classList.add('hidden');if(a)a()}}
$('dialog').addEventListener('pointerdown',e=>{e.stopPropagation();advanceDlg()});

function bagPanel(tab){
  tab=tab||'items';
  const tabs=['items','skills','map','status'].map(t=>`<button class='pbtn' data-a='tab' data-v='${t}' style='display:inline-block;margin:2px;${t===tab?'background:#f5c542;color:#222':''}'>${t[0].toUpperCase()+t.slice(1)}</button>`).join('');
  let body='';
  if(tab==='items'){
    const used=Object.keys(G.inv).filter(k=>G.inv[k]>0&&ITEMS[k]).length;
    body=`<div class='row'><span>Gold ${G.gold}</span><span>Slots ${used}/${slotCap()}</span></div><div class='row'><span>Weapon: ${G.wpn?nm(G.wpn):'none'}</span><span>Armor: ${G.arm?nm(G.arm):'none'}</span></div>`;
    const ids=Object.keys(G.inv).filter(k=>G.inv[k]>0&&ITEMS[k]);
    body+=ids.length?ids.map(k=>{const it=ITEMS[k];let b='';
      if(it.t==='wpn')b=`<button data-a='equip' data-v='${k}'>${G.wpn===k?'Equipped':'Equip'}</button>`;
      else if(it.t==='arm')b=`<button data-a='equip' data-v='${k}'>${G.arm===k?'Equipped':'Equip'}</button>`;
      else if(it.t==='food')b=`<button data-a='eat' data-v='${k}'>Use</button>`;
      return `<div class='row'><span>${it.n} x${G.inv[k]}</span>${b}</div>`}).join(''):`<div class='row'>Your bag is empty. Strike trees and rocks, defeat monsters and search chests!</div>`;
  }else if(tab==='skills'){
    body=Object.keys(ELEMENTS).map(k=>{const el=ELEMENTS[k];return `<div class='row' style='display:block'><b style='color:#${el.col.toString(16).padStart(6,'0')}'>${el.name}</b> ${G.element===k?'(active)':`<button data-a='el' data-v='${k}' style='float:right'>Choose</button>`}<div class='sm' style='margin-top:4px'>${el.skills.map(s=>`${s.n} (${s.nx} NX, Lv ${s.unlock})`).join('<br>')}</div></div>`}).join('');
  }else if(tab==='map'){
    body=`<div class='sm'>Discover waypoints by walking up to them, then travel between them any time.</div>`+WPS.map(w=>`<div class='row'><span>${G.wps[w.id]?w.name:'???  (undiscovered)'}</span>${G.wps[w.id]?`<button data-a='tp' data-v='${w.id}'>Travel</button>`:''}</div>`).join('');
  }else{
    const q=QUESTS[G.quest];
    body=`<div class='row'><span>Level ${G.lvl}</span><span>XP ${G.xp}/${xpNeed()}</span></div><div class='row'><span>HP ${Math.round(G.hp)}/${maxHP()}</span><span>Nexus ${Math.round(G.nx)}/${maxNX()}</span></div><div class='row'><span>Attack ${atkPow()}</span><span>Defense ${defense()}</span></div><div class='row'><span>Kingdom</span><span>${G.kingdom?KINGDOMS.find(k=>k.id===G.kingdom).name:'None yet'}</span></div><div class='row' style='display:block'><b>Objective</b><div class='sm'>${q?q.obj:''}</div></div><button class='pbtn' data-a='quit' style='background:#a8324a'>Save and quit to title</button>`;
  }
  showPanel(`<h3>Hero's Bag</h3><div style='text-align:center'>${tabs}</div>${body}<button class='pbtn' data-a='close'>Close</button>`);
}
function recipeOK(r){return Object.entries(r.need).every(([k,v])=>has(k,v))&&(!r.tool||has(r.tool))}
function craftPanel(){showPanel(`<h3>Crafting Table</h3><div class='sm'>Gather materials in the wild, then craft here. Planks need an axe.</div>${RECIPES.map((r,i)=>`<div class='row'><span><b>${nm(r.out)}</b> x${r.n}<br><span class='sm'>${needStr(r.need)}${r.tool?`, <span style='color:${has(r.tool)?'#9be7a0':'#ff8a8a'}'>Tool: ${nm(r.tool)}</span>`:''}</span></span><button data-a='craft' data-v='${i}' ${recipeOK(r)?'':'disabled'}>Craft</button></div>`).join('')}<button class='pbtn' data-a='close'>Close</button>`)}
function shopPanel(tab){
  tab=tab||'buy';
  let body='';
  if(tab==='buy')body=SHOP.map(id=>{const p=Math.max(2,ITEMS[id].v*2);return `<div class='row'><span>${nm(id)}<br><span class='sm'>${p} gold</span></span><button data-a='buy' data-v='${id}' ${G.gold>=p?'':'disabled'}>Buy</button></div>`}).join('');
  else{const ids=Object.keys(G.inv).filter(k=>G.inv[k]>0&&ITEMS[k]&&G.wpn!==k&&G.arm!==k);body=ids.length?ids.map(k=>{const p=Math.max(1,Math.floor(ITEMS[k].v/2));return `<div class='row'><span>${nm(k)} x${G.inv[k]}<br><span class='sm'>${p} gold each</span></span><button data-a='sell' data-v='${k}'>Sell 1</button></div>`}).join(''):`<div class='row'>Nothing to sell.</div>`}
  showPanel(`<h3>Market - Trader Quill</h3><div class='sm'>Gold: ${G.gold}</div><div style='text-align:center'><button class='pbtn' data-a='stab' data-v='buy' style='display:inline-block;margin:2px'>Buy</button><button class='pbtn' data-a='stab' data-v='sell' style='display:inline-block;margin:2px'>Sell</button></div>${body}<button class='pbtn' data-a='close'>Close</button>`);
}
function kingdomPanel(){showPanel(`<h3>Join a Kingdom</h3><div class='sm'>Heroes serve a realm. Choose carefully.</div>${KINGDOMS.map(k=>`<div class='row'><span><b>${k.name}</b><br><span class='sm'>${k.perk} (Lv ${k.lvl})</span></span><button data-a='join' data-v='${k.id}' ${G.lvl>=k.lvl?'':'disabled'}>Join</button></div>`).join('')}<button class='pbtn' data-a='close'>Close</button>`)}
function equip(id,silent){const it=ITEMS[id];if(it.t==='wpn'){G.wpn=id;applyBlade()}else if(it.t==='arm')G.arm=id;if(!silent)toast('Equipped '+it.n,'#9be7ff')}
const WCOL={club:0x8a5a2b,ironsword:0xcfd8e8,emberblade:0xff6a2a,frostspear:0x9fd0ff,scalesword:0xb8281c,moonblade:0xd8b4ff};
function applyBlade(){if(hero&&G.wpn)hero.bladeM.color.setHex(WCOL[G.wpn]||0xcfd8e8)}
function craft(i){
  const r=RECIPES[i];if(!recipeOK(r))return;
  const isPack=r.out==='backpack';
  if(isPack&&(G.bag||0)>=1){toast('You already have a backpack.','#aaa');return}
  if(!isPack&&!(G.inv[r.out]>0)){const left=Object.keys(G.inv).filter(k=>(G.inv[k]-(r.need[k]||0))>0).length;if(left>=slotCap()){toast('Your bag is full! Craft a Backpack for more slots.','#ff8a8a');return}}
  Object.entries(r.need).forEach(([k,v])=>take(k,v));
  if(isPack){G.bag=1;toast('Backpack crafted! You now have 12 slots.','#ffd24a',3000)}else{give(r.out,r.n);toast('Crafted '+nm(r.out)+' x'+r.n,'#9be7ff')}
  G.crafted[r.out]=1;AU.sfx('pickup');
  const it=ITEMS[r.out];if(it.t==='wpn'&&(!G.wpn||it.atk>ITEMS[G.wpn].atk))equip(r.out,true);if(it.t==='arm'&&(!G.arm||it.def>ITEMS[G.arm].def))equip(r.out,true);
  craftPanel();save();
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;const a=t.dataset.a,v=t.dataset.v;AU.sfx('ui');
  switch(a){
    case 'close':closePanel();break;
    case 'tab':bagPanel(v);break;
    case 'equip':equip(v);bagPanel('items');break;
    case 'eat':eatItem(v);bagPanel('items');break;
    case 'el':G.element=v;buildSkillButtons();bagPanel('skills');break;
    case 'tp':teleport(v);break;
    case 'craft':craft(+v);break;
    case 'buy':{const p=Math.max(2,ITEMS[v].v*2);if(G.gold>=p&&give(v)){G.gold-=p;toast('Bought '+nm(v))}shopPanel('buy');save();break}
    case 'sell':{const p=Math.max(1,Math.floor(ITEMS[v].v/2));if(has(v)){take(v);G.gold+=p}shopPanel('sell');save();break}
    case 'stab':shopPanel(v);break;
    case 'join':G.kingdom=v;G.hp=Math.min(G.hp+20,maxHP());closePanel();toast('You joined the '+KINGDOMS.find(k=>k.id===v).name+'!','#ffd24a',3200);AU.sfx('level');save();break;
    case 'buyMyth':{if((G.bag||0)>=2)toast('You already own it.');else if(G.gold<5000)toast('You need 5000 gold.','#ff8a8a');else{G.gold-=5000;G.bag=2;toast('Mythic Backpack acquired! 24 slots.','#ff5c8a',3200);AU.sfx('level')}closePanel();save();break}
    case 'quit':save();location.reload();break;
  }});

// ================= story & quests =================
const ELDER_INTRO=['Hero... you have crossed the veil at last. I am Maren, keeper of Dawnhold.','This world is Aethra. The Nexus, the wellspring of all magic, is failing.','A Cinder Drake in the volcanic south drinks the Nexus dry. Only a hero of the Reborn can stop it.','But you are not strong yet. Gather timber and stone, and learn the craft of forging. Follow the golden arrow, and I will guide you.'];
function nearest(list,f){let b=null,bd=1e9;for(const o of list){if(!f(o))continue;const d=Math.hypot(o.x-pl.x,o.z-pl.z);if(d<bd){bd=d;b=o}}return b}
const nearestNode=()=>nearest(nodes,n=>!n.dead&&n.kind!=='sisal');
const nearestEnemy=()=>nearest(enemies,e=>!e.dead&&!e.boss&&!e.def.passive&&Math.hypot(e.x,e.z)>36);
const nearestChest=()=>nearest(town.chests,c=>!c.opened);
const QUESTS=[
 {obj:'Speak with Elder Maren in Dawnhold.',tgt:()=>NPCDEF.elder,done:()=>!!G.met.elder},
 {obj:'Gather 5 Timber and 3 Stone. Strike trees and rocks with your sword.',prog:()=>`Timber ${Math.min(5,G.inv.wood||0)}/5   Stone ${Math.min(3,G.inv.stone||0)}/3`,tgt:nearestNode,done:()=>has('wood',5)&&has('stone',3)},
 {obj:'At the Crafting Table in the plaza, craft a Stone Axe, then Planks, then a Wooden Club.',prog:()=>`Axe ${has('axe')?'yes':'no'}   Planks ${G.inv.plank||0}/3   Rope ${G.inv.rope||0}/1`,tgt:()=>town.table,done:()=>!!G.crafted.club},
 {obj:'Defeat 3 monsters outside the town walls.',prog:()=>`Defeated ${Math.min(3,G.kills)}/3`,tgt:nearestEnemy,done:()=>G.kills>=3},
 {obj:'Search the houses of Dawnhold and open a chest.',tgt:nearestChest,done:()=>G.chestsOpened>=1},
 {obj:'Reach level 5, then speak with Captain Roswen to join a kingdom.',prog:()=>`Level ${G.lvl}/5`,tgt:()=>NPCDEF.captain,done:()=>!!G.kingdom},
 {obj:'Travel to the Elderwood in the west and meet Sylvaris the elf.',tgt:()=>NPCDEF.elf,done:()=>!!G.met.elf},
 {obj:'Craft armor at the table (Hide Vest or Ferrite Plate).',tgt:()=>town.table,done:()=>!!G.arm},
 {obj:'Grow stronger: reach level 6 before facing the Drake.',prog:()=>`Level ${G.lvl}/6`,tgt:nearestEnemy,done:()=>G.lvl>=6},
 {obj:'Slay the Cinder Drake in Cinder Reach, far to the south.',tgt:()=>BOSSPOS,done:()=>!!G.bossDead},
 {obj:'The Nexus is restored. Explore Aethra freely!',tgt:()=>null,done:()=>false}
];
const QR=[{xp:20,gold:10},{xp:30,gold:10,items:{fiber:2}},{xp:40,gold:15},{xp:60,gold:25,items:{potion:2}},{xp:50,gold:20},{xp:90,gold:60,items:{ingot:3}},{xp:100,gold:40,items:{petal:3,nexusTonic:1}},{xp:120,gold:80},{xp:200,gold:150,items:{crystal:2}},{xp:600,gold:500,items:{mythicarmor:1}},{}];
function reward(r){if(!r)return;if(r.xp)addXP(r.xp);if(r.gold)G.gold+=r.gold;if(r.items)for(const k in r.items)give(k,r.items[k])}
function checkQuest(){let g=0;while(g++<5){const q=QUESTS[G.quest];if(!q||!q.done||!q.done())break;const i=G.quest;G.quest++;reward(QR[i]);toast('Objective complete!','#ffd24a',2600);AU.sfx('level');onQuestDone(i);save()}}
function onQuestDone(i){
  if(i===0)setTimeout(()=>toast('Follow the golden arrow to your next objective','#ffd24a',3200),2800);
  if(i===5)setTimeout(()=>speak('Captain Roswen',['The Kingdom welcomes you, hero. Dawnhold stands behind you.','Seek Sylvaris, the elf ranger of the Elderwood. She knows the old path to the Drake.','Use the waypoint stones to travel quickly. Discover them by walking up to them.']),1800);
  if(i===9)setTimeout(()=>speak('Elder Maren',['The Drake falls, and the Nexus blazes back to life across Aethra.','You have done what no one else could, hero. Dawnhold will sing your name for a thousand years.','Chapter I is complete. Aethra is yours to explore, and more adventures are coming.']),2500);
}
function addXP(n){G.xp+=n;let up=false;while(G.xp>=xpNeed()){G.xp-=xpNeed();G.lvl++;up=true;G.hp=maxHP();G.nx=maxNX()}
  if(up){toast('LEVEL UP!  Level '+G.lvl,'#ffd24a',2800);AU.sfx('level');burst(pl.x,pl.y+1,pl.z,0xffd24a,24,6);
    const u=[];ELEMENTS[G.element].skills.forEach(s=>{if(s.unlock===G.lvl)u.push(s.n)});if(u.length)setTimeout(()=>toast('New ability: '+u.join(', '),'#9be7ff',2600),1600)}}

// ================= effects =================
const pgeo=new THREE.SphereGeometry(0.12,6,6);
function addFx(mesh,life,upd,own){scene.add(mesh);fxs.push({mesh,life,t:0,upd,own})}
function updateFx(dt){for(let i=fxs.length-1;i>=0;i--){const f=fxs[i];f.t+=dt;const k=Math.min(1,f.t/f.life);if(f.upd)f.upd(f.mesh,k,dt);if(k>=1){scene.remove(f.mesh);if(f.mesh.material)f.mesh.material.dispose();if(f.own&&f.mesh.geometry)f.mesh.geometry.dispose();fxs.splice(i,1)}}}
function burst(x,y,z,color,n,sp){for(let i=0;i<n;i++){const m=new THREE.Mesh(pgeo,new THREE.MeshBasicMaterial({color,transparent:true}));m.position.set(x,y,z);const v=new THREE.Vector3((Math.random()-0.5)*sp,Math.random()*sp*0.9,(Math.random()-0.5)*sp);addFx(m,0.5+Math.random()*0.35,(o,k,dt)=>{o.position.addScaledVector(v,dt);v.y-=8*dt;o.material.opacity=1-k})}}
function ring(x,y,z,r,color){const g=new THREE.RingGeometry(0.85,1,36);g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color,transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.set(x,y,z);addFx(m,0.45,(o,k)=>{o.scale.setScalar(Math.max(0.1,r*k));o.material.opacity=0.9*(1-k)},true)}
function bolt(x1,y1,z1,x2,y2,z2,color){const m=new THREE.Mesh(new THREE.SphereGeometry(0.35,10,8),new THREE.MeshBasicMaterial({color,transparent:true,blending:THREE.AdditiveBlending}));m.position.set(x1,y1,z1);addFx(m,0.18,(o,k)=>{o.position.set(x1+(x2-x1)*k,y1+(y2-y1)*k,z1+(z2-z1)*k)},true);burst(x2,y2,z2,color,10,5)}
function slashFx(){const g=new THREE.RingGeometry(1.0,3.2,24,1,-Math.PI/2-0.95+(pl.combo%2?0.2:-0.2),1.9);g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xdff3ff,transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.set(pl.x,pl.y+0.9,pl.z);m.rotation.y=pl.face;addFx(m,0.16,(o,k)=>{o.material.opacity=0.85*(1-k);o.scale.setScalar(1+k*0.25)},true)}
function floatText(t,x,y,z,color){const s=makeLabel(String(t),color,0.7);s.position.set(x,y,z);scene.add(s);floaters.push({s,t:0})}
function updateFloaters(dt){for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];f.t+=dt;f.s.position.y+=1.5*dt;f.s.material.opacity=Math.max(0,1-f.t/0.9);if(f.t>=0.9){scene.remove(f.s);f.s.material.map.dispose();f.s.material.dispose();floaters.splice(i,1)}}}

// ================= world building =================
let arrow=null,beacon=null;
function makeArrow(){const ag=new THREE.ConeGeometry(0.4,1.2,10);ag.rotateX(Math.PI/2);arrow=new THREE.Mesh(ag,new THREE.MeshBasicMaterial({color:0xffd24a}));arrow.visible=false;scene.add(arrow);
  beacon=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,60,12,1,true),new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true,opacity:0.28,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beacon.visible=false;scene.add(beacon)}
function spawnEnemy(id,x,z){const def=MOBS[id],model=makeMob(id,def);scene.add(model);
  const e={id,def,model,x,z,hx:x,hz:z,hp:def.hp,max:def.hp,dead:false,cd:1,wt:0,wd:0,walk:false,respawn:0,boss:!!def.boss,flash:0,lunge:0,fb:3,fleeT:0,aggro:def.boss?20:12,reach:1.4*def.size+0.7};
  model.position.set(x,heightAt(x,z),z);enemies.push(e);return e}
function spawnEnemies(){
  const counts={meadow:16,forest:14,desert:10,snow:9,volcanic:11};
  for(const b of Object.keys(BIOMES)){const ids=Object.keys(MOBS).filter(k=>MOBS[k].biome.includes(b)&&!MOBS[k].boss);let n=counts[b],tries=0;
    while(n>0&&tries<800){tries++;const x=(Math.random()-0.5)*290,z=(Math.random()-0.5)*290;if(biomeAt(x,z)!==b||Math.hypot(x,z)<40||heightAt(x,z)<SEA+1)continue;spawnEnemy(ids[rnd(0,ids.length-1)],x,z);n--}}
  let bz=140;while(bz>104&&heightAt(0,bz)<SEA+1.2)bz-=3;BOSSPOS={x:0,z:bz};BOSS=spawnEnemy('drake',0,bz);
}
function scatterSisal(){
  for(let i=0;i<110;i++){const x=(Math.random()-0.5)*300,z=(Math.random()-0.5)*300;if(Math.hypot(x,z)<36)continue;const b=biomeAt(x,z);if(b!=='meadow'&&b!=='desert')continue;const h=heightAt(x,z);if(h<SEA+0.8)continue;
    const g=new THREE.Group(),m=new THREE.MeshLambertMaterial({color:b==='desert'?0x8aa84a:0x4a9a4a});
    for(let k=0;k<7;k++){const p=new THREE.Group();p.rotation.y=k/7*6.283;const leaf=new THREE.Mesh(new THREE.ConeGeometry(0.12,1.1,4),m);leaf.position.set(0,0.5,0.28);leaf.rotation.x=0.55;leaf.castShadow=true;p.add(leaf);g.add(p)}
    g.position.set(x,h,z);scene.add(g);nodes.push({kind:'sisal',obj:g,x,z,r:0.7,hp:1,maxhp:1,drop:{sisal:[1,3]},respawn:0,dead:false})}
}
const POOL={common:['wood','fiber','stone','torch','club'],uncommon:['hide','ore','petal','sand','meat'],rare:['ingot','potion','nexusTonic','leather','ironsword'],epic:['ember','frost','crystal','ironarmor','horsegear'],legendary:['emberblade','frostspear','scale','scalearmor'],mythic:['moonblade','mythicarmor']};
function rollRarity(){const t=RARITY.reduce((a,r)=>a+r.w,0);let x=Math.random()*t;for(const r of RARITY){x-=r.w;if(x<=0)return r}return RARITY[0]}
function openChest(c){
  if(c.opened){toast('This chest is empty.','#aaa');return}
  c.opened=true;G.chests[c.id]=1;G.chestsOpened++;c.pivot.rotation.x=-1.2;c.spark.visible=false;AU.sfx('pickup');
  const rolls=rnd(2,3),lines=[];
  for(let i=0;i<rolls;i++){const r=rollRarity(),id=POOL[r.id][rnd(0,POOL[r.id].length-1)],t=ITEMS[id].t,q=(t==='mat'||t==='food')?rnd(1,3):1,ok=give(id,q);lines.push(`<span style='color:${RCOL[r.id]}'>${r.name}: ${nm(id)} x${q}${ok?'':' (bag full, left behind)'}</span>`)}
  const g=rnd(5,25);G.gold+=g;
  showPanel(`<h3>Chest opened!</h3>${lines.map(l=>`<div class='row'>${l}</div>`).join('')}<div class='row'><span style='color:#ffd24a'>Gold +${g}</span></div><button class='pbtn' data-a='close'>Take all</button>`);save();
}
function talkNpc(k){const d=NPCDEF[k];
  if(k==='elder'){if(!G.met.elder)speak(d.name,ELDER_INTRO,()=>{G.met.elder=1;give('rope',1);toast('Received Rope','#9be7ff');save()});else speak(d.name,[QUESTS[G.quest].obj])}
  else if(k==='merchant')speak(d.name,DIALOGUE.merchant.lines.slice(0,1),()=>shopPanel('buy'));
  else if(k==='smith')speak(d.name,DIALOGUE.smith.lines);
  else if(k==='healer')speak(d.name,['You look weary, hero. Let the light of dawn mend you.'],healerHeal);
  else if(k==='steward')speak(d.name,['Welcome. The masters of Aurelle Mansion offer a Mythic Backpack to those who can afford it.','It holds twenty-four slots, and costs five thousand gold.'],stewardShop);
  else if(k==='captain'){if(G.kingdom)speak(d.name,['Hail, hero of the '+KINGDOMS.find(q=>q.id===G.kingdom).name+'. The realm is proud of you.']);else if(G.lvl<5)speak(d.name,DIALOGUE.captain.lines);else speak(d.name,['You have proven yourself. Choose a kingdom to serve.'],kingdomPanel)}
  else if(k==='elf'){if(!G.met.elf)speak(d.name,DIALOGUE.elf.lines.concat(['The Drake sleeps in Cinder Reach, past the Cinder Gate. Forge armor and grow strong first. Take these petals for the road.']),()=>{G.met.elf=1;give('petal',3);toast('Received 3 Moonpetal','#c27bff');save()});else speak(d.name,['Walk softly, hero. The Drake awaits in the south.'])}
}
function buildInteractables(){
  for(const k of Object.keys(NPCDEF)){const d=NPCDEF[k];if(k==='elf'){const p=findDry(d.x,d.z);d.x=p.x;d.z=p.z}
    const m=makeNPC(d.type,d.robe),y=groundY(d.x,d.z);m.position.set(d.x,y,d.z);m.rotation.y=Math.atan2(-d.x,-d.z)||0;scene.add(m);
    const lb=makeLabel(d.name,'#ffe7a0');lb.position.set(d.x,y+3.1,d.z);scene.add(lb);d.y=y;
    inter.push({kind:'npc',x:d.x,z:d.z,r:3.6,label:'Talk to '+d.name,run:()=>talkNpc(k)})}
  town.chests.forEach(c=>{inter.push({kind:'chest',x:c.x,z:c.z,r:2.8,get label(){return c.opened?'Empty chest':'Open chest'},run:()=>openChest(c)})});
  inter.push({kind:'table',x:town.table.x,z:town.table.z,r:3.4,label:'Use the crafting table',run:craftPanel});
  town.beds.forEach(b=>inter.push({kind:'bed',x:b.x,z:b.z,r:2.6,label:'Sleep in bed (until morning)',run:sleepBed}));
  town.furn.forEach(f=>{if(f.kind==='table')inter.push({x:f.x,z:f.z,r:2.2,label:'Eat at the table',run:eatAtTable});else if(f.kind==='chair')inter.push({x:f.x,z:f.z,r:1.6,label:'Sit and rest (1 hour)',run:sitRest});else inter.push({x:f.x,z:f.z,r:2.0,label:'Search the shelf',run:()=>searchShelf(f.id)})});
  inter.push({kind:'fountain',x:0,z:2,r:4.4,label:'Drink from the fountain',run:drinkWater});
  town.wps.forEach(w=>{const lb=makeLabel(w.name,'#9be7ff',0.9);lb.position.set(w.x,w.y+3.8,w.z);scene.add(lb);inter.push({kind:'wp',x:w.x,z:w.z,r:3.8,label:'Waypoint: '+w.name,run:()=>bagPanel('map')})});
}
async function buildWorld(setP){
  const step=async(p,t)=>{setP(p,t);await sleep(40)};
  await step(5,'Shaping the land...');buildTerrain(scene);
  await step(25,'Growing the forests...');scatter(scene,nodes);scatterSisal();
  await step(50,'Raising Dawnhold...');town=buildTown(scene,heightAt);
  for(let i=nodes.length-1;i>=0;i--){const n=nodes[i];let bad=Math.hypot(n.x,n.z)<34;for(const w of town.wps)if(Math.hypot(n.x-w.x,n.z-w.z)<6)bad=true;
    if(bad){scene.remove(n.obj);nodes.splice(i,1)}else{n.maxhp=n.hp;n.respawn=0;n.dead=false}}
  await step(65,'Awakening the creatures...');spawnEnemies();
  await step(80,'Gathering the villagers...');buildInteractables();
  await step(92,'Painting the heavens...');
  hero=makeHero();hero.group.visible=false;scene.add(hero.group);makeArrow();buildSkillButtons();
  await step(100,'Ready');
}
function teleport(id){const w=town.wps.find(q=>q.id===id);if(!w||!G.wps[id])return;closePanel();
  fadeTo(1,450).then(()=>{const a=Math.random()*6.283,tx=w.x+Math.cos(a)*2.5,tz=w.z+Math.sin(a)*2.5;pl.x=tx;pl.z=tz;pl.y=groundY(tx,tz);pl.jump=false;pl.vy=0;pl.lx=tx;pl.lz=tz;AU.sfx('skill');return fadeTo(0,500)}).then(()=>toast('Arrived at '+w.name,'#9be7ff'))}

// ================= skills =================
const skBtns=[],skCd=[0,0,0];
function buildSkillButtons(){
  skBtns.forEach(b=>b.remove());skBtns.length=0;const pos=[[104,190],[170,150],[170,214]];
  ELEMENTS[G.element].skills.forEach((s,i)=>{const b=document.createElement('button');b.className='sk';b.style.right=pos[i][0]+'px';b.style.bottom=pos[i][1]+'px';b.innerHTML=s.n+'<br>'+s.nx+' NX';
    b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();castSkill(i)});document.body.appendChild(b);skBtns.push(b)});
}
function castSkill(i){
  if(G.dead||ui.panel||dlg||pl.sleeping||mode!=='play')return;const s=ELEMENTS[G.element].skills[i];if(!s)return;
  if(G.lvl<s.unlock){toast('Unlocks at level '+s.unlock,'#ffb347');return}
  if(skCd[i]>0)return;if(G.nx<s.nx){toast('Not enough Nexus energy','#ff8a8a');return}
  G.nx-=s.nx;skCd[i]=s.cd;AU.sfx('skill');const col=ELEMENTS[G.element].col;
  if(s.heal){G.hp=Math.min(maxHP(),G.hp+s.heal);floatText('+'+s.heal,pl.x,pl.y+2.6,pl.z,'#7dffa0');burst(pl.x,pl.y+1,pl.z,0x7dffa0,18,4);ring(pl.x,pl.y+0.2,pl.z,4,col);return}
  if(s.buff){pl.veil=6;burst(pl.x,pl.y+1,pl.z,0x9a9a9a,26,3);ring(pl.x,pl.y+0.2,pl.z,3,0x9a9a9a);toast('Shield up: incoming damage halved','#cfcfcf');return}
  const dmg=Math.round(s.dmg*(1+G.lvl*0.1)+atkPow()*0.3);
  if(s.aoe){ring(pl.x,pl.y+0.2,pl.z,s.r,col);burst(pl.x,pl.y+0.8,pl.z,col,24,7);cam.shake=0.3;for(const e of enemies){if(e.dead)continue;if(Math.hypot(e.x-pl.x,e.z-pl.z)<s.r+e.def.size*0.6)dmgEnemy(e,dmg)}pl.swing=0.25;return}
  let best=null,bd=s.r;
  for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-pl.x,e.z-pl.z);if(d<bd&&Math.abs(angDiff(Math.atan2(e.x-pl.x,e.z-pl.z),pl.face))<1.3){bd=d;best=e}}
  if(best){pl.face=Math.atan2(best.x-pl.x,best.z-pl.z);bolt(pl.x,pl.y+1.5,pl.z,best.x,groundY(best.x,best.z)+1.2*best.def.size,best.z,col);setTimeout(()=>{if(!best.dead)dmgEnemy(best,dmg)},120)}
  else{const tx=pl.x+Math.sin(pl.face)*s.r*0.6,tz=pl.z+Math.cos(pl.face)*s.r*0.6;bolt(pl.x,pl.y+1.5,pl.z,tx,pl.y+1.2,tz,col)}
  pl.swing=0.25;
}

// ================= survival, time, furniture =================
const ICONS={wood:'\u{1FAB5}',stone:'\u{1FAA8}',fiber:'\u{1F33F}',ore:'\u26F0\uFE0F',crystal:'\u{1F48E}',hide:'\u{1F7EB}',scale:'\u{1F409}',ember:'\u{1F525}',frost:'\u2744\uFE0F',petal:'\u{1F338}',sand:'\u23F3',ingot:'\u{1F529}',plank:'\u{1F7E7}',rope:'\u27B0',meat:'\u{1F356}',potion:'\u{1F9EA}',nexusTonic:'\u{1F537}',club:'\u{1F3CF}',ironsword:'\u{1F5E1}\uFE0F',emberblade:'\u{1F5E1}\uFE0F',frostspear:'\u{1F531}',scalesword:'\u2694\uFE0F',moonblade:'\u{1F319}',leather:'\u{1F9BA}',ironarmor:'\u{1F6E1}\uFE0F',scalearmor:'\u{1F6E1}\uFE0F',mythicarmor:'\u{1F451}',horsegear:'\u{1F434}',torch:'\u{1F526}',wool:'\u{1F9F6}',sisal:'\u{1F33E}',axe:'\u{1FA93}',backpack:'\u{1F392}',mythpack:'\u{1F392}'};
const slotCap=()=>G.bag===2?24:G.bag===1?12:8;
const nightC=new THREE.Color(0x0a1030),dayC=new THREE.Color(HORIZON),skyN=new THREE.Color(0x1a2a5a),white=new THREE.Color(0xffffff),sunWarm=new THREE.Color(0xffa860),sunDay=new THREE.Color(0xfff0cf);
function applyLighting(){
  const h=G.hour;let k;
  if(h>=7&&h<=18)k=1;else if(h>=5.5&&h<7)k=(h-5.5)/1.5;else if(h>18&&h<=20)k=1-(h-18)/2;else k=0;
  const sm=k*k*(3-2*k);
  sun.intensity=0.18+1.55*sm;hemi.intensity=0.34+0.62*sm;
  sun.color.lerpColors(sunWarm,sunDay,clamp((sm-0.2)/0.6,0,1));
  scene.fog.color.lerpColors(nightC,dayC,sm);sky.material.color.lerpColors(skyN,white,sm);
}
function updateTime(dt){const night=G.hour>=20||G.hour<5.5;G.hour+=dt*(24/600)*(night?2:1);if(G.hour>=24){G.hour-=24;G.day++}applyLighting()}
const warned={};
function warn(key,cond,msg){if(cond){if(!warned[key]){warned[key]=1;toast(msg,'#ffb347',2600)}}else warned[key]=0}
function updateSurvival(dt){
  G.hunger=Math.max(0,G.hunger-dt*0.12);G.thirst=Math.max(0,G.thirst-dt*0.17);
  G.fatigue=Math.min(100,G.fatigue+dt*(0.1+(pl.sprinting?0.5:0)+(pl.swing>0?0.1:0)));
  if(pl.sprinting)G.energy=Math.max(0,G.energy-dt*14);else G.energy=Math.min(100,G.energy+dt*9);
  warn('hg',G.hunger<15,'You are starving. Eat some food!');warn('th',G.thirst<15,'You are very thirsty. Drink water!');warn('ft',G.fatigue>85,'You are exhausted. Find a bed soon!');
  if(G.hunger<=0||G.thirst<=0){G.hp-=dt*1.2;pl.lastHit=0;if(G.hp<=0)die()}
  if(G.fatigue>=100)collapse();
}
function collapse(){if(pl.sleeping||G.dead)return;pl.sleeping=true;$('msg').innerHTML='You collapse from exhaustion...';$('msg').classList.remove('hidden');
  fadeTo(1,900).then(()=>{const p=town.wps[0];pl.x=p.x+2;pl.z=p.z+2;pl.y=groundY(pl.x,pl.z);pl.jump=false;pl.lx=pl.x;pl.lz=pl.z;G.fatigue=30;G.hp=Math.max(G.hp,maxHP()*0.5);G.hour=(G.hour+6)%24;G.hunger=Math.max(20,G.hunger-20);G.thirst=Math.max(20,G.thirst-20);$('msg').classList.add('hidden');return fadeTo(0,900)}).then(()=>{pl.sleeping=false;toast('You woke up in Dawnhold. Sleep in a bed next time!','#cfcfff',3200);save()})}
function sleepBed(){if(pl.sleeping)return;pl.sleeping=true;
  fadeTo(1,800).then(()=>{if(G.hour>=6)G.day++;G.hour=6.2;G.fatigue=0;G.hp=maxHP();G.nx=maxNX();G.hunger=Math.max(25,G.hunger-20);G.thirst=Math.max(25,G.thirst-20);applyLighting();return fadeTo(0,900)}).then(()=>{pl.sleeping=false;toast('You slept soundly. A new day begins.','#cfcfff',2800);save()})}
function sitRest(){if(pl.sleeping)return;pl.sleeping=true;fadeTo(1,500).then(()=>{G.hour=(G.hour+1)%24;G.fatigue=Math.max(0,G.fatigue-15);G.hp=Math.min(maxHP(),G.hp+10);applyLighting();return fadeTo(0,500)}).then(()=>{pl.sleeping=false;toast('You rest for an hour. Fatigue eased.','#cfcfff',2200)})}
function drinkWater(){G.thirst=100;G.hp=Math.min(maxHP(),G.hp+5);toast('You drink the cool water. Thirst quenched.','#7fe0ff',2200);AU.sfx('pickup')}
function eatItem(v){const it=ITEMS[v];if(!it||!has(v)||it.t!=='food')return;take(v);if(it.heal)G.hp=Math.min(maxHP(),G.hp+it.heal);if(it.nx)G.nx=Math.min(maxNX(),G.nx+it.nx);if(v==='meat')G.hunger=Math.min(100,G.hunger+40);if(v==='potion')G.thirst=Math.min(100,G.thirst+25);toast('Used '+it.n,'#9be7a0');AU.sfx('pickup')}
function eatAtTable(){if(has('meat'))eatItem('meat');else toast('You have no food. Buy or cook Roast Meat.','#ff8a8a')}
function searchShelf(id){G.shelves=G.shelves||{};if(G.shelves[id]===G.day){toast('You already searched here today.','#aaa');return}G.shelves[id]=G.day;const r=Math.random();let m;
  if(r<0.4){give('fiber',rnd(1,2));m='You find some wild fiber.'}else if(r<0.7){give('sisal',rnd(1,2));m='You find dried sisal.'}else if(r<0.9){const g=rnd(3,12);G.gold+=g;m='You find '+g+' gold coins.'}else{give('potion');m='You find a Vital Draught!'}
  toast(m,'#ffe7a0');AU.sfx('pickup')}
function healerHeal(){G.hp=maxHP();G.nx=maxNX();G.fatigue=Math.max(0,G.fatigue-30);burst(pl.x,pl.y+1,pl.z,0x7dffa0,26,5);ring(pl.x,pl.y+0.2,pl.z,4,0x7dffa0);toast('Sister Elowyn restores you fully.','#7dffa0',2600);AU.sfx('level');save()}
function stewardShop(){showPanel(`<h3>Aurelle Mansion Steward</h3><div class='sm'>Gold: ${G.gold}</div><div class='row'><span><b>Mythic Backpack</b><br><span class='sm'>24 slots. 5000 gold</span></span><button data-a='buyMyth' ${(G.bag||0)>=2?'disabled':''}>Buy</button></div><button class='pbtn' data-a='close'>Close</button>`)}
const WATER={label:'Drink water',run:drinkWater};
function nearestInter(){let b=null,bd=1e9;for(const o of inter){const d=Math.hypot(o.x-pl.x,o.z-pl.z);if(d<o.r&&d<bd){bd=d;b=o}}return b}
function nearWater(){return town.floorAt(pl.x,pl.z)===null&&heightAt(pl.x,pl.z)<SEA+0.75}
function interactNow(){const o=nearestInter();if(o)return o;return nearWater()?WATER:null}
function useAction(){if(dlg){advanceDlg();return}if(G.dead||ui.panel||pl.sleeping||mode!=='play')return;const o=interactNow();if(o){AU.sfx('ui');o.run()}}
let hbKey='';
function renderHotbar(){
  const cap=slotCap(),ids=Object.keys(G.inv).filter(k=>G.inv[k]>0&&ITEMS[k]);
  const key=ids.map(k=>k+G.inv[k]).join(',')+'|'+cap+'|'+G.wpn+'|'+G.arm;if(key===hbKey)return;hbKey=key;
  let h='';for(let i=0;i<12;i++){const id=ids[i],lk=i>=cap;h+=`<div class='slot${lk?' lk':''}' ${id&&!lk?`data-id='${id}'`:''}>${lk?'&#128274;':(id?`${ICONS[id]||'?'}<i>${G.inv[id]}</i>`:'')}</div>`}
  $('hotbar').innerHTML=h;
}
$('hotbar').addEventListener('pointerdown',e=>{const s=e.target.closest('.slot');if(!s||!s.dataset.id)return;e.stopPropagation();const id=s.dataset.id,it=ITEMS[id];AU.sfx('ui');
  if(it.t==='food')eatItem(id);else if(it.t==='wpn'||it.t==='arm')equip(id);else toast(it.n+' x'+G.inv[id],'#cfe9ff',1200);hbKey=''});

// ================= combat =================
function eOK(x,z){if(heightAt(x,z)<SEA-0.9)return false;if(Math.abs(x)>HALF-44||Math.abs(z)>HALF-44)return false;if(Math.hypot(x,z)<32)return false;for(const c of town.colliders)if(x>c.minx-0.6&&x<c.maxx+0.6&&z>c.minz-0.6&&z<c.maxz+0.6)return false;return true}
function dmgEnemy(e,dmg){
  e.hp-=dmg;e.flash=0.15;const gy=heightAt(e.x,e.z);floatText(Math.round(dmg),e.x,gy+2.2*e.def.size,e.z,'#ffe27a');burst(e.x,gy+1,e.z,0xffe27a,6,4);AU.sfx('hit');cam.shake=Math.max(cam.shake,0.12);
  if(e.def.passive)e.fleeT=4;
  if(!e.boss){const dx=e.x-pl.x,dz=e.z-pl.z,d=Math.hypot(dx,dz)||1,nx=e.x+dx/d*0.8,nz=e.z+dz/d*0.8;if(eOK(nx,nz)){e.x=nx;e.z=nz}}
  if(e.hp<=0)killEnemy(e);
}
function killEnemy(e){
  e.dead=true;e.model.visible=false;e.respawn=45+Math.random()*30;const gy=heightAt(e.x,e.z);burst(e.x,gy+1,e.z,e.def.col,20,6);
  const got=[];for(const k of Object.keys(e.def.drop)){const a=e.def.drop[k],c=rnd(a[0],a[1]);if(c>0&&give(k,c))got.push('+'+c+' '+nm(k))}
  const gold=rnd(2,6)*(e.boss?40:1);G.gold+=gold;if(!e.def.passive)G.kills++;
  if(got.length)toast(got.join('  ')+'  +'+gold+' gold','#cfe9ff',1800);
  addXP(e.def.xp);
  if(e.boss){G.bossDead=true;toast('THE CINDER DRAKE HAS FALLEN!','#ffb347',4200);cam.shake=0.8;AU.sfx('level')}
}
function hurtPlayer(raw){
  if(pl.inv>0||G.dead||pl.sleeping)return;let d=raw*(pl.veil>0?0.5:1);d=Math.max(1,d-defense()*0.35);G.hp-=d;pl.lastHit=0;
  floatText(Math.round(d),pl.x,pl.y+2.4,pl.z,'#ff6a6a');AU.sfx('hurt');const h=$('hurt');h.style.opacity=0.8;setTimeout(()=>{h.style.opacity=0},170);cam.shake=0.25;if(G.hp<=0)die();
}
function die(){
  if(G.dead)return;G.dead=true;G.hp=0;$('msg').innerHTML='You were defeated...<br><span style="font-size:15px;opacity:.7">The Nexus returns you to Dawnhold.</span>';$('msg').classList.remove('hidden');
  setTimeout(()=>{fadeTo(1,500).then(()=>{const p=town.wps[0];pl.x=p.x+2;pl.z=p.z+2;pl.y=groundY(pl.x,pl.z);pl.jump=false;pl.lx=pl.x;pl.lz=pl.z;G.hp=maxHP();G.nx=maxNX();G.gold=Math.floor(G.gold*0.9);G.hunger=Math.max(G.hunger,30);G.thirst=Math.max(G.thirst,30);G.dead=false;$('msg').classList.add('hidden');save();return fadeTo(0,700)})},2600);
}
function spawnProj(e){const m=new THREE.Mesh(new THREE.SphereGeometry(0.6,10,8),new THREE.MeshBasicMaterial({color:0xff6a1a}));m.position.set(e.x,heightAt(e.x,e.z)+2,e.z);scene.add(m);const dx=pl.x-e.x,dz=pl.z-e.z,d=Math.hypot(dx,dz)||1;projs.push({m,vx:dx/d*11,vz:dz/d*11,life:3,dmg:e.def.atk*0.8})}
function updateProj(dt){for(let i=projs.length-1;i>=0;i--){const p=projs[i];p.life-=dt;p.m.position.x+=p.vx*dt;p.m.position.z+=p.vz*dt;const gy=groundY(p.m.position.x,p.m.position.z)+1.2;p.m.position.y+=(gy-p.m.position.y)*Math.min(1,dt*3);
  if(Math.hypot(p.m.position.x-pl.x,p.m.position.z-pl.z)<1.3){hurtPlayer(p.dmg);burst(pl.x,pl.y+1,pl.z,0xff6a1a,14,5);p.life=0}
  if(p.life<=0){scene.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();projs.splice(i,1)}}}
function updateEnemies(dt){
  for(const e of enemies){
    if(e.dead){if(!e.boss){e.respawn-=dt;if(e.respawn<=0){e.dead=false;e.hp=e.max;e.x=e.hx;e.z=e.hz;e.model.visible=true}}continue}
    const dx=pl.x-e.x,dz=pl.z-e.z,d=Math.hypot(dx,dz);if(d>110)continue;
    e.cd-=dt;e.flash=Math.max(0,e.flash-dt);e.fb-=dt;if(e.fleeT>0)e.fleeT-=dt;
    let tx=0,tz=0,sp=0;const home=Math.hypot(e.hx-e.x,e.hz-e.z);
    if(e.def.passive){
      if(e.fleeT>0&&d>0.1){tx=-dx/d;tz=-dz/d;sp=e.def.spd*1.6}
      else{e.wt-=dt;if(e.wt<=0){e.wt=2+Math.random()*3;e.wd=Math.random()*6.283;e.walk=Math.random()<0.55}if(home>14){tx=(e.hx-e.x)/home;tz=(e.hz-e.z)/home;sp=e.def.spd*0.5}else if(e.walk){tx=Math.sin(e.wd);tz=Math.cos(e.wd);sp=e.def.spd*0.35}}
    }else if(d<e.aggro&&!G.dead&&!pl.sleeping&&Math.hypot(pl.x,pl.z)>34){
      if(d>e.reach){tx=dx/d;tz=dz/d;sp=e.def.spd}
      else if(e.cd<=0){e.cd=e.boss?1.6:1.25;e.lunge=0.25;hurtPlayer(e.def.atk*(0.85+Math.random()*0.3))}
      if(e.boss&&d>5&&d<18&&e.fb<=0){e.fb=3.5;spawnProj(e)}
    }else{
      e.wt-=dt;if(e.wt<=0){e.wt=2+Math.random()*3;e.wd=Math.random()*6.283;e.walk=Math.random()<0.6}
      if(home>14){tx=(e.hx-e.x)/home;tz=(e.hz-e.z)/home;sp=e.def.spd*0.6}else if(e.walk){tx=Math.sin(e.wd);tz=Math.cos(e.wd);sp=e.def.spd*0.35}
    }
    if(sp>0){const nx=e.x+tx*sp*dt,nz=e.z+tz*sp*dt;if(eOK(nx,e.z))e.x=nx;if(eOK(e.x,nz))e.z=nz;e.model.rotation.y=Math.atan2(tx,tz)}
    e.model.position.set(e.x,heightAt(e.x,e.z),e.z);
    if(e.lunge>0)e.lunge-=dt;e.model.scale.setScalar(e.def.size*(1+Math.max(0,e.lunge)*0.8));
    const mats=e.model.userData.mats;if(mats)for(const m of mats)m.emissive.setHex(e.flash>0?0xff3322:0x000000);
  }
}
function harvest(n){
  const dmg=(n.kind==='tree'&&has('axe'))?2:1;n.hp-=dmg;n.shake=0.2;burst(n.x,(n.obj.position.y||0)+1,n.z,n.kind==='tree'?0x6bbf4a:(n.kind==='sisal'?0x8aa84a:0xaaaaaa),5,3);AU.sfx('hit');
  if(n.hp<=0){n.dead=true;n.obj.visible=false;n.respawn=80;const got=[];for(const k of Object.keys(n.drop)){const a=n.drop[k];let c=rnd(a[0],a[1]);if(k==='wood'&&has('axe'))c+=1;if(c>0&&give(k,c))got.push('+'+c+' '+nm(k))}if(got.length)toast(got.join('  '),'#cfe9ff',1400);AU.sfx('pickup')}
}
function updateNodes(dt){for(const n of nodes){if(n.dead){n.respawn-=dt;if(n.respawn<=0){n.dead=false;n.hp=n.maxhp;n.obj.visible=true}}else if(n.shake>0){n.shake-=dt;n.obj.rotation.z=Math.sin(time*60)*0.3*n.shake;if(n.shake<=0)n.obj.rotation.z=0}}}
function attack(){
  if(pl.atkCd>0||G.dead||ui.panel||dlg||pl.sleeping||mode!=='play')return;
  pl.atkCd=0.4;pl.swing=0.3;pl.combo=pl.comboT>0?(pl.combo+1)%3:0;pl.comboT=1.0;AU.sfx('swing');
  let best=null,bd=7;for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-pl.x,e.z-pl.z);if(d<bd){bd=d;best=e}}
  if(best)pl.face=Math.atan2(best.x-pl.x,best.z-pl.z);
  slashFx();const range=3.4,power=atkPow()*(pl.combo===2?1.5:1);
  for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-pl.x,e.z-pl.z)-e.def.size*0.5;if(d<range&&Math.abs(angDiff(Math.atan2(e.x-pl.x,e.z-pl.z),pl.face))<1.1)dmgEnemy(e,power*(0.9+Math.random()*0.2))}
  for(const n of nodes){if(n.dead)continue;const d=Math.hypot(n.x-pl.x,n.z-pl.z);if(d<range+0.5&&Math.abs(angDiff(Math.atan2(n.x-pl.x,n.z-pl.z),pl.face))<1.2)harvest(n)}
}
function jump(){if(pl.jump||G.dead||ui.panel||dlg||pl.sleeping||mode!=='play')return;pl.jump=true;pl.vy=9}
function dash(){if(pl.dashCd>0||G.dead||ui.panel||dlg||pl.sleeping||mode!=='play'||G.energy<20)return;G.energy-=20;const dx=pl.moving?pl.ix:Math.sin(pl.face),dz=pl.moving?pl.iz:Math.cos(pl.face);pl.dx=dx;pl.dz=dz;pl.dashT=0.2;pl.inv=0.32;pl.dashCd=1.2;pl.face=Math.atan2(dx,dz);burst(pl.x,pl.y+1,pl.z,0x6fd6ff,16,4);AU.sfx('dash')}

// ================= player =================
const LIM=HALF-42;
function tryMove(nx,nz){
  if(Math.abs(nx)>LIM||Math.abs(nz)>LIM){if(pl.edgeT<=0){toast('A shimmering Nexus mist turns you back.','#bfe3ff',1800);pl.edgeT=3}return false}
  if(heightAt(nx,nz)<SEA-0.9&&town.floorAt(nx,nz)===null)return false;
  for(const c of town.colliders)if(nx>c.minx-0.45&&nx<c.maxx+0.45&&nz>c.minz-0.45&&nz<c.maxz+0.45)return false;
  for(const n of nodes){if(n.dead)continue;const dx=nx-n.x,dz=nz-n.z,rr=n.r+0.35;if(dx*dx+dz*dz<rr*rr)return false}
  return true;
}
let sprintHeld=false;
function updatePlayer(dt){
  let ix=mv.x,iy=mv.y;
  if(keys.KeyA||keys.ArrowLeft)ix-=1;if(keys.KeyD||keys.ArrowRight)ix+=1;if(keys.KeyW||keys.ArrowUp)iy+=1;if(keys.KeyS||keys.ArrowDown)iy-=1;
  const il=Math.hypot(ix,iy);if(il>1){ix/=il;iy/=il}
  const fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw),rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);
  let vx=fx*iy+rx*ix,vz=fz*iy+rz*ix;const mag=Math.hypot(vx,vz);pl.moving=mag>0.12;
  if(pl.moving){pl.ix=vx/mag;pl.iz=vz/mag}
  pl.sprinting=(sprintHeld||keys.ShiftRight)&&pl.moving&&G.energy>1;
  let sp=6.8*(pl.swing>0?0.75:1)*(pl.sprinting?1.65:1);
  if(pl.dashT>0){pl.dashT-=dt;vx=pl.dx*28;vz=pl.dz*28}else{vx*=sp;vz*=sp}
  if(pl.moving&&pl.dashT<=0)pl.face=lerpAng(pl.face,Math.atan2(vx,vz),Math.min(1,dt*14));
  const steps=Math.max(1,Math.ceil(Math.hypot(vx,vz)*dt/0.35));
  for(let s=0;s<steps;s++){const nx=pl.x+vx*dt/steps,nz=pl.z+vz*dt/steps;if(tryMove(nx,pl.z))pl.x=nx;if(tryMove(pl.x,nz))pl.z=nz}
  const gh=groundY(pl.x,pl.z);
  if(pl.jump){pl.vy-=24*dt;pl.y+=pl.vy*dt;if(pl.y<=gh){pl.y=gh;pl.vy=0;pl.jump=false}}else pl.y+=(gh-pl.y)*Math.min(1,dt*16);
  if(!isFinite(pl.x)||!isFinite(pl.z)||!isFinite(pl.y)||pl.y<gh-8){pl.x=pl.lx;pl.z=pl.lz;pl.y=groundY(pl.lx,pl.lz);pl.jump=false}
  else if(!pl.jump&&tryMove(pl.x,pl.z)){pl.lx=pl.x;pl.lz=pl.z}
  pl.atkCd-=dt;pl.swing-=dt;pl.comboT-=dt;pl.dashCd-=dt;pl.inv-=dt;pl.veil-=dt;pl.lastHit+=dt;pl.edgeT-=dt;
  for(let i=0;i<3;i++)skCd[i]=Math.max(0,skCd[i]-dt);
  if(pl.lastHit>5)G.hp=Math.min(maxHP(),G.hp+maxHP()*0.02*dt);
  G.nx=Math.min(maxNX(),G.nx+(4+G.lvl*0.4)*dt);
  updateSurvival(dt);updateTime(dt);
  town.roofs.forEach(r=>{const b=r.box;r.mesh.visible=!(pl.x>b.minx&&pl.x<b.maxx&&pl.z>b.minz&&pl.z<b.maxz)});
  pl.inside=town.roofs.some(r=>!r.mesh.visible);
  for(const w of town.wps){if(!G.wps[w.id]&&Math.hypot(pl.x-w.x,pl.z-w.z)<4.5){G.wps[w.id]=1;toast('Waypoint unlocked: '+w.name,'#6fd6ff',3000);AU.sfx('level');burst(w.x,w.y+2,w.z,0x6fd6ff,24,6);save()}}
}
function updateHero(dt){
  const h=hero;h.group.position.set(pl.x,pl.y,pl.z);h.group.rotation.y=pl.face;
  const w=pl.moving?Math.sin(time*(pl.sprinting?15:11))*0.8:0;h.legL.rotation.x=w;h.legR.rotation.x=-w;h.armL.rotation.x=-w*0.7;
  if(pl.swing>0){const s=1-pl.swing/0.3;h.armR.rotation.x=-0.3-Math.sin(s*Math.PI)*1.9;h.armR.rotation.z=(pl.combo%2?-0.7:0.7)*Math.sin(s*Math.PI)}else{h.armR.rotation.x=w*0.7-0.1;h.armR.rotation.z=0}
  h.cape.rotation.x=0.18+(pl.moving?0.35:0)+Math.sin(time*5)*0.05;
  if(pl.moving&&!pl.jump)h.group.position.y+=Math.abs(Math.sin(time*11))*0.06;
  h.group.visible=!(pl.dashT>0&&Math.floor(time*30)%2===0);
}
function updateCamera(dt){
  const inside=pl.inside,tp=inside?1.0:cam.pitch,td=inside?4.8:9;
  cam.dist+=(td-cam.dist)*Math.min(1,dt*5);cam.curP=cam.curP||tp;cam.curP+=(tp-cam.curP)*Math.min(1,dt*5);
  const tx=pl.x,ty=pl.y+1.7,tz=pl.z,cp=Math.cos(cam.curP),sp=Math.sin(cam.curP);
  let cx=tx+Math.sin(cam.yaw)*cp*cam.dist,cy=ty+sp*cam.dist,cz=tz+Math.cos(cam.yaw)*cp*cam.dist;
  cy=Math.max(cy,heightAt(cx,cz)+1.0);
  if(cam.shake>0){cam.shake-=dt;cx+=(Math.random()-0.5)*cam.shake;cy+=(Math.random()-0.5)*cam.shake}
  camera.position.set(cx,cy,cz);camera.lookAt(tx,ty,tz);
}
function updateArrow(){
  const q=QUESTS[G.quest],t=q&&q.tgt?q.tgt():null;
  if(!t||G.dead){arrow.visible=false;beacon.visible=false;return}
  const dx=t.x-pl.x,dz=t.z-pl.z,d=Math.hypot(dx,dz);
  arrow.visible=d>4;arrow.position.set(pl.x,pl.y+3.4+Math.sin(time*4)*0.15,pl.z);arrow.rotation.y=Math.atan2(dx,dz);
  beacon.visible=d>8;beacon.position.set(t.x,groundY(t.x,t.z)+30,t.z);
}
let hudT=0;
function setBar(id,v,m,label){$(id+'Fill').style.width=clamp(v/m*100,0,100)+'%';$(id+'Txt').textContent=label+' '+Math.round(v)}
function updateHud(dt){
  setBar('hp',G.hp,maxHP(),'HP');setBar('nx',G.nx,maxNX(),'Nexus');setBar('en',G.energy,100,'Energy');setBar('hg',G.hunger,100,'Hunger');setBar('th',G.thirst,100,'Thirst');setBar('ft',G.fatigue,100,'Fatigue');
  hudT-=dt;
  if(hudT<=0){hudT=0.25;
    const hh=Math.floor(G.hour),mm=Math.floor((G.hour-hh)*60),night=G.hour>=20||G.hour<5.5;
    $('where').innerHTML=`${(town.floorAt(pl.x,pl.z)!==null&&Math.hypot(pl.x,pl.z)<34)?'Dawnhold':BIOMES[biomeAt(pl.x,pl.z)].n}<br>Day ${G.day} ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')} ${night?'(night)':''}<br>Lv ${G.lvl} &middot; ${G.gold} gold`;
    const q=QUESTS[G.quest],t=q.tgt?q.tgt():null;let d='';if(t)d=Math.round(Math.hypot(t.x-pl.x,t.z-pl.z))+' m';
    $('obj').innerHTML=`<b>OBJECTIVE</b>${q.obj}${q.prog?`<div class='p'>${q.prog()}</div>`:''}${d?`<div class='d'>${d} away</div>`:''}`;
    const o=interactNow();$('prompt').textContent=o?'Use: '+o.label:'';$('prompt').classList.toggle('hidden',!o);$('btnUse').style.boxShadow=o?'0 0 14px 4px #ffd24a':'none';
    renderHotbar();
  }
  skBtns.forEach((b,i)=>{const s=ELEMENTS[G.element].skills[i];b.classList.toggle('lock',G.lvl<s.unlock);b.classList.toggle('cd',skCd[i]>0)});
  if(BOSS&&!BOSS.dead&&Math.hypot(BOSS.x-pl.x,BOSS.z-pl.z)<45){$('bossbar').classList.remove('hidden');$('bossName').textContent='Cinder Drake';$('bossFill').style.width=clamp(BOSS.hp/BOSS.max*100,0,100)+'%'}else $('bossbar').classList.add('hidden');
}
let qT=0,saveT=0;
function updatePlay(dt){
  const sim=!(ui.panel||dlg||G.dead||pl.sleeping);
  if(sim){updatePlayer(dt);updateEnemies(dt);updateProj(dt);updateNodes(dt);if(attackHeld)attack();
    qT-=dt;if(qT<=0){qT=0.5;checkQuest()}saveT+=dt;if(saveT>5){saveT=0;save()}}
  updateFx(dt);updateFloaters(dt);updateDlg(dt);updateHero(dt);updateCamera(dt);updateArrow();updateHud(dt);
  sun.position.set(pl.x+40,pl.y+65,pl.z+25);sun.target.position.set(pl.x,pl.y,pl.z);
}

// ================= title screen / start / boot =================
const SHOTS=[
 {a:[0,260,300],b:[0,115,160],l:[0,0,0],d:12},
 {a:[-34,24,44],b:[-12,17,32],l:[0,5,0],d:9},
 {a:[-130,34,66],b:[-102,22,44],l:[-86,6,10],d:9},
 {a:[132,36,-58],b:[106,24,-34],l:[92,4,-8],d:9},
 {a:[42,40,-72],b:[22,28,-92],l:[0,10,-110],d:9},
 {a:[-42,34,128],b:[-22,26,112],l:[0,6,100],d:9}
];
let shot=0,shotT=0,fading=false,tapped=false;
function enterTitle(){
  mode='title';AU.setMood(1);shot=0;shotT=0;fading=false;G.hour=9;applyLighting();
  sun.position.set(80,120,60);sun.target.position.set(0,0,0);
  $('title').classList.remove('hidden');document.body.classList.remove('play');
  const f=$('fade');f.style.transition='none';f.style.opacity=1;requestAnimationFrame(()=>requestAnimationFrame(()=>fadeTo(0,2400)));
}
function updateTitle(dt){
  shotT+=dt;let s=SHOTS[shot];
  if(!fading&&shotT>s.d-1.1){fading=true;const f=$('fade');f.style.transition='opacity 1.1s ease';f.style.opacity=1}
  if(shotT>=s.d){shot=shot===0?1:(shot%(SHOTS.length-1))+1;shotT=0;fading=false;s=SHOTS[shot];const f=$('fade');f.style.transition='opacity 1.3s ease';f.style.opacity=0}
  const k=clamp(shotT/s.d,0,1),e=k*k*(3-2*k);
  camera.position.set(s.a[0]+(s.b[0]-s.a[0])*e,s.a[1]+(s.b[1]-s.a[1])*e,s.a[2]+(s.b[2]-s.a[2])*e);camera.lookAt(s.l[0],s.l[1],s.l[2]);
}
const TIPS_L=['Sleep in a bed to recover, and keep an eye on hunger and thirst.','Waypoint stones let you travel quickly once discovered.','Every chest in Dawnhold hides something different.','Craft an axe first. Planks need one.','Nexus energy powers your elemental abilities.'];
async function startGame(cont){
  if(mode!=='title')return;mode='loading';
  await fadeTo(1,900);
  $('title').classList.add('hidden');const ld=$('loading');ld.classList.remove('hidden');$('loadTip').textContent=TIPS_L[rnd(0,TIPS_L.length-1)];
  const lb=$('loadBar');lb.style.width='0%';
  if(cont&&loadSave()){}else{cont=false;resetGame()}
  setupWorldState(cont);
  fadeTo(0,600);
  for(let i=1;i<=10;i++){lb.style.width=i*10+'%';await sleep(230)}
  await fadeTo(1,700);ld.classList.add('hidden');
  document.body.classList.add('play');hero.group.visible=true;AU.setMood(0.6);
  mode='play';
  const ch=$('chapter');ch.innerHTML=`<div class='c1'>CHAPTER I</div><div class='c2'>The Failing Nexus</div>`;ch.classList.remove('hidden');
  await fadeTo(0,1600);setTimeout(()=>ch.classList.add('hidden'),2600);
  if(!cont){setTimeout(()=>toast('Left stick: move. Drag the right side of the screen: look around.','#ffffff',3600),3200);setTimeout(()=>toast('Strike attacks. Use talks and opens things. Dash is a quick flash step.','#ffffff',3800),7200);setTimeout(()=>toast('Watch hunger, thirst and fatigue. Sleep in a bed when tired.','#ffffff',3800),11400)}
}
function setupWorldState(cont){
  if(G.hunger==null)G.hunger=100;if(G.thirst==null)G.thirst=100;if(G.fatigue==null)G.fatigue=0;if(G.hour==null)G.hour=8.5;if(G.day==null)G.day=1;if(G.bag==null)G.bag=0;if(!G.shelves)G.shelves={};
  G.energy=100;
  if(!cont){G.hp=maxHP();G.nx=maxNX();G.x=0;G.z=18}
  if(!(G.hp>=1))G.hp=maxHP();
  pl.x=G.x;pl.z=G.z;pl.edgeT=0;
  if(!tryMove(pl.x,pl.z)){const p=town.wps[0];pl.x=p.x+2;pl.z=p.z+2}
  pl.y=groundY(pl.x,pl.z);pl.vy=0;pl.jump=false;pl.face=Math.PI;pl.lx=pl.x;pl.lz=pl.z;pl.dashT=0;pl.inv=0;pl.sleeping=false;pl.lastHit=99;pl.swing=0;
  cam.yaw=0;cam.pitch=0.5;cam.dist=9;cam.curP=0.5;
  enemies.forEach(e=>{e.dead=false;e.hp=e.max;e.x=e.hx;e.z=e.hz;e.model.visible=true;e.model.scale.setScalar(e.def.size);e.fleeT=0;if(e.boss&&G.bossDead){e.dead=true;e.model.visible=false}});
  nodes.forEach(n=>{n.dead=false;n.hp=n.maxhp;n.obj.visible=true});
  town.chests.forEach(c=>{c.opened=!!G.chests[c.id];c.pivot.rotation.x=c.opened?-1.2:0;c.spark.visible=!c.opened});
  applyBlade();buildSkillButtons();applyLighting();hbKey='';
}

// ================= input =================
const stick=$('stick'),knob=$('knob');let stickId=null;
function moveStick(e){const r=stick.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const m=Math.hypot(dx,dy),max=r.width/2-8;if(m>max){dx*=max/m;dy*=max/m}knob.style.transform=`translate(${dx}px,${dy}px)`;mv.x=dx/max;mv.y=-dy/max}
function endStick(e){if(e.pointerId!==stickId)return;stickId=null;mv.x=mv.y=0;knob.style.transform='translate(0,0)'}
stick.addEventListener('pointerdown',e=>{e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e)});
stick.addEventListener('pointermove',e=>{if(e.pointerId===stickId)moveStick(e)});
stick.addEventListener('pointerup',endStick);stick.addEventListener('pointercancel',endStick);
let lookId=null,lx=0,ly=0;
canvas.addEventListener('pointerdown',e=>{if(mode!=='play'||lookId!==null)return;lookId=e.pointerId;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(e.pointerId!==lookId)return;cam.yaw-=(e.clientX-lx)*0.006;cam.pitch=clamp(cam.pitch+(e.clientY-ly)*0.004,0.15,1.2);lx=e.clientX;ly=e.clientY});
['pointerup','pointercancel'].forEach(t=>canvas.addEventListener(t,e=>{if(e.pointerId===lookId)lookId=null}));
const hold=(id,on,off)=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();on()});['pointerup','pointercancel','pointerleave'].forEach(t=>b.addEventListener(t,()=>{if(off)off()}))};
hold('btnAtk',()=>{attackHeld=true;attack()},()=>{attackHeld=false});
hold('btnUse',useAction);hold('btnJump',jump);hold('btnDash',dash);
hold('btnSprint',()=>{sprintHeld=true},()=>{sprintHeld=false});
$('btnBag').addEventListener('pointerdown',e=>{e.stopPropagation();if(mode!=='play'||G.dead||pl.sleeping)return;ui.panel?closePanel():bagPanel()});
window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(mode!=='play')return;
  if(e.code==='Space')jump();if(e.code==='KeyJ')attack();if(e.code==='KeyE')useAction();if(e.code==='ShiftLeft')dash();
  if(e.code==='Digit1')castSkill(0);if(e.code==='Digit2')castSkill(1);if(e.code==='Digit3')castSkill(2);if(e.code==='KeyB')ui.panel?closePanel():bagPanel()});
window.addEventListener('keyup',e=>{keys[e.code]=false});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')save()});
$('title').addEventListener('pointerdown',()=>{if(tapped)return;tapped=true;AU.initAudio();AU.startMusic();$('tap').classList.add('hidden');$('menu').classList.remove('hidden');$('mCont').style.display=hasSave()?'block':'none'});
$('mNew').addEventListener('click',()=>{AU.sfx('ui');if(hasSave()&&!confirm('Start a new game? This erases your saved progress.'))return;startGame(false)});
$('mCont').addEventListener('click',()=>{AU.sfx('ui');startGame(true)});
function syncSettings(){$('sMusic').value=Math.round(AU.settings.music*100);$('sSfx').value=Math.round(AU.settings.sfx*100);$('sQual').textContent=AU.settings.hi?'High':'Low'}
$('mSet').addEventListener('click',()=>{AU.sfx('ui');syncSettings();$('menu').classList.add('hidden');$('setbox').classList.remove('hidden')});
$('sBack').addEventListener('click',()=>{AU.sfx('ui');$('setbox').classList.add('hidden');$('menu').classList.remove('hidden')});
$('sMusic').addEventListener('input',e=>{AU.settings.music=e.target.value/100;AU.setVolumes()});
$('sSfx').addEventListener('input',e=>{AU.settings.sfx=e.target.value/100;AU.setVolumes()});
$('sQual').addEventListener('click',()=>{AU.settings.hi=!AU.settings.hi;AU.saveSettings();applyQuality();syncSettings()});

// ================= main loop =================
let last=performance.now();
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min(0.05,(now-last)/1000);last=now;time+=dt;
  if(mode==='title')updateTitle(dt);else if(mode==='play')updatePlay(dt);
  if(town)town.spinners.forEach(s=>{s.o.rotation.y+=dt*1.2;if(s.bob)s.o.position.y=s.by+Math.sin(time*2+s.o.position.x)*0.15});
  clouds.forEach(c=>{c.position.x+=dt*1.5;if(c.position.x>360)c.position.x=-360});
  sky.position.copy(camera.position);
  if(mode!=='boot')renderer.render(scene,camera);
}
async function boot(){
  resize();const bb=$('bootBar'),txt=$('bootTxt');
  try{await buildWorld((p,t)=>{bb.style.width=p+'%';txt.textContent=t})}catch(err){txt.textContent='Something went wrong: '+err.message;console.error(err);return}
  $('boot').classList.add('hidden');enterTitle();requestAnimationFrame(loop);
}
boot();
