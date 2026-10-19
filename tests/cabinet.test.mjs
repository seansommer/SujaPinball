import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {fitCabinet} from '../src/camera.js';
import {Pinball} from '../src/physics.js';

const advance=(g,seconds)=>{for(let i=0;i<Math.ceil(seconds*240);i++)g.step(1/240);};
const live=()=>{const events=[],game=new Pinball({mode:'practice',onEvent:e=>events.push(e)});game.state='playing';game.balls=[];return{game,events};};

test('portrait cabinet uses at least 95% of phone width and keeps rails inside the screen',()=>{
 for(const [w,h]of[[390,768],[393,776],[430,856]]){
  const camera=new T.PerspectiveCamera();fitCabinet(camera,w,h);
  const projected=[];
  for(const x of[-51,51])for(const z of[-92,92]){const p=new T.Vector3(x,3,z).project(camera);projected.push({x:(p.x+1)*w/2,y:(1-p.y)*h/2});}
  assert.ok((Math.max(...projected.map(p=>p.x))-Math.min(...projected.map(p=>p.x)))/w>.95);
  for(const p of projected){assert.ok(p.x>=0&&p.x<=w);assert.ok(p.y>=44&&p.y<h);}
 }
});
test('all three view angles keep the score glass, bottle, and flippers visible on a short phone',()=>{
 for(const view of['cabinet','overhead','deep']){
  const camera=new T.PerspectiveCamera();fitCabinet(camera,375,660,view);
  for(const p of[new T.Vector3(-47,5,-110),new T.Vector3(47,5,-110),new T.Vector3(0,33,-11),new T.Vector3(0,3,73)]){
   const projected=p.project(camera);assert.ok(Math.abs(projected.x)<=1.001);assert.ok(Math.abs(projected.y)<=1.001);
  }
 }
});
test('spinner and distinct linked shots charge a temporary double-score press',()=>{
 const {game:g,events}=live(),ball=g.addBall('free',23,94,0,90);
 g.spin(ball);assert.ok(events.some(e=>e.type==='spinner'&&e.turns>=4&&e.points>0));
 g.registerShot('orbit',16,32);assert.ok(events.some(e=>e.type==='shot-chain'&&e.chain===2));
 g.chargePress(100);assert.equal(g.boost,12);g.combo=0;g.lastScore=-10;const boosted=g.addScore(100);assert.equal(boosted,200);
 g.paused=true;advance(g,3);assert.equal(g.boost,12);
 g.paused=false;g.balls=[];advance(g,12.1);assert.equal(g.boost,0);assert.ok(events.some(e=>e.type==='pressure-end'));
});
test('outlane kickback rescues one ball, then allows the next outlane drain',()=>{
 const {game:g,events}=live(),ball=g.addBall('free',10,166,0,50);
 assert.equal(g.rescueOutlane(ball),true);assert.ok(ball.vy<0);assert.equal(g.kickback,false);assert.equal(events.filter(e=>e.type==='kickback').length,1);
 Object.assign(ball,{x:10,y:166,vy:50});assert.equal(g.rescueOutlane(ball),false);
});
test('a timed flipper shot has enough energy to reach the upper ingredient section',()=>{
 const {game:g}=live(),ball=g.addBall('free',41,151,0,55);g.setFlipper(0,true);advance(g,.08);
 assert.ok(ball.vy<-115);assert.ok(ball.y-ball.vy**2/(2*68)<50);
});
