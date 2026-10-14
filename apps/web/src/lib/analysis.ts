import type {components} from './api.generated';
export type AnalysisDetail=components['schemas']['AnalysisDetail'];
export type AnalysisJob=components['schemas']['AnalysisJob'];
export type AnalysisResult=components['schemas']['AnalysisResult'];
export type ChordEvent=components['schemas']['AnalysisChordEvent'];
export async function analysisRequest<T>(path:string,method='GET',data?:unknown,signal?:AbortSignal):Promise<T>{const response=await fetch(`/api/analysis/${path}`,{method,headers:data instanceof FormData?undefined:{'Content-Type':'application/json'},body:data===undefined?undefined:data instanceof FormData?data:JSON.stringify(data),signal,cache:'no-store'});const value=await response.json();if(!response.ok)throw new Error(value.detail??'Não foi possível concluir a análise.');return value as T;}
export const jobLabel=(status:string)=>({pending:'Na fila',processing:'Processando',completed:'Sugestões disponíveis',needs_input:'Precisa de informação manual',failed:'Falha no processamento',cancelled:'Cancelado'}[status]??status);
export const errorLabel=(code:string|null)=>({invalid_audio:'O arquivo não contém áudio MP3/WAV válido.',invalid_format:'Formato real incompatível com a extensão.',duration_or_channels:'Envie áudio de 2 segundos a 10 minutos, mono/estéreo e 8–192 kHz.',timeout:'O processamento ultrapassou o limite de três minutos.',integrity_failed:'A verificação de integridade falhou.',lease_expired:'O worker foi interrompido e esgotou suas tentativas.',processing_failed:'Não foi possível estimar os dados desse áudio.'}[code??'']??'Falha no processamento.');
