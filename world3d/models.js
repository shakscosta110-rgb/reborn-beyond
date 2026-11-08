import * as THREE from 'three';
// All characters and creatures are original designs built from simple 3D shapes.
const lam=c=>new THREE.MeshLambertMaterial({color:c});
const bas=c=>new THREE.MeshBasicMaterial({color:c});
function mk(geo,mat,x=0,y=0,z=0,cast=true){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=cast;return m}
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const SP=(r,a=14,b=10)=>new THREE.SphereGeometry(r,a,b);
const CY=(r1,r2,h,s=10)=>new THREE.CylinderGeometry(r1,r2,h,s);
const CN=(r,h,s=8)=>new THREE.ConeGeometry(r,h,s);

export function makeLabel(text,color='#ffffff',scale=1){
  const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');
  x.font='bold 30px Trebuchet MS,Arial';x.textAlign='center';x.textBaseline='middle';
  x.lineWidth=6;x.strokeStyle='rgba(0,0,0,0.85)';x.strokeText(text,128,34);x.fillStyle=color;x.fillText(text,128,34);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));
  s.scale.set(4*scale,1*scale,1);return s;
}

export function makeHero(){
  const g=new THREE.Group(),skin=lam(0xffd9bf),navy=lam(0x2b3a8c),gold=lam(0xf5c542),hair=lam(0x3a6bff),dark=lam(0x1d2152);
  g.add(mk(new THREE.CapsuleGeometry(0.38,0.7,4,10),navy,0,1.15,0));
  g.add(mk(CY(0.4,0.4,0.12,12),gold,0,0.92,0));
  g.add(mk(SP(0.3,16,12),skin,0,1.95,0));
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const h=mk(CN(0.1,0.45,5),hair,Math.cos(a)*0.17,2.22,Math.sin(a)*0.17);h.rotation.x=Math.sin(a)*0.55;h.rotation.z=-Math.cos(a)*0.55;g.add(h)}
  g.add(mk(new THREE.SphereGeometry(0.315,14,8,0,Math.PI*2,0,Math.PI*0.55),hair,0,1.97,0));
  const eyeM=bas(0x111111);
  g.add(mk(SP(0.045,8,6),eyeM,-0.1,1.97,0.27,false),mk(SP(0.045,8,6),eyeM,0.1,1.97,0.27,false));
  const cape=mk(BX(0.7,1.1,0.06),lam(0xc9283e),0,1.3,-0.42);cape.rotation.x=0.18;g.add(cape);
  const legL=new THREE.Group(),legR=new THREE.Group();legL.position.set(-0.17,0.78,0);legR.position.set(0.17,0.78,0);
  legL.add(mk(BX(0.22,0.78,0.24),dark,0,-0.39,0));legR.add(mk(BX(0.22,0.78,0.24),dark,0,-0.39,0));g.add(legL,legR);
  const armL=new THREE.Group(),armR=new THREE.Group();armL.position.set(-0.52,1.55,0);armR.position.set(0.52,1.55,0);
  armL.add(mk(BX(0.17,0.62,0.17),skin,0,-0.31,0));armR.add(mk(BX(0.17,0.62,0.17),skin,0,-0.31,0));
  const sword=new THREE.Group();sword.position.set(0,-0.62,0.05);sword.rotation.x=Math.PI/2;
  const bladeM=lam(0xcfd8e8);sword.add(mk(BX(0.08,1.25,0.03),bladeM,0,0.65,0));
  sword.add(mk(BX(0.32,0.07,0.09),gold,0,0.02,0),mk(BX(0.06,0.25,0.06),lam(0x5a3a1a),0,-0.14,0));
  armR.add(sword);g.add(armL,armR);
  return {group:g,armL,armR,legL,legR,cape,sword,bladeM};
}

