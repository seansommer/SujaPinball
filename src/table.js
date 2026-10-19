export const W=100,H=180,R=1.65;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const JUICES=[
 {name:'GREEN GLOW',color:'#b9f36a',dark:'#1b5d30',ingredients:['KALE','CUCUMBER','CELERY']},
 {name:'CITRUS SPARK',color:'#ffd36a',dark:'#8a4f18',ingredients:['LEMON','ORANGE','PINEAPPLE']},
 {name:'CARROT CRUSH',color:'#ff9759',dark:'#8f361d',ingredients:['CARROT','GINGER','TURMERIC']},
 {name:'BERRY BRILLIANT',color:'#d2a2ff',dark:'#592f86',ingredients:['BERRY','APPLE','BEET']}
];
export const BUMPERS=[{id:'pop-0',x:29,y:47,r:6.3,index:0},{id:'pop-1',x:70,y:47,r:6.3,index:1},{id:'pop-2',x:50,y:27,r:6.3,index:2}];
export const BANK=[{x:12,y:71},{x:12,y:84},{x:84,y:72},{x:84,y:85}];
export const GATES=[{x:26,y:14},{x:50,y:12},{x:74,y:14}];
const boundary=[[5,174],[5,31],[8,19],[17,10],[32,5],[67,5],[83,11],[94,23],[97,39],[97,178]];
export const WALLS=boundary.slice(1).map((p,i)=>({a:boundary[i],b:p,kind:'rail'})).concat([
 {a:[89,174],b:[89,55],kind:'shooter'},
 {a:[7,113],b:[12,140],kind:'guide'},{a:[12,140],b:[26,154],kind:'guide'},
 {a:[87,113],b:[82,140],kind:'guide'},{a:[82,140],b:[74,154],kind:'guide'},
 {a:[6,149],b:[18,173],kind:'rail'},{a:[88,149],b:[78,173],kind:'rail'}
]);
export const SLINGS=[{id:'sling-l',points:[[17,118],[31,139],[18,140]],color:'#bd81ff'},{id:'sling-r',points:[[83,118],[69,139],[82,140]],color:'#bd81ff'}];
export const FLIPPERS=[{id:'left',x:28,y:154,length:20,r:2,rest:.50,up:-.55},{id:'right',x:72,y:154,length:20,r:2,rest:Math.PI-.50,up:Math.PI+.55}];
export const RAMP=[[78,103],[86,79],[83,46],[69,24],[37,23],[18,45],[16,79],[21,116]];
export function rampPoint(t){const n=RAMP.length-1,u=clamp(t,0,.999999)*n,i=Math.floor(u),v=u-i,a=RAMP[Math.max(0,i-1)],b=RAMP[i],c=RAMP[Math.min(n,i+1)],d=RAMP[Math.min(n,i+2)];const k=(p0,p1,p2,p3)=>.5*((2*p1)+(-p0+p2)*v+(2*p0-5*p1+4*p2-p3)*v*v+(-p0+3*p1-3*p2+p3)*v*v*v);return{x:k(a[0],b[0],c[0],d[0]),y:k(a[1],b[1],c[1],d[1]),z:2+Math.sin(t*Math.PI)*5};}
export function nearest(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return{x:ax+dx*t,y:ay+dy*t,t};}
export function validRun(r){return r&&r.version==='1.0.0'&&r.game==='suja-pinball'&&r.mode==='arcade'&&Number.isFinite(r.score)&&r.score>=0&&Number.isFinite(r.duration)&&r.duration>=0;}
export function rankRuns(directory={},runs={},hidden={}){return Object.entries(runs||{}).flatMap(([uid,rows])=>directory[uid]?Object.entries(rows||{}).filter(([id,r])=>!hidden?.[uid]?.[id]&&validRun(r)).map(([id,r])=>({...r,id,uid,displayName:directory[uid].displayName})):[]).sort((a,b)=>b.score-a.score||b.bottles-a.bottles||a.duration-b.duration||a.id.localeCompare(b.id)).slice(0,10);}
