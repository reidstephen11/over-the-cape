import * as THREE from 'three';
import {buildPatrolBody,buildPatrolWheel} from './src/render/patrolProposal';
import {patrolTuning as t} from './src/data/patrol';
const g=buildPatrolBody(t,buildPatrolWheel(t));const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));m.updateMatrixWorld();
const c=new THREE.PerspectiveCamera(36,1200/860,.05,200);c.position.set(2.3,1.1,4.5);c.lookAt(.4,.5,2.3);c.updateMatrixWorld();const ray=new THREE.Raycaster();
for(const [x,y] of [[970,381],[950,388],[1000,373],[900,404],[1060,355],[1020,363]]){
 ray.setFromCamera(new THREE.Vector2(x/600-1,1-y/430),c);const h=ray.intersectObject(m)[0];if(!h)continue;const i=h.faceIndex!*3;
 console.log(JSON.stringify({pixel:[x,y],point:h.point.toArray(),slot:g.attributes.materialSlot.getX(i),tag:g.attributes.tag.getX(i),vertices:[i,i+1,i+2].map(k=>new THREE.Vector3().fromBufferAttribute(g.attributes.position,k).toArray())}));
}
