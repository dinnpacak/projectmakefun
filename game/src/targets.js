// Hostile operators patrol between cover, acquire the player, return fire, and expose head hitboxes.
import * as THREE from 'three';
import { PALETTE } from './palette.js';

const SPAWNS = [[-7.5,-8],[-3.5,-9],[3.5,-9],[7.5,-8],[0,-6]];
const HEALTH=100, RESPAWN_SECONDS=4, FALL_SECONDS=.35;
export function createTargets(scene){
 const bodyMat=new THREE.MeshStandardMaterial({color:0xb44c45,roughness:.72}), headMat=new THREE.MeshStandardMaterial({color:0xe8a774,roughness:.55}), gearMat=new THREE.MeshStandardMaterial({color:0x293b43,metalness:.22,roughness:.62}), glowMat=new THREE.MeshBasicMaterial({color:0xff624f});
 const torsoGeo=new THREE.BoxGeometry(.54,.8,.34), headGeo=new THREE.SphereGeometry(.17,16,12), postGeo=new THREE.BoxGeometry(.12,.5,.12), baseGeo=new THREE.BoxGeometry(.52,.08,.52);
 const items=[], hitMeshes=[]; let now=0, healthCallback=()=>{};
 for(let i=0;i<SPAWNS.length;i++){
  const [x,z]=SPAWNS[i], group=new THREE.Group(); group.position.set(x,0,z);
  const base=new THREE.Mesh(baseGeo,gearMat); base.position.y=.04; const post=new THREE.Mesh(postGeo,gearMat); post.position.y=.3;
  const torso=new THREE.Mesh(torsoGeo,bodyMat); torso.position.y=1; torso.userData.part='torso';
  const head=new THREE.Mesh(headGeo,headMat); head.position.y=1.55; head.userData.part='head';
  const pack=new THREE.Mesh(new THREE.BoxGeometry(.28,.42,.18),gearMat); pack.position.set(0,1.02,.23);
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.045,8,8),glowMat); lamp.position.set(0,1.04,-.19);
  group.add(base,post,torso,head,pack,lamp); group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}}); scene.add(group);
  const item={group,torso,head,health:HEALTH,alive:true,fall:0,respawnAt:0,phase:i*1.9,home:new THREE.Vector3(x,0,z),waypoint:i%2?1:-1,fire:1+i*.33,flash:0,side:i<3?'DEFENDERS':'RAIDERS'};
  torso.userData.target=item; head.userData.target=item; hitMeshes.push(torso,head); items.push(item);
 }
 function damage(mesh,amount){const item=mesh.userData.target;if(!item||!item.alive)return false;item.health-=amount;if(item.health>0)return false;item.alive=false;item.fall=0;item.respawnAt=now+RESPAWN_SECONDS;return true;}
 function step(dt,time,playerPos){now=time;for(const item of items){if(!item.alive){item.fall=Math.min(1,item.fall+dt/FALL_SECONDS);item.group.rotation.x=-item.fall*1.4;item.group.position.y=-item.fall*.1;if(time>=item.respawnAt){item.alive=true;item.health=HEALTH;item.fall=0;item.group.rotation.x=0;item.group.position.copy(item.home);}continue;}
   item.group.position.y=0; const lane=item.waypoint===1?2.7:-2.7, dx=lane-item.group.position.x, dz=-4.4-item.group.position.z, d=Math.hypot(dx,dz)||1;
   item.group.position.x+=dx/d*dt*.85; item.group.position.z+=dz/d*dt*.85; if(d<.6)item.waypoint*=-1;
   const px=playerPos.x-item.group.position.x,pz=playerPos.z-item.group.position.z,dist=Math.hypot(px,pz); item.group.rotation.y=Math.atan2(-px,-pz);
   item.flash=Math.max(0,item.flash-dt); if(dist<15){item.fire-=dt;if(item.fire<=0){item.fire=1.45+((items.indexOf(item)%3)*.28);item.flash=.09; if(dist<11&&Math.random()<.28)healthCallback(8+Math.random()*7);}}
  }}
 return {items,hitMeshes,damage,step,remaining(){return items.filter(i=>i.alive).length;},aimPoint(index){const i=items[index%items.length];return new THREE.Vector3(i.group.position.x,i.torso.position.y,i.group.position.z);},onPlayerDamage(fn){healthCallback=fn;},reset(){for(const i of items){i.alive=true;i.health=HEALTH;i.fall=0;i.group.rotation.set(0,0,0);i.group.position.copy(i.home);}}};
}
