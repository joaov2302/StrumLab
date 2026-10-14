'use client';
import { useRef, useState } from 'react';
import { chordPattern, sectionTypes, type SectionBuffer } from '@/lib/music';
type Props = {section:SectionBuffer;index:number;total:number;onChange:(section:SectionBuffer)=>void;onMove:(direction:number)=>void;onDuplicate:()=>void;onRemove:()=>void};
export function SectionEditor({section,index,total,onChange,onMove,onDuplicate,onRemove}:Props) {
  const input=useRef<HTMLTextAreaElement>(null);const [chord,setChord]=useState('G'); const [error,setError]=useState('');
  function insert() {
    if(!chordPattern.test(chord)){setError('Acorde não reconhecido.');return;}
    const start=input.current?.selectionStart ?? section.text.length;
    const end=input.current?.selectionEnd ?? start;
    const symbol=`[${chord}]`;
    onChange({...section,text:section.text.slice(0,start)+symbol+section.text.slice(end)});setError('');
    requestAnimationFrame(()=>{input.current?.focus();input.current?.setSelectionRange(start+symbol.length,start+symbol.length);});
  }
  return <fieldset className="section-editor"><legend>Seção {index+1}</legend><div className="section-top"><label>Nome da seção<input aria-label={`Nome da seção ${index+1}`} value={section.label} maxLength={120} onChange={event=>onChange({...section,label:event.target.value})} /></label><label>Tipo<select value={section.type} onChange={event=>onChange({...section,type:event.target.value as SectionBuffer['type']})}>{sectionTypes.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label></div><label htmlFor={`text-${section.id}`}>Letra e acordes · Seção {index+1}</label><textarea id={`text-${section.id}`} ref={input} rows={Math.max(4,Math.min(section.text.split('\n').length+1,16))} value={section.text} maxLength={250000} onChange={event=>onChange({...section,text:event.target.value})} placeholder="[G]Escreva sua cifra [D]aqui" spellCheck={false} aria-describedby={`help-${section.id}`} /><p id={`help-${section.id}`} className="field-help">Cada quebra cria uma linha. Posicione [G] antes da palavra; use \[ para um colchete literal.</p><div className="actions section-actions"><label>Acorde<input aria-label={`Acorde para seção ${index+1}`} className="chord-input" value={chord} maxLength={40} onChange={event=>setChord(event.target.value)} /></label><button className="secondary" onClick={insert}>Inserir acorde</button><button className="secondary" disabled={index===0} onClick={()=>onMove(-1)} aria-label={`Subir seção ${index+1}`}>↑</button><button className="secondary" disabled={index===total-1} onClick={()=>onMove(1)} aria-label={`Descer seção ${index+1}`}>↓</button><button className="secondary" onClick={onDuplicate}>Duplicar</button><button className="secondary" disabled={total===1} onClick={onRemove}>Remover seção</button></div>{error?<p role="alert">{error}</p>:null}</fieldset>;
}
