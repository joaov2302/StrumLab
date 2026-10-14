import type { SongContent, SongSection, SongToken } from './songs';
export const sectionTypes = [['intro','Introdução'],['verse','Verso'],['chorus','Refrão'],['bridge','Ponte'],['outro','Final'],['other','Outra seção']] as const;
export const chordPattern = /^([A-G])([#b]?)(|m|maj|min|dim|aug|sus[24]?|[+o°])(?:[0-9]{1,2})?(?:(?:add|sus|maj|dim|aug|[#b])[0-9]{1,2})*(?:\/([A-G])([#b]?))?$/;
export function parseLine(input: string): SongToken[] {
  const tokens: SongToken[] = []; let text = '';
  const flush = () => { if (text) { tokens.push({type:'text',value:text,symbol:null}); text = ''; } };
  for (let index=0; index<input.length; index++) {
    const character = input[index];
    if (character === '\\' && ['[',']','\\','{','}'].includes(input[index+1])) { text += input[++index]; continue; }
    if (character === '[') {
      flush(); const end = input.indexOf(']',index+1);
      if (end < 0) throw new Error('Feche o acorde com ]. O texto permanece no editor.');
      const symbol = input.slice(index+1,end);
      if (!chordPattern.test(symbol) || symbol.length > 40) throw new Error(`Acorde não reconhecido: ${symbol || '(vazio)'}.`);
      tokens.push({type:'chord',symbol,value:null}); index=end;
    } else if (character === ']') throw new Error('Use \\] para um colchete literal no texto.');
    else text += character;
  }
  flush(); return tokens;
}
const escapeText = (text: string) => text.replace(/[\\[\]{}]/g, character => `\\${character}`);
export function lineMarkup(tokens: SongToken[]) { return tokens.map(t => t.type === 'chord' ? `[${t.symbol}]` : escapeText(t.value)).join(''); }
export type SectionBuffer = {id:string;type:SongSection['type'];label:string;text:string;lineIds:string[]};
export type EditorBuffer = Omit<SongContent,'sections'> & {sections:SectionBuffer[]};
export function toBuffer(content: SongContent): EditorBuffer {
  return {...content,sections:content.sections.map(s => ({id:s.id,type:s.type,label:s.label,text:s.lines.map(l => lineMarkup(l.tokens)).join('\n'),lineIds:s.lines.map(l => l.id)}))};
}
export function fromBuffer(buffer: EditorBuffer): SongContent {
  if (!buffer.title.trim()) throw new Error('Informe o título da cifra.');
  return {...buffer,sections:buffer.sections.map(s => ({id:s.id,type:s.type,label:s.label,lines:s.text.split('\n').map((line,index) => ({id:s.lineIds[index] ?? crypto.randomUUID(),tokens:parseLine(line)}))}))};
}
const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const flats = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
export function soundingKey(key: string, capo: number): string {
  if (!/^[A-G][#b]?m?$/.test(key)) return 'Não informado';
  const match = key.match(/^([A-G])([#b]?)(m?)$/)!;
  const root: Record<string,number> = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const pitch = ((root[match[1]] + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0) + capo) % 12 + 12) % 12;
  return (key.includes('b') ? flats : notes)[pitch]+match[3];
}
