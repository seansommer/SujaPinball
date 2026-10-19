import test from'node:test';
import assert from'node:assert/strict';
import{Pinball}from'../src/physics.js';
import{orderTargets}from'../src/orders.js';

function live(seed=1){const events=[],g=new Pinball({seed,onEvent:e=>events.push(e)});g.state='playing';g.balls=[];return{g,events};}
function fillOrder(g){const o=g.orders;if(o.phase!=='order')o.start();const b=g.balls[0]||g.addBall('free',50,110);b.state='free';b.cooldowns.ramp=0;if(o.kind==='fruit')for(let i=0;i<6;i++)g.hitBumper(i%3,b);else if(o.kind==='spinner')for(let i=0;i<2;i++)g.spin(b);else if(o.kind==='conveyor')g.captureRamp(b);else for(const type of['spinner','ramp','orbit'])g.emit(type,{x:23,y:94});}
function readyDelivery(g){for(let i=0;i<3;i++){fillOrder(g);g.orders.step(3.3);}assert.equal(g.orders.phase,'delivery');}

test('factory orders follow real contacts, award once, and relight kickback',()=>{
 const{g,events}=live(),b=g.addBall('free');g.orders.step(3.1);assert.equal(g.orders.kind,'fruit');
 g.kickback=false;for(let i=0;i<5;i++)g.hitBumper(i%3,b);assert.equal(g.orders.progress,5);assert.equal(g.orders.completed,0);
 g.hitBumper(2,b);assert.equal(g.orders.completed,1);assert.equal(g.orders.pack,1);assert.ok(g.kickback);assert.ok(events.find(e=>e.type==='order-complete'&&e.points>=5000));
 g.hitBumper(0,b);assert.equal(g.orders.completed,1);assert.equal(events.filter(e=>e.type==='order-complete').length,1);
});
test('orders retain progress across a lost ball and stop their clocks during pause or launch preparation',()=>{
 const{g}=live(),b=g.addBall('free');g.orders.start();g.hitBumper(0,b);g.hitBumper(1,b);const clock=g.orders.remaining;
 g.kickback=false;g.saver=0;g.drain(b);assert.equal(g.orders.progress,2);g.orders.step(4);assert.equal(g.orders.remaining,clock);
 g.state='playing';g.paused=true;g.orders.step(4);assert.equal(g.orders.remaining,clock);
 g.paused=false;g.orders.step(1);assert.ok(g.orders.remaining<clock);
});
test('three orders light a collectible delivery jackpot that starts two-ball Frenzy without consuming a reserve',()=>{
 const{g,events}=live();const ball=g.addBall('free',50,103,0,-70);readyDelivery(g);
 assert.deepEqual(orderTargets(g).map(x=>x.key),['bottle']);g.ingredients.fill(false);const reserves=g.reserves,extras=g.extraBalls,oldScore=g.score;
 ball.state='free';assert.equal(g.collectBottle(ball),true);assert.equal(g.orders.frenzy,true);assert.equal(g.orders.deliveries,1);assert.equal(g.balls.length,2);assert.equal(g.reserves-reserves,g.extraBalls-extras);assert.ok(g.score-oldScore>=20000);assert.equal(g.saver,12);assert.equal(g.rushes,0);assert.equal(g.bottles,0);
 assert.ok(events.some(e=>e.type==='delivery-jackpot'));assert.equal(g.collectBottle(ball),false);assert.equal(g.orders.deliveries,1);
});
test('delivery jackpot cannot bypass tilt, requires a live ball, and never adds a fourth ball',()=>{
 const{g}=live();const ball=g.addBall('free');readyDelivery(g);ball.state='free';g.tilt=1;assert.equal(g.collectBottle(ball),false);assert.equal(g.orders.jackpotReady,true);
 g.tilt=0;ball.state='ramp';assert.equal(g.collectBottle(ball),false);ball.state='free';g.addBall('free');g.addBall('free');assert.equal(g.collectBottle(ball),true);assert.equal(g.balls.length,3);
});
test('expired delivery gives another order a chance without erasing recipes or earned order totals',()=>{
 const{g,events}=live();g.addBall('free');readyDelivery(g);g.ingredients=[true,false,true];g.orders.step(26);
 assert.equal(g.orders.phase,'waiting');assert.equal(g.orders.pack,2);assert.equal(g.orders.completed,3);assert.deepEqual(g.ingredients,[true,false,true]);assert.ok(events.some(e=>e.type==='delivery-expired'));
 g.orders.step(3.1);assert.equal(g.orders.phase,'order');fillOrder(g);g.orders.step(3.3);assert.equal(g.orders.jackpotReady,true);
});
test('factory tour requires distinct physical shot types and guides only the remaining shots',()=>{
 const{g}=live();g.orders.phase='order';g.orders.kind='circuit';g.orders.remaining=45;
 g.emit('spinner',{x:23,y:94});g.emit('spinner',{x:23,y:94});assert.equal(g.orders.progress,1);assert.deepEqual(orderTargets(g).map(x=>x.key),['ramp','orbit']);
 g.emit('ramp',{x:78,y:103});g.emit('orbit',{x:16,y:32});assert.equal(g.orders.completed,1);
});
test('Frenzy raises bumper rewards, ends cleanly, and preserves the shared persisted score schema',()=>{
 const{g,events}=live();const ball=g.addBall('free');const fields=Object.keys(g.result()).sort();readyDelivery(g);ball.state='free';g.collectBottle(ball);
 g.combo=0;g.lastScore=-10;g.multiplier=1;g.boost=0;g.rush=0;let score=g.score;g.hitBumper(0,ball);assert.equal(g.score-score,1000);
 g.orders.step(20.1);assert.equal(g.orders.frenzy,false);assert.equal(g.balls.length,2);assert.ok(events.some(e=>e.type==='frenzy-end'));assert.deepEqual(Object.keys(g.result()).sort(),fields);
 g.combo=0;g.lastScore=-10;score=g.score;g.hitBumper(1,ball);assert.equal(g.score-score,350);
});
test('last-second cues fire once per second and paused simulation does not emit late countdowns',()=>{
 const{g,events}=live();g.orders.start();g.orders.remaining=8.2;g.orders.step(.3);g.orders.step(.2);assert.equal(events.filter(e=>e.type==='order-tick').length,1);
 g.paused=true;g.orders.step(6);assert.equal(events.filter(e=>e.type==='order-tick').length,1);g.paused=false;g.orders.step(1);assert.equal(events.filter(e=>e.type==='order-tick').length,2);
});
