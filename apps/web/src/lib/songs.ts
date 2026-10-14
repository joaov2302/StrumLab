import type { components } from './api.generated';
export type SongContent = components['schemas']['SongContent'];
export type SongDetail = components['schemas']['SongDetail'];
export type SongSummary = components['schemas']['SongSummary'];
export type SongPage = components['schemas']['SongPage'];
export type SongSection = components['schemas']['SongSection'];
export type SongToken = components['schemas']['SongToken'];
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function songsRequest<T>(path = '', method = 'GET', data?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try { response = await fetch(`/api/songs${path}`, {method,headers:{'Content-Type':'application/json'},body:data === undefined ? undefined : JSON.stringify(data),cache:'no-store',signal}); }
  catch (error) { if (signal?.aborted) throw error; throw new ApiError(503,'Não foi possível acessar a biblioteca. Tente novamente.'); }
  const value = await response.json();
  if (!response.ok) throw new ApiError(response.status, value.detail ?? 'Não foi possível concluir a operação.');
  return value as T;
}
export function newContent(): SongContent {
  return {schemaVersion:1,title:'Nova cifra',artist:'',key:'',bpm:null,meter:'4/4',capo:0,sourceType:'manual',sourceReference:'',rightsBasis:'unspecified',sections:[{id:crypto.randomUUID(),type:'verse',label:'Verso 1',lines:[{id:crypto.randomUUID(),tokens:[]}]}]};
}
