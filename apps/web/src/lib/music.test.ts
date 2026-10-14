import { describe, expect, it } from 'vitest';
import { newContent } from './songs';
import { fromBuffer, lineMarkup, parseLine, soundingKey, toBuffer } from './music';
import { exportChordPro, importChordPro } from './chordpro';
describe('Semantic editor',()=>{
  it('preserves unicode, whitespace, escaped brackets and consecutive chords',()=>{
    const text='[G/B]Ação 🎶 [Em7][Bb]coração \\[literal\\] \\\\ fim';
    const tokens=parseLine(text);expect(lineMarkup(tokens)).toBe(text);
    expect(tokens.filter(t=>t.type==='chord').map(t=>t.symbol)).toEqual(['G/B','Em7','Bb']);
  });
  it('keeps section and line IDs through save/reopen conversion',()=>{
    const content=newContent();content.sections[0].lines[0].tokens=parseLine('[G]texto');
    expect(fromBuffer(toBuffer(content))).toEqual(content);
  });
  it('rejects unknown and unclosed symbols without modifying the input',()=>{
    for(const value of ['[H]texto','[Gtexto','[]texto'])expect(()=>parseLine(value)).toThrow();
  });
  it('capo changes sounding key without changing chord tokens',()=>{
    expect(soundingKey('G',2)).toBe('A');expect(soundingKey('F#m',2)).toBe('G#m');expect(soundingKey('Bb',2)).toBe('C');
    const content=newContent();content.sections[0].lines[0].tokens=parseLine('[G/B]cantar');const tokens=content.sections[0].lines[0].tokens;content.capo=2;expect(content.sections[0].lines[0].tokens).toBe(tokens);
  });
});
describe('Basic ChordPro',()=>{
  const normalize=(content:ReturnType<typeof newContent>)=>({...content,sourceType:'chordpro',sections:content.sections.map(s=>({...s,id:'section',lines:s.lines.map(l=>({...l,id:'line'}))}))});
  it('round-trips metadata, sections, empty lines and musical content',()=>{
    const content=newContent();content.title='Canção {autoral}';content.artist='Autor fictício';content.key='G';content.bpm=90;content.capo=2;
    content.sections=[{id:'one',type:'verse',label:'Verso',lines:[{id:'line-one',tokens:parseLine('[G/B]Ação e [Em7]coração')},{id:'empty',tokens:[]}]},{id:'two',type:'chorus',label:'Refrão {final}',lines:[{id:'line-two',tokens:parseLine('[Bb][F#m]🎶') }]}];
    expect(normalize(importChordPro(exportChordPro(content)))).toEqual(normalize(content));
  });
  it('imports the basic documented subset and CRLF',()=>{
    const content=importChordPro('{title: Canção}\r\n{artist: Autor}\r\n{key: G}\r\n[G]Hoje vou [D]cantar');
    expect(content.sections[0].lines[0].tokens).toEqual(parseLine('[G]Hoje vou [D]cantar'));expect(content.title).toBe('Canção');
  });
  it.each(['{unsupported: x}','{start_of_chorus}\n[G]texto','{tempo: nan}','{capo: 20}','{key: H}','{start_of_chorus}\n{end_of_verse}'])('rejects unsupported or malformed syntax %s',input=>expect(()=>importChordPro(input)).toThrow());
});
