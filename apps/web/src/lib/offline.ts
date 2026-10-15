import type {SongDetail} from './songs';
const prefix='strumlab.offline.v1.';
export function savedSong(id:string):{detail:SongDetail;updatedAt:string}|null{try{const v=JSON.parse(localStorage.getItem(prefix+id)??'null');return v?.detail?.song?.id===id&&Array.isArray(v.detail.revisions)&&v.detail.draft?.sections?v:null;}catch{return null;}}
export async function saveSongOffline(detail:SongDetail){if(!('serviceWorker'in navigator))throw new Error('O navegador não oferece uso offline.');const registration=await Promise.race([navigator.serviceWorker.ready,new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('O modo offline não está ativo. Recarregue a página e tente novamente.')),10000))]);if(!registration.active)throw new Error('Recarregue a página para ativar o modo offline.');const id=detail.song.id;
  await new Promise<void>((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>{channel.port1.close();reject(new Error('Não foi possível preparar as páginas offline. Tente novamente.'));},30000);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();if(e.data?.ok)resolve();else reject(new Error('Falha ao salvar as páginas offline.'));};registration.active!.postMessage({type:'SAVE_SONG',id},[channel.port2]);});
  localStorage.setItem(prefix+id,JSON.stringify({detail,updatedAt:new Date().toISOString()}));
}
