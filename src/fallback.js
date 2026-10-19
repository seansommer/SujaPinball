import{JUICES,BUMPERS,BANK,GATES,WALLS,SLINGS,FLIPPERS,RAMP,rampPoint,clamp}from'./table.js';import{Effects}from'./effects.js';
import{canvasCabinetLayout}from'./camera.js';import{CabinetDisplay}from'./cabinet-display.js';
export class CanvasTable{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.effects=new Effects();this.display=new CabinetDisplay();this.glass=document.createElement('canvas');this.glass.width=1024;this.glass.height=240;this.mission=document.createElement('canvas');this.mission.width=1024;this.mission.height=180;this.trails=new Map();this.texture=new Image();this.texture.src='./assets/playfield.webp';this.reduced=false;this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();}
 resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio,1.7);this.canvas.width=r.width*d;this.canvas.height=r.height*d;this.dpr=d;this.width=r.width;this.height=r.height;Object.assign(this,canvasCabinetLayout(r.width,r.height,(document.querySelector('.suite-header')?.getBoundingClientRect().height||44)+3));}
 setQuality(q,reduced){this.reduced=reduced;this.effects.reduced=reduced;}
 clear(){this.effects.clear();this.trails.clear();}
 event(e){this.effects.event(e);this.display.hit(e);if(e.type==='bottle'||e.type==='jackpot')this.bottleColor=e.color;}
 project(x,y){const r=this.canvas.getBoundingClientRect();return{x:r.left+this.ox+x*this.scale,y:r.top+this.oy+y*this.scale};}
 path(points,close=false){const c=this.ctx;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(close)c.closePath();}
 line(points,color,width=1,glow=0){const c=this.ctx;c.save();this.path(points);c.lineWidth=width;c.lineJoin=c.lineCap='round';c.strokeStyle=color;if(glow){c.shadowColor=color;c.shadowBlur=glow;}c.stroke();c.restore();}
 disc(x,y,r,color,glow=0){const c=this.ctx;c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.shadowColor=color;c.shadowBlur=glow;c.fill();c.restore();}
 label(text,x,y,size=2.2,color='#d6efcf'){const c=this.ctx;c.fillStyle=color;c.textAlign='center';c.font=`800 ${size}px Arial`;c.fillText(text,x,y);}
 render(g,dt){
  this.effects.step(dt);const c=this.ctx,fx=this.effects,t=fx.time,color=g.recipe.color;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#020b12';c.fillRect(0,0,this.width,this.height);
  const bg=c.createRadialGradient(this.width*.5,this.height*.45,5,this.width*.5,this.height*.45,this.height*.65);bg.addColorStop(0,'#14372f');bg.addColorStop(1,'#020b12');c.fillStyle=bg;c.fillRect(0,0,this.width,this.height);c.save();c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);if(!this.reduced)c.translate(Math.sin(t*59)*fx.shake*.3,0);
  for(const[x,y,col]of[[-18,53,'#aafa6d'],[118,45,'#c891ff'],[-18,130,'#ffd371'],[118,126,'#ff9e53']]){
   c.save();c.translate(x,y);const steel=c.createLinearGradient(-8,0,8,0);steel.addColorStop(0,'#354f4b');steel.addColorStop(.25,'#d5e6d0');steel.addColorStop(.55,'#5b7872');steel.addColorStop(.9,'#bac9b0');steel.addColorStop(1,'#2e4740');c.fillStyle=steel;c.beginPath();c.roundRect(-8,-23,16,48,6);c.fill();c.fillStyle=col;c.globalAlpha=.5;c.fillRect(-7,-12,14,24);c.globalAlpha=1;this.line([[-8,-13],[8,-13]],'#e1c481',.9);this.line([[-8,13],[8,13]],'#e1c481',.9);this.line([[0,-23],[0,-29],[x<50?15:-15,-29],[x<50?15:-15,-9]],'#bdc2a3',1.1);c.restore();
  }
  c.fillStyle='#15292e';c.shadowColor='#000';c.shadowBlur=10;c.beginPath();c.roundRect(0,-2,101,184,3);c.fill();c.shadowBlur=0;
  this.display.step(g,dt);this.display.draw(this.glass.getContext('2d'),g,t);c.drawImage(this.glass,3,-21,94,21);
  c.save();c.beginPath();c.roundRect(3,1,95,177,2);c.clip();c.fillStyle='#0b2d28';c.fillRect(3,1,95,177);if(this.texture.complete&&this.texture.naturalWidth)c.drawImage(this.texture,3,1,95,177);const dark=c.createLinearGradient(0,0,0,180);dark.addColorStop(0,'#05131822');dark.addColorStop(1,'#05131866');c.fillStyle=dark;c.fillRect(3,1,95,177);c.restore();
  this.line([[1,-1],[1,180]],'#839590',1.2);this.line([[100,-1],[100,180]],'#839590',1.2);for(const w of WALLS){this.line([w.a,w.b],'#10181c',3.7);this.line([w.a,w.b],'#a6b7b8',1.8);this.line([w.a,w.b],w.kind==='guide'?'#ab7ce8':color,.5,1.5);}
  for(let i=0;i<27;i++)for(const x of[1.7,99.3]){const col=g.rush?JUICES[Math.floor(i/6+t)%4].color:i%3?'#b8f785':'#c494ff';this.disc(x,3+i*6.4,.4,col,1.1);}
  for(const s of SLINGS){const hit=fx.hit(s.id);c.save();this.path(s.points,true);c.fillStyle=hit?'#d9c2ff':'#332645';c.shadowColor='#bc86ff';c.shadowBlur=hit?7:2;c.fill();c.lineWidth=1;c.strokeStyle='#c5c3ce';c.stroke();c.restore();this.line([s.points[0],s.points[1]],'#bd87ff',1.2,2);}
  for(let i=0;i<BANK.length;i++){const p=BANK[i],lit=g.bank[i];this.line([[p.x,p.y-3],[p.x,p.y+3]],lit?'#e4ceff':'#835db6',2,lit?4:1);this.disc(p.x+(p.x<50?3:-3),p.y,.7,lit?'#d5b1ff':'#36463c');}
  for(let i=0;i<GATES.length;i++){const p=GATES[i],lit=g.gates[i]||(g.state==='ready'&&g.skillGate===i);this.line([[p.x-4,p.y-4],[p.x-4,p.y+5]],'#8fa2a5',1);this.line([[p.x+4,p.y-4],[p.x+4,p.y+5]],'#8fa2a5',1);this.disc(p.x,p.y,1.6,lit?color:'#32493a',lit?4:0);this.label(String(i+1),p.x,p.y+.6,1.7,'#041810');}
  // Sculpted citrus, berry and green toys carry their own color and bounce.
  BUMPERS.forEach((p,i)=>{
   const hit=fx.hit('pop-'+i),r=p.r-hit*.6,col=['#ffb847','#c789ff','#b3f56b'][i];c.save();c.translate(p.x,p.y+hit*.8);
   this.disc(0,2.2,p.r+.7,'#020c0b');const base=c.createLinearGradient(-r,0,r,0);base.addColorStop(0,'#576459');base.addColorStop(.25,'#f4e9ba');base.addColorStop(.47,'#728c87');base.addColorStop(.75,'#d5e4df');base.addColorStop(1,'#344d4b');this.disc(0,.8,p.r+.2,base);
   c.strokeStyle=col;c.lineWidth=1;c.shadowColor=col;c.shadowBlur=hit?10:3;c.beginPath();c.arc(0,0,r-.3,0,Math.PI*2);c.stroke();c.shadowBlur=0;
   if(i===0){
    const orange=c.createRadialGradient(-2,-3,.1,0,-1,r);orange.addColorStop(0,'#ffe790');orange.addColorStop(.6,'#ffac2c');orange.addColorStop(1,'#c45710');this.disc(0,-1,r-1.2,orange);
    c.strokeStyle='#fff4b8';c.lineWidth=.3;for(let n=0;n<9;n++){const a=n*Math.PI*2/9;this.line([[Math.cos(a)*.7,-1+Math.sin(a)*.7],[Math.cos(a)*(r-1.8),-1+Math.sin(a)*(r-1.8)]],'#ffefb4',.22);}this.disc(0,-1,.5,'#ffeac1');
   }else if(i===1){
    for(const[x,y]of[[-2,-2],[1,-3],[3,-1],[-3,0],[0,0],[2,2],[-1,3],[0,-4]]){const grape=c.createRadialGradient(x-.5,y-.6,.1,x,y,1.8);grape.addColorStop(0,'#efb6ff');grape.addColorStop(.3,'#a347b8');grape.addColorStop(1,'#3a135a');this.disc(x,y,1.85,grape);}this.line([[0,-4],[1,-6]],'#93ca4d',.6);
   }else{
    const leaf=c.createLinearGradient(-3,-4,4,4);leaf.addColorStop(0,'#e7ff95');leaf.addColorStop(.5,'#86d142');leaf.addColorStop(1,'#226b30');c.fillStyle=leaf;c.beginPath();c.moveTo(-4,4);c.bezierCurveTo(-6,-3,0,-7,4,-5);c.bezierCurveTo(7,2,0,6,-4,4);c.fill();this.line([[-3,3],[3,-4]],'#d9fda1',.35);
   }
   this.label(g.recipe.ingredients[i],0,9.2,1.7,g.ingredients[i]?col:'#92aa94');c.restore();
  });
  // Tall bottle toy with a reflective glass silhouette and an animated juice level.
  c.save();c.translate(50,80);this.disc(0,4,8,'#061c16');c.beginPath();c.ellipse(0,3,7.6,4,0,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=.7;c.shadowColor=color;c.shadowBlur=g.bottleReady?8:2;c.stroke();c.shadowBlur=0;
  const bottle=c.createLinearGradient(-6,0,6,0);bottle.addColorStop(0,'#90c9b5');bottle.addColorStop(.2,'#dcffef55');bottle.addColorStop(.6,'#214c3655');bottle.addColorStop(.85,'#c4ffdfaa');bottle.addColorStop(1,'#739b87');c.fillStyle=bottle;c.beginPath();c.roundRect(-5.8,-21,11.6,25,2);c.fill();c.strokeStyle='#daffeaaa';c.lineWidth=.5;c.stroke();c.save();c.beginPath();c.roundRect(-5.1,-20,10.2,23,1.7);c.clip();const level=g.capping>0||g.rush?1:g.ingredients.filter(Boolean).length/3*.88;const height=4+level*18;c.fillStyle=g.capping>0?(this.bottleColor||color):color;c.globalAlpha=.8;c.fillRect(-5.1,3-height,10.2,height);c.fillStyle='#ffffffaa';c.fillRect(-4.6,3-height,9.2,.5);c.restore();c.fillStyle='#18542c';c.fillRect(-4.6,-12,9.2,8);this.label('suja',0,-6,4,'#fff');c.fillStyle='#e1e9df';c.fillRect(-3.8,-24-g.capping*4,7.6,3);for(let i=0;i<7;i++){c.fillStyle='#6c8078';c.fillRect(-3.3+i,-24-g.capping*4,.2,2.8);}this.line([[-4.4,-19],[-4.4,-14]],'#eaffef',.7);c.restore();
  this.disc(50,96,5.6,'#8da79e');this.disc(50,96,4.7,'#020c0a');c.save();c.beginPath();c.ellipse(50,96,5,4.1,0,0,Math.PI*2);c.strokeStyle=g.bottleReady||g.rush?color:'#496747';c.lineWidth=.6;c.shadowColor=color;c.shadowBlur=g.bottleReady?4:0;c.stroke();c.restore();
  for(let i=0;i<5;i++){const lit=g.bottleReady||g.rush,alpha=lit?.45+.4*Math.sin(t*7-i):.14;c.globalAlpha=Math.max(.1,alpha);this.line([[48.8,101+i*3.8],[50,99.3+i*3.8],[51.2,101+i*3.8]],color,.7,lit?2:0);}c.globalAlpha=1;
  this.display.drawMission(this.mission.getContext('2d'),g,t);c.drawImage(this.mission,19.5,112.5,61,13);this.label('COLD PRESS',79,111,1.9,'#cfb1ee');if(g.saver>0)this.label('BALL SAVE',50,174,2.2,color);
  this.line([[16,94],[30,94]],'#d4baf9',.6,1);c.save();c.translate(23,94);c.scale(1,Math.cos(g.spinnerAngle||0));c.fillStyle='#c091ef';c.fillRect(-5,-2,10,4);c.restore();this.label('JUICE SPINNER',23,102,1.9,'#d9bdff');
  for(const x of[14,81])this.disc(x,160,1.4,g.kickback?'#c7ff85':'#253c2d',g.kickback?3:0);
  // Raised translucent conveyor loop casts a real-looking offset shadow.
  const pts=Array.from({length:65},(_,i)=>{const p=rampPoint(i/64);return[p.x,p.y-p.z*.45];});this.line(pts.map(([x,y])=>[x+1.5,y+3]),'#00100c66',6);this.line(pts,'#557f744d',5.5);this.line(pts,'#d9baff',.8,1.5);for(const side of[-1,1])this.line(pts.map(([x,y])=>[x+side*2.5,y]),'#adc3be',.8);const rp=rampPoint((t*.3)%1);if(!this.reduced)this.disc(rp.x,rp.y-rp.z*.45,1,'#d2a7ff',4);
  for(let i=0;i<2;i++){const f=g.flippers[i],x=f.x+Math.cos(f.angle)*f.length,y=f.y+Math.sin(f.angle)*f.length;this.line([[f.x+1,f.y+2],[x+1,y+2]],'#030d0c',5);this.line([[f.x,f.y],[x,y]],'#bac5b6',4.8);this.line([[f.x,f.y-.3],[x,y-.3]],g.tilt?'#617766':color,3.5,!this.reduced&&g.inputs[i]?3:1);this.line([[f.x+1,f.y-1],[x,y-1]],'#e4ffbc',.5);this.disc(f.x,f.y,1.4,'#dae3cd');this.disc(f.x,f.y,.65,'#364d43');}
  const live=new Set(g.balls.map(b=>b.id));for(const id of this.trails.keys())if(!live.has(id))this.trails.delete(id);
  for(const b of g.balls){if(b.state==='bottle')continue;const h=b.z||0,y=b.y-h*.45;let trail=this.trails.get(b.id)||[];trail.unshift([b.x,y]);trail=trail.slice(0,9);this.trails.set(b.id,trail);if(!this.reduced&&b.state!=='shooter'){c.save();trail.forEach(([x,y],i)=>{c.globalAlpha=.24*(1-i/9);this.disc(x,y,b.r*(1-i*.05),g.rush?'#c59aff':color,2);});c.restore();}this.disc(b.x+1,y+1.3+h*.3,b.r,'#0008');const grad=c.createRadialGradient(b.x-.6,y-.8,.1,b.x,y,b.r);grad.addColorStop(0,'#fff');grad.addColorStop(.22,'#f1f6ff');grad.addColorStop(.4,'#8caba8');grad.addColorStop(.58,'#31483c');grad.addColorStop(.74,'#bec7d9');grad.addColorStop(1,'#335159');this.disc(b.x,y,b.r,grad);this.disc(b.x-.5,y-.7,.35,'#fff',.6);}
  for(const p of fx.particles){c.save();c.globalAlpha=Math.min(1,p.life*2);this.disc(p.x,p.y-p.z*.5,p.size*.6,p.color,1);c.restore();}for(const r of fx.rings){c.save();c.globalAlpha=r.life;c.beginPath();c.ellipse(r.x,r.y,(.5-r.life)*30+2,(.5-r.life)*20+1,0,0,Math.PI*2);c.strokeStyle=r.color;c.lineWidth=.6;c.stroke();c.restore();}for(const label of fx.labels){c.save();c.globalAlpha=Math.min(1,label.life*3);this.label('+'+Math.round(label.points).toLocaleString(),label.x,label.y-(1-label.life)*10,label.big?5:3.8,label.color);c.restore();}c.restore();
 }
}
