// Explicit, reproducible asset preparation; never runs on app startup.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from '@playwright/test';
const commit='6f4eb1b092acc88f5448cea1a0001bd07b971af8';
const base=`https://raw.githubusercontent.com/freepats/spanish-classical-guitar/${commit}/`;
const chords={G:['G2','B2','D3','G3','B3','G4'],C:['C3','E3','G3','C4','E4'],D:['D3','A3','D4','F#4'],Em:['E2','B2','E3','G3','B3','E4']};
const cache=path.resolve('.cache/guitar-source'),out=path.resolve('apps/web/public/audio/guitar');
await fs.mkdir(cache,{recursive:true});await fs.mkdir(out,{recursive:true});
const sources=[];const encoded={};
for(const name of new Set(Object.values(chords).flat())){
  const url=base+'samples/'+encodeURIComponent(name)+'.flac';
  const response=await fetch(url);if(!response.ok)throw new Error(`Download ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());await fs.writeFile(path.join(cache,name+'.flac'),bytes);
  encoded[name]=bytes.toString('base64');sources.push({file:name+'.flac',url,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
for(const file of ['LICENSE','README.md','SpanishClassicalGuitar-20190618.sfz']){const r=await fetch(base+file);if(!r.ok)throw new Error('Missing provenance');await fs.writeFile(path.join(out,file==='LICENSE'?'LICENSE.txt':file),await r.text());}
const browser=await chromium.launch();
try{
  const page=await browser.newPage();
  const outputs=await page.evaluate(async({encoded,chords})=>{
    const decoder=new OfflineAudioContext(1,44100,44100),notes={};
    for(const[name,value]of Object.entries(encoded)){const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));notes[name]=await decoder.decodeAudioData(bytes.buffer);}
    const outputs=[];
    for(const[chord,names]of Object.entries(chords))for(const direction of ['down','up']){
      const ctx=new OfflineAudioContext(1,88200,44100),order=direction==='down'?names:[...names].reverse();
      order.forEach((name,i)=>{const source=ctx.createBufferSource();source.buffer=notes[name];const gain=ctx.createGain();gain.gain.value=1/names.length;source.connect(gain).connect(ctx.destination);source.start(i*.012);});
      const rendered=await ctx.startRendering(),data=rendered.getChannelData(0);let peak=0;for(const v of data)peak=Math.max(peak,Math.abs(v));
      const buffer=new ArrayBuffer(44+data.length*2),view=new DataView(buffer),put=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i));};
      put(0,'RIFF');view.setUint32(4,36+data.length*2,true);put(8,'WAVE');put(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,44100,true);view.setUint32(28,88200,true);view.setUint16(32,2,true);view.setUint16(34,16,true);put(36,'data');view.setUint32(40,data.length*2,true);
      let rms=0;for(let i=0;i<data.length;i++){const fade=Math.min(1,(data.length-i)/4410),v=data[i]*.65/peak*fade;view.setInt16(44+i*2,Math.round(v*32767),true);rms+=v*v;}
      let binary='';for(const byte of new Uint8Array(buffer))binary+=String.fromCharCode(byte);
      outputs.push({file:`${chord}-${direction}.wav`,base64:btoa(binary),peak:.65,rms:Math.sqrt(rms/data.length),seconds:2});
    }return outputs;
  },{encoded,chords});
  const assets=[];for(const output of outputs){const bytes=Buffer.from(output.base64,'base64');await fs.writeFile(path.join(out,output.file),bytes);const{base64,...metadata}=output;assets.push({...metadata,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
  await fs.writeFile(path.join(out,'provenance.json'),JSON.stringify({author:'Roberto (roberto@zenvoid.org), FreePats',source:'https://freepats.zenvoid.org/Guitar/acoustic-guitar.html',repository:'https://github.com/freepats/spanish-classical-guitar',commit,license:'CC0-1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',retrievedAt:'2026-10-14',attributionRequired:false,derivation:'Recorded nylon guitar notes, no pitch shifting; 12 ms string staggering in ascending/descending order, 2 s mono 44.1 kHz PCM16, peak normalized to 0.65, final 100 ms fade. Assembled strums, not recordings of full chord strums.',chords,sources,assets},null,2)+'\n');
  console.log(`Prepared ${assets.length} licensed guitar assets; ${sources.length} recorded pitches.`);
}finally{await browser.close();}
