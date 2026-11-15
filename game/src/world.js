// Bright voxel relay garden. Existing cover volumes retain the original combat lanes.
import * as THREE from 'three';
export function createWorld(scene){
 const group=new THREE.Group();scene.add(group);
 const mat=color=>new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true});
 const grass=mat(0x8bd44b),wall=mat(0xe9cd8c),stone=mat(0x45bfc1),wood=mat(0xbc743d),plank=mat(0xe5a55c),leaf=mat(0x3ba64f),lime=mat(0x70c64a),cream=mat(0xffefc4),blue=mat(0x467fc9);
 const colliders=[],shootables=[];
 function box(w,h,d,x,y,z,material,solid=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);if(solid){colliders.push(new THREE.Box3().setFromObject(m));shootables.push(m);}return m;}
 box(26,.4,26,0,-.2,0,grass);
 for(const [w,d,x,z] of [[.5,26,-13,0],[.5,26,13,0],[26,.5,0,-13],[26,.5,0,13]]){box(w,5,d,x,2.5,z,wall);box(w+.1,.25,d+.1,x,5.05,z,cream,false);}
 box(4.2,1.45,1.15,-4,.725,-4.2,stone);box(4.2,1.45,1.15,4,.725,-4.2,stone);
 box(1.25,1.05,4,-7,.525,1.5,wood);box(1.25,1.05,4,7,.525,1.5,wood);
 box(3.1,1.5,1.2,-4,.75,7,wood);box(3.1,1.5,1.2,4,.75,7,wood);
 box(1.6,2.8,1.6,0,1.4,-2,blue);
 for(const x of [-9,9]){box(2.8,.8,1.2,x,.4,-8,plank);for(const dx of [-1.1,1.1])box(.12,.83,1.24,x+dx,.42,-8,wood,false);}
 for(const x of [-8,8]){box(2.1,1.05,1.05,x,.52,-10,blue);box(1.7,.16,1.15,x,1.1,-10,cream,false);}
 // Slatted wooden ramps alongside cover; physical stepped supports allow jumping onto them.
 for(const x of [-9.5,9.5])for(let i=0;i<8;i++){const h=.16*(i+1);box(2,h,.42,x,h/2,4-i*.4,wood);box(2.05,.045,.39,x,h+.022,4-i*.4,plank,false);}
 function tree(x,z,scale=1){box(.55,2.5*scale,.55,x,1.25*scale,z,wood,false);box(2.5*scale,1.35*scale,2.5*scale,x,3*scale,z,leaf,false);box(1.8*scale,1.1*scale,1.8*scale,x+.25,3.9*scale,z,lime,false);}
 for(const [x,z,s] of [[-11,-10,1.2],[11,-10,1.15],[-11,-3,1],[11,-3,1],[-11,8,1.3],[11,8,1.2],[-6,-15,1.6],[6,-16,1.5]])tree(x,z,s);
 // Broad path tiles and small flowers add depth without new collision obstacles.
 for(let z=-11;z<=11;z+=2)box(2.2,.015,1.65,0,.012,z,cream,false);
 for(let i=0;i<28;i++){const x=(i%2?1:-1)*(10.5+(i%3)*.35),z=-11+(i*1.71)%23;box(.16,.22,.16,x,.11,z,i%3?cream:plank,false);}
 const cloud=mat(0xffffff);for(const [x,y,z] of [[-16,14,-30],[12,12,-29],[0,16,-38]]){box(8,1.3,2.4,x,y,z,cloud,false);box(4,1.4,2.2,x+1,y+1,z,cloud,false);}
 scene.add(new THREE.HemisphereLight(0xe4f7ff,0x7eab45,2.2));
 const key=new THREE.DirectionalLight(0xfff0c7,2.6);key.position.set(-8,16,9);key.target.position.set(0,0,-2);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-18,right:18,top:18,bottom:-18,far:50});key.shadow.bias=-.0006;scene.add(key,key.target);
 return {colliders,shootables,group};
}
