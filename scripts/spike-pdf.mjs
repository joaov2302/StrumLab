import { mkdirSync,readFileSync,writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { renderBook,RENDERER_VERSION } from '../apps/web/src/lib/pdf/renderer.ts';
const root=fileURLToPath(new URL('../',import.meta.url));process.chdir(path.join(root,'apps/web'));
const output=path.join(root,'.cache/pdf-spike');mkdirSync(output,{recursive:true});
const fixture=(columns)=>({schemaVersion:1,rendererVersion:RENDERER_VERSION,songbookId:'spike-book',bookVersion:1,title:'Cancioneiro de teste — Ação e coração',subtitle:'30 músicas sintéticas · Unicode, acordes e páginas reais',organizer:'StrumLab · fixture autoral',cover:{enabled:true,imageData:'',imageRights:'unspecified'},layout:{font:columns===1?'serif':'sans',fontSize:11,marginMm:15,lineSpacing:1.1,columns},items:Array.from({length:30},(_,i)=>({itemId:`item-${i}`,songId:`song-${i}`,revisionId:`revision-${i}`,revisionNo:1,notes:i===0?'↑ ↓ ° # b G/B C7sus4 F#m7 🎶':'',content:{schemaVersion:1,title:`Canção sintética ${String(i+1).padStart(2,'0')}`,artist:'Autor fictício',key:'G',bpm:90,meter:'4/4',capo:2,sourceType:'manual',sourceReference:'Fixture do spike',rightsBasis:'own',sections:[{id:`section-${i}`,type:'verse',label:'Verso autoral',lines:Array.from({length:i===2?100:i===3?40:8},(_,line)=>({id:`line-${i}-${line}`,tokens:[{type:'chord',symbol:'G/B',value:null},{type:'text',value:`Ação e coração ${line+1} — `,symbol:null},{type:'chord',symbol:'F#m7',value:null},{type:'text',value:'caminhar sem cortar o texto. FIM',symbol:null}]}))},{id:`chorus-${i}`,type:'chorus',label:'Refrão',lines:[{id:`last-${i}`,tokens:[{type:'chord',symbol:'C7sus4/Bb',value:null},{type:'text',value:`FINAL-${i+1} ↑ ↓ ° 🎶`,symbol:null}]}]}]}}))});
const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fontFiles={sans:'NotoSans',serif:'NotoSerif',symbols:'NotoSymbols',math:'NotoMath',emoji:'NotoEmoji'};
const fontCss=Object.entries(fontFiles).map(([name,file])=>`@font-face{font-family:${name};src:url(data:font/ttf;base64,${readFileSync(path.join(root,'assets/fonts',file+'.ttf')).toString('base64')})}`).join('');
const browser=await chromium.launch();const summary=[];
try{for(const columns of [1,2]){
 const manifest=fixture(columns);const started=performance.now();const result=await renderBook(manifest);const kitMs=performance.now()-started;
 writeFileSync(path.join(output,`pdfkit-${columns}.pdf`),result.pdf);writeFileSync(path.join(output,`plan-${columns}.json`),JSON.stringify(result.plan));
 const html=`<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}@page{size:A4;margin:0}body{margin:0}.page{width:595.2756pt;height:841.8898pt;position:relative;break-after:page}.page:last-child{break-after:auto}.text{position:absolute;white-space:pre;line-height:1.4}</style></head><body>${result.plan.pages.map(page=>`<section class="page">${page.elements.map(e=>e.kind==='text'?`<span class="text" style="left:${e.x}pt;top:${e.y}pt;font-size:${e.size}pt;font-family:${e.font},sans,symbols,math,emoji;color:${e.color}">${escape(e.text)}</span>`:'').join('')}</section>`).join('')}</body></html>`;
 const page=await browser.newPage();const chromeStart=performance.now();await page.setContent(html);await page.evaluate(()=>document.fonts.ready);const pdf=await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:true});const chromeMs=performance.now()-chromeStart;await page.close();writeFileSync(path.join(output,`chromium-${columns}.pdf`),pdf);
 summary.push({columns,pages:result.pageCount,pdfkit:{milliseconds:Math.round(kitMs),bytes:result.pdf.length},chromium:{milliseconds:Math.round(chromeMs),bytes:pdf.length},index:result.pageIndex});
}}finally{await browser.close();}
writeFileSync(path.join(output,'summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary.map(({index,...entry})=>entry),null,2));
