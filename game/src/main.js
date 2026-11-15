// Iron Meridian: offline relay assault, fixed-step simulation and explicit round rules.
import * as THREE from 'three';
import {PALETTE} from './palette.js';
import {createWorld} from './world.js';
import {createInput} from './input.js';
import {createPlayer} from './player.js';
import {createWeapon} from './weapon.js';
import {createTargets} from './targets.js';
import {createHud} from './hud.js';
import {createRound,STORE} from './round.mjs';
const params=new URLSearchParams(location.search),shot=params.get('shot');
let seed=Number(params.get('seed'))||1;
function random(){seed|=0;seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;}
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.getElementById('game').appendChild(renderer.domElement);
const scene=new THREE.Scene();
scene.background=new THREE.Color(PALETTE.canvas);
scene.fog=new THREE.Fog(PALETTE.canvas,18,46);
const camera=new THREE.PerspectiveCamera(74,innerWidth/innerHeight,.05,140);
scene.add(camera);
const world=createWorld(scene),targets=createTargets(scene),weapon=createWeapon(camera);
const player=createPlayer(world.colliders),hud=createHud(),rules=createRound();
const input=createInput(renderer.domElement,locked=>{
 if(shot)return;
 if(locked){rules.deploy();hud.hideOverlay();}
 else if(rules.phase==='LIVE'||rules.phase==='PLANT')hud.showOverlay('paused',score());
});
const ray=new THREE.Raycaster();ray.far=80;
const direction=new THREE.Vector3();
const status=document.getElementById('round-objective');
const store=document.getElementById('buy-menu');
const damage=document.getElementById('damage-flash');
const relay=new THREE.Mesh(new THREE.OctahedronGeometry(.26),new THREE.MeshStandardMaterial({color:0xd38a57,emissive:0x7a2b13,emissiveIntensity:1.4}));
relay.position.set(-8,1.65,-10);scene.add(relay);
const ring=new THREE.Mesh(new THREE.TorusGeometry(1.6,.035,8,48),new THREE.MeshBasicMaterial({color:0xd38a57,transparent:true,opacity:.7}));
ring.rotation.x=Math.PI/2;ring.position.set(-8,.08,-10);scene.add(ring);
let lastTime=performance.now(),accumulator=0,elapsed=0,frozen=false;
let previousPhase=rules.phase,previousRound=rules.round,armory=true;
const grenades=[];
function score(){return rules.wins*100+rules.kills*10;}
function syncCamera(){const b=player.state;camera.position.set(b.position.x,b.position.y+b.eye,b.position.z);camera.rotation.set(b.pitch,b.yaw,0,'YXZ');}
function aimAt(p){const b=player.state,dx=p.x-b.position.x,dy=p.y-b.position.y-b.eye,dz=p.z-b.position.z;b.yaw=Math.atan2(-dx,-dz);b.pitch=Math.asin(dy/(Math.hypot(dx,dy,dz)||1));syncCamera();}
function buy(name){if(rules.buy(name))weapon.configure(STORE[name].mag,STORE[name].reserve);}
hud.onPlay(()=>{
 if(rules.phase==='ROUND_END'){rules.next();resetRound();}
 rules.deploy();input.requestLock();
});
targets.onPlayerDamage(amount=>{
 rules.hit(amount);damage.classList.add('show');
 setTimeout(()=>damage.classList.remove('show'),140);
});
function resetRound(){
 player.state.position.set(0,0,9.5);targets.reset();weapon.refill();
 weapon.configure(STORE[rules.selected].mag,STORE[rules.selected].reserve);
 relay.material.color.set(0xd38a57);armory=true;hud.showOverlay('start',score());
}
function shoot(){
 if(!weapon.ready()||!weapon.takeRound())return;
 camera.getWorldDirection(direction);
 const spread=weapon.spread(player.groundSpeed());
 direction.x+=(random()*2-1)*spread;direction.y+=(random()*2-1)*spread;
 direction.normalize();scene.updateMatrixWorld(true);ray.set(camera.position,direction);
 const living=targets.items.filter(t=>t.alive).flatMap(t=>[t.torso,t.head]);
 const hit=ray.intersectObjects(world.shootables.concat(living),false)[0];
 if(hit?.object.userData.target){
  const killed=targets.damage(hit.object,hit.object.userData.part==='head'?100:34);
  if(killed)rules.confirmKill();hud.hitMarker(killed,shot?4000:90);
 }
 weapon.pullTrigger();player.recoil(.009+random()*.004,(random()*2-1)*.004);
}
function throwGrenade(){
 if(rules.credits<450||grenades.length>=2)return;
 rules.credits-=450;camera.getWorldDirection(direction);
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),new THREE.MeshStandardMaterial({color:0x73c8b1,emissive:0x174a43}));
 mesh.position.copy(camera.position);scene.add(mesh);
 grenades.push({mesh,velocity:direction.clone().multiplyScalar(11).add(new THREE.Vector3(0,3,0)),life:1.4});
}
function tick(dt){
 const active=Boolean(shot||input.state.locked);
 if(active&&(rules.phase==='LIVE'||rules.phase==='PLANT')){
  elapsed+=dt;player.step(dt,input.state.keys);weapon.step(dt);
  targets.step(dt,elapsed,player.state.position);
  for(let i=grenades.length-1;i>=0;i--){
   const g=grenades[i];g.life-=dt;g.velocity.y-=9.8*dt;g.mesh.position.addScaledVector(g.velocity,dt);
   if(g.mesh.position.y<.15){g.mesh.position.y=.15;g.velocity.y=Math.abs(g.velocity.y)*.35;g.velocity.x*=.7;g.velocity.z*=.7;}
   if(g.life<=0){
    for(const t of targets.items)if(t.alive&&t.group.position.distanceTo(g.mesh.position)<5&&targets.damage(t.torso,100))rules.confirmKill();
    scene.remove(g.mesh);g.mesh.geometry.dispose();g.mesh.material.dispose();grenades.splice(i,1);
   }
  }
 }
 const b=player.state.position;
 rules.tick(dt,active,{onSite:Math.hypot(b.x+8,b.z+10)<2.2,interact:input.state.keys.has('KeyE'),clear:targets.remaining()===0});
 if(rules.round!==previousRound){previousRound=rules.round;resetRound();}
 if(rules.phase!==previousPhase){
  if(rules.phase==='ROUND_END'){
   if(document.pointerLockElement)document.exitPointerLock();
   hud.showOverlay(rules.health>0?'end':'paused',score());
   document.getElementById('overlay-copy').textContent=rules.reason;
  }
  previousPhase=rules.phase;
 }
}
window.addEventListener('keydown',event=>{
 if(event.repeat)return;
 if(event.code==='KeyB')armory=!armory;
 const name={Digit1:'rifle',Digit2:'smg',Digit3:'shotgun'}[event.code];
 if(name)buy(name);
 if(event.code==='KeyG'&&input.state.locked&&rules.phase==='LIVE')throwGrenade();
});
function updateHud(){
 hud.setAmmo(weapon.state.mag,weapon.state.reserve);hud.setScore(score());
 const seconds=rules.phase==='BUY'?'READY':Math.max(0,Math.ceil((rules.planted?35:100)-rules.time))+'s';
 const objective=rules.planted?'HOLD UPLINK':rules.progress>0?'ARMING '+Math.floor(rules.progress/3*100)+'%':'WEST RELAY · HOLD E';
 status.textContent=`R${String(rules.round).padStart(2,'0')} · ${rules.phase} · ${seconds} · $${rules.credits} · HP ${Math.ceil(rules.health)} · ${rules.kills} K · ${rules.wins}W ${rules.losses}L · ${objective}`;
 status.classList.add('show');store.classList.toggle('show',rules.phase==='BUY'&&armory);
 relay.rotation.y=elapsed*.8;ring.material.opacity=rules.planted?.5+Math.sin(elapsed*6)*.3:.7;
}
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min((now-lastTime)/1000,.1);lastTime=now;
 if(!frozen){
  if(input.state.locked){
   const look=input.takeLook();player.look(look.x,look.y);
   if(input.state.firing&&(rules.phase==='LIVE'||rules.phase==='PLANT'))shoot();
   if(input.state.keys.has('KeyR'))weapon.reload();
  }
  accumulator+=dt;let steps=0;
  while(accumulator>=1/60&&steps++<6){tick(1/60);accumulator-=1/60;}
  if(accumulator>.1)accumulator=0;
  syncCamera();updateHud();
 }
 renderer.render(scene,camera);
}
function runShot(name){
 hud.hideOverlay();player.state.position.set(0,0,9.5);
 if(name==='start'){hud.showOverlay('start',0);aimAt(new THREE.Vector3(0,1.5,-5));}
 else{
  rules.deploy();for(let i=0;i<90;i++)tick(1/60);aimAt(targets.aimPoint(0));
  if(name==='end'){rules.finish(true,'Uplink complete. Sector secured.');hud.showOverlay('end',score());}
 }
 updateHud();syncCamera();frozen=true;
 let paints=0;
 function paint(){renderer.render(scene,camera);if(++paints<2)requestAnimationFrame(paint);else window.__shotReady=true;}
 requestAnimationFrame(paint);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
syncCamera();updateHud();
if(shot)runShot(shot);else requestAnimationFrame(frame);
