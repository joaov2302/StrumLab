import type { SongContent } from '@/lib/songs';
import { soundingKey } from '@/lib/music';
export function Score({content}: {content:SongContent}) {
  return <article className="score"><header><h2>{content.title}</h2><p>{content.artist || 'Artista não informado'}</p><p className="score-meta">Tom escrito: {content.key || 'Não informado'} · Capo: {content.capo} · Tom soando: {soundingKey(content.key,content.capo)} · {content.meter}{content.bpm ? ` · ${content.bpm} BPM` : ''}</p></header>{content.sections.map(section=><section key={section.id} className="score-section"><h3>{section.label || 'Seção'}</h3>{section.lines.map(line=><div key={line.id} className="score-line">{line.tokens.length ? line.tokens.map((token,index)=>{
    if(token.type==='text'&&line.tokens[index-1]?.type==='chord')return null;
    const next=line.tokens[index+1];
    const text=token.type==='text'?token.value:next?.type==='text'?next.value:'\u00a0';
    return <span className="score-piece" key={index}><span className="score-chord">{token.type==='chord'?token.symbol:'\u00a0'}</span><span className="score-text">{text}</span></span>;
  }) : <span aria-hidden="true">&nbsp;</span>}</div>)}</section>)}</article>;
}
