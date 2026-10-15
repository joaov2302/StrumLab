'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError, songsRequest, type SongContent, type SongDetail } from '@/lib/songs';
import { fromBuffer, toBuffer, type EditorBuffer, type SectionBuffer } from '@/lib/music';
import { exportChordPro } from '@/lib/chordpro';
import {savedSong} from '@/lib/offline';
import {readRecovery,saveRecovery,clearRecovery} from '@/lib/recovery';
import {ChordTools} from './chord-tools';
import { Score } from './score';
import { SectionEditor } from './section-editor';

export function SongEditor({id}:{id:string}) {
  const [detail,setDetail]=useState<SongDetail|null>(null);const [error,setError]=useState('');const [retry,setRetry]=useState(0);
  useEffect(()=>{const controller=new AbortController();songsRequest<SongDetail>(`/${id}`,'GET',undefined,controller.signal).then(setDetail,exception=>{if(!controller.signal.aborted){const saved=savedSong(id);if(saved)setDetail(saved.detail);else setError(exception.message);}});return()=>controller.abort();},[id,retry]);
  if(!detail||detail.song.id!==id)return <><h1>Editor de cifra</h1>{error?<div role="alert" className="notice"><p>{error}</p><button onClick={()=>{setError('');setRetry(value=>value+1);}}>Tentar novamente</button></div>:<p role="status">Carregando cifra…</p>}<Link href="/musicas">Voltar à biblioteca</Link></>;
  return <EditorSession key={id} initial={detail} />;
}
function EditorSession({initial}:{initial:SongDetail}) {
  const router=useRouter();
  const [detail,setDetail]=useState(initial);const remote=useRef(initial);
  const [buffer,setBuffer]=useState(()=>toBuffer(initial.draft));const current=useRef(buffer);
  const past=useRef<EditorBuffer[]>([]);const future=useRef<EditorBuffer[]>([]);
  const [historyCounts,setHistoryCounts]=useState({undo:0,redo:0});const generation=useRef(0);
  const [dirty,setDirty]=useState(false);const dirtyRef=useRef(false);
  const [busy,setBusy]=useState(false);const busyRef=useRef(false);const active=useRef(true);
  const [message,setMessage]=useState(initial.song.currentRevisionId?'Rascunho carregado da biblioteca':'Rascunho salvo na biblioteca');
  const [error,setError]=useState('');const [conflict,setConflict]=useState<SongDetail|null>(null);
  const [showPreview,setShowPreview]=useState(false);const [showHistory,setShowHistory]=useState(false);
  const [semitones,setSemitones]=useState(2);const [spelling,setSpelling]=useState<'sharps'|'flats'>('sharps');
  const [autosave,setAutosave]=useState(true);
  const [copyPath,setCopyPath]=useState('');
  const [recovery,setRecovery]=useState(()=>readRecovery(initial.song.id));
  const [recoveryError,setRecoveryError]=useState('');
  function rememberLocally(value:EditorBuffer){try{saveRecovery(initial.song.id,{version:remote.current.song.draftVersion,baseRevisionId:remote.current.baseRevisionId,buffer:value,updatedAt:new Date().toISOString()});setRecoveryError('');}catch{setRecoveryError('O navegador não pôde guardar a recuperação local. Salve o rascunho na biblioteca ou exporte ChordPro antes de fechar.');}}
  function forgetLocally(){try{clearRecovery(initial.song.id);setRecovery(null);}catch{setRecoveryError('Não foi possível limpar a recuperação neste navegador.');}}
  function recover(){if(!recovery)return;const candidate=recovery,latest=remote.current;const changed=candidate.version!==latest.song.draftVersion||candidate.baseRevisionId!==latest.baseRevisionId;if(changed)remote.current={...latest,baseRevisionId:candidate.baseRevisionId,song:{...latest.song,draftVersion:candidate.version}};setRecovery(null);replace(candidate.buffer);if(changed){setConflict(latest);setError('A biblioteca mudou desde a recuperação. Compare ou salve como cópia.');}setMessage('Alterações recuperadas deste navegador; revise antes de salvar.');}

  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  function replace(next:EditorBuffer,remember=true) {
    if(remember){past.current=[...past.current.slice(-99),current.current];future.current=[];}
    rememberLocally(next);current.current=next;generation.current++;setBuffer(next);dirtyRef.current=true;setDirty(true);setError('');setMessage('Alterações no rascunho');setHistoryCounts({undo:past.current.length,redo:future.current.length});
  }
  function undo(redo=false) {
    const source=redo?future:past;const target=redo?past:future;const next=source.current.pop();
    if(next){target.current.push(current.current);replace(next,false);}
  }
  async function persist(kind:'draft'|'revisions') {
    if(busyRef.current||conflict||recovery)return;
    let content:SongContent;try{content=fromBuffer(current.current);}catch(exception){setError((exception as Error).message);return;}
    const submitted=generation.current;busyRef.current=true;setBusy(true);setError('');setMessage(kind==='draft'?'Salvando rascunho…':'Salvando revisão…');
    try {
      const result=await songsRequest<SongDetail>(`/${remote.current.song.id}/${kind}`,kind==='draft'?'PUT':'POST',{content,baseRevisionId:remote.current.baseRevisionId,draftVersion:remote.current.song.draftVersion});
      if(!active.current)return;
      remote.current=result;setDetail(result);
      const unchanged=submitted===generation.current;if(unchanged)forgetLocally();else rememberLocally(current.current);dirtyRef.current=!unchanged;setDirty(!unchanged);
      setMessage(unchanged ? kind==='draft'?'Rascunho salvo na biblioteca':`Revisão ${result.revisions[0].revisionNo} salva` : 'Revisão recebida; há novas alterações no rascunho');
    } catch(exception) {
      if(!active.current)return;
      setError((exception as Error).message);setMessage('Não salvo · rascunho preservado nesta tela');
      if(exception instanceof ApiError && exception.status===409){try{setConflict(await songsRequest<SongDetail>(`/${remote.current.song.id}`));}catch{setConflict(remote.current);}}
    } finally{busyRef.current=false;if(active.current)setBusy(false);}
  }
  // Debounced draft autosave; final revisions require an explicit action.
  useEffect(()=>{
    if(!dirty||busy||conflict||recovery||!autosave||error)return;
    const timer=setTimeout(()=>void persist('draft'),1500);
    return()=>clearTimeout(timer);
    // persist reads the latest buffer and version from refs; this effect schedules by state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[buffer,dirty,busy,conflict,recovery,autosave,error]);
  useEffect(()=>{
    if(!dirty)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();};
    const guard=(event:MouseEvent)=>{
      const link=(event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement|null;
      if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||link.target==='_blank')return;
      const url=new URL(link.href);
      if(url.origin===location.origin&&(url.pathname!==location.pathname||url.search!==location.search)&&!window.confirm('Há alterações não salvas. Sair do editor?')){event.preventDefault();event.stopImmediatePropagation();}
    };
    window.addEventListener('beforeunload',warn);document.addEventListener('click',guard,true);
    return()=>{window.removeEventListener('beforeunload',warn);document.removeEventListener('click',guard,true);};
  },[dirty]);
  let preview:SongContent|null=null;let parseError='';try{preview=fromBuffer(buffer);}catch(exception){parseError=(exception as Error).message;}
  function sectionChange(index:number,section:SectionBuffer){const normalized={...section,lineIds:section.text.split('\n').map((_,n)=>section.lineIds[n]??crypto.randomUUID())};replace({...current.current,sections:current.current.sections.map((item,n)=>n===index?normalized:item)});}
  function move(index:number,direction:number){const sections=[...current.current.sections];[sections[index],sections[index+direction]]=[sections[index+direction],sections[index]];replace({...current.current,sections});}
  async function transpose() {
    if(!preview||busyRef.current)return;const submitted=generation.current;busyRef.current=true;setBusy(true);setError('');
    try{const value=await songsRequest<SongContent>('/transpose','POST',{content:preview,semitones,spelling});if(active.current){if(submitted===generation.current)replace(toBuffer(value));else setError('A cifra mudou durante a transposição. Suas alterações foram mantidas; tente transpor novamente.');}}
    catch(exception){if(active.current)setError((exception as Error).message);}finally{busyRef.current=false;if(active.current)setBusy(false);}
  }
  function download(){if(!preview)return;const blob=new Blob([exportChordPro(preview)],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='strumlab-cifra.cho';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function copy() {
    if(!preview||busyRef.current)return;const submitted=generation.current;busyRef.current=true;setBusy(true);
    try{const value=await songsRequest<SongDetail>('','POST',{...preview,title:`${preview.title.slice(0,190)} (cópia)`});const path=`/musicas/${value.song.id}/editar`;if(submitted===generation.current){dirtyRef.current=false;setDirty(false);router.push(path);}else{setCopyPath(path);setError('A cópia foi salva. As novas alterações continuam preservadas nesta tela.');}}
    catch(exception){setError((exception as Error).message);}finally{busyRef.current=false;if(active.current)setBusy(false);}
  }
  function loadLatest(){if(!conflict||!window.confirm('Descartar o rascunho desta tela e carregar o que está na biblioteca?'))return;forgetLocally();remote.current=conflict;setDetail(conflict);const next=toBuffer(conflict.draft);current.current=next;setBuffer(next);past.current=[];future.current=[];setHistoryCounts({undo:0,redo:0});setDirty(false);dirtyRef.current=false;setConflict(null);setError('');setMessage('Rascunho recarregado');}
  async function restore(revisionId:string){if(busyRef.current||recovery||!window.confirm('Restaurar como nova revisão? O rascunho atual será substituído; as revisões anteriores serão preservadas.'))return;const submitted=generation.current;busyRef.current=true;setBusy(true);try{const value=await songsRequest<SongDetail>(`/${detail.song.id}/revisions/${revisionId}/restore`,'POST',{draftVersion:remote.current.song.draftVersion,baseRevisionId:remote.current.baseRevisionId});if(!active.current)return;remote.current=value;setDetail(value);if(submitted===generation.current){const next=toBuffer(value.draft);current.current=next;setBuffer(next);past.current=[];future.current=[];setHistoryCounts({undo:0,redo:0});dirtyRef.current=false;setDirty(false);forgetLocally();setMessage(`Revisão ${value.revisions[0].revisionNo} salva por restauração`);}else setMessage('Restauração salva; novas alterações preservadas no rascunho');setError('');}catch(exception){if(!active.current)return;setError((exception as Error).message);if(exception instanceof ApiError&&exception.status===409){try{setConflict(await songsRequest<SongDetail>(`/${detail.song.id}`));}catch{setConflict(remote.current);}}}finally{busyRef.current=false;if(active.current)setBusy(false);}}
  const archived=detail.song.status==='archived';
  return <><div className="editor-heading"><div><p className="eyebrow">Cifra · {detail.revisions.length ? `Revisão ${detail.revisions[0].revisionNo}`:'Primeiro rascunho'}</p><h1>Editor de cifra</h1><p role="status" aria-live="polite">{message}</p></div><div className="actions"><Link className="button secondary" href="/musicas">Biblioteca</Link><Link className="button secondary" href={`/musicas/${detail.song.id}`}>Ler cifra</Link><button disabled={busy||!!conflict||!!recovery||archived||!!parseError} onClick={()=>void persist('revisions')}>Salvar revisão</button></div></div>
    {recovery?<section className="notice" aria-label="Recuperação de rascunho"><h2>Há alterações guardadas neste navegador</h2><p>Recuperação de {new Date(recovery.updatedAt).toLocaleString('pt-BR')}. Nenhuma alteração foi aplicada à biblioteca.</p><button disabled={busy} onClick={recover}>Recuperar alterações locais</button><button className="secondary" disabled={busy} onClick={forgetLocally}>Descartar recuperação local</button></section>:null}
    {recoveryError?<p role="alert" className="notice">{recoveryError}</p>:null}
    {error?<p role="alert" className="notice">{error}</p>:null}
    {copyPath?<Link className="button secondary" href={copyPath}>Abrir a cópia salva</Link>:null}
    {archived?<div className="notice"><p>Esta música está arquivada. Reabra na biblioteca para editar.</p><Link href="/musicas">Ir à biblioteca</Link></div>:null}
    {conflict?<section className="notice" aria-label="Conflito de edição"><h2>Seu rascunho está preservado</h2><p>Outra edição alterou a biblioteca. Compare o rascunho abaixo com o conteúdo salvo antes de escolher.</p><div className="actions"><button onClick={loadLatest} disabled={busy}>Descartar meu rascunho e recarregar</button><button onClick={()=>void copy()} disabled={busy||!!parseError}>Salvar meu rascunho como cópia</button></div><details><summary>Comparar com a biblioteca</summary>{preview?<Score content={preview}/>:<p>{parseError}</p>}<h3>Conteúdo da biblioteca</h3><Score content={conflict.draft}/></details></section>:null}
    <fieldset disabled={archived||!!recovery} className="metadata"><legend>Sobre a música</legend><label>Título<input value={buffer.title} maxLength={200} onChange={event=>replace({...buffer,title:event.target.value})}/></label><label>Artista<input value={buffer.artist} maxLength={200} onChange={event=>replace({...buffer,artist:event.target.value})}/></label><label>Tom escrito<input value={buffer.key} maxLength={3} placeholder="G, Bb, F#m" onChange={event=>replace({...buffer,key:event.target.value})}/></label><label>Capo<input type="number" min={0} max={12} value={buffer.capo} onChange={event=>replace({...buffer,capo:Number(event.target.value)})}/></label><label>BPM (opcional)<input type="number" min={20} max={400} value={buffer.bpm??''} onChange={event=>replace({...buffer,bpm:event.target.value===''?null:Number(event.target.value)})}/></label><label>Compasso<input value={buffer.meter} maxLength={5} onChange={event=>replace({...buffer,meter:event.target.value})}/></label></fieldset>
    <div className="editor-toolbar"><div className="actions"><button className="secondary" disabled={!historyCounts.undo||archived||!!recovery} onClick={()=>undo()}>Desfazer</button><button className="secondary" disabled={!historyCounts.redo||archived||!!recovery} onClick={()=>undo(true)}>Refazer</button><button className="secondary" onClick={()=>setShowPreview(value=>!value)}>{showPreview?'Ocultar leitura':'Ver leitura'}</button><button className="secondary" onClick={()=>setShowHistory(value=>!value)}>Histórico ({detail.revisions.length})</button></div><div className="actions"><label>Semitons<input type="number" min={-12} max={12} value={semitones} onChange={event=>setSemitones(Number(event.target.value))}/></label><label>Grafia<select value={spelling} onChange={event=>setSpelling(event.target.value as 'sharps'|'flats')}><option value="sharps">Sustenidos</option><option value="flats">Bemóis</option></select></label><button className="secondary" disabled={busy||archived||!!recovery||!!parseError} onClick={()=>void transpose()}>Transpor</button></div></div>
    {preview?<ChordTools content={preview} onApply={archived||busy||conflict||recovery?undefined:value=>replace(toBuffer(value))}/>:null}
    {parseError?<p role="alert" className="notice">{parseError} Corrija antes de salvar. O texto não foi descartado.</p>:null}
    <fieldset disabled={archived||!!recovery} className="sections-fieldset"><legend>Seções da cifra</legend>{buffer.sections.map((section,index)=><SectionEditor key={section.id} section={section} index={index} total={buffer.sections.length} onChange={value=>sectionChange(index,value)} onMove={direction=>move(index,direction)} onRemove={()=>replace({...buffer,sections:buffer.sections.filter((_,n)=>n!==index)})} onDuplicate={()=>{const duplicate={...section,id:crypto.randomUUID(),lineIds:section.text.split('\n').map(()=>crypto.randomUUID()),label:`${section.label} (cópia)`.slice(0,120)};replace({...buffer,sections:[...buffer.sections.slice(0,index+1),duplicate,...buffer.sections.slice(index+1)]});}}/>)}<button className="secondary" disabled={buffer.sections.length>=100} onClick={()=>replace({...buffer,sections:[...buffer.sections,{id:crypto.randomUUID(),type:'chorus',label:'Refrão',text:'',lineIds:[crypto.randomUUID()]}]})}>Adicionar seção</button></fieldset>
    <details className="settings-panel"><summary>Origem do conteúdo</summary><p>Informações declaradas para sua biblioteca local.</p><label>Base de direitos<select value={buffer.rightsBasis} disabled={archived||!!recovery} onChange={event=>replace({...buffer,rightsBasis:event.target.value as SongContent['rightsBasis']})}><option value="unspecified">Não informada</option><option value="own">Autoria própria</option><option value="permission">Permissão do titular</option><option value="public_domain">Domínio público declarado</option></select></label><label>Referência de origem<input value={buffer.sourceReference} maxLength={1000} disabled={archived} onChange={event=>replace({...buffer,sourceReference:event.target.value})}/></label></details>
    <div className="actions save-toolbar"><label className="checkbox-label"><input type="checkbox" checked={autosave} onChange={event=>setAutosave(event.target.checked)}/>Salvar rascunho automaticamente</label><button className="secondary" disabled={busy||!dirty||!!conflict||archived||!!parseError} onClick={()=>void persist('draft')}>Salvar rascunho agora</button><button className="secondary" disabled={!!parseError} onClick={download}>Exportar ChordPro</button></div>
    {showPreview&&preview?<section className="settings-panel" aria-label="Prévia de leitura"><Score content={preview}/></section>:null}
    {showHistory?<section className="settings-panel"><h2>Revisões salvas</h2><p className="muted">Restaurar cria uma nova revisão. Cada versão conserva seus metadados e acordes.</p>{detail.revisions.length?<ul className="revision-list">{detail.revisions.map(revision=><li key={revision.id}><div><strong>Revisão {revision.revisionNo}</strong><p>{new Date(revision.createdAt).toLocaleString('pt-BR')} · {revision.source==='restored'?'Restauração':revision.source==='chordpro'?'ChordPro':'Manual'}</p></div><div className="actions"><Link className="button secondary" href={`/musicas/${detail.song.id}?revision=${revision.id}`}>Ler revisão {revision.revisionNo}</Link><button className="secondary" disabled={busy||archived||!!conflict} onClick={()=>void restore(revision.id)}>Restaurar revisão {revision.revisionNo}</button></div></li>)}</ul>:<p>Nenhuma revisão publicada. Use Salvar revisão para registrar a primeira.</p>}</section>:null}
  </>;
}
