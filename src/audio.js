const MUSIC={menu:'menu.mp3',table:'table.mp3',rainbow:'rainbow.mp3'};
const defaults={music:.24,sfx:.8,voice:.65};
export class PinballAudio{
 constructor(){try{this.settings={...defaults,...JSON.parse(localStorage.getItem('sujaPinballAudio'))};}catch{this.settings={...defaults};}this.ctx=null;this.active=false;this.track='menu';this.desired=null;this.cache=new Map();this.loads=new Map();this.generation=0;this.voice=null;this.lastVoice=-100;this.lastEffect={};this.musicSources=new Set();this.effectSources=new Set();this.rolling=null;this.onStatus=()=>{};}
 async unlock(){if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);this.sfx=this.ctx.createGain();this.sfx.connect(this.master);this.music=this.ctx.createGain();this.music.connect(this.master);this.voiceGain=this.ctx.createGain();this.voiceGain.connect(this.master);this.updateVolumes();this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*.2,this.ctx.sampleRate);const a=this.noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);for(const name of['flipper','metal','pop','drain','voice-bottle-ready','voice-fresh-bottle','voice-rainbow-rush','voice-extra-ball','voice-game-over'])this.load(name+'.mp3').catch(()=>{});}if(this.ctx.state==='suspended')await this.ctx.resume();if(this.active)this.select(this.track);}
 updateVolumes(){if(!this.ctx)return;const t=this.ctx.currentTime;this.sfx.gain.setTargetAtTime(clamp(this.settings.sfx),t,.03);this.music.gain.setTargetAtTime(clamp(this.settings.music)*(this.voice?.32:1),t,.08);this.voiceGain.gain.setTargetAtTime(clamp(this.settings.voice),t,.03);}
 set(key,value){this.settings[key]=clamp(value);try{localStorage.setItem('sujaPinballAudio',JSON.stringify(this.settings));}catch{}this.updateVolumes();}
 async load(name){if(this.cache.has(name))return this.cache.get(name);if(this.loads.has(name))return this.loads.get(name);const p=fetch('./assets/audio/'+name+'?v=factory-cabinet-1').then(r=>{if(!r.ok)throw Error('Audio unavailable');return r.arrayBuffer();}).then(b=>this.ctx.decodeAudioData(b)).then(b=>{this.cache.set(name,b);return b;}).finally(()=>this.loads.delete(name));this.loads.set(name,p);return p;}
 setActive(active,track=this.track){this.active=active;this.track=track;if(this.master)this.master.gain.setTargetAtTime(active?1:0,this.ctx.currentTime,.008);if(!active)this.clearEffects();else if(track==='menu')this.stopRolling();if(!active){this.desired=null;this.generation++;for(const src of this.musicSources){try{src.stop();}catch{}}this.musicSources.clear();this.musicSource=null;this.stopVoice();}else if(this.ctx)this.select(track);}
 async select(track){if(!this.ctx||!this.active)return;if(this.musicSource&&this.currentTrack===track)return;if(this.desired===track)return;this.desired=track;const g=++this.generation;
  try{const buffer=await this.load(MUSIC[track]);if(g!==this.generation||!this.active||this.track!==track)return;const src=this.ctx.createBufferSource(),gain=this.ctx.createGain();src.buffer=buffer;src.loop=true;gain.gain.value=0;gain.connect(this.music);src.connect(gain);const t=this.ctx.currentTime;gain.gain.linearRampToValueAtTime(1,t+1.2);src.start();this.musicSources.add(src);src.onended=()=>this.musicSources.delete(src);const old=this.musicSource,oldGain=this.musicFade;if(old){oldGain.gain.cancelScheduledValues(t);oldGain.gain.setTargetAtTime(0,t,.25);try{old.stop(t+1);}catch{}}this.musicSource=src;this.musicFade=gain;this.currentTrack=track;this.onStatus('Sound ready.');
  }catch{if(g===this.generation){this.desired=null;this.onStatus('Music could not load. Tap the music button to retry.');}}
 }
 sample(name,gain=.5,rate=1){const b=this.cache.get(name+'.mp3');if(!this.ctx||!b||!this.active)return;const src=this.ctx.createBufferSource(),vol=this.ctx.createGain();src.buffer=b;src.playbackRate.value=rate;vol.gain.value=gain;src.connect(vol);vol.connect(this.sfx);this.trackEffect(src);src.start();}
 tone(freq,duration=.12,volume=.12,type='sine',delay=0,end=null){if(!this.ctx||!this.active)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.sfx);this.trackEffect(o);o.start(t);o.stop(t+duration+.02);}
 crack(volume=.08,duration=.06,cutoff=1500){if(!this.ctx||!this.active)return;const t=this.ctx.currentTime,src=this.ctx.createBufferSource(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();src.buffer=this.noise;f.type='highpass';f.frequency.value=cutoff;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);src.connect(f);f.connect(g);g.connect(this.sfx);this.trackEffect(src);src.loop=duration>.18;src.start();src.stop(t+duration);}
 chord(notes,delay=.055,volume=.1){notes.forEach((n,i)=>this.tone(n,.23,volume,'triangle',i*delay));}
 async say(name,priority=false){if(!this.ctx||!this.active||this.settings.voice===0)return;const t=this.ctx.currentTime;if(!priority&&(this.voice||t-this.lastVoice<2.2))return;this.stopVoice();const token=++this.voiceToken||1;this.voiceToken=token;try{const b=await this.load('voice-'+name+'.mp3');if(this.voiceToken!==token||!this.active)return;const src=this.ctx.createBufferSource();src.buffer=b;src.connect(this.voiceGain);this.voice=src;this.lastVoice=t;this.updateVolumes();src.onended=()=>{if(this.voice===src){this.voice=null;this.updateVolumes();}};src.start();}catch{}}
 stopVoice(){this.voiceToken=(this.voiceToken||0)+1;if(this.voice){try{this.voice.stop();}catch{}this.voice=null;this.updateVolumes();}}
 trackEffect(source){this.effectSources.add(source);source.onended=()=>{this.effectSources.delete(source);source.disconnect?.();};}
 clearEffects(){for(const source of this.effectSources){try{source.stop();}catch{}}this.effectSources.clear();this.stopRolling();}
 stopRolling(){if(this.rolling){try{this.rolling.source.stop();}catch{}this.rolling=null;}}
 bell(note,volume=.09,decay=.2){for(const[ratio,gain]of[[1,1],[2.71,.35],[5.43,.12]])this.tone(note*ratio,decay/Math.sqrt(ratio),volume*gain,'sine');}
 steam(volume=.08,duration=.25,frequency=850){this.crack(volume,duration,frequency);this.tone(110,duration,.035,'triangle',0,55);}
 update(game,dt){
  if(!this.ctx||!this.active||!game.active){this.stopRolling();return;}
  const balls=game.balls.filter(b=>['free','ramp','launch'].includes(b.state));
  const speed=balls.reduce((sum,b)=>sum+Math.hypot(b.vx||0,b.vy||0),0),meanX=balls.length?balls.reduce((sum,b)=>sum+b.x,0)/balls.length:50;
  if(!this.rolling){
   const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate),samples=buffer.getChannelData(0);let brown=0;
   for(let i=0;i<samples.length;i++){brown=(brown+(Math.random()*2-1)*.035)/1.02;samples[i]=brown*3;}
   const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain(),pan=this.ctx.createStereoPanner?.();
   source.buffer=buffer;source.loop=true;filter.type='lowpass';gain.gain.value=0;source.connect(filter);filter.connect(gain);if(pan){gain.connect(pan);pan.connect(this.sfx);}else gain.connect(this.sfx);source.start();this.rolling={source,filter,gain,pan};
  }
  const r=this.rolling,t=this.ctx.currentTime;r.gain.gain.setTargetAtTime(Math.min(.045,speed/7000),t,.06);r.filter.frequency.setTargetAtTime(180+Math.min(speed,300)*6,t,.08);r.source.playbackRate.setTargetAtTime(.55+Math.min(speed,220)/170,t,.08);r.pan?.pan.setTargetAtTime((meanX-50)/65,t,.08);
 }
 event(e){
  if(!this.ctx||!this.active)return;const t=this.ctx.currentTime;
  const interval=({rail:.065,'flipper-hit':.045,spinner:.12,gate:.08})[e.type]||.018;
  if(t-(this.lastEffect[e.type]??-100)<interval)return;this.lastEffect[e.type]=t;
  const ingredient=[293.66,349.23,440][e.index||0];
  switch(e.type){
   case'flipper-up':this.sample('flipper',.58,1.02+(e.index||0)*.04);this.tone(76,.045,.12,'triangle',0,44);this.crack(.055,.025,2200);break;
   case'flipper-down':this.sample('flipper',.2,.72);this.tone(58,.055,.05,'sine');break;
   case'flipper-hit':this.crack(.07,.035,1900);this.bell(380+(e.index||0)*37,.045,.08);break;
   case'power-shot':this.steam(.055,.14,1800);this.tone(200,.13,.045,'triangle',0,600);break;
   case'rail':this.sample('metal',Math.min(.26,(e.strength||20)/240),.85+Math.random()*.25);this.bell(780+Math.random()*320,.016,.045);break;
   case'bumper':this.sample('pop',.55,.8+(e.index||0)*.14);this.bell(ingredient,.13,.22);this.tone(95,.12,.14,'sine',0,42);if(e.fresh)this.tone(ingredient*2,.25,.055,'triangle',.055);break;
   case'sling':this.crack(.17,.065,500);this.tone(e.id==='sling-l'?160:184,.1,.12,'triangle',0,65);this.bell(620,.04,.08);break;
   case'target':this.bell([587.33,698.46,880,1046.5][e.index||0],.1,.26);this.crack(.06,.02,1700);break;
   case'bank-complete':this.chord([293.66,440,587.33,880],.055,.12);this.steam(.09,.28,800);break;
   case'gate':this.bell(587.33+(e.index||0)*146.83,.065,.18);break;
   case'plunger-pull':this.crack(.035,.18,3700);this.tone(65,.17,.035,'triangle',0,120);break;
   case'launch':this.crack(.14,.2,600);this.tone(85,.23,.16,'triangle',0,42);this.bell(1174.66,.045,.22);break;
   case'count':this.tone(147,.1,.1,'triangle');this.crack(.07,.035,2500);this.bell(440+(e.number||1)*73.4,.08,.13);break;
   case'ready':this.chord([293.66,440,587.33],.04,.11);break;
   case'skill':this.chord([587.33,698.46,880,1174.66],.06,.14);this.steam(.09,.2,2100);break;
   case'spinner':for(let i=0;i<Math.min(8,e.turns||4);i++)this.tone([587.33,698.46,880,1046.5][i%4],.1,.065,'triangle',i*.032);this.crack(.045,.18,3500);break;
   case'orbit':this.chord([293.66,349.23,440,587.33],.045,.1);this.tone(180,.28,.06,'triangle',0,1000);break;
   case'ramp':this.steam(.09,.25,600);this.tone(140,.48,.055,'triangle',0,880);this.chord([293.66,440,587.33],.085,.08);break;
   case'ramp-exit':this.sample('metal',.23,1.45);this.bell(587.33,.055,.11);break;
   case'bottle-hit':this.bell(196,.065,.16);break;
   case'bottle-ready':this.chord([440,587.33,880],.07,.12);this.say('bottle-ready');break;
   case'bottle':this.steam(.13,.45,1300);this.tone(120,.3,.09,'sine',0,65);this.chord([293.66,349.23,440,587.33,698.46,880],.06,.13);this.say('fresh-bottle');break;
   case'rainbow':this.chord([293.66,349.23,440,587.33,698.46,880,1174.66],.05,.14);this.steam(.14,.5,1900);this.say('rainbow-rush',true);break;
   case'jackpot':this.chord([587.33,698.46,880,1174.66,1396.9],.055,.17);this.bell(147,.15,.55);this.steam(.12,.3,2500);break;
   case'pressure-ready':this.chord([146.83,220,293.66,440,587.33,880],.05,.13);this.steam(.16,.45,900);break;
   case'pressure-end':this.chord([587.33,440,293.66],.05,.06);break;
   case'shot-chain':this.chord([440,587.33,698.46,880].slice(0,Math.min(4,e.chain||2)),.04,.1);break;
   case'extra-ball':this.chord([440,587.33,880,1174.66],.075,.13);this.say('extra-ball',true);break;
   case'multiplier':case'save-lit':this.chord([349.23,440,698.46],.065,.1);break;
   case'kickback':this.tone(75,.12,.16,'triangle',0,160);this.crack(.15,.09,900);this.chord([440,587.33,880],.04,.08);break;
   case'saved':this.chord([349.23,440,587.33],.07,.1);this.steam(.07,.15,1200);break;
   case'drain':this.sample('drain',.34,.72);this.tone(85,.22,.065,'triangle',0,38);break;
   case'tilt':this.tone(73.42,.6,.12,'triangle');this.tone(77.78,.6,.1,'triangle');break;
   case'nudge':this.sample('metal',.28,.55);this.tone(48,.1,.08,'sine');break;
   case'over':this.chord([587.33,440,349.23,293.66],.15,.1);this.say('game-over',true);break;
   case'combo':this.chord([440,587.33,880],.05,.09);break;
   case'select':this.bell(587.33,.045,.06);break;
  }
 }

}
const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
