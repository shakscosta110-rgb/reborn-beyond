// Original game data for Reborn Beyond: World. All names, creatures and items are original.
export const RARITY = [
  {id:'common',name:'Common',w:50,c:'r-common'},
  {id:'uncommon',name:'Uncommon',w:25,c:'r-uncommon'},
  {id:'rare',name:'Rare',w:13,c:'r-rare'},
  {id:'epic',name:'Epic',w:7,c:'r-epic'},
  {id:'legendary',name:'Legendary',w:4,c:'r-legendary'},
  {id:'mythic',name:'Mythic',w:1,c:'r-mythic'}
];
export const ITEMS = {
  wood:{n:'Timber',t:'mat',v:2}, stone:{n:'Stone',t:'mat',v:2}, fiber:{n:'Wild Fiber',t:'mat',v:1},
  ore:{n:'Ferrite Ore',t:'mat',v:5}, crystal:{n:'Nexus Crystal',t:'mat',v:12}, hide:{n:'Beast Hide',t:'mat',v:4},
  scale:{n:'Drake Scale',t:'mat',v:20}, ember:{n:'Ember Core',t:'mat',v:15}, frost:{n:'Frost Shard',t:'mat',v:15},
  petal:{n:'Moonpetal',t:'mat',v:6}, sand:{n:'Glass Sand',t:'mat',v:2}, ingot:{n:'Ferrite Ingot',t:'mat',v:12},
  plank:{n:'Planks',t:'mat',v:3}, rope:{n:'Rope',t:'mat',v:4},
  meat:{n:'Roast Meat',t:'food',v:6,heal:35}, potion:{n:'Vital Draught',t:'food',v:14,heal:80},
  nexusTonic:{n:'Nexus Tonic',t:'food',v:16,nx:60},
  club:{n:'Wooden Club',t:'wpn',v:8,atk:6}, ironsword:{n:'Ferrite Blade',t:'wpn',v:40,atk:14},
  emberblade:{n:'Emberfang Blade',t:'wpn',v:120,atk:26}, frostspear:{n:'Frostpiercer',t:'wpn',v:120,atk:25},
  scalesword:{n:'Drakescale Edge',t:'wpn',v:260,atk:40}, moonblade:{n:'Moonlit Saber',t:'wpn',v:600,atk:60},
  leather:{n:'Hide Vest',t:'arm',v:20,def:4}, ironarmor:{n:'Ferrite Plate',t:'arm',v:90,def:10},
  scalearmor:{n:'Drakescale Mail',t:'arm',v:300,def:20}, mythicarmor:{n:'Aegis of Dawn',t:'arm',v:900,def:34},
  horsegear:{n:'Steed Saddle',t:'misc',v:50}, torch:{n:'Torch',t:'misc',v:3}
};
export const RECIPES = [
  {out:'plank',n:2,need:{wood:1}},
  {out:'rope',n:1,need:{fiber:3}},
  {out:'torch',n:2,need:{wood:1,ember:0}},
  {out:'club',n:1,need:{plank:3,rope:1}},
  {out:'ingot',n:1,need:{ore:2,wood:1}},
  {out:'ironsword',n:1,need:{ingot:3,plank:1,rope:1}},
  {out:'leather',n:1,need:{hide:4,rope:2}},
  {out:'ironarmor',n:1,need:{ingot:6,hide:2}},
  {out:'meat',n:2,need:{hide:1,wood:1}},
  {out:'potion',n:1,need:{petal:3,sand:1}},
  {out:'nexusTonic',n:1,need:{crystal:1,petal:1}},
  {out:'emberblade',n:1,need:{ingot:4,ember:2,plank:1}},
  {out:'frostspear',n:1,need:{ingot:4,frost:2,plank:1}},
  {out:'scalesword',n:1,need:{ingot:6,scale:3,rope:2}},
  {out:'scalearmor',n:1,need:{ingot:8,scale:5,hide:3}}
];
export const SHOP = ['potion','nexusTonic','meat','club','ironsword','leather','ironarmor','rope','plank','horsegear'];
// Elemental ability trees. Nexus energy (NX) is the resource; each skill has its own cost.
export const ELEMENTS = {
  fire:{name:'Fire',col:0xff6a2a,skills:[
    {id:'ember',n:'Ember Bolt',nx:10,dmg:22,r:18,cd:1.2,unlock:1},
    {id:'magma',n:'Magma Burst',nx:25,dmg:48,r:7,cd:3,unlock:4,aoe:true},
    {id:'smoke',n:'Smoke Veil',nx:18,dmg:0,r:0,cd:6,unlock:6,buff:'veil'}]},
  storm:{name:'Storm',col:0x9fd0ff,skills:[
    {id:'spark',n:'Spark Lash',nx:8,dmg:18,r:20,cd:0.9,unlock:1},
    {id:'bolt',n:'Thunder Spear',nx:28,dmg:60,r:22,cd:3.5,unlock:4},
    {id:'chain',n:'Chain Arc',nx:30,dmg:36,r:9,cd:4,unlock:6,aoe:true}]},
  light:{name:'Light',col:0xfff2a8,skills:[
    {id:'ray',n:'Radiant Ray',nx:12,dmg:24,r:22,cd:1.3,unlock:1},
    {id:'heal',n:'Dawn Mend',nx:24,dmg:0,r:0,cd:5,unlock:4,heal:60},
    {id:'nova',n:'Sun Nova',nx:34,dmg:55,r:8,cd:4.5,unlock:6,aoe:true}]}
};
export const BIOMES = {
  meadow:{n:'Verdant Meadow',g:0x5fae4a,tree:'oak',fog:0xbfe3ff},
  forest:{n:'Elderwood',g:0x2f7a3a,tree:'pine',fog:0xa9d3c0},
  desert:{n:'Ashen Dunes',g:0xd9b66a,tree:'cactus',fog:0xf0d9a8},
  snow:{n:'Frostveil Peaks',g:0xe8f1ff,tree:'pine',fog:0xdbe9ff},
  volcanic:{n:'Cinder Reach',g:0x4a3a3a,tree:'dead',fog:0x6a4a44}
};
export const MOBS = {
  wolf:{n:'Gloam Wolf',hp:40,atk:6,xp:14,spd:4.2,col:0x6d7388,drop:{hide:[1,2]},size:1.0,biome:['meadow','forest']},
  sprite:{n:'Mire Sprite',hp:28,atk:5,xp:10,spd:3.4,col:0x6be0a0,drop:{fiber:[1,3],petal:[0,1]},size:0.8,biome:['meadow','forest']},
  scorpion:{n:'Dune Scorpion',hp:60,atk:9,xp:22,spd:3.6,col:0xc98a3a,drop:{hide:[1,2],sand:[1,2]},size:1.1,biome:['desert']},
  yeti:{n:'Frostveil Brute',hp:120,atk:14,xp:40,spd:3.0,col:0xdfeaff,drop:{frost:[1,2],hide:[2,3]},size:1.6,biome:['snow']},
  imp:{n:'Cinder Imp',hp:70,atk:12,xp:30,spd:4.4,col:0xe8502a,drop:{ember:[1,2],ore:[0,2]},size:0.9,biome:['volcanic']},
  drake:{n:'Cinder Drake',hp:420,atk:26,xp:220,spd:3.4,col:0xb8281c,drop:{scale:[3,5],ember:[2,4],crystal:[1,2]},size:2.6,biome:['volcanic'],boss:true}
};
export const DIALOGUE = {
  elder:{name:'Elder Maren',lines:['Welcome, hero. The Nexus has stirred, and the old kingdoms need champions.','Gather timber and stone, then craft at the table in town. Strong gear keeps you alive.','Beware the Cinder Drake in the volcanic south. Few return from there.']},
  smith:{name:'Smith Dova',lines:['Ferrite ingots make the best blades. Bring ore and timber to the crafting table.','Drake scales make armor that turns aside fire. If you can win them.']},
  elf:{name:'Sylvaris the Elf Ranger',lines:['The Elderwood remembers every footstep. Walk softly and the trees will guide you.','Moonpetal grows near the forest edge. It makes a fine healing draught.']},
  merchant:{name:'Trader Quill',lines:['Fresh stock in the market! Healing draughts, blades, armor, and more.','Sell me your spare materials and I will pay fair coin.']},
  captain:{name:'Captain Roswen of Dawnhold',lines:['The Kingdom of Dawnhold takes in every hero who proves themselves. Reach level five and speak to me again.']}
};
export const KINGDOMS = [
  {id:'dawn',name:'Kingdom of Dawnhold',perk:'+10% max HP',lvl:5},
  {id:'ember',name:'Emberthrone Dominion',perk:'+10% damage',lvl:8},
  {id:'moon',name:'Moonveil Concord',perk:'+20 max Nexus',lvl:8}
];
