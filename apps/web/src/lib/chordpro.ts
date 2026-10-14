import { lineMarkup, parseLine, sectionTypes } from './music';
import { newContent, type SongContent, type SongSection } from './songs';
const escapeDirective = (value:string) => value.replace(/[\\{}]/g, c=>`\\${c}`).replace(/\r?\n/g,' ');
const unescapeDirective = (value:string) => value.replace(/\\([\\{}])/g,'$1');
export function exportChordPro(content: SongContent): string {
  const metadata = [`{title: ${escapeDirective(content.title)}}`,`{artist: ${escapeDirective(content.artist)}}`,`{key: ${content.key}}`,`{time: ${content.meter}}`,`{capo: ${content.capo}}`];
  if (content.bpm !== null) metadata.push(`{tempo: ${content.bpm}}`);
  return [...metadata,...content.sections.flatMap(s => [`{start_of_${s.type}: ${escapeDirective(s.label)}}`,...s.lines.map(l=>lineMarkup(l.tokens)),`{end_of_${s.type}}`])].join('\n');
}
export function importChordPro(input: string): SongContent {
  if (input.length > 250000) throw new Error('Arquivo muito grande para o editor local.');
  const content = newContent(); content.title='Cifra importada'; content.sourceType='chordpro'; content.sections=[];
  let current: SongSection | undefined; let explicit = false;
  for (const [lineNumber,raw] of input.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n').entries()) {
    const directive = raw.match(/^\{([a-z_]+)(?::\s*(.*))?\}$/i);
    if (raw.startsWith('{') && !directive) throw new Error(`Diretiva inválida na linha ${lineNumber+1}.`);
    if (directive) {
      const name=directive[1].toLowerCase(); const value=unescapeDirective(directive[2]??'');
      if (['title','artist','key','time','tempo','capo'].includes(name)) {
        if (name==='title') content.title=value;
        if (name==='artist') content.artist=value;
        if (name==='key') { if(value && !/^[A-G][#b]?m?$/.test(value)) throw new Error('Tom inválido no ChordPro.'); content.key=value; }
        if (name==='time') { if(!/^(?:[1-9]|1[0-6])\/(?:2|4|8|16)$/.test(value)) throw new Error('Compasso inválido no ChordPro.'); content.meter=value; }
        if (name==='tempo' || name==='capo') { const numeric=Number(value); if (!/^\d+$/.test(value) || !Number.isInteger(numeric) || (name==='tempo' ? numeric<20 || numeric>400 : numeric<0 || numeric>12)) throw new Error(`Valor inválido em ${name}.`); if(name==='tempo')content.bpm=numeric;else content.capo=numeric; }
      } else if (name.startsWith('start_of_')) {
        const type=name.slice(9) as SongSection['type'];
        if(!sectionTypes.some(([key])=>key===type) || explicit) throw new Error(`Seção não suportada ou aninhada na linha ${lineNumber+1}.`);
        current={id:crypto.randomUUID(),type,label:value||sectionTypes.find(([key])=>key===type)![1],lines:[]}; content.sections.push(current); explicit=true;
      } else if (name.startsWith('end_of_')) {
        if(!explicit || !current || name!==`end_of_${current.type}`) throw new Error(`Fim de seção incompatível na linha ${lineNumber+1}.`);
        if(!current.lines.length) current.lines.push({id:crypto.randomUUID(),tokens:[]}); current=undefined;explicit=false;
      } else throw new Error(`Diretiva não suportada: ${name}, linha ${lineNumber+1}. O original foi preservado.`);
    } else {
      if (!current) { current={id:crypto.randomUUID(),type:'verse',label:'Verso',lines:[]}; content.sections.push(current); }
      current.lines.push({id:crypto.randomUUID(),tokens:parseLine(raw)});
    }
  }
  if(explicit) throw new Error('A seção ChordPro precisa de uma diretiva de encerramento.');
  if(!content.sections.length) content.sections=newContent().sections;
  if(!content.title.trim()) throw new Error('O título importado está vazio.');
  return content;
}
