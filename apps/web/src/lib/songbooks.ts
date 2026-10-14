import type {components} from './api.generated';
export type BookConfig=components['schemas']['BookConfig'];
export type BookDetail=components['schemas']['BookDetail'];
export type BookItem=components['schemas']['BookItem'];
export type BookPage=components['schemas']['BookPage'];
export type BookExport=components['schemas']['BookExport'];
export type BookRenderClaim=components['schemas']['BookRenderClaim'];
export class BookError extends Error{constructor(public status:number,message:string){super(message);}}
export async function bookRequest<T>(path='',method='GET',data?:unknown,signal?:AbortSignal):Promise<T>{
  let response:Response;try{response=await fetch(`/api/songbooks${path}`,{method,headers:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),cache:'no-store',signal});}
  catch(exception){if(signal?.aborted)throw exception;throw new BookError(503,'Não foi possível acessar os cancioneiros. Tente novamente.');}
  const value=await response.json();if(!response.ok)throw new BookError(response.status,value.detail??'Não foi possível concluir a operação.');return value as T;
}
export const newBook=():BookConfig=>({title:'Novo cancioneiro',subtitle:'',organizer:'',cover:{enabled:true,imageData:'',imageRights:'unspecified'},layout:{font:'serif',fontSize:11,marginMm:15,lineSpacing:1.1,columns:1}});
