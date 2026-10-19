import {BUMPERS} from './table.js';

const GOLD='#ffd17a';
const recipes={
 fruit:{name:'FRUIT HARVEST',hint:'MAKE 6 BUMPER HITS',target:6,duration:40},
 spinner:{name:'SPINNER SPRINT',hint:'SHOOT LEFT SPINNER TWICE',target:2,duration:40},
 conveyor:{name:'COLD PRESS RUN',hint:'MAKE A RIGHT RAMP SHOT',target:1,duration:40},
 circuit:{name:'FACTORY TOUR',hint:'SPINNER · RAMP · LEFT ORBIT',target:3,duration:45}
};

// Goals follow actual table contacts. They never change the saved run schema.
export class FactoryOrders{
 constructor(game){this.game=game;this.phase='waiting';this.remaining=3;this.kind=null;this.progress=0;this.pack=0;this.completed=0;this.deliveries=0;this.round=0;this.bonus=0;this.seen=new Set();this.lastTick=Infinity;}
 get goal(){return recipes[this.kind]||null;}
 get jackpotReady(){return this.phase==='delivery';}
 get frenzy(){return this.phase==='frenzy';}
 get title(){return this.jackpotReady?'DELIVERY JACKPOT':this.frenzy?'FACTORY FRENZY':this.goal?.name||'FRESH FACTORY ORDERS';}
 get hint(){return this.jackpotReady?'SHOOT THE GOLDEN BOTTLE':this.frenzy?'SUPER BUMPERS · KEEP FLIPPING':this.goal?.hint||'THREE ORDERS LIGHT THE DELIVERY JACKPOT';}
 emit(type,data={}){this.game.emit(type,{color:GOLD,x:50,y:112,title:this.title,hint:this.hint,progress:this.progress,target:this.goal?.target||1,pack:this.pack,completed:this.completed,...data});}
 start(){
  const first=['fruit',this.game.seed%2?'spinner':'conveyor',this.game.seed%2?'conveyor':'spinner'];
  this.kind=this.round===0?first[this.pack]:['fruit','spinner','conveyor','circuit'][(this.completed+this.game.seed%4)%4];
  this.phase='order';this.remaining=this.goal.duration;this.progress=0;this.seen.clear();this.lastTick=Infinity;this.emit('order-start');
 }
 step(dt){
  if(!this.game.active)return;
  this.remaining=Math.max(0,this.remaining-dt);
  if(['waiting','cooldown'].includes(this.phase)){
   if(this.remaining===0){if(this.pack===3){this.phase='delivery';this.remaining=25;this.lastTick=Infinity;this.emit('delivery-ready');}else this.start();}
   return;
  }
  if(this.phase==='frenzy'){if(this.remaining===0)this.endFrenzy();return;}
  if(this.remaining===0){this.emit(this.jackpotReady?'delivery-expired':'order-expired');this.phase='waiting';this.remaining=3;this.kind=null;this.progress=0;if(this.pack===3)this.pack=2;return;}
  const seconds=Math.ceil(this.remaining);
  if(seconds<=8&&seconds!==this.lastTick){this.lastTick=seconds;this.emit('order-tick',{seconds,delivery:this.jackpotReady});}
 }
 event(e){
  if(this.phase!=='order'||!this.game.active||this.game.tilt)return;
  let hit=this.kind==='fruit'&&e.type==='bumper'||this.kind==='spinner'&&e.type==='spinner'||this.kind==='conveyor'&&e.type==='ramp';
  if(this.kind==='circuit'&&['spinner','ramp','orbit'].includes(e.type)&&!this.seen.has(e.type)){this.seen.add(e.type);hit=true;}
  if(!hit)return;
  this.progress=Math.min(this.goal.target,this.progress+1);
  if(this.progress<this.goal.target){this.emit('order-progress',{x:e.x,y:e.y});return;}
  this.pack++;this.completed++;this.phase='cooldown';this.remaining=3.2;
  const points=this.game.addScore(4000+this.pack*1000+Math.min(this.round,5)*1500);this.bonus+=points;
  this.game.kickback=true;this.game.chargePress(20);this.emit('order-complete',{points,x:e.x,y:e.y});
 }
 claim(ball){
  const g=this.game;if(!this.jackpotReady||!g.active||g.tilt||ball.state!=='free')return false;
  this.phase='frenzy';this.remaining=20;this.deliveries++;this.round++;this.pack=0;this.progress=0;
  ball.state='bottle';ball.routeTime=0;ball.x=50;ball.y=82;ball.vx=ball.vy=0;g.capping=1.2;g.kickback=true;g.saver=Math.max(g.saver,12);
  const points=g.addScore(20000+Math.min(this.round-1,5)*5000);this.bonus+=points;
  if(g.balls.length<2){const extra=g.addBall('free',70,65,-24,38);extra.cooldowns.bottle=g.time+3;}
  this.emit('delivery-jackpot',{points,x:50,y:82,balls:g.balls.length});return true;
 }
 endFrenzy(){this.phase='waiting';this.remaining=4;this.kind=null;this.emit('frenzy-end');}
 ballLost(){if(this.frenzy)this.endFrenzy();}
}

export function orderTargets(game){
 const o=game.orders;if(!o)return[];
 if(o.jackpotReady)return[{key:'bottle',x:50,y:96,r:6,color:GOLD}];
 if(o.frenzy||o.phase==='order'&&o.kind==='fruit')return BUMPERS.map(p=>({key:p.id,x:p.x,y:p.y,r:p.r+2,color:GOLD}));
 if(o.phase!=='order')return[];
 const shots={spinner:{key:'spinner',x:23,y:94,r:5,color:GOLD},ramp:{key:'ramp',x:78,y:103,r:5,color:GOLD},orbit:{key:'orbit',x:16,y:32,r:5,color:GOLD}};
 if(o.kind==='spinner')return[shots.spinner];if(o.kind==='conveyor')return[shots.ramp];
 return Object.entries(shots).filter(([key])=>!o.seen.has(key)).map(([,target])=>target);
}
