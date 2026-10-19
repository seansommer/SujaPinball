import*as T from'three';
import{RoomEnvironment}from'three/addons/environments/RoomEnvironment.js';
import{EffectComposer}from'three/addons/postprocessing/EffectComposer.js';
import{RenderPass}from'three/addons/postprocessing/RenderPass.js';
import{UnrealBloomPass}from'three/addons/postprocessing/UnrealBloomPass.js';
import{JUICES,BUMPERS,BANK,GATES,WALLS,SLINGS,FLIPPERS,RAMP,rampPoint,clamp}from'./table.js';
import{Effects}from'./effects.js';
import{fitCabinet}from'./camera.js';
import{FactoryStage}from'./factory-stage.js';
const position=(x,y,h=0)=>new T.Vector3(x-50,h,y-90);
function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
function glowTexture(){return canvasTexture(64,64,c=>{const g=c.createRadialGradient(32,32,0,32,32,31);g.addColorStop(0,'#fff');g.addColorStop(.18,'#ffffffdf');g.addColorStop(.5,'#ffffff55');g.addColorStop(1,'#fff0');c.fillStyle=g;c.fillRect(0,0,64,64);});}
export class PinballScene{
 constructor(canvas,{onContextLost=()=>{}}={}){
  this.canvas=canvas;this.effects=new Effects();this.quality='auto';this.reduced=false;this.ballMeshes=new Map();this.juice=-1;this.scene=new T.Scene();this.scene.background=new T.Color('#020b12');this.scene.fog=new T.FogExp2('#020b12',.0027);
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onContextLost();});
  this.camera=new T.PerspectiveCamera(34,1,.1,1200);this.view='cabinet';this.scene.add(new T.HemisphereLight('#d5fff5','#15222d',2.5));
  const env=new RoomEnvironment(),pmrem=new T.PMREMGenerator(this.renderer);this.envMap=pmrem.fromScene(env,.03).texture;this.scene.environment=this.envMap;env.dispose();pmrem.dispose();this.scene.environmentIntensity=.85;
  const key=new T.DirectionalLight('#e5fff4',3.1);key.position.set(-50,120,65);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-65,right:65,top:110,bottom:-110,near:1,far:280});key.shadow.bias=-.0003;key.shadow.normalBias=.25;this.scene.add(key);this.key=key;
  const purple=new T.PointLight('#b365ff',3800,230,2);purple.position.set(45,28,-45);this.scene.add(purple);const green=new T.PointLight('#9aff78',4200,210,2);green.position.set(-35,35,20);this.scene.add(green);this.rushLight=new T.PointLight('#cfacff',0,160,2);this.rushLight.position.set(0,35,-10);this.scene.add(this.rushLight);
  this.metal=new T.MeshStandardMaterial({color:'#bcc8d2',metalness:.96,roughness:.2});this.dark=new T.MeshStandardMaterial({color:'#11282b',metalness:.75,roughness:.34});this.gold=new T.MeshStandardMaterial({color:'#d2ad5a',metalness:.8,roughness:.24});this.lime=new T.MeshStandardMaterial({color:'#b8f466',emissive:'#7edb37',emissiveIntensity:.55,metalness:.35,roughness:.28});this.purple=new T.MeshStandardMaterial({color:'#8f64d7',emissive:'#8e44ee',emissiveIntensity:1.5,metalness:.35,roughness:.27});this.glow=glowTexture();
  this.buildTable();this.buildBumpers();this.buildBottle();this.buildRamp();this.buildFlippers();this.buildInserts();this.buildParticles();
  this.factory=new FactoryStage(this);
  this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new T.Vector2(600,900),.48,.36,1.05);this.composer.addPass(this.bloom);
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
 }
 mesh(geometry,material,parent=this.scene){const m=new T.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 cyl(x,y,r,h,mat,base=0,parent=this.scene){const m=this.mesh(new T.CylinderGeometry(r,r,h,40),mat,parent);m.position.copy(position(x,y,base+h/2));return m;}
 tube(points,r,mat,parent=this.scene){const curve=new T.CatmullRomCurve3(points),mesh=this.mesh(new T.TubeGeometry(curve,Math.max(16,points.length*6),r,8,false),mat,parent);return mesh;}
 flatText(text,w=512,h=128,color='#e6ffca'){return canvasTexture(w,h,(c)=>{c.clearRect(0,0,w,h);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font=`800 ${Math.min(h*.54,w/(text.length*.54))}px Arial`;c.fillText(text,w/2,h/2);});}
 decal(text,x,y,w,h,matColor='#c9f89a'){const texture=this.flatText(text,512,128,matColor),mat=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});const m=this.mesh(new T.PlaneGeometry(w,h),mat);m.rotation.x=-Math.PI/2;m.position.copy(position(x,y,.12));m.castShadow=false;return m;}
 buildTable(){
  const cabinet=this.mesh(new T.BoxGeometry(104,6,184),this.dark);cabinet.position.y=-3.5;cabinet.receiveShadow=true;
  const wood=new T.MeshStandardMaterial({color:'#174a3e',metalness:.5,roughness:.3});const field=this.mesh(new T.PlaneGeometry(94,176),wood);field.rotation.x=-Math.PI/2;field.position.set(0,-.1,-1);field.castShadow=false;
  new T.TextureLoader().load('./assets/playfield.webp',tex=>{tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());wood.map=tex;wood.color.set('#ffffff');wood.needsUpdate=true;});
  const rimMat=new T.MeshStandardMaterial({color:'#395258',metalness:.95,roughness:.22});
  for(const x of[-51,51]){const rail=this.mesh(new T.BoxGeometry(2.1,4.8,185),rimMat);rail.position.set(x,1.6,0);}
  for(const z of[-92,92]){const rail=this.mesh(new T.BoxGeometry(104,3.5,2),rimMat);rail.position.set(0,0,z);}
  for(const w of WALLS){this.tube([position(...w.a,2.3),position(...w.b,2.3)],.85,this.metal);this.tube([position(...w.a,1.2),position(...w.b,1.2)],.35,w.kind==='guide'?this.purple:this.lime);}
  for(const s of SLINGS){const shape=new T.Shape();s.points.forEach(([x,y],i)=>i?shape.lineTo(x-50,y-90):shape.moveTo(x-50,y-90));shape.closePath();const geom=new T.ExtrudeGeometry(shape,{depth:2.1,bevelEnabled:true,bevelThickness:.5,bevelSize:.6,bevelSegments:2});geom.rotateX(Math.PI/2);geom.translate(0,2.4,0);const m=this.mesh(geom,this.purple);m.userData.key=s.id;const points=s.points.concat([s.points[0]]).map(p=>position(...p,2.7));this.tube(points,.65,this.metal);}
  // Cabinet edge lamps chase around real rails, rather than flashing the whole screen.
  this.leds=[];for(let i=0;i<26;i++)for(const x of[4,98]){const m=this.cyl(x,9+i*6.1,.5,.2,i%3?this.lime:this.purple,2.9);m.castShadow=false;this.leds.push(m);}
  this.decal('SUJA PINBALL',49,114,36,7);this.decal('FILL THE BOTTLE',50,126,30,4,'#b7c9bf');this.decal('RAINBOW RUSH',49,57,29,4,'#cda7ff');this.decal('COLD PRESS',77,110,18,3.7,'#d5c0ff');
  this.saverText=this.decal('BALL SAVE',50,169,23,4,'#d8ff96');
  // Round pin posts and chrome inlane guides.
  for(const[x,y]of[[16,115],[32,142],[84,115],[68,142],[28,154],[72,154],[22,27],[79,28]]){this.cyl(x,y,1.3,3,this.metal);this.cyl(x,y,1.55,.6,this.lime,2.4);}
  for(const x of[20,80])this.tube([position(x,141,1),position(x,150,1)],.35,this.lime);
  this.decal('PLUNGER',94,153,4,22,'#cfe2de');
 }
 fruit(type,index){
  const group=new T.Group(),colors=[['#86cf46','#bbe17f','#6bae50'],['#ffd744','#ff9a29','#dfbf45'],['#ff7f24','#e5bc6a','#e3a62d'],['#8c4ab6','#e9b454','#a83d73']][type],mat=new T.MeshStandardMaterial({color:colors[index],roughness:.33,metalness:.08}),leaf=new T.MeshStandardMaterial({color:'#5ca239',roughness:.4});
  const sphere=(x,y,z,r,sx=1,sy=1,sz=1,material=mat)=>{const m=this.mesh(new T.SphereGeometry(r,18,12),material,group);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;};
  if(type===3&&index===0){for(let i=0;i<9;i++){const a=i*Math.PI*2/5; sphere(Math.cos(a)*(i<5?2:1.1),1+Math.floor(i/5)*2,Math.sin(a)*(i<5?2:1.1),1.6);}sphere(0,4,0,1,1.6,.25,.7,leaf);}
  else if(type===2&&index===0){const m=this.mesh(new T.ConeGeometry(2.4,6,20),mat,group);m.rotation.z=.32;m.position.y=2;for(let i=0;i<4;i++)sphere((i-1.5)*.6,5,0,1,.5,2,.35,leaf);}
  else if(type===0){for(let i=0;i<3;i++){const m=sphere((i-1)*1.7,1.6,0,2,1,1.5,.55,index===0?leaf:mat);m.rotation.z=(i-1)*.65;}sphere(0,1,0,1,.45,2,.4,leaf);}
  else if(type===1&&index<2){sphere(0,1.7,0,3,index?1.25:1,.65,1);const rim=this.mesh(new T.TorusGeometry(2.5,.16,8,32),new T.MeshStandardMaterial({color:'#fff3bb',roughness:.65}),group);rim.rotation.x=Math.PI/2;rim.position.y=3.3;for(let i=0;i<8;i++){const a=i*Math.PI/4;const m=this.mesh(new T.BoxGeometry(.12,.12,4.8),new T.MeshStandardMaterial({color:'#fff1b9'}),group);m.rotation.y=a;m.position.y=3.3;}}
  else{sphere(0,2,0,3,1,.9,1);sphere(0,5,0,1,2,.22,.7,leaf);if(type===1){for(let i=0;i<4;i++){const m=sphere(0,5+i*.6,0,1,.6,2,.4,leaf);m.rotation.z=i*.6;}}}
  return group;
 }
 buildBumpers(){
  this.pops=[];
  for(const p of BUMPERS){const group=new T.Group();group.position.copy(position(p.x,p.y));this.scene.add(group);const base=this.mesh(new T.CylinderGeometry(p.r,p.r+.7,2,40),this.metal,group);base.position.y=1;
   const mat=new T.MeshStandardMaterial({color:'#b8f466',emissive:'#b8f466',emissiveIntensity:.6,metalness:.35,roughness:.25});const ring=this.mesh(new T.TorusGeometry(p.r-.2,.8,10,40),mat,group);ring.rotation.x=Math.PI/2;ring.position.y=2.2;
   const capGroup=new T.Group();capGroup.position.y=3;group.add(capGroup);const cap=this.mesh(new T.CylinderGeometry(p.r-1,p.r-1.3,1,40),this.gold,capGroup);const fruits=JUICES.map((_,type)=>{const g=this.fruit(type,p.index);g.position.y=.8;capGroup.add(g);g.visible=type===0;return g;});this.pops.push({group,capGroup,mat,fruits,ring});
  }
 }
 buildBottle(){
  const group=new T.Group();group.position.copy(position(50,79));this.scene.add(group);this.bottle=group;
  this.cyl(50,79,8,1.5,this.metal);this.bottleRing=this.mesh(new T.TorusGeometry(7.2,.55,12,50),this.lime.clone(),group);this.bottleRing.rotation.x=Math.PI/2;this.bottleRing.position.y=1.6;
  this.cyl(50,96,5.6,.8,this.metal,.1);this.cyl(50,96,4.4,.2,new T.MeshStandardMaterial({color:'#020b0b',roughness:.6}),.95);this.mouthRing=this.mesh(new T.TorusGeometry(4.8,.4,10,40),this.lime.clone());this.mouthRing.rotation.x=Math.PI/2;this.mouthRing.position.copy(position(50,96,1.2));this.tube([position(50,91,.8),position(50,85,.8)],.6,this.metal);
  const pts=[[0,1],[5.1,1],[5.6,2],[5.6,20],[5,22],[3.5,24],[3.5,28],[0,28]].map(([r,h])=>new T.Vector2(r,h));
  const glass=new T.MeshPhysicalMaterial({color:'#dfffea',metalness:.05,roughness:.16,transparent:true,opacity:.23,side:T.DoubleSide,depthWrite:false,clearcoat:1});this.mesh(new T.LatheGeometry(pts,48),glass,group);
  this.juiceMat=new T.MeshStandardMaterial({color:'#b9f36a',emissive:'#64ae30',emissiveIntensity:.3,roughness:.17,metalness:.15});this.fill=this.mesh(new T.CylinderGeometry(5.05,5.05,1,40),this.juiceMat,group);this.fill.position.y=2;this.fillLevel=.15;
  const label=canvasTexture(512,512,c=>{c.fillStyle='#18542c';c.fillRect(0,0,512,512);c.fillStyle='#fff';c.textAlign='center';c.font='700 150px Arial';c.fillText('suja',256,270);c.font='700 28px Arial';c.fillText('COLD PRESSED',256,342);c.beginPath();c.ellipse(260,110,26,43,.7,0,Math.PI*2);c.fill();});
  const labelMesh=this.mesh(new T.PlaneGeometry(8.8,9),new T.MeshStandardMaterial({map:label,roughness:.5,side:T.DoubleSide}),group);labelMesh.position.set(0,13,5.65);labelMesh.castShadow=false;
  this.cap=this.mesh(new T.CylinderGeometry(4.15,4.15,2,40),new T.MeshStandardMaterial({color:'#f2f6ed',metalness:.6,roughness:.22}),group);this.cap.position.y=29;
  for(let i=0;i<28;i++){const a=i*Math.PI*2/28,m=this.mesh(new T.BoxGeometry(.17,1.7,.17),this.metal,this.cap);m.position.set(Math.cos(a)*4.1,0,Math.sin(a)*4.1);}
  this.bottleGlow=new T.Sprite(new T.SpriteMaterial({map:this.glow,color:'#b8f86e',transparent:true,opacity:.26,blending:T.AdditiveBlending,depthWrite:false}));this.bottleGlow.position.set(0,15,-11);this.bottleGlow.scale.set(37,45,1);this.scene.add(this.bottleGlow);
 }
 buildRamp(){
  const pts=Array.from({length:65},(_,i)=>{const p=rampPoint(i/64);return position(p.x,p.y,p.z+1.2);}),left=[],right=[];for(let i=0;i<pts.length;i++){const d=pts[Math.min(pts.length-1,i+1)].clone().sub(pts[Math.max(0,i-1)]).normalize(),n=new T.Vector3(d.z,0,-d.x).multiplyScalar(2.9);left.push(pts[i].clone().add(n));right.push(pts[i].clone().sub(n));}
  this.tube(left,.55,this.metal);this.tube(right,.55,this.metal);this.tube(pts,.2,this.purple);
  const vertices=[],indices=[];for(let i=0;i<left.length;i++){for(const p of[left[i],right[i]])vertices.push(p.x,p.y-.7,p.z);if(i<left.length-1){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geom.setIndex(indices);geom.computeVertexNormals();this.mesh(geom,new T.MeshPhysicalMaterial({color:'#b5f1c3',transparent:true,opacity:.32,roughness:.2,metalness:.3,side:T.DoubleSide}));
  for(const t of[.15,.36,.56,.78]){const p=rampPoint(t);this.cyl(p.x,p.y,.8,p.z+1,this.metal);}
  this.rampLamp=new T.Sprite(new T.SpriteMaterial({map:this.glow,color:'#bd83ff',transparent:true,blending:T.AdditiveBlending,opacity:.6,depthWrite:false}));this.rampLamp.scale.set(9,9,1);this.scene.add(this.rampLamp);
 }
 buildFlippers(){this.flipperModels=FLIPPERS.map(f=>{const group=new T.Group();group.position.copy(position(f.x,f.y,2.4));this.scene.add(group);const shape=new T.Shape();shape.moveTo(0,-2.2);shape.lineTo(17.7,-1.65);shape.quadraticCurveTo(22,0,17.7,1.65);shape.lineTo(0,2.2);shape.absarc(0,0,2.2,Math.PI/2,Math.PI*1.5,false);const geom=new T.ExtrudeGeometry(shape,{depth:2,bevelEnabled:true,bevelSize:.45,bevelThickness:.4,bevelSegments:3,curveSegments:18});geom.rotateX(Math.PI/2);geom.translate(0,1,0);this.mesh(geom,this.lime,group);const edge=new T.Mesh(new T.CapsuleGeometry(1.7,16,6,18),this.metal);edge.rotation.z=Math.PI/2;edge.position.set(9,0,0);group.add(edge);return group;});}
 buildInserts(){
  this.bankLamps=BANK.map((p,i)=>{const m=this.cyl(p.x,p.y,1.4,2,this.purple.clone(),1.2);return m;});
  this.gateLamps=GATES.map(g=>{this.tube([position(g.x-4,g.y-2,2),position(g.x-4,g.y+5,2)],.55,this.metal);this.tube([position(g.x+4,g.y-2,2),position(g.x+4,g.y+5,2)],.55,this.metal);return this.cyl(g.x,g.y,2,.3,this.lime.clone(),.05);});
  this.arrows=[];for(let i=0;i<5;i++){const m=this.mesh(new T.ConeGeometry(1.7,3.6,3),this.lime.clone());m.rotation.x=-Math.PI/2;m.position.copy(position(50,101+i*3.8,.4));m.scale.z=.15;this.arrows.push(m);}
 }
 buildParticles(){this.particleSprites=Array.from({length:150},()=>{const m=new T.Sprite(new T.SpriteMaterial({map:this.glow,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));m.visible=false;this.scene.add(m);return m;});}
 setQuality(q,reduced=false){this.quality=q;this.reduced=reduced;this.effects.reduced=reduced;this.renderer.setPixelRatio(Math.min(devicePixelRatio,q==='low'?1:q==='high'?2:1.6));this.renderer.shadowMap.enabled=q!=='low';this.resize();}
 setView(view){this.view=view;this.resize();}
 resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;this.width=w;this.height=h;this.renderer.setSize(w,h,false);this.composer?.setSize(w,h);this.rig=fitCabinet(this.camera,w,h,this.view,(document.querySelector('.suite-header')?.getBoundingClientRect().height||44)+3);}
 event(e){this.effects.event(e);this.factory.event(e);if(e.type==='bottle'||e.type==='jackpot')this.bottleColor=e.color;}
 clear(){this.effects.clear();this.factory.clear();for(const m of this.ballMeshes.values()){this.scene.remove(m.mesh);for(const s of m.trail)this.scene.remove(s);}this.ballMeshes.clear();}
 project(x,y,z=4){const v=position(x,y,z).project(this.camera),r=this.canvas.getBoundingClientRect();return{x:(v.x+1)*r.width/2+r.left,y:(1-v.y)*r.height/2+r.top};}
 render(game,dt){
  this.effects.step(dt);const fx=this.effects,t=fx.time,color=new T.Color(game.recipe.color);if(this.juice!==game.juice){this.juice=game.juice;for(const p of this.pops)p.fruits.forEach((f,i)=>f.visible=i===this.juice);this.juiceMat.color.copy(color);this.juiceMat.emissive.copy(color).multiplyScalar(.35);}
  const shotColor=new T.Color(game.orders?.jackpotReady?'#ffd17a':game.recipe.color);const bottleColor=new T.Color(game.capping>0?(this.bottleColor||game.recipe.color):game.recipe.color);this.juiceMat.color.copy(bottleColor);this.juiceMat.emissive.copy(bottleColor).multiplyScalar(.35);this.fillLevel+=(Math.max(.13,game.capping>0||game.rush>0?1:game.ingredients.filter(Boolean).length/3*.86)-this.fillLevel)*Math.min(1,dt*3);this.fill.scale.y=2+this.fillLevel*18;this.fill.position.y=2+this.fill.scale.y/2;this.cap.position.y=29+game.capping*5;this.cap.rotation.y=game.capping*8;this.bottleRing.material.color.copy(shotColor);this.bottleRing.material.emissive.copy(shotColor);this.bottleRing.material.emissiveIntensity=game.bottleReady||game.rush||game.orders?.jackpotReady?2+Math.sin(t*5)*.3:.4;
  this.bottleGlow.material.color.copy(color);this.bottleGlow.material.opacity=this.reduced?.15:.18+(game.bottleReady?.1:0)+fx.flash*.35;
  this.mouthRing.material.color.copy(shotColor);this.mouthRing.material.emissive.copy(shotColor);this.mouthRing.material.emissiveIntensity=game.bottleReady||game.rush||game.orders?.jackpotReady?2:.15;
  for(let i=0;i<this.pops.length;i++){const p=this.pops[i],hit=fx.hit('pop-'+i);p.capGroup.position.y=3-hit*1.8;p.capGroup.rotation.y=Math.sin(hit*3)*.1;p.mat.color.copy(color);p.mat.emissive.copy(color);p.mat.emissiveIntensity=(game.ingredients[i]?1.4:.32)+hit*2;}
  for(let i=0;i<2;i++)this.flipperModels[i].rotation.y=-game.flippers[i].angle;
  for(let i=0;i<this.bankLamps.length;i++)this.bankLamps[i].material.emissiveIntensity=(game.bank[i]?2:.4)+fx.hit('target')*1.2;
  for(let i=0;i<this.gateLamps.length;i++)this.gateLamps[i].material.emissiveIntensity=game.gates[i]||((game.state==='ready'||game.balls.some(b=>b.skill))&&game.skillGate===i)?2:.18;
  for(let i=0;i<this.arrows.length;i++){const lit=game.bottleReady||game.rush>0||game.orders?.jackpotReady;this.arrows[i].material.emissiveIntensity=lit?1.8+Math.sin(t*6-i)*.5:.08;this.arrows[i].material.color.copy(shotColor);this.arrows[i].material.emissive.copy(shotColor);}
  this.saverText.visible=game.saver>0;const rp=rampPoint((t*.3)%1);this.rampLamp.position.copy(position(rp.x,rp.y,rp.z+2));this.rampLamp.visible=!this.reduced;this.rushLight.intensity=game.rush>0?2800:fx.flash*2500;
  for(let i=0;i<this.leds.length;i++)this.leds[i].scale.y=game.rush>0?1.4:1;
  const live=new Set(game.balls.map(b=>b.id));for(const[id,item]of this.ballMeshes)if(!live.has(id)){this.scene.remove(item.mesh);item.trail.forEach(s=>this.scene.remove(s));this.ballMeshes.delete(id);}
  for(const b of game.balls){let item=this.ballMeshes.get(b.id);if(!item){const mesh=this.mesh(new T.SphereGeometry(b.r,24,18),this.metal);const trail=Array.from({length:9},()=>{const s=new T.Sprite(new T.SpriteMaterial({map:this.glow,color:game.rush?'#c79aff':'#d6ffad',transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));this.scene.add(s);return s;});item={mesh,trail,positions:[]};this.ballMeshes.set(b.id,item);}item.mesh.visible=b.state!=='bottle';item.mesh.position.copy(position(b.x,b.y,b.r+(b.z||0)));item.mesh.rotation.x+=b.vy*dt*.2;item.mesh.rotation.z-=b.vx*dt*.2;
   item.positions.unshift(item.mesh.position.clone());item.positions.length=Math.min(10,item.positions.length);item.trail.forEach((s,i)=>{const p=item.positions[Math.min(i,item.positions.length-1)];s.position.copy(p);s.scale.setScalar(b.r*(2.3-i*.12));s.material.opacity=!this.reduced&&b.state!=='shooter'&&b.state!=='bottle'?.2*(1-i/9):0;});
  }
  this.particleSprites.forEach((m,i)=>{const p=fx.particles[i];m.visible=!!p;if(p){m.position.copy(position(p.x,p.y,Math.max(.2,p.z)));m.material.color.set(p.color);m.material.opacity=Math.min(1,p.life*2);m.scale.setScalar(p.size*3);}});
  this.factory.update(game,dt);
  const offset=!this.reduced?Math.sin(t*58)*fx.shake*.2:0;this.camera.position.copy(this.rig.position);this.camera.position.x+=offset;this.camera.lookAt(this.rig.target.clone().add(new T.Vector3(offset,0,0)));if(this.quality==='low')this.renderer.render(this.scene,this.camera);else this.composer.render();
 }
}
