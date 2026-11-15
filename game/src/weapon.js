// Weapon profiles share handling but reward deliberate shots and timed reloads.
import * as THREE from 'three';
import { PALETTE } from './palette.js';
const FIRE_GAP=.11, RELOAD_TIME=1.65, MOVE_REFERENCE=5.2;
export function createWeapon(camera){
 const model=new THREE.Group();model.name='scoped-relay-rifle';model.position.set(.27,-.25,-.43);camera.add(model);
 const addBlock=(w,h,d,x,y,z,color)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.8}));m.position.set(x,y,z);model.add(m);return m;};
 // Long black precision-rifle silhouette; the equipped Relay Rifle keeps its original rules.
 addBlock(.17,.16,.61,0,0,-.05,0x151c24);addBlock(.13,.12,.36,0,.02,-.51,0x222b32);
 addBlock(.065,.065,.65,0,.035,-.96,0x0b1018);addBlock(.12,.1,.14,0,.035,-1.32,0x26313b);
 addBlock(.17,.18,.32,0,-.025,.39,0x101722);addBlock(.09,.21,.11,0,-.16,.13,0x171e23);
 addBlock(.12,.22,.17,0,-.17,-.13,0x303b43);addBlock(.07,.09,.08,0,.13,-.12,0x303b43);
 addBlock(.19,.18,.4,0,.245,-.17,0x101822);addBlock(.24,.23,.1,0,.245,.055,0x080f18);
 const lens=new THREE.Mesh(new THREE.PlaneGeometry(.17,.16),new THREE.MeshStandardMaterial({color:0x32cfff,emissive:0x08aaff,emissiveIntensity:2,roughness:.15}));lens.position.set(0,.245,.112);model.add(lens);
 addBlock(.025,.025,.025,.07,.08,.05,0x55dfff);
 // Two squared sleeves, gloves and deterministic yellow / olive camouflage patches.
 for(const [x,y,z,w,d] of [[.03,-.29,.48,.21,.42],[-.22,-.22,-.17,.19,.46]]){
  addBlock(w,.19,d,x,y,z,0xe5b833);addBlock(w*.8,.12,.16,x,y+.04,z-.18,0xb88b31);
  for(let i=0;i<5;i++)addBlock(.07,.025,.085,x+(i%2?.055:-.055),y+.105,z-.14+i*.066,i%2?0x6b712d:0x927d24);
 }

 const flash=new THREE.Mesh(new THREE.PlaneGeometry(.24,.24),new THREE.MeshBasicMaterial({color:0xffc27a,transparent:true,opacity:.9,depthWrite:false,side:THREE.DoubleSide}));flash.position.set(.24,-.18,-.95);flash.visible=false;camera.add(flash);const lamp=new THREE.PointLight(0xffb75e,0,5);lamp.position.set(.24,-.16,-.6);camera.add(lamp);
 const state={mag:30,reserve:90,capacity:30,cooldown:0,reloadLeft:0,flash:0,kick:0,spreadBase:.0022,spreadMove:.028};
 function step(dt){state.cooldown=Math.max(0,state.cooldown-dt);state.flash=Math.max(0,state.flash-dt);state.kick+=(0-state.kick)*Math.min(1,dt*14);model.position.z=-.42+state.kick;model.rotation.x=state.kick*2.2;flash.visible=state.flash>0;flash.rotation.z=state.flash*30;lamp.intensity=state.flash>0?18:0;if(state.reloadLeft>0){state.reloadLeft=Math.max(0,state.reloadLeft-dt);model.rotation.x=-.55*Math.min(1,(RELOAD_TIME-state.reloadLeft)*2);if(state.reloadLeft===0){const take=Math.min(state.capacity-state.mag,state.reserve);state.mag+=take;state.reserve-=take;}}}
  return {
    state, step,
    configure(mag,reserve){state.capacity=mag;state.mag=mag;state.reserve=reserve;state.spreadBase=mag<=10?.012:mag>=36?.006:.0022;state.spreadMove=mag<=10?.055:mag>=36?.04:.028;},
    ready(){return state.mag>0&&state.cooldown===0&&state.reloadLeft===0;},
    pullTrigger(){state.cooldown=FIRE_GAP;state.flash=.06;state.kick=.055;},
    takeRound(){if(!state.mag)return false;state.mag--;return true;},
    reload(){if(state.reloadLeft||state.mag===state.capacity||!state.reserve)return;state.reloadLeft=RELOAD_TIME;},
    spread(speed){return state.spreadBase+Math.min(1,speed/MOVE_REFERENCE)*state.spreadMove;},
    refill(){state.mag=state.capacity;state.reserve=90;state.cooldown=0;state.reloadLeft=0;state.flash=0;state.kick=0;},
  };
}