export function makeMob(id,def){
  const g=new THREE.Group(),mats=[];const L=c=>{const m=lam(c);mats.push(m);return m};
  const c=def.col,dk=new THREE.Color(c).multiplyScalar(0.55).getHex();
  const eye=bas(id==='sprite'?0xffffff:0xff3030),glow=bas(0xff9d2a);
  if(id==='wolf'){
    g.add(mk(BX(0.7,0.7,1.5),L(c),0,0.85,0),mk(BX(0.55,0.5,0.6),L(c),0,1.1,0.95),mk(BX(0.28,0.22,0.4),L(dk),0,0.98,1.35));
    [-0.2,0.2].forEach(x=>{g.add(mk(CN(0.12,0.3,4),L(dk),x,1.45,0.85));g.add(mk(SP(0.05,6,6),eye,x,1.18,1.22,false))});
    [[-0.25,-0.5],[0.25,-0.5],[-0.25,0.5],[0.25,0.5]].forEach(p=>g.add(mk(BX(0.18,0.6,0.18),L(dk),p[0],0.3,p[1])));
    const t=mk(CN(0.14,0.8,5),L(dk),0,0.95,-1.05);t.rotation.x=-1.1;g.add(t);
  }else if(id==='sprite'){
    g.add(mk(SP(0.38,14,10),L(c),0,1.2,0));
    const halo=new THREE.Mesh(SP(0.58,12,10),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.3,depthWrite:false}));halo.position.y=1.2;g.add(halo);
    [-1,1].forEach(s=>{const w=mk(BX(0.7,0.05,0.35),L(0xcff8e0),s*0.55,1.35,-0.05);w.rotation.z=s*0.5;g.add(w);g.add(mk(SP(0.06,6,6),eye,s*0.14,1.28,0.32,false))});
    g.add(mk(CN(0.08,0.3,5),L(dk),0,1.75,0));
  }else if(id==='scorpion'){
    g.add(mk(BX(0.9,0.4,1.3),L(c),0,0.45,0),mk(BX(0.5,0.35,0.45),L(dk),0,0.5,0.8));
    [-1,1].forEach(s=>{g.add(mk(BX(0.18,0.18,0.7),L(dk),s*0.55,0.5,0.95));g.add(mk(BX(0.4,0.14,0.35),L(c),s*0.55,0.5,1.35));g.add(mk(SP(0.05,6,6),eye,s*0.12,0.62,1.02,false))});
    for(let i=0;i<4;i++){g.add(mk(SP(0.2-i*0.02,8,6),L(c),0,0.55+i*0.28,-0.7-i*0.1))}
    const st=mk(CN(0.1,0.35,5),L(0xffd84a),0,1.7,-0.55);st.rotation.x=Math.PI*0.75;g.add(st);
    [-0.35,0,0.35].forEach(z=>[-1,1].forEach(s=>g.add(mk(BX(0.5,0.06,0.06),L(dk),s*0.65,0.25,z*1.1))));
  }else if(id==='yeti'){
    const b=mk(SP(0.85,14,12),L(c),0,1.1,0);b.scale.y=1.2;g.add(b);
    g.add(mk(SP(0.5,14,10),L(c),0,2.1,0.1),mk(BX(0.5,0.22,0.1),L(0x9fc3e8),0,2.0,0.55));
    [-1,1].forEach(s=>{g.add(mk(BX(0.4,1.1,0.4),L(c),s*1.0,1.2,0.1));g.add(mk(SP(0.09,6,6),eye,s*0.2,2.2,0.55,false));g.add(mk(CN(0.12,0.4,5),L(0xdfeaff),s*0.35,2.55,0.1));g.add(mk(BX(0.4,0.8,0.4),L(dk),s*0.4,0.4,0))});
  }else if(id==='imp'){
    g.add(mk(SP(0.4,12,10),L(c),0,0.9,0),mk(SP(0.3,12,10),L(c),0,1.45,0.05));
    [-1,1].forEach(s=>{const h=mk(CN(0.08,0.35,5),L(0x2a0a0a),s*0.2,1.82,0);h.rotation.z=-s*0.3;g.add(h);g.add(mk(SP(0.05,6,6),glow,s*0.1,1.5,0.3,false));const w=mk(BX(0.8,0.05,0.5),L(0x7a1d1d),s*0.65,1.1,-0.2);w.rotation.z=s*0.5;g.add(w);g.add(mk(BX(0.12,0.5,0.12),L(dk),s*0.15,0.3,0))});
    const t=mk(CN(0.07,0.7,5),L(dk),0,0.7,-0.5);t.rotation.x=-1.2;g.add(t);
  }else if(id==='drake'){
    const body=mk(SP(1.1,16,12),L(c),0,1.6,0);body.scale.set(1,0.9,1.7);g.add(body);
    g.add(mk(CY(0.4,0.55,1.3,8),L(c),0,2.3,1.6));
    const hd=mk(BX(0.8,0.7,1.1),L(c),0,3.0,2.2);g.add(hd);g.add(mk(BX(0.5,0.35,0.6),L(dk),0,2.85,2.9));
    [-1,1].forEach(s=>{const h=mk(CN(0.14,0.7,5),L(0x2a1a14),s*0.3,3.5,2.0);h.rotation.x=-0.5;g.add(h);g.add(mk(SP(0.1,8,6),glow,s*0.3,3.1,2.7,false));
      const w=mk(BX(2.8,0.08,1.5),L(0x7a1812),s*2.0,2.6,-0.2);w.rotation.z=s*0.35;g.add(w);
      g.add(mk(BX(0.4,1.1,0.4),L(dk),s*0.7,0.55,0.8));g.add(mk(BX(0.4,1.1,0.4),L(dk),s*0.7,0.55,-0.8))});
    for(let i=0;i<5;i++){const t=mk(CN(0.45-i*0.07,1.0,6),L(c),0,1.3-i*0.06,-1.8-i*0.7);t.rotation.x=-Math.PI/2;g.add(t)}
    for(let i=0;i<6;i++){g.add(mk(CN(0.12,0.4,4),L(0xffb347),0,2.5-i*0.02,1.2-i*0.55))}
  }else if(id==='sheep'){
    const dk2=L(0x3a3a3a),body=mk(SP(0.6,12,10),L(c),0,0.85,0);body.scale.set(1,0.85,1.3);g.add(body);
    g.add(mk(SP(0.28,10,8),dk2,0,1.0,0.85),mk(SP(0.04,6,6),bas(0xffffff),-0.1,1.08,1.1,false),mk(SP(0.04,6,6),bas(0xffffff),0.1,1.08,1.1,false));
    [[-0.25,-0.4],[0.25,-0.4],[-0.25,0.4],[0.25,0.4]].forEach(p=>g.add(mk(BX(0.12,0.45,0.12),dk2,p[0],0.22,p[1])));
    [-1,1].forEach(s=>g.add(mk(SP(0.1,6,6),dk2,s*0.3,1.15,0.8)));
  }
  g.scale.setScalar(def.size);g.userData.mats=mats;return g;
}

