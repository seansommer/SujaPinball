const MUSIC={menu:'menu.mp3',table:'table.mp3',rainbow:'rainbow.mp3'};
const defaults={music:.17,sfx:.8,voice:.85};
export class PinballAudio{
 constructor(){try{this.settings={...defaults,...JSON.parse(localStorage.getItem('sujaPinballAudio'))};}catch{this.settings={...defaults};}this.ctx=null;this.active=false;this.track='menu';this.desired=null;this.cache=new Map();this.loads=new Map();this.generation=0;this.voice=null;this.lastVoice=-100;this.lastEffect={};this.musicSources=new Set();this.onStatus=()=>{};}
 async unlock(){if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);this.sfx=this.ctx.createGain();this.sfx.connect(this.master);this.music=this.ctx.createGain();this.music.connect(this.master);this.voiceGain=this.ctx.createGain();this.voiceGain.connect(this.master);this.updateVolumes();this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*.2,this.ctx.sampleRate);const a=this.noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);for(const name of['flipper','metal','pop','drain','voice-congratulations','voice-objective-achieved','voice-go','voice-look-out','voice-game-over'])this.load(name+'.mp3').catch(()=>{});}if(this.ctx.state==='suspended')await this.ctx.resume();if(this.active)this.select(this.track);}
 updateVolumes(){if(!this.ctx)return;const t=this.ctx.currentTime;this.sfx.gain.setTargetAtTime(clamp(this.settings.sfx),t,.03);this.music.gain.setTargetAtTime(clamp(this.settings.music)*(this.voice?.32:1),t,.08);this.voiceGain.gain.setTargetAtTime(clamp(this.settings.voice),t,.03);}
 set(key,value){this.settings[key]=clamp(value);try{localStorage.setItem('sujaPinballAudio',JSON.stringify(this.settings));}catch{}this.updateVolumes();}
 async load(name){if(this.cache.has(name))return this.cache.get(name);if(this.loads.has(name))return this.loads.get(name);const p=fetch('./assets/audio/'+name).then(r=>{if(!r.ok)throw Error('Audio unavailable');return r.arrayBuffer();}).then(b=>this.ctx.decodeAudioData(b)).then(b=>{this.cache.set(name,b);return b;}).finally(()=>this.loads.delete(name));this.loads.set(name,p);return p;}
 setActive(active,track=this.track){this.active=active;this.track=track;if(!active){this.desired=null;this.generation++;for(const src of this.musicSources){try{src.stop();}catch{}}this.musicSources.clear();this.musicSource=null;this.stopVoice();}else if(this.ctx)this.select(track);}
 async select(track){if(!this.ctx||!this.active)return;if(this.musicSource&&this.currentTrack===track)return;if(this.desired===track)return;this.desired=track;const g=++this.generation;
  try{const buffer=await this.load(MUSIC[track]);if(g!==this.generation||!this.active||this.track!==track)return;const src=this.ctx.createBufferSource(),gain=this.ctx.createGain();src.buffer=buffer;src.loop=true;gain.gain.value=0;gain.connect(this.music);src.connect(gain);const t=this.ctx.currentTime;gain.gain.linearRampToValueAtTime(1,t+1.2);src.start();this.musicSources.add(src);src.onended=()=>this.musicSources.delete(src);const old=this.musicSource,oldGain=this.musicFade;if(old){oldGain.gain.cancelScheduledValues(t);oldGain.gain.setTargetAtTime(0,t,.25);try{old.stop(t+1);}catch{}}this.musicSource=src;this.musicFade=gain;this.currentTrack=track;this.onStatus('Sound ready.');
  }catch{if(g===this.generation){this.desired=null;this.onStatus('Music could not load. Tap the music button to retry.');}}
 }
 sample(name,gain=.5,rate=1){const b=this.cache.get(name+'.mp3');if(!this.ctx||!b||!this.active)return;const src=this.ctx.createBufferSource(),vol=this.ctx.createGain();src.buffer=b;src.playbackRate.value=rate;vol.gain.value=gain;src.connect(vol);vol.connect(this.sfx);src.start();}
 tone(freq,duration=.12,volume=.12,type='sine',delay=0,end=null){if(!this.ctx||!this.active)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.sfx);o.start(t);o.stop(t+duration+.02);}
 crack(volume=.08,duration=.06,cutoff=1500){if(!this.ctx||!this.active)return;const t=this.ctx.currentTime,src=this.ctx.createBufferSource(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();src.buffer=this.noise;f.type='highpass';f.frequency.value=cutoff;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);src.connect(f);f.connect(g);g.connect(this.sfx);src.start();src.stop(t+duration);}
 chord(notes,delay=.055,volume=.1){notes.forEach((n,i)=>this.tone(n,.23,volume,'triangle',i*delay));}
 async say(name,priority=false){if(!this.ctx||!this.active||this.settings.voice===0)return;const t=this.ctx.currentTime;if(!priority&&(this.voice||t-this.lastVoice<2.2))return;this.stopVoice();const token=++this.voiceToken||1;this.voiceToken=token;try{const b=await this.load('voice-'+name+'.mp3');if(this.voiceToken!==token||!this.active)return;const src=this.ctx.createBufferSource();src.buffer=b;src.connect(this.voiceGain);this.voice=src;this.lastVoice=t;this.updateVolumes();src.onended=()=>{if(this.voice===src){this.voice=null;this.updateVolumes();}};src.start();}catch{}}
 stopVoice(){this.voiceToken=(this.voiceToken||0)+1;if(this.voice){try{this.voice.stop();}catch{}this.voice=null;this.updateVolumes();}}
 event(e){if(!this.ctx||!this.active)return;const t=this.ctx.currentTime;if(['rail','flipper-hit'].includes(e.type)&&t-(this.lastEffect[e.type]||0)<.045)return;this.lastEffect[e.type]=t;
  switch(e.type){
   case'flipper-up':this.sample('flipper',.62,1.05);this.tone(95,.035,.09,'square',0,60);break;
   case'flipper-down':this.sample('flipper',.28,.85);break;
   case'flipper-hit':this.crack(.075,.035,2500);this.tone(180,.05,.08,'triangle');break;
   case'rail':this.sample('metal',Math.min(.32,(e.strength||20)/190),.95+Math.random()*.13);break;
   case'bumper':this.sample('pop',.55,1+e.index*.08);this.chord([523.25,659.25,783.99].slice(e.index,e.index+1),.04,.16);this.tone(140,.11,.13,'sine',0,70);break;
   case'sling':this.crack(.18,.055,600);this.tone(250,.11,.13,'triangle',0,85);break;
   case'target':this.chord([880,1174.66],.035,.12);break;
   case'gate':this.tone(1046.5+e.index*110,.13,.08,'sine');break;
   case'launch':this.crack(.12,.18,400);this.tone(130,.35,.15,'triangle',0,980);this.chord([523.25,659.25,783.99],.055,.12);break;
   case'count':this.tone(660,.13,.15,'square');break;
   case'ready':this.tone(1320,.3,.12,'square');break;
   case'skill':this.chord([659.25,783.99,1046.5,1318.5],.065,.15);this.say('congratulations');break;
   case'ramp':this.tone(320,.6,.09,'sawtooth',0,1600);this.chord([523.25,659.25,783.99,1046.5],.085,.09);break;
   case'ramp-exit':this.sample('metal',.25,1.3);break;
   case'bottle-hit':this.tone(220,.13,.06,'sine');break;
   case'bottle-ready':this.chord([783.99,1046.5,1318.5],.08,.15);break;
   case'bottle':this.chord([523.25,659.25,783.99,1046.5,1318.5,1568],.07,.17);this.say('objective-achieved');break;
   case'rainbow':this.chord([523.25,659.25,783.99,1046.5,1318.5,1568,2093],.065,.16);this.say('go',true);break;
   case'jackpot':this.chord([1046.5,1318.5,1568,2093],.07,.19);this.say('congratulations');break;
   case'extra-ball':this.chord([659.25,783.99,1046.5,1568],.07,.14);this.say('congratulations');break;
   case'multiplier':case'save-lit':this.chord([783.99,1046.5,1318.5],.07,.12);break;
   case'saved':this.chord([659.25,783.99,1046.5],.07,.13);break;
   case'drain':this.sample('drain',.4,.9);this.chord([392,329.63,261.63],.08,.11);break;
   case'tilt':this.tone(110,.7,.15,'sawtooth');this.say('look-out',true);break;
   case'nudge':this.sample('metal',.25,.7);if(e.warning)this.say('look-out');break;
   case'over':this.chord([523.25,392,329.63,261.63],.16,.12);this.say('game-over',true);break;
   case'combo':this.chord([783.99,1046.5],.05,.12);break;
   case'select':this.tone(880,.045,.05,'square');break;
  }
 }
}
const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
