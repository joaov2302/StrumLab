import {NextRequest,NextResponse} from 'next/server';
import {renderBook,type BookManifest} from '@/lib/pdf/renderer';
import type {BookRenderClaim} from '@/lib/songbooks';
export const runtime='nodejs';
const uuid='[0-9a-fA-F-]{36}';
const allowed=new RegExp(`^(?:|${uuid}(?:/(?:items(?:/(?:order|${uuid}(?:/strumming)?))?|exports(?:/${uuid}(?:/pdf)?)?))?)$`);
async function proxy(request:NextRequest,context:{params:Promise<{path?:string[]}>}){
  const {path=[]}=await context.params,route=path.join('/');const host=request.headers.get('host')??'';
  if(!allowed.test(route))return NextResponse.json({status:404,detail:'Endpoint indisponível.'},{status:404});
  if(!/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(host)||(request.method!=='GET'&&(request.headers.get('origin')!==`http://${host}`||request.headers.get('content-type')?.split(';')[0]!=='application/json')))return NextResponse.json({status:403,detail:'Use a interface local para editar o cancioneiro.'},{status:403});
  const token=process.env.LOCAL_API_TOKEN;if(!token)return NextResponse.json({status:503,detail:'Inicialize o ambiente local e reinicie o frontend.'},{status:503});
  const base=process.env.API_BASE_URL??'http://127.0.0.1:8080';
  const call=(suffix:string,method:string,body?:string)=>fetch(`${base}/api/v1/songbooks${suffix}`,{method,headers:{'Content-Type':'application/json','X-StrumLab-Local-Token':token},body,cache:'no-store',signal:AbortSignal.timeout(15000)});
  try{
    const body=request.method==='GET'?undefined:await request.text();if(body&&Buffer.byteLength(body)>4194304)return NextResponse.json({status:413,detail:'O limite local é 4 MiB por requisição de livro.'},{status:413});
    const query=new URLSearchParams();for(const name of ['q','status','offset'])if(request.nextUrl.searchParams.has(name))query.set(name,request.nextUrl.searchParams.get(name)!);
    const response=await call(`${route?`/${route}`:''}${query.size?`?${query}`:''}`,request.method,body);
    if(route.endsWith('/pdf')&&response.ok){return new NextResponse(new Uint8Array(await response.arrayBuffer()),{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="strumlab-cancioneiro.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-PDF-SHA256':response.headers.get('X-PDF-SHA256')??''}});}
    const value=await response.json();if(!response.ok)return NextResponse.json(value,{status:response.status});
    if(request.method==='POST'&&route.endsWith('/exports')){
      const claim=value as BookRenderClaim;if(!claim.leaseToken)return NextResponse.json(claim.export);
      const exportPath=`/${path[0]}/exports/${claim.export.id}/result`;
      try{
        const result=await renderBook(claim.manifest as BookManifest);
        if(result.pdf.length>16777216)throw new Error('O PDF excede o limite local de 16 MiB. Reduza a imagem ou divida o livro.');
        const completed=await call(exportPath,'PUT',JSON.stringify({leaseToken:claim.leaseToken,manifestHash:claim.export.manifestHash,pdfBase64:result.pdf.toString('base64'),pageCount:result.pageCount,pageIndex:result.pageIndex}));
        if(!completed.ok)throw new Error('Não foi possível persistir o PDF. Tente novamente.');return NextResponse.json(await completed.json());
      }catch(exception){await call(exportPath,'PATCH',JSON.stringify({leaseToken:claim.leaseToken})).catch(()=>undefined);return NextResponse.json({status:502,title:'PDF indisponível',detail:exception instanceof Error?exception.message:'Não foi possível renderizar o livro. Tente novamente.'},{status:502});}
    }return NextResponse.json(value,{status:response.status});
  }catch{return NextResponse.json({status:503,detail:'Não foi possível acessar o serviço local. Seus ajustes continuam nesta tela.'},{status:503});}
}
export const GET=proxy;export const POST=proxy;export const PUT=proxy;export const PATCH=proxy;export const DELETE=proxy;
