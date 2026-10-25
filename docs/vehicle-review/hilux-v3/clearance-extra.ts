import * as THREE from 'three';
import {buildHiluxWheel} from './src/render/hiluxProposal';
import {hiluxTuning as t} from './src/data/hilux';
const wp=buildHiluxWheel(t).getAttribute('position');const p=new THREE.Vector3();
const volumes=[];
for(const x of [-.42,.42])volumes.push({name:`chassis-${x}`,min:[x-.045,-.095,-1.99],max:[x+.045,.055,2.35]});
for(const w of t.wheels){const s=Math.sign(w.x),wx=w.front?.4:.51;const x=s*(wx+.835-.05)/2;volumes.push({name:`well-roof-${w.x}-${w.z}`,min:[x-(.835-.05-wx)/2,.367,w.z-.376],max:[x+(.835-.05-wx)/2,.397,w.z+.376]});}
const hits:Record<string,number>={};const examples:unknown[]=[];
for(let wi=0;wi<4;wi++)for(const deg of t.wheels[wi].front?[-31,0,31]:[0])for(const bump of [0,.11]){
 const w=t.wheels[wi],r=new THREE.Matrix4().makeRotationY(deg*Math.PI/180);
 for(let i=0;i<wp.count;i++){
  p.fromBufferAttribute(wp,i).applyMatrix4(r).add(new THREE.Vector3(w.x,-.12+bump,w.z));
  for(const v of volumes)if(p.x>v.min[0]+.001&&p.x<v.max[0]-.001&&p.y>v.min[1]+.001&&p.y<v.max[1]-.001&&p.z>v.min[2]+.001&&p.z<v.max[2]-.001){hits[v.name]=(hits[v.name]??0)+1;if(examples.length<10)examples.push({wi,deg,bump,part:v.name,point:p.toArray()});}
 }
}
console.log(JSON.stringify({hits,examples},null,2));
