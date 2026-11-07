// REBORN BEYOND - Stage 2: life loop (original content)
const FORMS = [
  {id:'human', name:'Human Wanderer', emoji:'🧑', hp:30, atk:6, def:4, spd:5, perk:'Balanced and adaptable'},
  {id:'slime', name:'Slime', emoji:'🟢', hp:40, atk:3, def:3, spd:4, perk:'Can absorb and copy a skill from defeated foes'},
  {id:'dragon', name:'Dragon Hatchling', emoji:'🐉', hp:24, atk:5, def:5, spd:4, perk:'Weak now, terrifying later'},
  {id:'spider', name:'Cave Spider', emoji:'🕷️', hp:22, atk:6, def:3, spd:8, perk:'Fast, venomous and sneaky'},
  {id:'vending', name:'Vending Machine', emoji:'🥤', hp:50, atk:2, def:9, spd:1, perk:'Sells snacks and cannot be pushed around'},
  {id:'sword', name:'Sentient Sword', emoji:'🗡️', hp:26, atk:9, def:4, spd:3, perk:'Needs a wielder and talks a lot'},
  {id:'villain', name:'Villainess/Villain', emoji:'😈', hp:28, atk:7, def:4, spd:6, perk:'Doomed by the story, ready to rewrite it'}
];
const START_EVENTS = [
  {t:'A goddess appears and apologises for the paperwork mix-up. She grants you a gift.', fx:{xp:15,luck:1}},
  {t:'You wake in a quiet forest. Strange glowing mushrooms surround you.', fx:{energy:0}},
  {t:'A village elder finds you and says an old prophecy mentioned your kind.', fx:{xp:10}}
];
const EVENTS = [
  {t:'You help villagers fix a bridge.', fx:{xp:12,gold:5}, e:-15},
  {t:'A goblin pack ambushes the road. You barely escape.', fx:{xp:20,hp:-6}, e:-20},
  {t:'You find a hidden shrine and pray. A goddess whispers your name.', fx:{xp:18,luck:1}, e:-10},
  {t:'A traveling merchant sells you a strange charm.', fx:{gold:-10,luck:1}, e:-5},
  {t:'You train until sunset in a mossy clearing.', fx:{xp:25,atk:1}, e:-25},
  {t:'A mysterious rival challenges you to a staring contest. You win.', fx:{xp:8}, e:-5},
  {t:'You wander into a ruin and trigger a trap.', fx:{hp:-10,xp:15}, e:-20},
  {t:'Rain pours all day. You rest in a cave.', fx:{hp:6}, e:10},
  {t:'You help a lost child find their way home. The town cheers.', fx:{xp:14,gold:8}, e:-10},
  {t:'A guild recruiter notices your potential.', fx:{xp:16,gold:5}, e:-8}
];
const SHOP = [
  {n:'Healing Potion', c:15, fx:{hp:20}, d:'+20 HP'},
  {n:'Energy Drink of Valor', c:12, fx:{energy:30}, d:'+30 energy'},
  {n:'Training Scroll', c:30, fx:{xp:40}, d:'+40 XP'},
  {n:'Lucky Clover Charm', c:25, fx:{luck:2}, d:'+2 luck'}
];
let G = null;
function newLife(){
  const f = FORMS[Math.floor(Math.random()*FORMS.length)];
  const name = (state.gender === 'female' ? ['Yuna','Mira','Kaede','Sora'] : ['Ren','Kai','Haru','Taro'])[Math.floor(Math.random()*4)];
  G = {form:f, name, age:0, lvl:1, xp:0, hp:f.hp, maxhp:f.hp, atk:f.atk, def:f.def, spd:f.spd, energy:100, gold:20, luck:1, log:[]};
}
function lvlNeed(){ return 40 + G.lvl * 25; }
function applyFx(fx){
  if(!fx) return;
  if(fx.xp) G.xp += fx.xp;
  if(fx.gold) G.gold = Math.max(0, G.gold + fx.gold);
  if(fx.luck) G.luck += fx.luck;
  if(fx.atk) G.atk += fx.atk;
  if(fx.hp) G.hp = Math.min(G.maxhp, Math.max(0, G.hp + fx.hp));
  if(fx.energy) G.energy = Math.min(100, Math.max(0, G.energy + fx.energy));
  while(G.xp >= lvlNeed()){ G.xp -= lvlNeed(); G.lvl++; G.maxhp += 6; G.hp = G.maxhp; G.atk += 1; G.def += 1; G.log.unshift('LEVEL UP! You are now level ' + G.lvl + '.'); }
}
function bar(v, max, color){ return `<div style="background:#222;border-radius:8px;height:12px;overflow:hidden"><div style="height:100%;width:${Math.max(0, Math.min(100, v/max*100))}%;background:${color}"></div></div>`; }
function showGame(){
  if(!G){ newLife(); const s = START_EVENTS[Math.floor(Math.random()*START_EVENTS.length)]; G.log.unshift('You were reborn as a ' + G.form.name + '. ' + G.form.perk + '.'); G.log.unshift(s.t); applyFx(s.fx); }
  const logHtml = G.log.slice(0, 6).map(l => `<div style="padding:6px 0;border-bottom:1px solid #2d2f5a;font-size:14px">${l}</div>`).join('');
  screen.innerHTML = `<div style="padding:12px;overflow:auto;height:100%">
    <div class="card"><div style="font-size:46px;text-align:center">${G.form.emoji}</div>
      <h2 style="text-align:center">${G.name} the ${G.form.name}</h2>
      <div style="text-align:center;opacity:.8">Age ${G.age} | Level ${G.lvl} | Gold ${G.gold}</div>
      <div style="margin-top:8px">HP ${G.hp}/${G.maxhp}${bar(G.hp,G.maxhp,'#3ddc97')}</div>
      <div style="margin-top:6px">Energy ${G.energy}/100${bar(G.energy,100,'#4cc9f0')}</div>
      <div style="margin-top:6px">XP ${G.xp}/${lvlNeed()}${bar(G.xp,lvlNeed(),'#f5c542')}</div>
      <div style="margin-top:8px;font-size:13px">ATK ${G.atk}  DEF ${G.def}  SPD ${G.spd}  LUCK ${G.luck}</div></div>
    <div class="card">${logHtml || 'Your story begins...'}</div>
    <div class="row">
      <button class="btn" id="bAge">Age up</button>
      <button class="btn" id="bTrain">Train (-25 energy)</button>
      <button class="btn" id="bRest">Rest</button>
      <button class="btn alt" id="bMenu">Isekai menu</button>
    </div></div>`;
  document.getElementById('bAge').onclick = ageUp;
  document.getElementById('bTrain').onclick = train;
  document.getElementById('bRest').onclick = rest;
  document.getElementById('bMenu').onclick = showMenu;
}
function ageUp(){
  if(G.energy < 10){ G.log.unshift('You are too exhausted to adventure. Rest first.'); return showGame(); }
  const ev = EVENTS[Math.floor(Math.random()*EVENTS.length)];
  G.age++; G.log.unshift('Age ' + G.age + ': ' + ev.t);
  applyFx(ev.fx); G.energy = Math.max(0, Math.min(100, G.energy + (ev.e || 0)));
  if(G.hp <= 0){ return showDeathEnd(); }
  showGame();
}
function train(){
  if(G.energy < 25){ G.log.unshift('Not enough energy to train. Rest first.'); return showGame(); }
  G.energy -= 25; G.log.unshift('You trained hard. +XP'); applyFx({xp: 20 + G.luck}); showGame();
}
function rest(){ G.energy = Math.min(100, G.energy + 40); G.hp = Math.min(G.maxhp, G.hp + 8); G.age += 0; G.log.unshift('You rested and recovered energy.'); showGame(); }
function showMenu(){
  const items = SHOP.map((s, i) => `<button class="btn" data-i="${i}" style="min-width:0;width:calc(100% - 16px)">${s.n} - ${s.c} gold (${s.d})</button>`).join('');
  screen.innerHTML = `<div style="padding:12px;overflow:auto;height:100%"><div class="card"><h2>Isekai Menu</h2><div>Gold: ${G.gold}</div></div>
    <div class="card"><h2>Guild Shop</h2>${items}</div>
    <div class="card"><button class="btn" id="bBack">Back</button></div></div>`;
  screen.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const s = SHOP[b.dataset.i]; if(G.gold >= s.c){ G.gold -= s.c; applyFx(s.fx); G.log.unshift('Bought ' + s.n + '.'); showMenu(); } else { G.log.unshift('Not enough gold for ' + s.n + '.'); showMenu(); } });
  document.getElementById('bBack').onclick = showGame;
}
function showDeathEnd(){
  screen.innerHTML = `<div class="center"><h1 style="color:var(--red)">You died again...</h1>
    <p>${G.name} the ${G.form.name} lived to age ${G.age}, level ${G.lvl}.</p>
    <button class="btn" id="bAgain">Reincarnate</button></div>`;
  document.getElementById('bAgain').onclick = () => { G = null; showLoading(); };
}
