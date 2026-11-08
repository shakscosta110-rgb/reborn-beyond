import * as THREE from 'three';
import {SEA} from './world.js';
const lam=c=>new THREE.MeshLambertMaterial({color:c});
const bas=c=>new THREE.MeshBasicMaterial({color:c});
export const WPS=[
  {id:'plaza',name:'Dawnhold Plaza',x:0,z:-6},
  {id:'market',name:'Market District',x:-16,z:12},
  {id:'smithy',name:'Smithy Quarter',x:20,z:6},
  {id:'wood',name:'Elderwood Gate',x:-76,z:0},
  {id:'dunes',name:'Dune Outpost',x:92,z:-8},
  {id:'frost',name:'Frost Camp',x:0,z:-108},
  {id:'cinder',name:'Cinder Gate',x:0,z:100}
];
export function buildTown(scene,H){
  const colliders=[],roofs=[],chests=[],floors=[],spinners=[],wps=[],beds=[],furn=[];
  const stone=lam(0x9b9ba8),stone2=lam(0x7b7c8c),wood=lam(0x8a5a2b),dark=lam(0x4a2f17),plaster=lam(0xeadfc6),roofM=lam(0xb4452f),cloth=lam(0xb3283d);
  const bx=(w,h,d,m,x,y,z,cast=true)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o};
  const cy=(r1,r2,h,m,x,y,z,seg=12)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o};
  const col=(x,z,w,d)=>colliders.push({minx:x-w/2,maxx:x+w/2,minz:z-d/2,maxz:z+d/2});
  const maxH=(x,z,r)=>{let m=H(x,z);for(let i=0;i<12;i++){const a=i/12*6.2832;m=Math.max(m,H(x+Math.cos(a)*r,z+Math.sin(a)*r))}return m};

  const py=maxH(0,0,13)+0.12;
  cy(13,13.8,6,stone,0,py-3,0,48);floors.push({cx:0,cz:0,r:13,y:py});
  cy(6.5,6.5,0.12,lam(0xb9b9c8),0,py+0.01,0,40);
  cy(2.6,2.8,0.8,stone2,0,py+0.4,2);cy(2.25,2.25,0.1,bas(0x4aa8ff),0,py+0.78,2);cy(0.35,0.45,2.4,stone,0,py+1.3,2,10);
  const orb=new THREE.Mesh(new THREE.SphereGeometry(0.4,12,10),bas(0x9fe3ff));orb.position.set(0,py+2.7,2);scene.add(orb);spinners.push({o:orb,by:py+2.7,bob:true});
  col(0,2,5.4,5.4);
  for(let i=0;i<6;i++){const a=i/6*6.2832+0.5,x=Math.cos(a)*10.5,z=Math.sin(a)*10.5;cy(0.1,0.12,3.2,dark,x,py+1.6,z,6);const l=new THREE.Mesh(new THREE.SphereGeometry(0.24,8,8),bas(0xffe9a0));l.position.set(x,py+3.3,z);scene.add(l)}
  const sx=-12,sz=4.5;bx(3.2,1.0,1.2,wood,sx,py+0.5,sz);bx(3.8,0.18,2.2,cloth,sx,py+2.5,sz-0.2);[-1.6,1.6].forEach(o=>bx(0.14,2.4,0.14,dark,sx+o,py+1.2,sz-0.8));
  bx(0.6,0.5,0.6,wood,sx-1.2,py+1.25,sz);bx(0.5,0.4,0.5,lam(0x4a8f4a),sx+0.3,py+1.2,sz);col(sx,sz,3.4,1.4);
  bx(2.2,1.3,1.6,stone2,15,py+0.65,9);bx(0.6,2.4,0.6,stone,15.6,py+1.9,9);bx(1.6,0.1,1.0,bas(0xff7a1a),15,py+1.32,9.1,false);
  bx(0.8,0.7,0.5,lam(0x33363f),17.4,py+0.35,9);col(15,9,2.3,1.7);col(17.4,9,0.9,0.7);
  cy(0.1,0.1,5.5,dark,-3,py+2.75,-14,6);bx(1.2,2.0,0.06,lam(0x2a4fb0),-2.4,py+4.2,-14,false);bx(0.5,0.5,0.07,lam(0xf5c542),-2.4,py+4.4,-13.95,false);
  const tx=8,tz=-3;bx(2.2,0.2,1.2,wood,tx,py+1.0,tz);[[-0.95,-0.45],[0.95,-0.45],[-0.95,0.45],[0.95,0.45]].forEach(p=>bx(0.14,1.0,0.14,dark,tx+p[0],py+0.5,tz+p[1]));
  bx(0.5,0.12,0.3,lam(0xcfd8e8),tx-0.5,py+1.16,tz);bx(0.3,0.3,0.3,lam(0x6a4a2a),tx+0.5,py+1.25,tz);bx(0.1,0.5,0.1,dark,tx+0.1,py+1.35,tz+0.2);col(tx,tz,2.4,1.4);

  function house(x,z,face,idx){
    const w=9,d=8,t=0.45,wh=3.4;
    let y0=H(x,z);for(const ox of [-w/2,0,w/2])for(const oz of [-d/2,0,d/2])y0=Math.max(y0,H(x+ox,z+oz));y0+=0.25;
    bx(w+0.9,6,d+0.9,stone2,x,y0-3,z);bx(w-0.7,0.12,d-0.7,wood,x,y0+0.06,z,false);
    const wall=(cx,cz,sx,sz)=>{bx(sx,wh,sz,plaster,cx,y0+wh/2,cz);col(cx,cz,sx,sz)};
    const zb=z-face*(d/2-t/2),zf=z+face*(d/2-t/2);
    wall(x,zb,w,t);wall(x-(w/2-t/2),z,t,d);wall(x+(w/2-t/2),z,t,d);
    const dw=2.4,seg=(w-dw)/2;wall(x-(dw/2+seg/2),zf,seg,t);wall(x+(dw/2+seg/2),zf,seg,t);
    bx(dw,0.9,t,dark,x,y0+wh-0.45,zf);
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(p=>bx(0.5,wh+0.2,0.5,dark,x+p[0]*(w/2-0.1),y0+wh/2,z+p[1]*(d/2-0.1)));
    const bounds={minx:x-w/2+t,maxx:x+w/2-t,minz:z-d/2+t,maxz:z+d/2-t};floors.push({box:true,minx:bounds.minx,maxx:bounds.maxx,minz:bounds.minz,maxz:bounds.maxz,y:y0+0.12});
    const rg=new THREE.ConeGeometry(w*0.78,2.8,4);rg.rotateY(Math.PI/4);const roof=new THREE.Mesh(rg,roofM);roof.scale.z=d/w;roof.position.set(x,y0+wh+1.4,z);roof.castShadow=true;scene.add(roof);
    roofs.push({mesh:roof,box:{minx:x-w/2-0.3,maxx:x+w/2+0.3,minz:z-d/2-0.3,maxz:z+d/2+0.3}});
    const fy=y0+0.12;
    const bedX=x-w/2+t+1.0,bedZ=z-face*(d/2-t-1.4);
    bx(1.7,0.45,2.4,wood,bedX,fy+0.35,bedZ);bx(1.6,0.2,1.6,lam(0x4c63c9),bedX,fy+0.66,bedZ+face*0.3);bx(1.1,0.18,0.5,lam(0xf1f1f1),bedX,fy+0.7,bedZ-face*0.85);col(bedX,bedZ,1.8,2.5);beds.push({x:bedX,z:bedZ});
    const tbX=x+1.6,tbZ=z-face*0.9;
    bx(1.7,0.12,1.0,wood,tbX,fy+0.86,tbZ);[[-0.7,-0.4],[0.7,-0.4],[-0.7,0.4],[0.7,0.4]].forEach(p=>bx(0.12,0.86,0.12,dark,tbX+p[0],fy+0.43,tbZ+p[1]));col(tbX,tbZ,1.8,1.1);
    furn.push({kind:'table',x:tbX,z:tbZ},{kind:'chair',x:tbX,z:tbZ-face*0.95});
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(0.13,8,8),bas(0xffe9a0));lamp.position.set(tbX+0.4,fy+1.05,tbZ);scene.add(lamp);
    bx(0.5,0.1,0.5,wood,tbX,fy+0.5,tbZ-face*0.95);bx(0.5,0.5,0.1,wood,tbX,fy+0.8,tbZ-face*1.2);
    const shX=x+w/2-t-0.4;bx(0.6,2.2,2.2,wood,shX,fy+1.1,z-face*0.4);
    [0xc9283e,0x2a4fb0,0x2f7a3a,0xf5c542,0x7c5cff,0xc9283e].forEach((c,i)=>bx(0.2,0.45,0.28,lam(c),shX-0.12,fy+0.5+(i%3)*0.7,z-face*(0.4-0.5+(i%2)*0.9),false));
    col(shX,z-face*0.4,0.7,2.3);furn.push({kind:'shelf',x:shX,z:z-face*0.4,id:'s'+idx});
    bx(2.4,0.04,2.4,lam(0x6a2a5a),x-0.9,fy+0.03,z+face*0.4,false);
    const cx=x+w/2-t-0.9,cz=z-face*(d/2-t-0.7);
    const cg=new THREE.Group();cg.position.set(cx,fy,cz);cg.rotation.y=face>0?0:Math.PI;scene.add(cg);
    const base=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.6,0.7),lam(0x6b4423));base.position.y=0.3;base.castShadow=true;cg.add(base);
    const band=new THREE.Mesh(new THREE.BoxGeometry(1.04,0.1,0.74),lam(0xf5c542));band.position.y=0.3;cg.add(band);
    const pivot=new THREE.Group();pivot.position.set(0,0.6,-0.35);cg.add(pivot);
    const lid=new THREE.Mesh(new THREE.BoxGeometry(1.04,0.25,0.74),lam(0x7b5230));lid.position.set(0,0.125,0.35);lid.castShadow=true;pivot.add(lid);
    const clasp=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.2,0.06),lam(0xf5c542));clasp.position.set(0,0.05,0.74);pivot.add(clasp);
    const spark=new THREE.Mesh(new THREE.OctahedronGeometry(0.16),bas(0xffd24a));spark.position.set(cx,fy+1.5,cz);scene.add(spark);spinners.push({o:spark,by:fy+1.5,bob:true});
    col(cx,cz,1.1,0.8);chests.push({id:'h'+idx,x:cx,z:cz,y:fy,pivot,spark,opened:false});
  }
  [[-22,-16,1],[-7,-27,1],[11,-27,1],[27,-14,1],[-30,8,-1],[28,16,-1]].forEach((h,i)=>house(h[0],h[1],h[2],i));

  for(const w of WPS){
    let y;
    if(w.id==='plaza'){y=py}else{y=Math.max(maxH(w.x,w.z,3),SEA+0.6)+0.1;cy(3,3.3,6,stone,w.x,y-3,w.z,24);floors.push({cx:w.x,cz:w.z,r:3,y})}
    cy(0.9,1.1,0.4,stone2,w.x,y+0.2,w.z,8);
    const cr=new THREE.Mesh(new THREE.OctahedronGeometry(0.7),bas(0x6fd6ff));cr.scale.y=1.7;cr.position.set(w.x,y+2.2,w.z);scene.add(cr);
    const rg=new THREE.Mesh(new THREE.TorusGeometry(1.1,0.06,8,24),bas(0xbfeeff));rg.position.set(w.x,y+2.2,w.z);rg.rotation.x=Math.PI/2;scene.add(rg);
    spinners.push({o:cr,by:y+2.2,bob:true},{o:rg,by:y+2.2,bob:false});
    wps.push({id:w.id,name:w.name,x:w.x,z:w.z,y});
  }
  function floorAt(x,z){for(const f of floors){if(f.box){if(x>f.minx&&x<f.maxx&&z>f.minz&&z<f.maxz)return f.y}else if(Math.hypot(x-f.cx,z-f.cz)<f.r)return f.y}return null}
  return {colliders,roofs,chests,floorAt,table:{x:tx,z:tz},spinners,wps,plazaY:py,beds,furn};
}
