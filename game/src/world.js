// A sunken relay yard cut into black basalt, marked in oxidized copper and hazard white.
import * as THREE from 'three';
import { PALETTE } from './palette.js';
export function createWorld(scene){
 const group=new THREE.Group();scene.add(group);const mats={};for(const [name,color] of Object.entries(PALETTE))mats[name]=new THREE.MeshStandardMaterial({color,roughness:name==='accent'?.46:.88,metalness:name==='ink'?.32:.06});
 const floor=new THREE.MeshStandardMaterial({color:0x17272d,roughness:.94}), trim=new THREE.MeshStandardMaterial({color:0xbd744c,roughness:.57,metalness:.35}), emissive=new THREE.MeshStandardMaterial({color:0x294d50,emissive:0x10282b,roughness:.45,metalness:.25});
 const colliders=[],shootables=[];
 function box(w,h,d,x,y,z,mat,solid=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);if(solid){colliders.push(new THREE.Box3().setFromObject(m));shootables.push(m);}return m;}
 box(26,.4,26,0,-.2,0,floor);box(.5,5,26,-13,2.5,0,mats.surface);box(.5,5,26,13,2.5,0,mats.surface);box(26,5,.5,0,2.5,-13,mats.surface);box(26,5,.5,0,2.5,13,mats.surface);
 // Paired low barriers shape three readable lanes without sealing the long sightlines.
 box(4.2,1.45,1.15,-4, .725,-4.2,mats.hairline);box(4.2,1.45,1.15,4,.725,-4.2,mats.hairline);
 box(1.25,1.05,4,-7,.525,1.5,mats.hairline);box(1.25,1.05,4,7,.525,1.5,mats.hairline);
 box(3.1,1.5,1.2,-4, .75,7,mats.surface);box(3.1,1.5,1.2,4,.75,7,mats.surface);
 box(1.6,2.8,1.6,0,1.4,-2,mats.ink);box(2.8,.8,1.2,-9,.4,-8,mats.accent);box(2.8,.8,1.2,9,.4,-8,mats.accent);
 // Relay uplink consoles: approach the amber terminal to arm the objective.
 box(2.1,1.05,1.05,-8,.52,-10,emissive);box(.08,.08,1.18, -8,1.1,-10,trim,false);
 box(2.1,1.05,1.05,8,.52,-10,emissive);box(.08,.08,1.18,8,1.1,-10,trim,false);
 // Distinct directional markings and architectural seams, intentionally non-colliding.
 for(let z=-11;z<=11;z+=2){box(.045,.012,24,-11,.012,z,trim,false);box(.045,.012,24,11,.012,z,trim,false);}
 for(const x of [-8,0,8]){box(.06,.02,8,x,.02,0,trim,false);}
 const sky=new THREE.HemisphereLight(0xb6d5d1,0x182327,1.25);scene.add(sky);
 const key=new THREE.DirectionalLight(0xffd1a1,2.5);key.position.set(-8,16,9);key.target.position.set(0,0,-2);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-18;key.shadow.camera.right=18;key.shadow.camera.top=18;key.shadow.camera.bottom=-18;key.shadow.camera.far=50;key.shadow.bias=-.0006;scene.add(key,key.target);
 for(const [x,z] of [[-10,-10],[10,-10],[-10,10],[10,10]]){const lamp=new THREE.PointLight(0x5faaa7,8,10,2);lamp.position.set(x,3.7,z);scene.add(lamp);}
 return {colliders,shootables,group};
}
