export class Effects{
 constructor(){this.time=0;this.hits=new Map();this.particles=[];this.rings=[];this.labels=[];this.serial=0;this.show=null;this.shake=0;this.flash=0;this.reduced=false;}
 event(e){const key=e.type==='bumper'?'pop-'+e.index:e.type==='target'?'target-'+e.index:e.id||e.type;this.hits.set(key,this.time);
  if(e.points&&e.x!==undefined&&!this.reduced)this.labels.push({id:++this.serial,x:e.x,y:e.y,life:1.05,max:1.05,color:e.color||'#c5ff92',points:e.points,big:e.points>=2500});
  if(['bottle','jackpot','rainbow','pressure-ready','bank-complete','skill','ramp','kickback'].includes(e.type))this.show={type:e.type,start:this.time,duration:e.type==='rainbow'?5:e.type==='pressure-ready'?3:1.4,color:e.color};
  if(['bumper','sling','target','flipper-hit','bottle','jackpot','rainbow','ramp','skill','spinner','kickback','power-shot','pressure-ready'].includes(e.type)){
  this.shake=Math.max(this.shake,['bottle','jackpot','rainbow'].includes(e.type)?1:.22);
  if(!this.reduced&&e.x!==undefined){const n=['bottle','jackpot','rainbow'].includes(e.type)?55:13;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=7+Math.random()*25;this.particles.push({x:e.x,y:e.y,z:2,vx:Math.cos(a)*s,vy:Math.sin(a)*s,vz:10+Math.random()*15,life:.35+Math.random()*.45,max:1,color:e.color||'#c5ff92',size:.5+Math.random()*.8});}this.rings.push({x:e.x,y:e.y,life:.45,color:e.color||'#c5ff92'});}
 }if(['bottle','rainbow','jackpot'].includes(e.type))this.flash=.5;}
 hit(key){return Math.max(0,1-(this.time-(this.hits.get(key)??-100))/.35);}
 step(dt){this.time+=dt;this.shake=Math.max(0,this.shake-dt*4);this.flash=Math.max(0,this.flash-dt);for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=55*dt;}this.particles=this.particles.filter(p=>p.life>0).slice(-150);for(const r of this.rings)r.life-=dt;this.rings=this.rings.filter(r=>r.life>0).slice(-12);for(const label of this.labels)label.life-=dt;this.labels=this.labels.filter(l=>l.life>0).slice(-18);if(this.show&&this.time-this.show.start>this.show.duration)this.show=null;}
 clear(){this.particles=[];this.rings=[];this.labels=[];this.show=null;this.hits.clear();this.shake=0;this.flash=0;}
}
