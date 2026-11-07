// REBORN BEYOND - Stage 2: playable life loop (original content)
(function(){
const st=document.createElement('style');
st.textContent=`.scroll{overflow-y:auto;height:100%;padding-bottom:20px}.hud{margin:8px;background:#15162a;border:2px solid #2d2f5a;border-radius:16px;padding:10px}.who{font-size:16px;margin-bottom:6px}.pe{font-size:34px;vertical-align:middle}.bar{height:9px;background:#222544;border-radius:6px;overflow:hidden;margin:3px 0 6px}.bar i{display:block;height:100%;border-radius:6px}.b-hp i{background:#3ddc97}.b-en i{background:#4cc9f0}.b-xp i{background:#f5c542}.b-love i{background:#ff6fa5}.lbl{font-size:12px;opacity:.85}.log{margin:8px;background:#0e0e1d;border:2px solid #2d2f5a;border-radius:12px;padding:8px;font-size:14px;min-height:64px}.log p{margin:3px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 8px}.grid .btn{min-width:0;margin:0;font-size:15px;padding:12px 6px}.bf{position:relative;height:290px;margin:8px;border-radius:16px;overflow:hidden;background:linear-gradient(#2a1b5e,#0b0b14 75%);border:2px solid #3b3d7a}.foe{position:absolute;right:6%;top:8%;text-align:center}.me{position:absolute;left:5%;bottom:4%;text-align:center}.spr{font-size:76px;animation:bob 1.7s ease-in-out infinite;filter:drop-shadow(0 0 12px #7c5cff)}.me .spr{font-size:88px}@keyframes bob{50%{transform:translateY(-8px)}}.box{background:#15162ae6;border:2px solid #3b3d7a;border-radius:10px;padding:5px 9px;font-size:13px;min-width:150px;text-align:left}.row2{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 8px;background:#15162a;border:2px solid #2d2f5a;border-radius:12px;padding:8px 10px;font-size:14px}.row2 .btn{min-width:0;margin:0 0 0 4px;padding:8px 12px;font-size:14px}h3{margin:10px 8px 4px;color:#f5c542}.sm{font-size:12px;opacity:.75}`;
document.head.appendChild(st);

const FORMS={
human:{name:'Reborn Human',emoji:'🧑',hp:40,pow:6,life:70,skill:'Blade Surge',evo:[{name:'Hero of Dawn',emoji:'🦸',hpx:1.5,powx:1.5,skill:'Radiant Slash'},{name:'Archmage',emoji:'🧙',hpx:1.2,powx:1.9,skill:'Arcane Nova'}]},
slime:{name:'Tiny Slime',emoji:'🟢',hp:55,pow:4,life:90,skill:'Acid Splash',evo:[{name:'Great Slime',emoji:'🫧',hpx:1.9,powx:1.3,skill:'Absorb Wave'},{name:'Devourer Slime',emoji:'🟣',hpx:1.3,powx:1.8,skill:'Devour'}]},
dragon:{name:'Dragon Hatchling',emoji:'🦎',hp:35,pow:5,life:150,skill:'Ember Breath',evo:[{name:'Young Drake',emoji:'🐲',hpx:1.6,powx:1.6,skill:'Flame Roar'},{name:'Storm Wyrm',emoji:'🐉',hpx:1.3,powx:1.9,skill:'Thunder Breath'}]},
spider:{name:'Spiderling',emoji:'🕷️',hp:30,pow:7,life:80,skill:'Venom Bite',evo:[{name:'Web Weaver',emoji:'🕸️',hpx:1.4,powx:1.6,skill:'Silk Snare'},{name:'Venom Queen',emoji:'🦂',hpx:1.2,powx:2,skill:'Death Sting'}]},
vending:{name:'Vending Machine',emoji:'🥫',hp:70,pow:3,life:120,skill:'Can Barrage',evo:[{name:'Mecha Vendor',emoji:'🤖',hpx:1.8,powx:1.5,skill:'Rocket Dispense'},{name:'Snack Deity',emoji:'🍩',hpx:1.4,powx:1.9,skill:'Divine Combo'}]}
};
const WORLDS=[
{n:'Verdant Plains',min:1,cost:0,mons:[['Goblin','👺',20,4],['Wild Wolf','🐺',24,5],['Giant Rat','🐀',14,3]]},
{n:'Ashen Kingdom',min:5,cost:80,mons:[['Fire Imp','👹',55,10],['Lava Golem','🪨',80,12],['Hellhound','🔥',60,11]]},
{n:'Frozen Abyss',min:10,cost:200,mons:[['Ice Wraith','👻',120,18],['Yeti','🦍',150,20],['Frost Wyrm','🐲',200,24]]},
{n:'Sky Citadel',min:15,cost:500,mons:[['Storm Harpy','🦅',260,30],['Angel Knight','🛡️',320,34],['Sky Dragon','🐉',450,40]]}
];
const CH={
aria:{n:'Aria, Goddess of Dawn',e:'✨',lines:['Aria smiles: your light grows brighter each year.','Aria hums a gentle hymn just for you.'],boon:'Blessing of Dawn (+20 max HP)',f:()=>{P.maxhp+=20;P.hp+=20}},
nyx:{n:'Nyx, Goddess of Night',e:'🌙',lines:['Nyx smirks: so you are the one who keeps surviving.','Nyx lets you rest under her starry cloak.'],boon:'Night Pact (+4 power)',f:()=>{P.pow+=4}},
elowen:{n:'Elowen, Elf Knight',e:'🏹',lines:['Elowen trains with you until sunset.','Elowen laughs and tells you a tale of her homeland.'],boon:'Elven Oath (+10 max energy)',f:()=>{P.maxen+=10}}
};
const SHOP=[
{n:'Healing Elixir (full HP)',c:20,f:()=>{P.hp=P.maxhp}},
{n:'Mana Fruit (full energy)',c:15,f:()=>{P.en=P.maxen}},
{n:'Power Rune (+3 power)',c:60,f:()=>{P.pow+=3}},
{n:'Soul Spa, isekai Botox (+10 max HP)',c:50,f:()=>{P.maxhp+=10;P.hp+=10}}
];

let P=null,B=null,view='hub',msg=[];
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[Math.floor(Math.random()*a.length)];
function save(){try{localStorage.setItem('rb_save',JSON.stringify(P))}catch(e){}}
function load(){try{return JSON.parse(localStorage.getItem('rb_save'))}catch(e){return null}}
function say(t){msg.unshift(t);msg=msg.slice(0,4)}
function pAtk(){return P.pow+P.lvl*2+P.fam.reduce((a,f)=>a+f.b,0)}
function bar(c,v,m,l){return `<div class='lbl'>${l} ${Math.max(0,Math.round(v))}/${m}</div><div class='bar b-${c}'><i style='width:${Math.max(0,Math.min(100,v/m*100))}%'></i></div>`}
function b(a,t,v,cls){return `<button class='btn ${cls||''}' data-a='${a}' ${v!==undefined?`data-v='${v}'`:''}>${t}</button>`}

function newLife(prev){
const k=pick(Object.keys(FORMS)),f=FORMS[k];
const legacy=prev?prev.legacy:0,lives=prev?prev.lives+1:1;
P={key:k,title:f.name,emoji:k==='human'?(state.gender==='female'?'👩':'👨'):f.emoji,age:0,lvl:1,xp:0,stage:0,maxhp:f.hp,hp:f.hp,maxen:60,en:60,pow:f.pow+legacy,gold:10,skill:f.skill,world:0,fam:[],love:{aria:0,nyx:0,elowen:0},boon:{},legacy:legacy,lives:lives,life:f.life};
msg=[];B=null;view='reveal';save();render();
}
function lvlUp(l){
while(P.xp>=P.lvl*20){P.xp-=P.lvl*20;P.lvl++;P.maxhp+=8;P.pow+=2;P.maxen+=2;P.hp=P.maxhp;l.push('LEVEL UP! Lv '+P.lvl+(P.lvl===10?' - you can EVOLVE!':''))}
return l;
}
function addLove(k,n){P.love[k]+=n;if(P.love[k]>=10&&!P.boon[k]){P.boon[k]=1;CH[k].f();say('Bond complete with '+CH[k].n+': '+CH[k].boon)}}
function need(n){if(P.en<n){say('Too tired! You need '+n+' energy. Rest first.');render();return false}return true}
function die(why){P.deathWhy=why;P.hp=0;P.legacy+=2;B=null;view='dead';save();render()}

function startBattle(dun){
const w=WORLDS[P.world],m=pick(w.mons),s=1+P.lvl*0.04;
B={n:m[0],e:m[1],maxhp:Math.round(m[2]*s*(dun?1.8:1)),atk:Math.round(m[3]*s*(dun?1.3:1)),dun:dun,guard:false,log:['A wild '+m[0]+' appears!']};
B.hp=B.maxhp;view='battle';render();
}
function win(l){
const w=P.world+1,xp=Math.round((10+w*8)*(B.dun?2.5:1)),g=Math.floor(rnd(4,12)*w*(B.dun?2.5:1));
P.xp+=xp;P.gold+=g;l.push('Victory! +'+xp+' XP, +'+g+' gold.');
if(P.fam.length<6&&Math.random()<(B.dun?0.4:0.22)){const f={n:'Baby '+B.n,e:B.e,b:1+P.world};P.fam.push(f);l.push(f.e+' '+f.n+' becomes your familiar!')}
lvlUp(l);B=null;say(l.join(' '));view='hub';save();render();
}
function act(a){
if(!B)return;const l=[];
if(a==='run'){if(Math.random()<0.55){say('You escaped!');B=null;view='hub';save();return render()}l.push('Could not escape!')}
else if(a==='guard'){B.guard=true;l.push('You brace for impact.')}
else{
let mult=1;
if(a==='skill'){if(P.en<10){B.log=['Not enough energy!'];return render()}P.en-=10;mult=1.4+Math.min(P.lvl,10)*0.12}
const dmg=Math.max(1,Math.round(pAtk()*mult*(0.8+Math.random()*0.4)));
B.hp-=dmg;l.push((a==='skill'?P.skill:'Strike')+'! '+dmg+' damage.');
P.fam.forEach(f=>{if(Math.random()<0.5&&B.hp>0){const d=f.b*2;B.hp-=d;l.push(f.e+' '+f.n+' hits for '+d+'.')}});
}
if(B.hp<=0)return win(l);
let d=Math.max(1,Math.round(B.atk*(0.8+Math.random()*0.4)));
if(B.guard){d=Math.ceil(d/2);B.guard=false}
P.hp-=d;l.push(B.n+' hits you for '+d+'.');
B.log=l;
if(P.hp<=0)return die('slain by '+B.n);
render();
}
function yearPass(){
P.age++;P.en=Math.min(P.maxen,P.en+25);P.gold+=rnd(0,3);
const ev=pick([
()=>{const g=rnd(10,40);P.gold+=g;return 'You found a pouch of '+g+' gold.'},
()=>{const d=rnd(5,12);P.hp=Math.max(1,P.hp-d);return 'A strange fever hits you (-'+d+' HP).'},
()=>{const x=rnd(8,20);P.xp+=x;const l=lvlUp([]);return 'A wandering sage teaches you a trick (+'+x+' XP). '+l.join(' ')},
()=>{const k=pick(['aria','nyx','elowen']);addLove(k,1);return CH[k].n+' appears in your dreams. (+1 bond)'},
()=>'A quiet year passes in this strange world.',
()=>{P.hp=Math.min(P.maxhp,P.hp+15);return 'A hot spring heals your wounds.'}
]);
say('Age '+P.age+': '+ev());
if(P.age>=P.life)return die('old age');
save();render();
}

const ACT={
begin(){view='hub';say('You open your eyes in a new world. Train, hunt and grow strong!');render()},
year(){yearPass()},
rest(){P.en=P.maxen;P.hp=Math.min(P.maxhp,P.hp+Math.round(P.maxhp*0.6));P.age++;say('You rested for a year. Energy restored, wounds healed. Age '+P.age+'.');if(P.age>=P.life)return die('old age');save();render()},
train(){if(!need(15))return;P.en-=15;const x=rnd(8,14);P.xp+=x;const l=['You train hard (+'+x+' XP).'];if(Math.random()<0.2){P.pow++;l.push('+1 power!')}lvlUp(l);say(l.join(' '));save();render()},
hunt(){if(!need(20))return;P.en-=20;startBattle(false)},
dungeon(){if(!need(35))return;P.en-=35;startBattle(true)},
atk(v){act(v)},
menu(v){view=v;render()},
buy(i){const it=SHOP[i];if(P.gold<it.c){say('Not enough gold.')}else{P.gold-=it.c;it.f();say('Bought '+it.n+'.')}save();render()},
travel(i){const w=WORLDS[i];if(P.lvl<w.min){say('You need level '+w.min+'.')}else if(P.gold<w.cost){say('You need '+w.cost+' gold.')}else{P.gold-=w.cost;P.world=i;say('You travel to '+w.n+'!');view='hub'}save();render()},
talk(k){if(!need(5))return;P.en-=5;addLove(k,1);say(pick(CH[k].lines)+' (+1 bond)');save();render()},
gift(k){if(P.gold<30){say('Not enough gold for a gift.')}else{P.gold-=30;addLove(k,3);say('Your gift delights '+CH[k].n+'! (+3 bond)')}save();render()},
evo(i){const o=evoOpts()[i];P.stage++;P.title=o.name;P.emoji=o.emoji;P.maxhp=Math.round(P.maxhp*o.hpx);P.hp=P.maxhp;P.pow=Math.round(P.pow*o.powx);P.skill=o.skill;P.lvl=1;P.xp=0;say('You evolved into '+o.name+'! Level reset to 1, but you are far stronger.');view='hub';save();render()},
reborn(){newLife(P)},
reset(){if(confirm('Erase all progress?')){try{localStorage.removeItem('rb_save')}catch(e){}location.reload()}}
};
function evoOpts(){return P.stage===0?FORMS[P.key].evo:[{name:'Ascended '+P.title,emoji:P.emoji,hpx:1.6,powx:1.6,skill:P.skill+' II'}]}

function hubV(){
return `<div class='scroll'><div class='hud'><div class='who'><span class='pe'>${P.emoji}</span> <b>${P.title}</b> &middot; Age ${P.age} &middot; Life ${P.lives}</div>${bar('hp',P.hp,P.maxhp,'HP')}${bar('en',P.en,P.maxen,'Energy')}${bar('xp',P.xp,P.lvl*20,'XP')}<div class='lbl'>Lv ${P.lvl} &middot; Power ${pAtk()} &middot; ${P.gold} gold &middot; ${WORLDS[P.world].n}</div></div><div class='log'>${msg.map(m=>'<p>'+m+'</p>').join('')||'<p>Your new life begins...</p>'}</div>${P.lvl>=10?`<div style='padding:0 8px 8px'>${b('menu','EVOLVE!','evo','alt')}</div>`:''}<div class='grid'>${b('train','Train (-15 EN)')}${b('hunt','Hunt (-20 EN)')}${b('dungeon','Dungeon (-35 EN)')}${b('rest','Rest (1 year)')}${b('year','Next Year')}${b('menu','Isekai Shop','shop')}${b('menu','Travel Worlds','travel')}${b('menu','Bonds','love')}${b('menu','Familiars','fam')}${b('reset','Reset game','','alt')}</div></div>`;
}
function battleV(){
return `<div class='scroll'><div class='bf'><div class='foe'><div class='box'><b>${B.n}</b>${bar('hp',B.hp,B.maxhp,'HP')}</div><div class='spr'>${B.e}</div></div><div class='me'><div class='spr'>${P.emoji}</div><div class='box'><b>${P.title}</b> Lv${P.lvl}${bar('hp',P.hp,P.maxhp,'HP')}${bar('en',P.en,P.maxen,'EN')}</div></div></div><div class='log'>${B.log.map(m=>'<p>'+m+'</p>').join('')}</div><div class='grid'>${b('atk','Attack','strike')}${b('atk',P.skill+' (10 EN)','skill')}${b('atk','Guard','guard')}${b('atk','Run','run','alt')}</div></div>`;
}
function shopV(){
return `<div class='scroll'><h3>Isekai Shop</h3><div class='sm' style='margin:0 8px'>You have ${P.gold} gold</div>${SHOP.map((it,i)=>`<div class='row2'><span>${it.n}<br><span class='sm'>${it.c} gold</span></span>${b('buy','Buy',i)}</div>`).join('')}<div class='log'>${msg.map(m=>'<p>'+m+'</p>').join('')}</div><div style='padding:8px'>${b('menu','Back','hub')}</div></div>`;
}
function travelV(){
return `<div class='scroll'><h3>Travel to another world</h3>${WORLDS.map((w,i)=>`<div class='row2'><span>${w.n}${i===P.world?' (here)':''}<br><span class='sm'>Lv ${w.min}+ &middot; ${w.cost} gold</span></span>${i===P.world?'':b('travel','Go',i)}</div>`).join('')}<div class='log'>${msg.map(m=>'<p>'+m+'</p>').join('')}</div><div style='padding:8px'>${b('menu','Back','hub')}</div></div>`;
}
function loveV(){
return `<div class='scroll'><h3>Bonds</h3>${Object.keys(CH).map(k=>`<div class='row2' style='display:block'><b>${CH[k].e} ${CH[k].n}</b>${bar('love',Math.min(10,P.love[k]),10,'Bond')}<div class='sm'>${P.boon[k]?'Unlocked: '+CH[k].boon:'Reach 10 for: '+CH[k].boon}</div><div style='margin-top:6px'>${b('talk','Talk (-5 EN)',k)}${b('gift','Gift (30g)',k)}</div></div>`).join('')}<div class='log'>${msg.map(m=>'<p>'+m+'</p>').join('')}</div><div style='padding:8px'>${b('menu','Back','hub')}</div></div>`;
}
function famV(){
return `<div class='scroll'><h3>Familiars (${P.fam.length}/6)</h3>${P.fam.length?P.fam.map(f=>`<div class='row2'><span>${f.e} ${f.n}</span><span class='sm'>+${f.b} power</span></div>`).join(''):`<div class='row2'>No familiars yet. Defeat monsters and you may tame one!</div>`}<div style='padding:8px'>${b('menu','Back','hub')}</div></div>`;
}
function evoV(){
return `<div class='scroll'><h3>Choose your evolution</h3><div class='sm' style='margin:0 8px'>Your level resets to 1, but you gain great power.</div>${evoOpts().map((o,i)=>`<div class='row2'><span style='font-size:30px'>${o.emoji}</span><span>${o.name}<br><span class='sm'>Skill: ${o.skill}</span></span>${b('evo','Evolve',i)}</div>`).join('')}<div style='padding:8px'>${b('menu','Not yet','hub')}</div></div>`;
}
function revealV(){
return `<div class='center'><div class='spr' style='font-size:110px'>${P.emoji}</div><h1 style='color:var(--gold)'>Reborn as: ${P.title}</h1><p>HP ${P.maxhp} &middot; Power ${P.pow}${P.legacy?'<br>Legacy bonus: +'+P.legacy+' power from past lives':''}</p>${b('begin','Begin Life')}</div>`;
}
function deadV(){
return `<div class='center'><div style='font-size:90px'>💀</div><h1 style='color:var(--red)'>You died</h1><p>${P.deathWhy} at age ${P.age}.<br>Your soul grows stronger: +2 power in every future life.</p>${b('reborn','Reincarnate')}</div>`;
}
function render(){
const V={hub:hubV,battle:battleV,shop:shopV,travel:travelV,love:loveV,fam:famV,evo:evoV,reveal:revealV,dead:deadV};
screen.innerHTML=V[view]();
}
screen.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;const f=ACT[t.dataset.a];if(f)f(t.dataset.v)});
window.showStageEnd=function(){const s=load();if(s){P=s;msg=[];view=P.hp<=0?'dead':'hub';render()}else newLife(null)};
})();
