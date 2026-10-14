import PDFDocument from 'pdfkit';
import * as fontkit from 'fontkit';
import path from 'node:path';
import type { SongContent } from '../songs';

export const RENDERER_VERSION='pdfkit-a4-v1';
export type BookLayout={font:'sans'|'serif';fontSize:number;marginMm:number;lineSpacing:number;columns:1|2};
export type BookCover={enabled:boolean;imageData:string;imageRights:'unspecified'|'own'|'permission'};
export type ManifestItem={itemId:string;songId:string;revisionId:string;revisionNo:number;content:SongContent;notes:string};
export type BookManifest={schemaVersion:1;rendererVersion:string;songbookId:string;bookVersion:number;title:string;subtitle:string;organizer:string;cover:BookCover;layout:BookLayout;items:ManifestItem[]};
type Font='sans'|'serif'|'symbols'|'math'|'emoji';
export type DrawText={kind:'text';x:number;y:number;text:string;size:number;font:Font;color:string};
type DrawImage={kind:'image';x:number;y:number;width:number;height:number;data:string};
export type PlannedPage={kind:'cover'|'index'|'song';elements:(DrawText|DrawImage)[]};
export type PageIndex={itemId:string;title:string;page:number;revisionNo:number};
export type BookPlan={pages:PlannedPage[];index:PageIndex[]};
const WIDTH=595.2756,HEIGHT=841.8898;
const fonts={sans:'NotoSans.ttf',serif:'NotoSerif.ttf',symbols:'NotoSymbols.ttf',math:'NotoMath.ttf',emoji:'NotoEmoji.ttf'};
const features:PDFKit.Mixins.OpenTypeFeatures[]=[];
const fontDirectory=()=>path.resolve(process.cwd(),'../../assets/fonts');
let coverage:Map<Font,fontkit.Font>|undefined;
function getCoverage(){if(!coverage)coverage=new Map(Object.entries(fonts).map(([name,file])=>[name as Font,fontkit.openSync(path.join(fontDirectory(),file)) as fontkit.Font]));return coverage;}
function glyphFont(character:string,preferred:Font):Font {
  const point=character.codePointAt(0)!;
  for(const name of [preferred,'sans','symbols','math','emoji'] as Font[])if(getCoverage().get(name)!.hasGlyphForCodePoint(point))return name;
  throw new Error(`Caractere U+${point.toString(16).toUpperCase()} sem fonte disponível. Ajuste o texto antes de exportar.`);
}
function runs(text:string,preferred:Font){
  const result:{font:Font;text:string}[]=[];
  for(const character of text.replace(/\t/g,'    ')){
    const font=glyphFont(character,preferred);const last=result.at(-1);
    if(last?.font===font)last.text+=character;else result.push({font,text:character});
  }return result;
}
function register(doc:PDFKit.PDFDocument){for(const[name,file]of Object.entries(fonts))doc.registerFont(name,path.join(fontDirectory(),file));}
function metric(){const doc=new PDFDocument({autoFirstPage:false});register(doc);const cache=new Map<string,number>();return {doc,width:(text:string,size:number,font:Font)=>{
  const key=`${font}:${size}:${text}`;const cached=cache.get(key);if(cached!==undefined)return cached;
  const value=runs(text,font).reduce((sum,run)=>sum+doc.font(run.font).fontSize(size).widthOfString(run.text,{features}),0);if(cache.size<40000)cache.set(key,value);return value;
}};}
type Measure=ReturnType<typeof metric>['width'];
const graphemes=(text:string)=>Array.from(new Intl.Segmenter('pt-BR',{granularity:'grapheme'}).segment(text),value=>value.segment);
function wrap(text:string,width:number,size:number,font:Font,measure:Measure):string[]{
  const result:string[]=[];
  for(const paragraph of text.replace(/\r\n?/g,'\n').split('\n')){
    let row='';
    for(const word of paragraph.match(/\s+|\S+/gu)??[]){
      if(row&&measure(row+word,size,font)>width){result.push(row);row='';}
      if(measure(word,size,font)<=width){row+=word;continue;}
      for(const character of graphemes(word)){if(row&&measure(row+character,size,font)>width){result.push(row);row='';}row+=character;}
    }result.push(row);
  }return result;
}
function addText(page:PlannedPage,text:string,x:number,y:number,size:number,font:Font,color='#202A24'){page.elements.push({kind:'text',text,x,y,size,font,color});}
type Atom={text:string;chord:string};
function atoms(content:SongContent['sections'][number]['lines'][number]):Atom[]{
  const result:Atom[]=[];let pending:string[]=[];
  for(const token of content.tokens){
    if(token.type==='chord'){pending.push(token.symbol);continue;}
    const words=token.value.match(/\s+|\S+/gu)??[];
    for(const word of words){result.push({text:word,chord:pending.join(' ')});pending=[];}
  }if(pending.length)result.push({text:'',chord:pending.join(' ')});return result.length?result:[{text:'',chord:''}];
}
function musicRows(line:SongContent['sections'][number]['lines'][number],width:number,size:number,font:Font,measure:Measure){
  const rows:Atom[][]=[[]];let occupied=0;
  for(const atom of atoms(line)){
    const chordWidth=measure(atom.chord,size*.85,font);
    if(chordWidth>width)throw new Error('Uma sequência de acordes excede a coluna. Escolha uma coluna ou separe os acordes em linhas.');
    const pieces=measure(atom.text,size,font)>width?wrap(atom.text,width,size,font,measure):[atom.text];
    for(const[pieceIndex,text]of pieces.entries()){
      const part={text,chord:pieceIndex===0?atom.chord:''};const extent=Math.max(measure(text,size,font),measure(part.chord,size*.85,font)+(part.chord?3:0));
      if(occupied&&occupied+extent>width){rows.push([]);occupied=0;}
      rows.at(-1)!.push(part);occupied+=extent;
    }
  }return rows;
}
function validateManifest(manifest:BookManifest){
  const l=manifest.layout;
  if(manifest.rendererVersion!==RENDERER_VERSION||manifest.schemaVersion!==1||!manifest.items.length||manifest.items.length>200)throw new Error('Manifesto vazio, inválido ou incompatível com o renderizador.');
  if(!['sans','serif'].includes(l.font)||![1,2].includes(l.columns)||l.fontSize<9||l.fontSize>16||l.marginMm<10||l.marginMm>25||l.lineSpacing<1||l.lineSpacing>1.6)throw new Error('Configuração de página inválida.');
}
export function planBook(manifest:BookManifest):BookPlan {
  validateManifest(manifest);const {doc,width:measure}=metric();
  const l=manifest.layout,font=l.font,margin=l.marginMm*72/25.4;
  const usable=WIDTH-2*margin,gap=24,columnWidth=(usable-gap*(l.columns-1))/l.columns;
  const size=l.fontSize,rowHeight=size*2.8*l.lineSpacing,bottom=HEIGHT-margin-20;
  const songs:PlannedPage[]=[];const starts:PageIndex[]=[];
  for(const item of manifest.items){
    let page:PlannedPage, column=0,y=margin;
    const newPage=(continued=false)=>{
      page={kind:'song',elements:[]};songs.push(page);column=0;y=margin;
      const title=continued?`${item.content.title} (continuação)`:item.content.title;
      for(const line of wrap(title,columnWidth,continued?12:18,font,measure)){addText(page,line,margin,y,continued?12:18,font);y+=continued?19:26;}
      const metadata=`${item.content.artist || 'Artista não informado'} · Tom ${item.content.key || '—'} · Capo ${item.content.capo} · ${item.content.meter}${item.content.bpm?` · ${item.content.bpm} BPM`:''}`;
      for(const line of wrap(metadata,columnWidth,9,'sans',measure)){addText(page,line,margin,y,9,'sans','#566157');y+=14;}y+=16;
    };
    const advance=()=>{if(column+1<l.columns){column++;y=margin;for(const line of wrap(`${item.content.title} (continuação)`,columnWidth,10,font,measure)){addText(page!,line,margin+column*(columnWidth+gap),y,10,font);y+=16;}y+=8;}else newPage(true);};
    const ensure=(height:number)=>{if(y+height>bottom)advance();if(y+height>bottom)throw new Error('Uma linha não cabe na página com o layout escolhido.');};
    newPage();starts.push({itemId:item.itemId,title:item.content.title,page:songs.length,revisionNo:item.revisionNo});
    for(const section of item.content.sections){
      const labelRows=wrap(section.label||'Seção',columnWidth,11,font,measure);
      const lineHeight=(row:Atom[])=>row.some(atom=>atom.chord)?rowHeight:size*1.7*l.lineSpacing;
      const firstRows=section.lines[0]?musicRows(section.lines[0],columnWidth,size,font,measure):[];
      const firstHeight=firstRows.reduce((sum,row)=>sum+lineHeight(row),0);
      ensure(labelRows.length*17+Math.min(firstHeight,bottom-margin-180));
      for(const label of labelRows){addText(page!,label,margin+column*(columnWidth+gap),y,11,font,'#244F3C');y+=17;}
      for(const line of section.lines){const rows=musicRows(line,columnWidth,size,font,measure);const groupHeight=rows.reduce((sum,row)=>sum+lineHeight(row),0);if(groupHeight<=bottom-margin-180)ensure(groupHeight);for(const row of rows){
        const hasChords=row.some(atom=>atom.chord);const height=hasChords?rowHeight:size*1.7*l.lineSpacing;
        ensure(height);let x=margin+column*(columnWidth+gap);
        for(const atom of row){
          if(atom.chord)addText(page!,atom.chord,x,y,size*.85,font,'#A34F2C');
          if(atom.text)addText(page!,atom.text,x,y+(hasChords?size*1.35:0),size,font);
          x+=Math.max(measure(atom.text,size,font),measure(atom.chord,size*.85,font)+(atom.chord?3:0));
        }y+=height;
      }}y+=12;
    }
    if(item.notes){ensure(26);for(const line of wrap(`Nota: ${item.notes}`,columnWidth,9,'sans',measure)){ensure(15);addText(page!,line,margin+column*(columnWidth+gap),y,9,'sans','#566157');y+=15;}}
  }
  // Count index pages from actual wrapped titles before assigning physical PDF pages.
  const tocRows=starts.map(item=>wrap(item.title,usable-52,11,font,measure));
  const tocPages:PlannedPage[]=[];let toc:PlannedPage,y=margin;
  const newToc=()=>{toc={kind:'index',elements:[]};tocPages.push(toc);y=margin;addText(toc,'Índice',margin,y,24,font);y+=42;};
  newToc();const positions:{page:PlannedPage;y:number;lines:string[]}[]=[];
  for(const lines of tocRows){const height=lines.length*18+12;if(y+height>bottom)newToc();positions.push({page:toc!,y,lines});y+=height;}
  const prefix=(manifest.cover.enabled?1:0)+tocPages.length;
  const index=starts.map(item=>({...item,page:item.page+prefix}));
  for(const[positionIndex,position]of positions.entries()){
    position.lines.forEach((line,n)=>addText(position.page,line,margin,position.y+n*18,11,font));
    addText(position.page,String(index[positionIndex].page),WIDTH-margin-32,position.y,11,font);
  }
  const coverPages:PlannedPage[]=[];
  if(manifest.cover.enabled){
    const cover:PlannedPage={kind:'cover',elements:[]};let cy=margin+70;
    addText(cover,'STR UMLAB'.replace(' ',''),margin,margin,11,'sans','#244F3C');
    for(const line of wrap(manifest.title,usable,32,font,measure)){addText(cover,line,margin,cy,32,font);cy+=44;}cy+=20;
    for(const line of wrap(manifest.subtitle,usable,15,font,measure)){if(line)addText(cover,line,margin,cy,15,font,'#566157');cy+=23;}
    if(manifest.cover.imageData){const height=Math.min(260,bottom-cy-100);if(height<80)throw new Error('A imagem e os textos da capa não cabem. Reduza os textos da capa.');cover.elements.push({kind:'image',x:margin,y:cy+20,width:usable,height,data:manifest.cover.imageData});cy+=height+40;}
    cy+=24;
    for(const line of wrap(manifest.organizer,usable,12,'sans',measure)){if(line)addText(cover,line,margin,cy,12,'sans','#566157');cy+=18;}
    if(cy>bottom)throw new Error('Os textos da capa excedem a página. Reduza o título, subtítulo ou organizador.');
    coverPages.push(cover);
  }
  const pages=[...coverPages,...tocPages,...songs];
  if(pages.length>500)throw new Error('O livro excede o limite local de 500 páginas. Divida o repertório em livros menores.');
  pages.forEach((page,index)=>addText(page,`${index+1} / ${pages.length}`,WIDTH-margin-55,HEIGHT-margin,9,'sans','#566157'));
  doc.end();return {pages,index};
}
export async function renderBook(manifest:BookManifest){
  const plan=planBook(manifest);const doc=new PDFDocument({autoFirstPage:false,margin:0,compress:true,info:{Title:manifest.title,Author:manifest.organizer,Creator:`StrumLab ${RENDERER_VERSION}`}});register(doc);
  const chunks:Buffer[]=[];const result=new Promise<Buffer>((resolve,reject)=>{doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
  for(const page of plan.pages){doc.addPage({size:[WIDTH,HEIGHT],margin:0});
    for(const element of page.elements){
      if(element.kind==='image'){doc.image(Buffer.from(element.data.split(',')[1],'base64'),element.x,element.y,{fit:[element.width,element.height],align:'center',valign:'center'});continue;}
      let x=element.x;
      for(const run of runs(element.text,element.font)){doc.font(run.font).fontSize(element.size).fillColor(element.color).text(run.text,x,element.y,{lineBreak:false,features});x+=doc.widthOfString(run.text,{features});}
    }
  }doc.end();return {pdf:await result,pageCount:plan.pages.length,pageIndex:plan.index,plan};
}
