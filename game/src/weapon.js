// Weapon profiles share handling but reward deliberate shots and timed reloads.
import * as THREE from 'three';
import { PALETTE } from './palette.js';
const FIRE_GAP=.11, RELOAD_TIME=1.65, MOVE_REFERENCE=5.2;
export function createWeapon(camera){
 const grip=new THREE.MeshStandardMaterial({color:0x253b40,roughness:.58,metalness:.32}),bodyMat=new THREE.MeshStandardMaterial({color:0xb5b9aa,roughness:.43,metalness:.56});
 const model=new THREE.Group(),receiver=new THREE.Mesh(new THREE.BoxGeometry(.11,.12,.47),bodyMat),barrel=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,.52,10),grip),stock=new THREE.Mesh(new THREE.BoxGeometry(.09,.1,.24),grip);barrel.rotation.x=Math.PI/2;barrel.position.set(0,.025,-.45);stock.position.set(0,-.02,.3);model.add(receiver,barrel,stock);model.position.set(.24,-.2,-.42);camera.add(model);
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
