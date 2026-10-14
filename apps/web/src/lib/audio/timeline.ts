import type {Pattern} from '../strumming';
export type Chord='G'|'C'|'D'|'Em';
export type Scheduled={index:number;slot:number;time:number;bpm:number;chord:Chord;event:Pattern['events'][number]};
export type Cancel=()=>void;
export type AudioSink={now:()=>number;attack:(event:Scheduled)=>Cancel;click:(event:Scheduled)=>Cancel};
type Entry={value:Scheduled;cancel:Cancel[]};
/** No wall-clock beat timing: callers only wake pump(), all timestamps use the audio clock. */
export class Timeline {
  running=false;loop=true;bpm:number;private targetBpm:number;chord:Chord='G';
  stopReason:'finished'|'stalled'|null=null;
  private queue:Entry[]=[];private active:Scheduled|null=null;private nextIndex=0;private nextTime=0;private pausedIndex=0;private pausedFraction=0;private finishTime=Infinity;
  constructor(readonly pattern:Pattern,private sink:AudioSink){this.bpm=pattern.defaultBpm;this.targetBpm=this.bpm;}
  get pendingBpm(){return this.running&&this.position().bpm!==this.targetBpm?this.targetBpm:null;}
  get step(){return 30/this.bpm;}
  position(at=this.sink.now()){
    if(!this.running)return{index:this.pausedIndex,slot:this.pausedIndex%8,fraction:this.pausedFraction,bpm:this.bpm};
    const entry=[this.active,...this.queue.map(q=>q.value)].filter((e):e is Scheduled=>!!e&&e.time<=at).at(-1);
    return entry?{index:entry.index,slot:entry.slot,fraction:Math.min(1,Math.max(0,(at-entry.time)/(30/entry.bpm))),bpm:entry.bpm}:{index:this.pausedIndex,slot:this.pausedIndex%8,fraction:this.pausedFraction,bpm:this.bpm};
  }
  play(){if(this.running)return;this.running=true;this.stopReason=null;const now=this.sink.now()+.04;
    if(this.pausedFraction>0){this.active={index:this.pausedIndex,slot:this.pausedIndex%8,time:now-this.pausedFraction*this.step,bpm:this.bpm,chord:this.chord,event:this.pattern.events[this.pausedIndex%8]};this.nextIndex=this.pausedIndex+1;this.nextTime=now+(1-this.pausedFraction)*this.step;}
    else{this.nextIndex=this.pausedIndex;this.nextTime=now;this.active=null;}
    this.finishTime=Infinity;this.pump();
  }
  pause(at=this.sink.now()){if(!this.running)return;const pos=this.position(at);this.pausedIndex=pos.index;this.pausedFraction=pos.fraction;this.bpm=pos.bpm;this.running=false;this.cancel();}
  restart(){this.running=false;this.stopReason=null;this.cancel();this.active=null;this.pausedIndex=0;this.pausedFraction=0;this.bpm=this.targetBpm;}
  private cancel(){for(const q of this.queue)for(const stop of q.cancel)stop();this.queue=[];}
  private rewindFuture(){const now=this.sink.now();const first=this.queue.find(q=>q.value.time>now);if(!first)return;const cut=this.queue.indexOf(first);for(const q of this.queue.slice(cut))for(const stop of q.cancel)stop();this.queue=this.queue.slice(0,cut);this.nextIndex=first.value.index;this.nextTime=first.value.time;this.finishTime=Infinity;this.bpm=this.position(now).bpm;}
  setBpm(value:number){if(!Number.isInteger(value)||value<45||value>160)throw new Error('BPM deve estar entre 45 e 160.');if(this.running){this.rewindFuture();this.targetBpm=value;}else{this.bpm=value;this.targetBpm=value;}this.pump();}
  setChord(value:Chord){this.chord=value;if(this.running){this.rewindFuture();this.pump();}}
  setLoop(value:boolean){this.loop=value;if(value)this.finishTime=Infinity;this.rewindFuture();this.pump();}
  pump(){if(!this.running)return;const now=this.sink.now();
    // Retain the current entry (and its cancellable tail), discard only ended tails.
    while(this.queue.length&&this.queue[0].value.time+2.1<now){this.active=this.queue.shift()!.value;}
    if(now>=this.finishTime){this.pause(this.finishTime-.00001);this.pausedFraction=1;this.stopReason='finished';return;}
    // A suspended/throttled tab must not emit a catch-up burst.
    if(this.nextTime<now-.15){this.pause();this.stopReason='stalled';return;}
    while(this.nextTime<now+.08){
      if(!this.loop&&this.nextIndex>0&&this.nextIndex%8===0){this.finishTime=this.nextTime;break;}
      if(this.nextIndex%8===0)this.bpm=this.targetBpm;
      const slot=this.nextIndex%8,event=this.pattern.events[slot],value={index:this.nextIndex,slot,time:this.nextTime,bpm:this.bpm,chord:this.chord,event};const cancel:Cancel[]=[];
      if(event.play)cancel.push(this.sink.attack(value));if(slot%2===0)cancel.push(this.sink.click(value));this.queue.push({value,cancel});this.nextIndex++;this.nextTime+=30/value.bpm;
    }
  }
}
