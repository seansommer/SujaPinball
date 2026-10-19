import{R,JUICES,BUMPERS,BANK,GATES,WALLS,SLINGS,FLIPPERS,clamp,nearest,rampPoint}from'./table.js';
import{FactoryOrders}from'./orders.js';
const TAU=Math.PI*2;
export class Pinball{
 constructor({seed=1,mode='arcade',onEvent=()=>{}}={}){
  this.seed=seed>>>0;this.randomState=this.seed;this.mode=mode;this.onEvent=onEvent;this.time=0;this.duration=0;this.state='countdown';this.countdown=3;this.paused=false;this.acc=0;this.nextId=1;this.balls=[];this.inputs=[false,false];this.flippers=FLIPPERS.map(f=>({...f,angle:f.rest,omega:0}));
  this.score=0;this.ballNumber=1;this.reserves=2;this.extraBalls=0;this.bottles=0;this.rushes=0;this.ramps=0;this.bumperHits=0;this.skillShots=0;this.maxCombo=0;this.combo=0;this.lastScore=-10;this.multiplier=1;this.juice=0;this.ingredients=[false,false,false];this.bank=[false,false,false,false];this.gates=[false,false,false];this.skillGate=this.seed%3;this.saver=0;this.rush=0;this.tilt=0;this.heat=0;this.lastNudge=-10;this.capping=0;this.nextExtra=75000;this.transition=0;
  this.addBall('shooter');
  this.pressure=0;this.boost=0;this.spinnerAngle=0;this.spinnerVelocity=0;this.kickback=true;this.lastShot=null;this.shotChain=0;
  this.orders=new FactoryOrders(this);
 }
 get active(){return!this.paused&&this.state==='playing';}
 get recipe(){return JUICES[this.juice];}
 get bottleReady(){return this.ingredients.every(Boolean);}
 random(){let t=this.randomState+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}
 emit(type,data={}){const event={type,time:this.time,color:this.recipe.color,...data};this.onEvent(event);this.orders?.event(event);}
 addBall(state='free',x=94,y=165,vx=0,vy=0){const b={id:this.nextId++,x,y,px:x,py:y,vx,vy,r:R,state,age:0,routeTime:0,cooldowns:{},still:0,skill:state==='shooter'};this.balls.push(b);return b;}
 setFlipper(index,down){if(this.inputs[index]===down)return;this.inputs[index]=down;if(down&&this.state==='ready'){this.skillGate=(this.skillGate+(index?1:2))%3;this.emit('select');}if(this.active&&!this.tilt)this.emit(down?'flipper-up':'flipper-down',{index});}
 release(){this.inputs=[false,false];}
 launch(power=.65){if(this.paused||this.state!=='ready')return false;const b=this.balls.find(b=>b.state==='shooter');if(!b)return false;this.state='playing';b.state='launch';b.age=0;b.vy=-126-clamp(power,0,1)*29;b.vx=0;b.power=clamp(power,0,1);this.saver=16;this.kickback=true;this.emit('launch',{x:b.x,y:b.y,power:b.power});return true;}
 nudge(){if(!this.active||this.time-this.lastNudge<.5||this.tilt)return false;this.lastNudge=this.time;this.heat+=1;if(this.heat>=2.55){this.tilt=3.2;this.saver=0;this.release();this.emit('tilt');return false;}for(const b of this.balls)if(b.state==='free'){b.vy-=23;b.vx+=(this.random()-.5)*18;}this.emit('nudge',{warning:this.heat>1.8});return true;}
 addScore(base,data={}){if(this.tilt)return 0;this.combo=this.time-this.lastScore<2.5?this.combo+1:1;this.maxCombo=Math.max(this.maxCombo,this.combo);this.lastScore=this.time;const points=Math.round(base*this.multiplier*(this.rush>0?3:1)*(this.boost>0?2:1)*(1+Math.min(8,this.combo-1)*.05));this.score=Math.min(100000000,this.score+points);if(this.score>=this.nextExtra&&this.extraBalls<3){this.reserves++;this.extraBalls++;this.nextExtra*=2;this.emit('extra-ball');}if(this.combo===10||this.combo===25)this.emit('combo',{combo:this.combo});return points;}
 chargePress(amount){if(this.tilt||this.boost>0)return;this.pressure=Math.min(100,this.pressure+amount);if(this.pressure>=100){this.pressure=0;this.boost=12;this.emit('pressure-ready',{x:50,y:116});}}
 registerShot(kind,x,y){const chain=this.lastShot&&this.lastShot.kind!==kind&&this.time-this.lastShot.time<6;this.shotChain=chain?Math.min(5,this.shotChain+1):1;this.lastShot={kind,time:this.time};if(chain)this.emit('shot-chain',{x,y,chain:this.shotChain,points:this.addScore(700*this.shotChain)});}
 spin(b){if(this.tilt)return;const turns=Math.max(4,Math.round(Math.abs(b.vy)/9));this.spinnerVelocity=Math.sign(b.vy)*Math.min(65,turns*5);this.chargePress(12);this.emit('spinner',{x:23,y:94,turns,points:this.addScore(turns*90)});this.registerShot('spinner',23,94);}
 rescueOutlane(b){if(!this.kickback||this.tilt||b.state!=='free'||b.y<160||b.vy<=0||!(b.x<17||b.x>81&&b.x<89))return false;this.kickback=false;const left=b.x<50;b.x=left?18:80;b.y=147;b.vx=left?22:-22;b.vy=-125;this.emit('kickback',{x:b.x,y:b.y,points:this.addScore(1000)});return true;}
 hitBumper(index,b){const pop=BUMPERS[index],points=this.addScore(this.orders.frenzy?1000:350);this.bumperHits++;const fresh=!this.ingredients[index];if(!this.rush)this.ingredients[index]=true;this.chargePress(fresh?7:3);this.emit('bumper',{x:pop.x,y:pop.y,index,points,fresh});if(fresh&&!this.rush&&this.bottleReady)this.emit('bottle-ready',{x:50,y:80});}
 collectBottle(b){
  if(!this.active||this.tilt||b.state!=='free')return false;
  if(this.orders.jackpotReady)return this.orders.claim(b);
  if(this.tilt||(!this.rush&&!this.bottleReady))return false;
  b.state='bottle';b.routeTime=0;b.x=50;b.y=82;b.vx=b.vy=0;this.capping=1.2;
  const jackpot=this.rush>0,points=this.addScore(jackpot?15000:10000);if(!jackpot)this.bottles++;
  this.emit(jackpot?'jackpot':'bottle',{x:50,y:77,points,juice:this.juice,bottles:this.bottles});
  this.registerShot('bottle',50,96);this.chargePress(20);
  if(!jackpot){this.ingredients=[false,false,false];this.juice=(this.juice+1)%4;if(this.bottles%4===0){this.rush=45;this.rushes++;this.saver=18;const needed=Math.max(0,3-this.balls.length);for(let i=0;i<needed;i++){const extra=this.addBall('free',30+i*40,61,(i?-1:1)*30,45);extra.cooldowns.bottle=this.time+3;}this.emit('rainbow',{x:50,y:60});}else this.emit('juice',{juice:this.juice});}
  return true;
 }
 captureRamp(b){if(this.tilt||b.cooldowns.ramp>this.time)return false;b.state='ramp';b.routeTime=0;b.vx=b.vy=0;b.cooldowns.ramp=this.time+5;this.ramps++;const points=this.addScore(2500);this.saver=Math.max(this.saver,4);this.emit('ramp',{x:78,y:103,points});this.registerShot('conveyor',78,103);this.chargePress(22);if(this.ramps%3===0){this.multiplier=Math.min(4,this.multiplier*2);this.emit('multiplier',{multiplier:this.multiplier});}return true;}
 cooldown(b,key,seconds=.1){if((b.cooldowns[key]||0)>this.time)return false;b.cooldowns[key]=this.time+seconds;return true;}
 segment(b,a,c,r=.5,restitution=.78,velocity={x:0,y:0}){
  const p=nearest(b.x,b.y,a[0],a[1],c[0],c[1]),dx=b.x-p.x,dy=b.y-p.y,dist=Math.hypot(dx,dy),min=R+r;if(dist>=min)return null;
  let nx=dx/(dist||1),ny=dy/(dist||1);if(dist<.00001){const d=Math.hypot(c[0]-a[0],c[1]-a[1])||1;nx=-(c[1]-a[1])/d;ny=(c[0]-a[0])/d;}
  b.x+=nx*(min-dist+.005);b.y+=ny*(min-dist+.005);const v=(b.vx-velocity.x)*nx+(b.vy-velocity.y)*ny;if(v<0){b.vx-=(1+restitution)*v*nx;b.vy-=(1+restitution)*v*ny;}return{nx,ny,speed:-v,t:p.t,x:p.x,y:p.y};
 }
 step(dt){if(this.paused||this.state==='over')return;this.acc+=Math.min(.1,Math.max(0,dt));while(this.acc>=1/240){this.fixed(1/240);this.acc-=1/240;}}
 fixed(dt){
  this.time+=dt;this.heat=Math.max(0,this.heat-dt*.25);this.tilt=Math.max(0,this.tilt-dt);this.capping=Math.max(0,this.capping-dt);
  if(this.state==='countdown'){const old=Math.ceil(this.countdown);this.countdown-=dt;if(this.countdown<=0){this.countdown=0;this.state='ready';this.emit('ready');}else if(Math.ceil(this.countdown)!==old)this.emit('count',{number:Math.ceil(this.countdown)});}
  if(this.state==='between'){this.transition-=dt;if(this.transition<=0){this.state='ready';this.addBall('shooter');this.emit('ready');}}
  for(let i=0;i<2;i++){const f=this.flippers[i],target=this.inputs[i]&&!this.tilt&&this.state!=='over'?f.up:f.rest,old=f.angle;f.angle+=(target-f.angle)*Math.min(1,dt*(this.inputs[i]?42:24));f.omega=(f.angle-old)/dt;}
  if(this.state!=='playing')return;
  this.duration+=dt;this.saver=Math.max(0,this.saver-dt);this.spinnerAngle+=this.spinnerVelocity*dt;this.spinnerVelocity*=Math.exp(-dt*1.1);if(this.boost>0){this.boost=Math.max(0,this.boost-dt);if(!this.boost)this.emit('pressure-end');}if(this.rush>0){this.rush=Math.max(0,this.rush-dt);if(!this.rush)this.emit('rainbow-end');}
  this.orders.step(dt);if(this.time-this.lastScore>2.5)this.combo=0;
  for(const b of [...this.balls]){
   b.px=b.x;b.py=b.y;b.age+=dt;
   if(b.state==='ramp'){b.routeTime+=dt;const p=rampPoint(b.routeTime/1.65);Object.assign(b,p);if(b.routeTime>=1.65){b.state='free';b.z=0;b.x=34;b.y=132;b.vx=3+(this.random()-.5)*8;b.vy=28;this.emit('ramp-exit',{x:b.x,y:b.y});}continue;}
   if(b.state==='bottle'){b.routeTime+=dt;if(b.routeTime>1.15){b.state='free';b.x=50;b.y=101;b.vx=(this.random()-.5)*35;b.vy=46;b.cooldowns.bottle=this.time+2;}continue;}
   if(b.state==='launch'){
    b.y+=b.vy*dt;b.vy+=17*dt;
    if(b.y<31){b.state='free';b.x=82;b.y=12;b.vx=-54-b.power*40;b.vy=-13+b.power*7;this.emit('skill-window',{x:82,y:20});}
    continue;
   }
   if(b.state!=='free')continue;
   b.vy+=68*dt;b.vx*=Math.pow(.996,dt*60);b.vy*=Math.pow(.999,dt*60);b.x+=b.vx*dt;b.y+=b.vy*dt;
   for(const w of WALLS){const hit=this.segment(b,w.a,w.b,.55,.82);if(hit?.speed>18&&this.cooldown(b,'wall',.11))this.emit('rail',{x:hit.x,y:hit.y,strength:hit.speed});}
   for(const s of SLINGS)for(let i=0;i<3;i++){const hit=this.segment(b,s.points[i],s.points[(i+1)%3],.65,.9);if(hit&&hit.speed>9&&this.cooldown(b,s.id,.35)){if(!this.tilt&&b.y<144){b.vx+=hit.nx*25;b.vy-=30;this.emit('sling',{x:hit.x,y:hit.y,id:s.id,points:this.addScore(100)});}}}
   for(const f of this.flippers){const tip={x:f.x+Math.cos(f.angle)*f.length,y:f.y+Math.sin(f.angle)*f.length},near=nearest(b.x,b.y,f.x,f.y,tip.x,tip.y),arm={x:near.x-f.x,y:near.y-f.y},v={x:-f.omega*arm.y,y:f.omega*arm.x};const hit=this.segment(b,[f.x,f.y],[tip.x,tip.y],f.r,.73,v);
    if(hit&&hit.speed>7&&this.cooldown(b,f.id,.10)){if(this.inputs[f.id==='left'?0:1]&&!this.tilt&&b.y<165&&Math.abs(f.omega)>2){const side=f.id==='left'?1:-1;b.vy=Math.min(b.vy,-122-hit.t*22);b.vx=side*(63-hit.t*68);if(hit.t>.62&&this.cooldown(b,'power-shot',1.2))this.emit('power-shot',{x:hit.x,y:hit.y,index:side>0?0:1});}this.emit('flipper-hit',{x:hit.x,y:hit.y,index:f.id==='left'?0:1,strength:hit.speed});}
   }
   for(const pop of BUMPERS){const dx=b.x-pop.x,dy=b.y-pop.y,d=Math.hypot(dx,dy),min=R+pop.r;if(d<min){const nx=dx/(d||1),ny=dy/(d||1);b.x=pop.x+nx*(min+.01);b.y=pop.y+ny*(min+.01);const vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=1.85*vn*nx;b.vy-=1.85*vn*ny;}if(this.cooldown(b,pop.id,.2)){if(!this.tilt){b.vx+=nx*38;b.vy+=ny*38;this.hitBumper(pop.index,b);}else this.emit('rail',{x:b.x,y:b.y,strength:25});}}}
   for(let i=0;i<BANK.length;i++){const p=BANK[i],hit=this.segment(b,[p.x,p.y-3],[p.x,p.y+3],.8,.95);if(hit&&this.cooldown(b,'bank-'+i,.3)&&!this.tilt){const fresh=!this.bank[i];this.bank[i]=true;this.chargePress(fresh?10:2);this.emit('target',{x:p.x,y:p.y,index:i,points:this.addScore(fresh?800:150)});if(this.bank.every(Boolean)){this.bank.fill(false);this.multiplier=Math.min(4,this.multiplier*2);this.chargePress(25);this.emit('bank-complete',{x:50,y:84});this.emit('multiplier',{multiplier:this.multiplier});}}}
   if((b.py-94)*(b.y-94)<=0&&b.x>16&&b.x<31&&this.cooldown(b,'spinner',.55))this.spin(b);
   if(b.py>37&&b.y<=37&&b.x<22&&b.vy<0&&this.cooldown(b,'orbit',3)&&!this.tilt){this.chargePress(18);this.emit('orbit',{x:16,y:32,points:this.addScore(1800)});this.registerShot('orbit',16,32);}
   if(b.y>63&&b.y<105){if(Math.hypot(b.x-50,(b.y-96)*.8)<9&&b.vy<12&&(b.cooldowns.bottle||0)<this.time&&this.collectBottle(b))continue;const hit=this.segment(b,[50,70],[50,88],5.3,.78);if(hit?.speed>10&&this.cooldown(b,'bottle-hit',.3))this.emit('bottle-hit',{x:50,y:79,points:this.addScore(150)});}
   if(b.vy<-12&&Math.hypot(b.x-78,b.y-103)<4.5&&this.captureRamp(b))continue;
   for(let i=0;i<GATES.length;i++){const g=GATES[i];if(Math.hypot(b.x-g.x,b.y-g.y)<4&&this.cooldown(b,'gate-'+i,1)){const skill=b.skill&&i===this.skillGate;if(skill){this.skillShots++;b.skill=false;}this.gates[i]=true;this.emit(skill?'skill':'gate',{x:g.x,y:g.y,index:i,points:this.addScore(skill?5000:500)});if(this.gates.every(Boolean)){this.gates.fill(false);this.saver=Math.max(this.saver,8);this.emit('save-lit');}}}
   this.rescueOutlane(b);
   const speed=Math.hypot(b.vx,b.vy);if(speed>165){b.vx*=165/speed;b.vy*=165/speed;}if(b.y>45)b.skill=false;
   if(!b.anchor||Math.hypot(b.x-b.anchor.x,b.y-b.anchor.y)>6){b.anchor={x:b.x,y:b.y};b.still=0;}else b.still+=dt;if(b.still>2.8){b.vx=(50-b.x)*.65+(this.random()-.5)*18;b.vy=-48;b.still=0;b.anchor=null;this.emit('unstick',{x:b.x,y:b.y});}
   if(!Number.isFinite(b.x+b.y+b.vx+b.vy)||b.y>181||b.x<0||b.x>102)this.drain(b);
  }
  // Equal-mass ball contacts keep Rainbow Rush physical rather than letting balls overlap.
  for(let i=0;i<this.balls.length;i++)for(let j=i+1;j<this.balls.length;j++){const a=this.balls[i],b=this.balls[j];if(a.state!=='free'||b.state!=='free')continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>0&&d<R*2){const nx=dx/d,ny=dy/d,over=(R*2-d)/2;a.x-=nx*over;a.y-=ny*over;b.x+=nx*over;b.y+=ny*over;const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(rel>0){a.vx-=rel*nx;a.vy-=rel*ny;b.vx+=rel*nx;b.vy+=rel*ny;}}}
  if(this.duration>=7200){this.state='over';this.emit('over',{result:this.result()});}
 }
 drain(b){
  const i=this.balls.indexOf(b);if(i<0)return;this.balls.splice(i,1);this.emit('drain',{x:b.x,y:176});if(this.balls.length)return;
  if(this.saver>0&&!this.tilt){const saved=this.addBall('launch');saved.vy=-145;saved.power=.7;this.saver=Math.max(0,this.saver-2);this.emit('saved');return;}
  this.orders.ballLost();
  if(this.mode==='practice'||this.reserves>0){if(this.mode!=='practice')this.reserves--;this.ballNumber++;this.state='between';this.transition=1.5;this.multiplier=1;this.rush=0;this.emit('next-ball',{ballNumber:this.ballNumber});}
  else{this.state='over';this.release();this.emit('over',{result:this.result()});}
 }
 result(){return{version:'1.0.0',game:'suja-pinball',mode:this.mode,seed:this.seed,score:this.score,bottles:this.bottles,ramps:this.ramps,bumperHits:this.bumperHits,skillShots:this.skillShots,rushes:this.rushes,maxCombo:this.maxCombo,extraBalls:this.extraBalls,duration:Math.round(this.duration*100)/100};}
}
