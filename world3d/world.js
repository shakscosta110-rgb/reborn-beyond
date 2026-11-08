import * as THREE from 'three';
import {BIOMES} from './data.js';
export const SIZE = 400, HALF = SIZE/2, SEA = -1.2;
function hash(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s)}
function smooth(t){return t*t*(3-2*t)}
function noise(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=smooth(x-xi),zf=smooth(z-zi);
  const a=hash(xi,zi),b=hash(xi+1,zi),c=hash(xi,zi+1),d=hash(xi+1,zi+1);
  return a+(b-a)*xf+(c-a)*zf+(a-b-c+d)*xf*zf}
function fbm(x,z){let v=0,a=0.5,f=1;for(let i=0;i<4;i++){v+=noise(x*f,z*f)*a;f*=2;a*=0.5}return v}
export function biomeAt(x,z){
  const d=Math.hypot(x,z);
  if(d<45)return 'meadow';
  if(z>90)return 'volcanic';
  if(x<-70)return 'forest';
  if(x>80&&z<40)return 'desert';
  if(z<-100)return 'snow';
  return 'meadow';
}
export function heightAt(x,z){
  const d=Math.hypot(x,z);
  let h=fbm(x*0.02,z*0.02)*9-2;
  const flat=Math.max(0,1-d/40);
  h=h*(1-flat)+1.5*flat;
  const edge=Math.max(0,(Math.max(Math.abs(x),Math.abs(z))-(HALF-40))/40);
  h-=edge*edge*14;
  if(biomeAt(x,z)==='snow')h+=3;
  return h;
}
export function buildTerrain(scene){
  const seg=160,geo=new THREE.PlaneGeometry(SIZE,SIZE,seg,seg);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,col=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i),h=heightAt(x,z);pos.setY(i,h);
    const b=BIOMES[biomeAt(x,z)];const c=new THREE.Color(b.g);
    const s=0.85+hash(x*3,z*3)*0.3;c.multiplyScalar(s);
    if(h<SEA+0.6)c.set(0xd8c98a);
    col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true}));mesh.receiveShadow=true;scene.add(mesh);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(SIZE*3,SIZE*3),new THREE.MeshLambertMaterial({color:0x2a7fd4,transparent:true,opacity:0.8}));
  water.rotation.x=-Math.PI/2;water.position.y=SEA;scene.add(water);
  return mesh;
}
export function mkTree(kind){
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.35,2.2,6),new THREE.MeshLambertMaterial({color:0x6b4a2b}));trunk.position.y=1.1;g.add(trunk);
  if(kind==='pine'){for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(1.5-i*0.35,1.8,7),new THREE.MeshLambertMaterial({color:0x1f6b3a}));c.position.y=2.4+i*1.1;g.add(c)}}
  else if(kind==='cactus'){trunk.material.color.set(0x4c9a4a);const a=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,1,6),trunk.material);a.position.set(0.5,1.5,0);g.add(a)}
  else if(kind==='dead'){trunk.material.color.set(0x2b2321);trunk.scale.set(0.8,1.2,0.8)}
  else{const l=new THREE.Mesh(new THREE.IcosahedronGeometry(1.6,0),new THREE.MeshLambertMaterial({color:0x3f9a3f}));l.position.y=3.2;g.add(l)}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g;
}
export function scatter(scene,nodes){
  for(let i=0;i<650;i++){
    const x=(Math.random()-0.5)*(SIZE-60),z=(Math.random()-0.5)*(SIZE-60);
    if(Math.hypot(x,z)<22)continue;const h=heightAt(x,z);if(h<SEA+0.8)continue;
    const b=biomeAt(x,z);const t=mkTree(BIOMES[b].tree);t.position.set(x,h,z);t.rotation.y=Math.random()*6;
    const s=0.8+Math.random()*0.7;t.scale.setScalar(s);scene.add(t);
    nodes.push({kind:'tree',obj:t,x,z,r:1.6,hp:3,drop:{wood:[2,4]}});
  }
  for(let i=0;i<220;i++){
    const x=(Math.random()-0.5)*(SIZE-60),z=(Math.random()-0.5)*(SIZE-60);
    if(Math.hypot(x,z)<20)continue;const h=heightAt(x,z);if(h<SEA+0.8)continue;
    const b=biomeAt(x,z);const ore=(b==='volcanic'||b==='snow')&&Math.random()<0.5;
    const m=new THREE.Mesh(new THREE.DodecahedronGeometry(0.9+Math.random()*0.5,0),new THREE.MeshLambertMaterial({color:ore?0x9a6a4a:0x8a8f99}));
    m.position.set(x,h+0.5,z);m.castShadow=true;scene.add(m);
    nodes.push({kind:ore?'ore':'rock',obj:m,x,z,r:1.4,hp:4,drop:ore?{ore:[1,3],stone:[0,1]}:{stone:[1,3]}});
  }
}
