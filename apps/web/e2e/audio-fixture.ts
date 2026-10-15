import fs from 'node:fs';
export const fixture=()=>{
  const sr=44100,bpm=90,duration=32*60/bpm,pcm=new Float32Array(Math.ceil(duration*sr));
  for(let beat=0;beat<32;beat++){const chord=['G','C','D','G','Em','C','D','G'][Math.floor(beat/4)],bytes=fs.readFileSync(`public/audio/guitar/${chord}-down.wav`),offset=Math.floor(beat*60/bpm*sr);for(let n=0;n<(bytes.length-44)/2&&offset+n<pcm.length;n++)pcm[offset+n]+=bytes.readInt16LE(44+n*2)/32768*.5;for(let n=0;n<500&&offset+n<pcm.length;n++)pcm[offset+n]+=.1*Math.sin(2*Math.PI*1800*n/sr)*Math.exp(-n/100);}
  const output=Buffer.alloc(44+pcm.length*2);output.write('RIFF');output.writeUInt32LE(output.length-8,4);output.write('WAVEfmt ',8);output.writeUInt32LE(16,16);output.writeUInt16LE(1,20);output.writeUInt16LE(1,22);output.writeUInt32LE(sr,24);output.writeUInt32LE(sr*2,28);output.writeUInt16LE(2,32);output.writeUInt16LE(16,34);output.write('data',36);output.writeUInt32LE(pcm.length*2,40);for(let i=0;i<pcm.length;i++)output.writeInt16LE(Math.round(Math.max(-1,Math.min(1,pcm[i]))*32767),44+i*2);return output;
};
