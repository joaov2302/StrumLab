'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {songsRequest} from '@/lib/songs';
import type {Binding} from '@/lib/strumming';
import {RhythmGrid} from './grid';
export function SongBinding({id}:{id:string}){
  const[value,setValue]=useState<Binding|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{const c=new AbortController();songsRequest<Binding>(`/${id}/strumming`,'GET',undefined,c.signal).then(setValue,e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[id,retry]);
  return <section className="settings-panel"><h2>Batida para prática</h2><p>Vínculo atual da música, independente da revisão da cifra e dos snapshots dos livros.</p>{error?<div role="alert"><p>{error}</p><button onClick={()=>{setError('');setRetry(v=>v+1);}}>Tentar novamente</button></div>:!value?<p role="status">Carregando batida…</p>:value.snapshot?<><p>{value.snapshot.pattern.name} · {value.snapshot.pattern.timeSignature} · {value.snapshot.bpm} BPM · versão {value.snapshot.pattern.version}</p><RhythmGrid pattern={value.snapshot.pattern}/>{value.snapshot.notes?<p>{value.snapshot.notes}</p>:null}<Link className="button" href={`/batidas/${value.snapshot.pattern.id}?version=${value.snapshot.pattern.version}&song=${id}`}>Praticar e editar vínculo</Link></>:<><p>Nenhuma batida vinculada.</p><Link href={`/batidas/pop-folk-basic?song=${id}`}>Escolher Pop / Folk</Link></>}</section>;
}
