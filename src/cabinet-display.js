const number=n=>Math.round(n||0).toLocaleString('en-US');
export class CabinetDisplay{
 constructor(){this.score=0;this.lastTarget=0;this.pulse=0;}
 step(game,dt){if(game.score<this.lastTarget)this.score=game.score;this.lastTarget=game.score;this.score+=(game.score-this.score)*Math.min(1,dt*11);if(Math.abs(game.score-this.score)<.5)this.score=game.score;this.pulse=Math.max(0,this.pulse-dt*2.5);}
 hit(e){if(e.points)this.pulse=Math.max(this.pulse,e.points>=2500?1:.35);}
 draw(c,game,time,w=1024,h=240){
  c.clearRect(0,0,w,h);c.save();c.scale(w/1024,h/240);
  c.fillStyle='#021410';c.fillRect(0,0,1024,240);
  const color=game.rush?'#e2bdff':game.orders?.frenzy?'#ffd17a':game.recipe.color;
  c.strokeStyle=color;c.lineWidth=3;c.strokeRect(5,5,1014,230);
  c.fillStyle='#b0d5b9';c.font='700 20px Arial';c.textAlign='left';c.fillText('SUJA  /  THE JUICE FACTORY',28,33);
  c.textAlign='right';c.fillStyle=color;c.fillText(game.rush?'RAINBOW RUSH':game.orders?.frenzy?'FACTORY FRENZY':game.recipe.name,995,33);
  c.save();c.beginPath();c.rect(25,45,730,128);c.clip();
  const value=Math.max(0,this.score),count=Math.max(7,String(Math.floor(game.score)).length),digits=String(Math.floor(value)).padStart(count,'0'),cell=650/count;
  c.font=`900 ${Math.min(117,cell*1.28)}px "Barlow Condensed", "Arial Narrow", Arial`;c.textAlign='center';
  c.shadowColor=color;c.shadowBlur=6+this.pulse*10;
  for(let i=0;i<count;i++){
   const magnitude=10**(count-1-i),rolling=value/magnitude,base=Math.floor(rolling),fraction=Math.max(0,(rolling-base-.92)/.08);
   c.fillStyle=i<count-Math.max(1,digits.replace(/^0+/,'').length)?'#244132':color;
   const x=28+cell*(i+.5);
   c.fillText(String(base%10),x,151-fraction*130);
   c.fillText(String((base+1)%10),x,281-fraction*130);
  }
  c.restore();c.shadowBlur=0;
  c.strokeStyle='#719b5f66';c.beginPath();c.moveTo(780,51);c.lineTo(780,171);c.stroke();
  c.fillStyle=color;c.textAlign='center';c.font='900 94px "Barlow Condensed", Arial';c.fillText((game.multiplier*(game.rush?3:1)*(game.boost>0?2:1))+'×',890,143);
  c.fillStyle='#c9ddca';c.textAlign='left';c.font='700 20px Arial';c.fillText(game.mode==='practice'?'PRACTICE · FREE PLAY':`BALL ${game.ballNumber} / ${3+game.extraBalls}`,28,205);
  c.textAlign='right';c.fillStyle=game.rush?'#e2bdff':game.boost>0?'#ffd46b':'#b8d5ba';
  c.fillText(game.rush?`JACKPOTS  ·  ${Math.ceil(game.rush)}s`:game.orders?.frenzy?`SUPER BUMPERS  ·  ${Math.ceil(game.orders.remaining)}s`:game.boost>0?`POWER PRESS  ·  ${Math.ceil(game.boost)}s`:game.combo>1?`${game.combo} HIT STREAK`:'FRESH JUICE. FULL TILT.',995,205);
  // Very faint dot-matrix glass texture; the score stays crisp at phone size.
  c.fillStyle='#00000019';for(let y=8;y<232;y+=6)c.fillRect(8,y,1008,1);
  c.restore();
 }
 drawMission(c,game,time,w=1024,h=180){
  c.clearRect(0,0,w,h);c.save();c.scale(w/1024,h/180);
  const color=game.boost>0?'#ffd579':game.recipe.color;
  c.fillStyle='#031a16e8';c.fillRect(0,0,1024,180);c.strokeStyle=color;c.lineWidth=3;c.strokeRect(4,4,1016,172);
  const order=game.orders;
  if(order&&['order','delivery','frenzy'].includes(order.phase)){
   const urgent=order.remaining<=8&&!order.frenzy,ink=urgent?'#ffb181':'#ffd17a';
   c.strokeStyle=ink;c.strokeRect(4,4,1016,172);c.textAlign='center';c.fillStyle=ink;c.font='900 44px "Barlow Condensed",Arial';c.fillText(order.title,512,49,950);
   c.font='800 37px Arial';c.fillStyle='#e5f3d7';c.fillText(order.hint,512,84,960);
   c.textAlign='left';c.fillStyle=ink;c.font='800 28px Arial';c.fillText(order.jackpotReady?'20,000+ JACKPOT':order.frenzy?'1,000+ PER BUMPER':`ORDER ${order.pack+1} / 3`,40,116);
   c.textAlign='center';if(order.phase==='order')c.fillText(`${order.progress} / ${order.goal.target}`,512,116);
   c.textAlign='right';c.fillText(`${Math.ceil(order.remaining)}s`,984,116);
   const total=order.jackpotReady?25:order.frenzy?20:order.goal.duration;
   c.fillStyle='#244032';c.fillRect(40,131,944,12);c.fillStyle=ink;c.fillRect(40,131,944*Math.min(1,order.remaining/total),12);
   c.textAlign='center';c.font='700 16px Arial';c.fillStyle='#aac7ad';c.fillText(order.jackpotReady?'GOLDEN BOTTLE RELEASES A SECOND BALL':order.frenzy?'KEEP THE JUICE FLOWING':game.boost>0?'POWER PRESS · DOUBLE POINTS':`PRESS ${Math.round(game.pressure||0)}%  ·  ${game.kickback?'KICKBACK READY':'FILL AN ORDER TO RELIGHT KICKBACK'}`,512,166,950);
   c.restore();return;
  }
  c.textAlign='center';c.fillStyle=color;c.font='900 42px "Barlow Condensed", Arial';
  c.fillText(game.rush?'BOTTLE JACKPOTS':game.bottleReady?'SHOOT THE BOTTLE':game.boost>0?'POWER PRESS · DOUBLE POINTS':'COLLECT THE THREE INGREDIENTS',512,50);
  for(let i=0;i<3;i++){
   const x=180+i*332,lit=game.ingredients[i]||game.rush>0;
   c.shadowBlur=lit?14:0;c.shadowColor=color;c.fillStyle=lit?color:'#29483b';c.beginPath();c.arc(x-85,91,10,0,Math.PI*2);c.fill();c.shadowBlur=0;
   c.fillStyle=lit?'#f0ffe3':'#89a998';c.font='700 24px Arial';c.fillText(game.recipe.ingredients[i],x+12,100);
  }
  c.fillStyle='#173b30';c.fillRect(40,131,944,13);c.fillStyle=color;
  c.fillRect(40,131,944*(game.boost>0?game.boost/12:(game.pressure||0)/100),13);
  c.font='700 16px Arial';c.fillStyle='#aac7ad';c.fillText(game.boost>0?'THE FACTORY IS IN OVERDRIVE':'SPINNER + TARGETS + LOOPS CHARGE THE PRESS',512,165);c.restore();
 }
}
