'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { songsRequest, type SongDetail } from '@/lib/songs';
import { exportChordPro } from '@/lib/chordpro';
import {OfflineSave} from '@/components/offline';
import {savedSong} from '@/lib/offline';
import {usePreferences} from '@/lib/preferences';
import {ChordTools} from './chord-tools';
import { Score } from './score';
import { SongBinding } from '../strumming/song-binding';
export function SongReader({id,revisionId}:{id:string;revisionId?:string}) {
  const [detail,setDetail]=useState<SongDetail|null>(null);const [error,setError]=useState('');const [reload,setReload]=useState(0);const [offline,setOffline]=useState('');const [preferences,updatePreferences]=usePreferences();const size=preferences.size;const [preferenceError,setPreferenceError]=useState('');
  useEffect(()=>{const controller=new AbortController();songsRequest<SongDetail>(`/${id}`,'GET',undefined,controller.signal).then(setDetail,exception=>{if(!controller.signal.aborted){const saved=savedSong(id);if(saved){setDetail(saved.detail);setOffline('Cópia offline de '+new Date(saved.updatedAt).toLocaleString('pt-BR')+'. Pode estar desatualizada.');}else setError(exception.message);}});return()=>controller.abort();},[id,reload]);
  const revision=detail?.revisions.find(value=>value.id===(revisionId??detail.song.currentRevisionId));
  const content=revision?.content ?? (!revisionId?detail?.draft:undefined);
  function download(){if(!content)return;const url=URL.createObjectURL(new Blob([exportChordPro(content)],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='strumlab-cifra.cho';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <><div className="page-heading"><div><p className="eyebrow">Leitura · {revision?`Revisão ${revision.revisionNo}`:'Rascunho'}</p><h1>{content?.title??'Leitura de cifra'}</h1></div><div className="actions"><Link className="button secondary" href="/musicas">Biblioteca</Link><Link className="button" href={`/musicas/${id}/editar`}>Editar cifra</Link></div></div>{error?<div role="alert" className="notice"><p>{error}</p><button onClick={()=>{setError('');setReload(value=>value+1);}}>Tentar novamente</button></div>:!detail?<p role="status">Carregando cifra…</p>:!content?<p role="alert">Revisão não encontrada. Nenhuma versão foi substituída pela atual.</p>:<>{offline?<p role="status" className="notice">{offline}</p>:null}<div className="reader-tools"><label>Tamanho de leitura<select value={size} onChange={event=>{try{updatePreferences({size:event.target.value as typeof size});setPreferenceError('');}catch{setPreferenceError('O navegador bloqueou o armazenamento da preferência.');}}}><option value="normal">Normal</option><option value="large">Grande</option><option value="extra">Extra grande</option></select></label><button className="secondary" onClick={download}>Exportar ChordPro</button><span className="badge">{revision?`Revisão ${revision.revisionNo} · snapshot salvo`:'Rascunho · ainda sem revisão publicada'}</span></div><div className={`reading-surface reading-${size}`}><Score content={content}/></div>{preferenceError?<p role="alert">{preferenceError}</p>:null}<OfflineSave detail={detail}/><ChordTools content={content}/><SongBinding id={id}/><p><Link className="button secondary" href={`/analise?song=${id}`}>Analisar áudio autorizado</Link></p></> }</>;
}
