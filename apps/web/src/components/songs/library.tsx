'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { newContent, songsRequest, type SongDetail, type SongPage, type SongSummary } from '@/lib/songs';
import { importChordPro } from '@/lib/chordpro';
const statuses = {draft:'Rascunho',reviewed:'Com revisão salva',archived:'Arquivada'};
export function Library() {
  const router=useRouter();
  const [query,setQuery]=useState(''); const [status,setStatus]=useState('active'); const [offset,setOffset]=useState(0);
  const [page,setPage]=useState<SongPage|null>(null); const [error,setError]=useState(''); const [loading,setLoading]=useState(true);
  const [reload,setReload]=useState(0); const [busy,setBusy]=useState(false); const [importText,setImportText]=useState(''); const [importError,setImportError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>{
      setLoading(true);
      songsRequest<SongPage>(`?q=${encodeURIComponent(query)}&status=${status}&offset=${offset}`, 'GET', undefined, controller.signal)
        .then(result=>{if(!controller.signal.aborted){setPage(result);setError('');}},exception=>{if(!controller.signal.aborted)setError(exception.message);})
        .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    },200);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[query,status,offset,reload]);
  async function create(importing=false) {
    setBusy(true);setImportError('');setError('');
    try {const content=importing ? importChordPro(importText) : newContent(); const detail=await songsRequest<SongDetail>('','POST',content);router.push(`/musicas/${detail.song.id}/editar`);}
    catch(exception){const message=(exception as Error).message;if(importing)setImportError(message);else setError(message);}
    finally{setBusy(false);}
  }
  async function archive(song:SongSummary) {
    setBusy(true);setError('');
    try {await songsRequest(`/${song.id}`,'PATCH',{archived:song.status!=='archived',draftVersion:song.draftVersion});setReload(value=>value+1);}
    catch(exception){setError((exception as Error).message);}finally{setBusy(false);}
  }
  return <><div className="page-heading"><div><p className="eyebrow">Seu repertório</p><h1>Músicas</h1><p className="muted">Escreva, revise e encontre suas cifras.</p></div><button disabled={busy} onClick={()=>void create()}>Criar cifra</button></div>
    <div className="library-tools"><label>Buscar por título ou artista<input type="search" value={query} maxLength={200} onChange={event=>{setLoading(true);setQuery(event.target.value);setOffset(0);}} /></label><label>Estado<select value={status} onChange={event=>{setLoading(true);setStatus(event.target.value);setOffset(0);}}><option value="active">Ativas</option><option value="draft">Rascunhos</option><option value="reviewed">Com revisão salva</option><option value="archived">Arquivadas</option><option value="all">Todas</option></select></label></div>
    {error ? <div role="alert" className="notice"><p>{error}</p><button onClick={()=>setReload(value=>value+1)}>Tentar novamente</button></div> : null}
    <section aria-label="Biblioteca de músicas" aria-busy={loading}>
      {loading ? <p role="status">Carregando biblioteca…</p> : page?.items.length ? <ul className="song-list">{page.items.map(song=><li key={song.id}><div><Link className="song-title" href={`/musicas/${song.id}`}>{song.title}</Link><p className="muted">{song.artist || 'Artista não informado'} · {statuses[song.status]}</p></div><div className="actions"><Link className="button secondary" href={`/musicas/${song.id}/editar`}>Editar</Link><button className="secondary" disabled={busy} onClick={()=>void archive(song)}>{song.status==='archived'?'Reabrir':'Arquivar'}</button></div></li>)}</ul> : !error ? <div className="empty-panel"><h2>{query?'Nenhuma cifra encontrada':'Sua biblioteca começa com uma cifra.'}</h2><p>{query?'Experimente outro título, artista ou estado.':'Crie sua primeira cifra ou importe um arquivo ChordPro autorizado.'}</p>{query ? <button onClick={()=>{setQuery('');setStatus('active');}}>Limpar filtros</button> : <button disabled={busy} onClick={()=>void create()}>Criar primeira cifra</button>}</div> : null}
      {page && page.total>50 ? <div className="actions pagination"><button disabled={loading||offset===0} onClick={()=>setOffset(value=>value-50)}>Anterior</button><span>{offset+1}–{Math.min(offset+50,page.total)} de {page.total}</span><button disabled={loading||offset+50>=page.total} onClick={()=>setOffset(value=>value+50)}>Próxima</button></div> : null}
    </section>
    <details className="settings-panel"><summary>Importar ChordPro básico</summary><p>Use título, artista, tom, tempo, compasso, capo e acordes entre colchetes. Diretivas não suportadas serão informadas antes de importar.</p><label>Arquivo ChordPro<input type="file" accept=".cho,.chopro,.chordpro,.pro,.txt,text/plain" onChange={async event=>{const file=event.target.files?.[0];if(file){if(file.size>1048576){setImportError('O limite local é 1 MiB.');return;}setImportText(await file.text());}}} /></label><label>Conteúdo ChordPro<textarea rows={8} value={importText} maxLength={250000} onChange={event=>setImportText(event.target.value)} /></label>{importError?<p role="alert">{importError}</p>:null}<button disabled={busy||!importText.trim()} onClick={()=>void create(true)}>Importar para editar</button></details>
  </>;
}
