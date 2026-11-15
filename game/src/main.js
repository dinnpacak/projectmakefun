// Boot and the one loop: a fixed 60 Hz simulation feeding a render at the display's rate.
// ?shot=start|play|end with &seed=N sets up a deterministic frame for a capture, renders it
// twice, then freezes it and sets window.__shotReady.
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { createWorld } from './world.js';
import { createInput } from './input.js';
import { createPlayer } from './player.js';
import { createWeapon } from './weapon.js';
import { createTargets } from './targets.js';
import { createHud } from './hud.js';

const FIXED_STEP = 1 / 60;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;

function mulberry32(initial) {
  let a = initial;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(seed);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.canvas);
scene.fog = new THREE.Fog(new THREE.Color(PALETTE.canvas), 18, 46);
const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.05, 140);
scene.add(camera);

const world = createWorld(scene);
const targets = createTargets(scene);
const weapon = createWeapon(camera);
const hud = createHud();
const player = createPlayer(world.colliders);
const input = createInput(renderer.domElement, onLockChange);
const raycaster = new THREE.Raycaster();
raycaster.far = 80;
const shootables = world.shootables.concat(targets.hitMeshes);
const direction = new THREE.Vector3();

const PHASES={BUY:'BUY',LIVE:'LIVE',PLANT:'PLANT',ROUND_END:'ROUND_END'};
const body=player.state, markerHoldMs=shot?4000:90, lastTime=performance.now();
let accumulator=0, elapsed=0;
let phase=PHASES.BUY, round=1, phaseTime=0, health=100, credits=800, wins=0, losses=0, planted=false, defuse=0, kills=0;
const STORE={rifle:{cost:2700,mag:30,reserve:90},smg:{cost:1400,mag:36,reserve:108},shotgun:{cost:1900,mag:8,reserve:40}};
let selected='rifle';
const damageText=document.getElementById('damage-flash');
const statusText=document.getElementById('round-objective');
const storeText=document.getElementById('buy-menu');
const objective=new THREE.Mesh(new THREE.OctahedronGeometry(.26,0),new THREE.MeshStandardMaterial({color:0xd38a57,emissive:0x7a2b13,emissiveIntensity:1.4}));objective.position.set(-8,1.65,-10);scene.add(objective);
const objectiveRing=new THREE.Mesh(new THREE.TorusGeometry(1.6,.035,8,48),new THREE.MeshBasicMaterial({color:0xd38a57,transparent:true,opacity:.7}));objectiveRing.rotation.x=Math.PI/2;objectiveRing.position.set(-8,.08,-10);scene.add(objectiveRing);
hud.setAmmo(weapon.state.mag,weapon.state.reserve);hud.setScore(0);
targets.onPlayerDamage((amount)=>{if(phase!==PHASES.LIVE&&phase!==PHASES.PLANT)return;health=Math.max(0,health-amount);damageText.classList.add('show');setTimeout(()=>damageText.classList.remove('show'),150);if(health===0)finishRound(false);});
hud.onPlay(()=>{if(phase===PHASES.BUY){phase=PHASES.LIVE;phaseTime=0;input.requestLock();}});
function buy(name){if(phase!==PHASES.BUY)return;const item=STORE[name];if(!item||credits<item.cost)return;credits-=item.cost;selected=name;weapon.configure(item.mag,item.reserve);hud.setAmmo(weapon.state.mag,weapon.state.reserve);}
function finishRound(won){phase=PHASES.ROUND_END;phaseTime=0;if(won){wins++;credits+=3250;kills+=1;}else{losses++;credits+=1900;}hud.setScore(wins*100+losses*40);if(document.pointerLockElement)document.exitPointerLock();hud.showOverlay(won?'end':'paused',wins*100+losses*40);}
function restart(){round++;phase=PHASES.BUY;phaseTime=0;health=100;planted=false;defuse=0;player.state.position.set(0,0,9.5);targets.reset();weapon.refill();weapon.configure(STORE[selected].mag,STORE[selected].reserve);hud.setAmmo(weapon.state.mag,weapon.state.reserve);hud.showOverlay('start',wins*100+losses*40);}
function onLockChange(locked){if(shot)return;if(locked){if(phase===PHASES.BUY){phase=PHASES.LIVE;phaseTime=0;}started=true;hud.hideOverlay();}else if(phase===PHASES.LIVE||phase===PHASES.PLANT)hud.showOverlay('paused',wins*100+losses*40);}
function syncCamera(){camera.position.set(body.position.x,body.position.y+body.eye,body.position.z);camera.rotation.set(body.pitch,body.yaw,0,'YXZ');}
function aimAt(point){const dx=point.x-body.position.x,dy=point.y-(body.position.y+body.eye),dz=point.z-body.position.z,length=Math.hypot(dx,dy,dz)||1;body.yaw=Math.atan2(-dx,-dz);body.pitch=Math.asin(Math.max(-1,Math.min(1,dy/length)));syncCamera();}
function throwGrenade(){if(phase!==PHASES.LIVE||credits<450)return;credits-=450;camera.getWorldDirection(direction);const origin=camera.position.clone();const grenade=new THREE.Mesh(new THREE.SphereGeometry(.14,12,8),new THREE.MeshStandardMaterial({color:0x73c8b1,emissive:0x174a43}));grenade.position.copy(origin);scene.add(grenade);const velocity=direction.clone().multiplyScalar(9);let t=0;const tick=setInterval(()=>{t+=.04;velocity.y-=.35;grenade.position.addScaledVector(velocity,.04);if(t>1.3){clearInterval(tick);const blast=new THREE.PointLight(0x73c8b1,65,9);blast.position.copy(grenade.position);scene.add(blast);setTimeout(()=>{scene.remove(blast);scene.remove(grenade);},220);for(const item of targets.items){if(item.alive&&item.group.position.distanceTo(grenade.position)<5)targets.damage(item.torso,100);}}},40);}
function shoot(spread){if(!weapon.takeRound())return false;camera.getWorldDirection(direction);direction.x+=(random()*2-1)*spread;direction.y+=(random()*2-1)*spread;direction.z+=(random()*2-1)*spread;direction.normalize();scene.updateMatrixWorld(true);raycaster.set(camera.position,direction);const hit=raycaster.intersectObjects(shootables,false)[0];if(hit&&hit.object.userData.target){const killed=targets.damage(hit.object,hit.object.userData.part==='head'?100:34);if(killed){kills++;credits+=300;hud.setScore(wins*100+losses*40+kills*10);}hud.hitMarker(killed,markerHoldMs);if(targets.remaining()===0)finishRound(true);}weapon.pullTrigger();player.recoil(.009+random()*.004,(random()*2-1)*.004);hud.setAmmo(weapon.state.mag,weapon.state.reserve);return true;}
function step(dt){elapsed+=dt;player.step(dt,input.state.keys);weapon.step(dt);targets.step(dt,elapsed,body.position);if(phase===PHASES.LIVE||phase===PHASES.PLANT){phaseTime+=dt;if(!planted&&phaseTime>22)phase=PHASES.PLANT;if(planted&&phaseTime>45)finishRound(false);if(!planted&&body.position.distanceTo(objective.position)<2.2&&input.state.keys.has('KeyE')){planted=true;phase=PHASES.PLANT;phaseTime=0;objective.material.color.set(0xff4a3d);}if(planted&&body.position.distanceTo(objective.position)<2.2&&input.state.keys.has('KeyF')){defuse+=dt;if(defuse>4)finishRound(true);}else defuse=0;if(phaseTime>100&&!planted)finishRound(false);}else if(phase===PHASES.ROUND_END){phaseTime+=dt;if(phaseTime>3)restart();}}
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-lastTime)/1000,.1);lastTime=now;if(!frozen){const look=input.takeLook();player.look(look.x,look.y);if(input.state.firing&&weapon.ready())shoot(weapon.spread(player.groundSpeed()));if(input.state.keys.has('KeyR'))weapon.reload();if(input.state.keys.has('Digit1'))buy('rifle');if(input.state.keys.has('Digit2'))buy('smg');if(input.state.keys.has('Digit3'))buy('shotgun');if(input.state.keys.has('KeyG'))throwGrenade();if(input.state.keys.has('KeyB'))storeText.classList.toggle('show');accumulator+=dt;let steps=0;while(accumulator>=FIXED_STEP&&steps<5){step(FIXED_STEP);accumulator-=FIXED_STEP;steps++;}if(accumulator>FIXED_STEP*5)accumulator=0;syncCamera();statusText.textContent=`ROUND ${String(round).padStart(2,'0')} · ${phase} · ${Math.max(0,Math.ceil((phase===PHASES.BUY?12:100-phaseTime)))}s · $${credits} · HP ${health} · ${kills} CONFIRMED · ${wins}W ${losses}L`;statusText.classList.add('show');if(phase===PHASES.BUY)storeText.classList.add('show');else storeText.classList.remove('show');objective.rotation.y+=dt*.8;}renderer.render(scene,camera);}
function settle(steps){for(let i=0;i<steps;i++)step(FIXED_STEP);}
function runShot(name){hud.hideOverlay();body.pitch=0;body.yaw=0;if(name==='play'||name==='end'){body.position.set(0,0,9.5);phase=PHASES.LIVE;const count=name==='play'?1:targets.items.length;for(let i=0;i<count;i++){const p=targets.aimPoint(i);for(let n=0;n<3;n++){aimAt(p);shoot(0);if(n<2)settle(8);}}settle(12);aimAt(targets.aimPoint(0));}else{phase=PHASES.BUY;body.position.set(0,0,9.5);settle(20);aimAt(new THREE.Vector3(0,1.5,-5));hud.showOverlay('start',0);}statusText.textContent=`ROUND 01 · ${phase} · 100s · $${credits} · HP ${health} · 0 CONFIRMED · 0W 0L`;statusText.classList.add('show');storeText.classList.add('show');paintTwiceThenReady();}
function paintTwiceThenReady(){let painted=0;function paint(){requestAnimationFrame(paint);syncCamera();renderer.render(scene,camera);if(++painted===2){window.__shotReady=true;frozen=true;}}requestAnimationFrame(paint);}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
syncCamera();if(shot)runShot(shot);else requestAnimationFrame(frame);