export function makeNPC(type,robe){
  const g=new THREE.Group(),skin=lam(0xf1c9a5),eyeM=bas(0x111111);
  g.add(mk(CY(0.3,0.55,1.5,10),lam(robe),0,0.75,0),mk(SP(0.28,14,10),skin,0,1.78,0));
  const hc={elder:0xf2f2f2,smith:0x3a2a1a,merchant:0x6a3a1a,captain:0x222222,elf:0xe8d98a}[type]||0x3a2a1a;
  g.add(mk(new THREE.SphereGeometry(0.3,12,8,0,Math.PI*2,0,Math.PI*0.55),lam(hc),0,1.82,0));
  g.add(mk(SP(0.04,6,6),eyeM,-0.1,1.8,0.25,false),mk(SP(0.04,6,6),eyeM,0.1,1.8,0.25,false));
  [-1,1].forEach(s=>g.add(mk(BX(0.14,0.7,0.14),lam(robe),s*0.5,1.2,0.05)));
  if(type==='elder'){const b=mk(CN(0.2,0.5,6),lam(0xf2f2f2),0,1.55,0.2);b.rotation.x=Math.PI;g.add(b);g.add(mk(CY(0.04,0.04,2.4,6),lam(0x7a4a22),0.6,1.2,0.25));g.add(mk(SP(0.14,10,8),bas(0x8fe3ff),0.6,2.5,0.25,false))}
  if(type==='smith'){g.add(mk(BX(0.55,0.9,0.1),lam(0x5a3a1a),0,1.0,0.3));g.add(mk(BX(0.12,0.12,0.7),lam(0x666a72),0.5,1.0,0.3))}
  if(type==='merchant'){g.add(mk(CY(0.45,0.45,0.08,12),lam(0x8a2a2a),0,2.08,0));g.add(mk(CY(0.22,0.28,0.3,10),lam(0x8a2a2a),0,2.25,0))}
  if(type==='captain'){g.add(mk(new THREE.SphereGeometry(0.34,12,8,0,Math.PI*2,0,Math.PI*0.6),lam(0xb9c2d6),0,1.82,0));g.add(mk(CN(0.1,0.5,5),lam(0xc9283e),0,2.3,-0.1));[-1,1].forEach(s=>g.add(mk(BX(0.35,0.18,0.4),lam(0xb9c2d6),s*0.4,1.6,0)));g.add(mk(BX(0.8,1.3,0.06),lam(0x2a4fb0),0,1.1,-0.4))}
  if(type==='elf'){[-1,1].forEach(s=>{const e=mk(CN(0.07,0.4,4),skin,s*0.3,1.85,0);e.rotation.z=-s*1.2;g.add(e)});g.add(mk(BX(0.8,1.2,0.05),lam(0x2f7a3a),0,1.1,-0.35));g.add(mk(CY(0.02,0.02,1.8,5),lam(0x8a5a2b),-0.55,1.1,0.2))}
  return g;
}
