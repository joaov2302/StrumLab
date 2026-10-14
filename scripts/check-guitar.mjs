import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {chromium} from '@playwright/test';
const directory='apps/web/public/audio/guitar/',provenance=JSON.parse(await fs.readFile(directory+'provenance.json','utf8'));
const encoded={};
for(const asset of provenance.assets){const bytes=await fs.readFile(directory+asset.file);if(crypto.createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw new Error('Asset hash changed: '+asset.file);encoded[asset.file]=bytes.toString('base64');}
if(provenance.license!=='CC0-1.0'||!(await fs.readFile(directory+'LICENSE.txt','utf8')).includes('CC0'))throw new Error('License missing');
const pattern=JSON.parse(await fs.readFile('StrumLab-documentacao-v1.1/examples/pop-folk-basic.json','utf8'));
const browser=await chromium.launch();
try{const page=await browser.newPage();const report=await page.evaluate(async({encoded,pattern})=>{
  const decoder=new OfflineAudioContext(1,44100,44100),buffers={};
  for(const[file,value]of Object.entries(encoded)){const buffer=await decoder.decodeAudioData(Uint8Array.from(atob(value),c=>c.charCodeAt(0)).buffer);buffers[file]=buffer;}
  const statistics=[];for(const[chord,bpm]of ['G','C','D','Em'].flatMap(c=>[90,160].map(b=>[c,b]))){
    const context=new OfflineAudioContext(1,Math.ceil((8*30/bpm+2.1)*44100),44100);let attacks=0,clicks=0;
    for(const event of pattern.events){const time=.04+event.slot*30/bpm;if(event.play){const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers[`${chord}-${event.direction}.wav`];gain.gain.value=.65*event.velocity;source.connect(gain).connect(context.destination);source.start(time);attacks++;}if(event.slot%2===0){const source=context.createBufferSource(),b=context.createBuffer(1,1103,44100),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.sin(2*Math.PI*(event.slot===0?1600:1000)*i/44100)*Math.exp(-i/(44100*.004))*.5*.3;source.buffer=b;source.connect(context.destination);source.start(time);clicks++;}}
    const output=await context.startRendering();let peak=0,sum=0;for(const v of output.getChannelData(0)){peak=Math.max(peak,Math.abs(v));sum+=v*v;}statistics.push({chord,bpm,attacks,clicks,peak,rms:Math.sqrt(sum/output.length)});
  }
  const assetStats=Object.entries(buffers).map(([file,b])=>{let sum=0,peak=0;const data=b.getChannelData(0);for(const v of data){sum+=v*v;peak=Math.max(peak,Math.abs(v));}return{file,duration:b.duration,peak,rms:Math.sqrt(sum/b.length),signature:Array.from(data.slice(1000,1020))};});return{statistics,assetStats};
},{encoded,pattern});
for(const row of report.statistics)if(row.attacks!==6||row.clicks!==4||row.peak>=1||row.rms<.001)throw new Error('Invalid offline rendering: '+JSON.stringify(row));
for(const row of report.assetStats)if(row.duration!==2||row.peak>.651||row.rms<.001)throw new Error('Invalid sample: '+row.file);
if(new Set(report.assetStats.map(row=>JSON.stringify(row.signature))).size!==8)throw new Error('Chord/direction samples must be distinct');
await fs.mkdir('.cache/phase4',{recursive:true});await fs.writeFile('.cache/phase4/audio-assets-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.statistics));
}finally{await browser.close();}
