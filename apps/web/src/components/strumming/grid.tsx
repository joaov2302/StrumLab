import {counts,symbol,type Pattern} from '@/lib/strumming';
export function RhythmGrid({pattern,slot}:{pattern:Pattern;slot?:number}){
  return <ol className="rhythm-grid" aria-label="Oito movimentos do compasso">{pattern.events.map(e=><li key={e.slot} className={`${slot===e.slot?'current':''} ${!e.play?'silent':''}`} aria-current={slot===e.slot?'step':undefined}><span className="rhythm-count">{counts[e.slot]}</span><strong aria-hidden="true">{symbol(e)}</strong><span className="sr-only">{e.direction==='down'?'Para baixo':'Para cima'}{e.play?', tocar':', sem tocar'}{e.accent?', acentuado':''}</span><small aria-hidden="true">{e.accent?'Acento':e.play?'Tocar':'Mover'}</small></li>)}</ol>;
}
