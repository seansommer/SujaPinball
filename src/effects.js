export class Effects{
 constructor(){this.time=0;this.hits=new Map();this.particles=[];this.rings=[];this.shake=0;this.flash=0;this.reduced=false;}
 event(e){const key=e.type==='bumper'?'pop-'+e.index:e.id||e.type;this.hits.set(key,this.time);if(['bumper','sling','target','flipper-hit','bottle','jackpot','rainbow','ramp','skill'].includes(e.type)){
  this.shake=Math.max(this.shake,['bottle','jackpot','rainbow'].includes(e.type)?1:.22);
  if(!this.reduced&&e.x!==undefined){const n=['bottle','jackpot','rainbow'].includes(e.type)?55:13;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=7+Math.random()*25;this.particles.push({x:e.x,y:e.y,z:2,vx:Math.cos(a)*s,vy:Math.sin(a)*s,vz:10+Math.random()*15,life:.35+Math.random()*.45,max:1,color:e.color||'#c5ff92',size:.5+Math.random()*.8});}this.rings.push({x:e.x,y:e.y,life:.45,color:e.color||'#c5ff92'});}
 }if(['bottle','rainbow','jackpot'].includes(e.type))this.flash=.5;}
 hit(key){return Math.max(0,1-(this.time-(this.hits.get(key)??-100))/.35);}
 step(dt){this.time+=dt;this.shake=Math.max(0,this.shake-dt*4);this.flash=Math.max(0,this.flash-dt);for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=55*dt;}this.particles=this.particles.filter(p=>p.life>0).slice(-150);for(const r of this.rings)r.life-=dt;this.rings=this.rings.filter(r=>r.life>0).slice(-12);}
 clear(){this.particles=[];this.rings=[];this.hits.clear();this.shake=0;this.flash=0;}
}
