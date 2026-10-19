import{validRun}from'./table.js';
export class RunStore{
 constructor(storage){this.storage=storage;}
 get(key,fallback){try{return JSON.parse(this.storage.getItem(key))??fallback;}catch{return fallback;}}
 set(key,data){try{this.storage.setItem(key,JSON.stringify(data));return true;}catch{return false;}}
 runs(owner=null){const data=this.get('sujaPinballRuns:'+(owner||'guest'),[]);return Array.isArray(data)?data:[];}
 add(id,owner,result,displayName='Guest'){const rows=this.runs(owner).filter(r=>r.id!==id);rows.push({...result,id,displayName,at:Date.now()});this.set('sujaPinballRuns:'+(owner||'guest'),rows.sort((a,b)=>b.score-a.score).slice(0,100));if(owner&&validRun(result)){const pending=this.pending().filter(r=>r.id!==id);pending.push({id,owner,result});this.set('sujaPinballPending',pending.slice(-50));}}
 pending(){const data=this.get('sujaPinballPending',[]);return Array.isArray(data)?data:[];}
 removePending(id,owner){this.set('sujaPinballPending',this.pending().filter(r=>r.id!==id||r.owner!==owner));}
 best(owner=null){return Math.max(0,...this.runs(owner).filter(validRun).map(r=>r.score));}
 top(owner=null){return this.runs(owner).filter(validRun).slice(0,10);}
}
