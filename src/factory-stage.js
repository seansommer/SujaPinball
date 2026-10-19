import * as T from 'three';
import {BANK,BUMPERS,JUICES,rampPoint} from './table.js';
import {CabinetDisplay} from './cabinet-display.js';
const at=(x,y,z=0)=>new T.Vector3(x-50,z,y-90);
const palette=['#ffbb4f','#ce8dff','#a7f970'];

// The artwork's factory becomes live machinery. Every moving game toy is
// tied to simulation state; decoration stays outside the playable lanes.
export class FactoryStage{
 constructor(owner){
  this.o=owner;this.scene=owner.scene;this.display=new CabinetDisplay();this.clock=1;this.banner=null;
  this.gold=new T.MeshStandardMaterial({color:'#efc572',metalness:.85,roughness:.22});
  this.emerald=new T.MeshPhysicalMaterial({color:'#12583b',metalness:.45,roughness:.23,clearcoat:1});
  this.glass=new T.MeshPhysicalMaterial({color:'#d5ffe6',transparent:true,opacity:.3,roughness:.1,metalness:.1,clearcoat:1,depthWrite:false});
  this.buildDisplays();this.buildPrint();this.buildSpinner();this.buildTargets();this.buildConveyor();this.buildLights();this.buildReactions();this.buildMachinery();
 }
 mesh(g,m,parent=this.scene){return this.o.mesh(g,m,parent);}
 plane(w,h,material,x,y,z=.15){const m=this.mesh(new T.PlaneGeometry(w,h),material);m.rotation.x=-Math.PI/2;m.position.copy(at(x,y,z));m.castShadow=false;return m;}
 texture(w,h){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(4,this.o.renderer.capabilities.getMaxAnisotropy());return{canvas,c:canvas.getContext('2d'),texture};}
 buildDisplays(){
  const base=this.mesh(new T.BoxGeometry(100,3.5,23),this.o.dark);base.position.copy(at(50,-10,.7));
  this.o.tube([[2,-21],[98,-21],[98,1],[2,1],[2,-21]].map(([x,y])=>at(x,y,3)),.75,this.gold);
  this.scoreGlass=this.texture(1024,240);this.plane(94,19,new T.MeshBasicMaterial({map:this.scoreGlass.texture,toneMapped:false}),50,-10,3.1);
  this.missionGlass=this.texture(1024,180);this.plane(61,13,new T.MeshBasicMaterial({map:this.missionGlass.texture,toneMapped:false}),50,119,.2);
  for(const x of[3,97])for(const y of[-19,-1])this.o.cyl(x,y,.6,.3,this.o.metal,3.1);
 }
 buildPrint(){
  const {canvas,c,texture}=this.texture(1024,2048);c.scale(1024/100,2048/180);c.lineCap=c.lineJoin='round';
  const path=(points,color,width)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();};
  for(const [x,y,r]of [[29,47,10],[70,47,10],[50,27,10],[50,79,12]]){
   c.strokeStyle='#d9b76b88';c.lineWidth=.19;
   for(const radius of[r,r+1.3,r+2.1]){c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.stroke();}
   for(let i=0;i<18;i++){const a=i*Math.PI/9;path([[x+Math.cos(a)*(r+2.3),y+Math.sin(a)*(r+2.3)],[x+Math.cos(a)*(r+3.8),y+Math.sin(a)*(r+3.8)]],'#c5a96988',.2);}
  }
  for(const side of[-1,1]){
   path([[50+side*39,31],[50+side*39,60],[50+side*29,66],[50+side*29,104],[50+side*12,133]],'#9eff8466',.55);
   path([[50+side*37,32],[50+side*37,58],[50+side*26,66],[50+side*26,101],[50+side*9,133]],'#e5c58088',.18);
   for(let i=0;i<7;i++){
    const x=50+side*37,y=64+i*9;c.save();c.translate(x,y);c.rotate(side*.7);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-6,-7,2,-10,3,-8);c.bezierCurveTo(6,-2,1,1,0,0);c.fillStyle=i%2?'#7ad47b22':'#c7b16422';c.fill();c.strokeStyle='#d7bc6b66';c.lineWidth=.16;c.stroke();c.restore();
   }
  }
  for(const [x,y]of[[31,111],[69,133]]){
   c.strokeStyle='#deb56866';c.lineWidth=.22;c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;path([[x+Math.cos(a),y+Math.sin(a)],[x+Math.cos(a)*4.5,y+Math.sin(a)*4.5]],'#deb56866',.16);}
  }
  c.textAlign='center';c.font='900 2.6px Arial';c.fillStyle='#dec58e';c.fillText('SPIN THE PRESS',23,105);c.fillText('FRESH RETURN',14,157);c.fillText('FRESH RETURN',81,157);
  c.font='900 5.3px Arial';c.fillStyle='#d6f4ac55';c.fillText('SUJA',50,141);c.font='700 1.6px Arial';c.fillStyle='#d9c79c88';c.fillText('COLD PRESSED  /  FULL TILT',50,145);
  texture.needsUpdate=true;this.plane(100,180,new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}),50,90,.045);
 }
 buildSpinner(){
  for(const x of[16,30]){this.o.cyl(x,94,.6,8,this.o.metal);this.o.cyl(x,94,1,.7,this.gold,1);}
  this.o.tube([at(16,94,7),at(30,94,7)],.35,this.o.metal);
  this.spinner=new T.Group();this.spinner.position.copy(at(23,94,7));this.scene.add(this.spinner);
  const mat=new T.MeshStandardMaterial({color:'#d8bdff',emissive:'#8c39e0',emissiveIntensity:.5,metalness:.6,roughness:.22});
  this.spinnerPlate=this.mesh(new T.BoxGeometry(10,5,.55),mat,this.spinner);
  const leaf=this.mesh(new T.TorusGeometry(1.2,.28,8,20),this.gold,this.spinner);leaf.position.z=.4;
 }
 buildTargets(){
  this.targets=BANK.map((p,i)=>{
   const group=new T.Group();group.position.copy(at(p.x,p.y));this.scene.add(group);
   const mat=new T.MeshStandardMaterial({color:'#d1a0ff',emissive:'#a45dff',emissiveIntensity:.5,roughness:.2,metalness:.3});
   const plate=this.mesh(new T.BoxGeometry(1.6,5.8,4.8),mat,group);plate.position.y=3;
   this.o.cyl(p.x,p.y,2.1,.4,this.gold,.15);
   return{group,plate,mat};
  });
 }
 buildConveyor(){
  this.slats=new T.InstancedMesh(new T.BoxGeometry(5.1,.32,.65),this.o.metal,44);this.slats.castShadow=true;this.scene.add(this.slats);this.dummy=new T.Object3D();
  this.gears=[];
  for(const x of[39,61]){
   const group=new T.Group();group.position.copy(at(x,133,.5));this.scene.add(group);
   const ring=this.mesh(new T.TorusGeometry(3.3,.65,10,32),this.gold,group);ring.rotation.x=Math.PI/2;
   const teeth=new T.InstancedMesh(new T.BoxGeometry(1.3,.7,1.6),this.gold,14),d=new T.Object3D();
   for(let i=0;i<14;i++){const a=i*Math.PI/7;d.position.set(Math.cos(a)*3.4,0,Math.sin(a)*3.4);d.rotation.y=-a;d.updateMatrix();teeth.setMatrixAt(i,d.matrix);}group.add(teeth);
   const axle=this.mesh(new T.CylinderGeometry(.9,.9,1.1,16),this.o.metal,group);this.gears.push(group);
  }
 }
 buildLights(){
  // Replace 52 separate static lamps with an animated, single-draw light rail.
  for(const m of this.o.leds){this.scene.remove(m);m.geometry.dispose();}this.o.leds=[];
  this.leds=new T.InstancedMesh(new T.CylinderGeometry(.65,.65,.35,10),new T.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),64);
  const d=new T.Object3D();for(let i=0;i<32;i++)for(let side=0;side<2;side++){d.position.copy(at(side?98:3,3+i*5.5,3));d.updateMatrix();this.leds.setMatrixAt(i*2+side,d.matrix);this.leds.setColorAt(i*2+side,new T.Color('#b9f36a'));}this.scene.add(this.leds);
  this.returnLamps=[14,81].map(x=>this.o.cyl(x,160,1.5,.25,new T.MeshStandardMaterial({color:'#c3ff82',emissive:'#b2ff73',emissiveIntensity:1.3}),.2));
  this.slingGlows=[];
  for(const [i,points]of [[[17,118],[31,139]],[[83,118],[69,139]]].entries()){
   const material=new T.LineBasicMaterial({color:'#e7c6ff',transparent:true,opacity:0,toneMapped:false});
   const geometry=new T.BufferGeometry().setFromPoints(Array.from({length:13},(_,n)=>at(points[0][0]+(points[1][0]-points[0][0])*n/12,points[0][1]+(points[1][1]-points[0][1])*n/12,3)));
   const line=new T.Line(geometry,material);this.scene.add(line);this.slingGlows.push({line,points,id:i?'sling-r':'sling-l'});
  }
 }
 buildReactions(){
  this.rings=Array.from({length:12},()=>{const m=new T.Mesh(new T.RingGeometry(1,1.11,48),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false}));m.rotation.x=-Math.PI/2;this.scene.add(m);return m;});
  this.labels=Array.from({length:18},()=>{const t=this.texture(384,128),mat=new T.SpriteMaterial({map:t.texture,transparent:true,depthWrite:false,depthTest:false,toneMapped:false});const sprite=new T.Sprite(mat);sprite.visible=false;this.scene.add(sprite);return{...t,sprite,id:null};});
 }
 buildMachinery(){
  // The surrounding factory frames wide screens, while the real table stays
  // edge-to-edge on a phone. Props never cover an active ball lane.
  for(const [x,y,h,color]of[[-13,45,25,'#b9f36a'],[114,38,32,'#bd83ff'],[-15,131,19,'#ffd370'],[114,126,24,'#ff9c43']]){
   this.o.cyl(x,y,7,h,this.o.metal,-6);this.o.cyl(x,y,7.25,1,this.gold,2);this.o.cyl(x,y,7.25,1,this.gold,h-8);
   const mat=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.65,roughness:.2,metalness:.25});this.o.cyl(x,y,7.05,h*.42,mat,h*.18-6);
   const cap=this.mesh(new T.SphereGeometry(7,24,12,0,Math.PI*2,0,Math.PI/2),this.o.metal);cap.position.copy(at(x,y,h-6));
   this.o.tube([at(x,y,h-5),at(x,y-12,h-5),at(x<50?-3:103,y-12,6)],.7,this.gold);
  }
 }
 event(e){
  this.display.hit(e);
  const captions={spinner:['JUICE SPINNER',`${e.turns||0} SPINS  ·  +${Math.round(e.points||0).toLocaleString()}`],orbit:['ORBIT COMPLETE','KEEP THE JUICE FLOWING'],bottle:['FRESHLY BOTTLED','FILL. CAP. CELEBRATE.'],jackpot:['JUICE JACKPOT!','THE FACTORY IS IN OVERDRIVE'],rainbow:['RAINBOW RUSH!','3 BALLS · TRIPLE POINTS'],ramp:['COLD PRESS LOOP','CONVEYOR SHOT'],skill:['SKILL SHOT!','RIGHT ON THE MONEY'],'pressure-ready':['POWER PRESS!','12 SECONDS · DOUBLE POINTS'],'bank-complete':['TARGET BANK COMPLETE','MULTIPLIER RAISED'],kickback:['FRESH RETURN!','KICKBACK USED · KEEP FLIPPING'],'shot-chain':[`${e.chain} SHOT COMBO`,'LINK DIFFERENT SHOTS'],'extra-ball':['EXTRA BALL!','YOUR NEXT BALL IS ON THE HOUSE'],tilt:['TILT','LET THE TABLE SETTLE']};
  if(captions[e.type])this.banner={title:captions[e.type][0],note:captions[e.type][1],until:this.o.effects.time+(['rainbow','jackpot'].includes(e.type)?2.4:1.4)};
 }
 update(g,dt){
  const o=this.o,fx=o.effects,t=fx.time,reduced=o.reduced;this.display.step(g,dt);this.clock+=dt;
  if(this.clock>.055){
   this.clock=0;this.display.draw(this.scoreGlass.c,g,t);this.scoreGlass.texture.needsUpdate=true;
   this.display.drawMission(this.missionGlass.c,g,t);
   if(this.banner&&this.banner.until>t){const c=this.missionGlass.c;c.fillStyle='#021a13';c.fillRect(6,6,1012,114);c.textAlign='center';c.fillStyle=g.boost>0?'#ffe0a3':g.recipe.color;c.shadowColor=c.fillStyle;c.shadowBlur=reduced?0:9;c.font='900 54px "Barlow Condensed",Arial';c.fillText(this.banner.title,512,60);c.shadowBlur=0;c.fillStyle='#dfefd6';c.font='700 22px Arial';c.fillText(this.banner.note,512,99);}
   this.missionGlass.texture.needsUpdate=true;
  }
  for(let i=0;i<o.pops.length;i++){
   const p=o.pops[i],hit=fx.hit('pop-'+i),color=new T.Color(palette[i]);p.mat.color.copy(color);p.mat.emissive.copy(color);p.mat.emissiveIntensity=.7+(g.ingredients[i]?.6:0)+hit*3;
   p.fruits.forEach((f,n)=>f.visible=n===[1,3,0][i]);p.capGroup.scale.set(1+hit*.1,1-hit*.13,1+hit*.1);
  }
  this.spinner.rotation.x=g.spinnerAngle||0;this.spinnerPlate.material.emissiveIntensity=.4+Math.min(2,Math.abs(g.spinnerVelocity||0)/25);
  this.targets.forEach((target,i)=>{const hit=fx.hit('target-'+i);target.plate.position.y=g.bank[i]?.9:3-hit*2;target.plate.rotation.z=(i<2?-1:1)*hit*.28;target.mat.emissiveIntensity=(g.bank[i]?2:.35)+hit*3;});
  for(let i=0;i<44;i++){
   const u=(i/44+(reduced?0:t)*(g.boost>0?.16:.065))%1,p=rampPoint(u),next=rampPoint(Math.min(.99999,u+.002));this.dummy.position.copy(at(p.x,p.y,p.z+.55));this.dummy.rotation.set(0,Math.atan2(next.x-p.x,next.y-p.y),0);this.dummy.updateMatrix();this.slats.setMatrixAt(i,this.dummy.matrix);
  }this.slats.instanceMatrix.needsUpdate=true;
  this.gears.forEach((gear,i)=>gear.rotation.y=reduced?0:(i?-1:1)*t*(g.boost>0?3.5:.45));
  const show=fx.show,phase=show?(t-show.start)/show.duration:0;
  for(let i=0;i<64;i++){
   const color=new T.Color(g.rush?JUICES[(Math.floor(i/8+t*2))%4].color:g.boost>0?'#ffd474':i%4?'#b4ff85':'#bd83ff');
   let brightness=reduced?.7:.5+.35*(.5+.5*Math.sin(i*.7-t*4));
   if(show&&!reduced)brightness+=Math.pow(Math.max(0,Math.cos(i*.36-phase*Math.PI*8)),5)*2.1;
   color.multiplyScalar(brightness);this.leds.setColorAt(i,color);
  }this.leds.instanceColor.needsUpdate=true;
  this.returnLamps.forEach(lamp=>lamp.material.emissiveIntensity=g.kickback?1.3:.05);
  this.slingGlows.forEach(({line,points,id})=>{const hit=fx.hit(id);line.material.opacity=reduced?0:hit;const a=line.geometry.attributes.position;for(let i=1;i<12;i++){const u=i/12,p=at(points[0][0]+(points[1][0]-points[0][0])*u+Math.sin(i*2.4+t*90)*hit*.55,points[0][1]+(points[1][1]-points[0][1])*u,3+hit);a.setXYZ(i,p.x,p.y,p.z);}a.needsUpdate=true;});
  this.rings.forEach((m,i)=>{const ring=fx.rings[i];m.visible=!!ring&&!reduced;if(!ring)return;const progress=1-ring.life/.45;m.position.copy(at(ring.x,ring.y,.24));m.scale.setScalar(2+progress*16);m.material.color.set(ring.color);m.material.opacity=(1-progress)*.65;});
  this.labels.forEach((item,i)=>{
   const label=fx.labels[i];item.sprite.visible=!!label;if(!label)return;
   if(item.id!==label.id){item.id=label.id;const c=item.c;c.clearRect(0,0,384,128);c.textAlign='center';c.textBaseline='middle';c.font='900 82px "Barlow Condensed",Arial';c.lineWidth=10;c.strokeStyle='#042119';const text='+'+Math.round(label.points).toLocaleString();c.strokeText(text,192,64,366);c.fillStyle=label.color;c.shadowColor=label.color;c.shadowBlur=reduced?0:7;c.fillText(text,192,64,366);c.shadowBlur=0;item.texture.needsUpdate=true;}
   const progress=1-label.life/label.max;item.sprite.position.copy(at(label.x,label.y-progress*5,5+progress*7));item.sprite.scale.set(label.big?23:14,label.big?7.6:4.7,1);item.sprite.material.opacity=Math.min(1,label.life*3);
  });
 }
}
