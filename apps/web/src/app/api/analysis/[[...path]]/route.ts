import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
const uuid='[0-9a-fA-F-]{36}',allowed=new RegExp(`^(?:songs/${uuid}/audio-assets|assets/${uuid}(?:/(?:audio|jobs))?|jobs/${uuid}(?:/apply)?)$`);
async function proxy(request:NextRequest,context:{params:Promise<{path?:string[]}>}){
  const{path=[]}=await context.params,route=path.join('/'),host=request.headers.get('host')??'',origin=request.headers.get('origin'),writing=request.method!=='GET';
  if(!allowed.test(route))return NextResponse.json({detail:'Endpoint indisponível.'},{status:404});
  if(!/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(host)||(origin!==null&&origin!==`http://${host}`)||request.headers.get('sec-fetch-site')==='cross-site'||(writing&&origin!==`http://${host}`))return NextResponse.json({detail:'Use a interface local para acessar análises.'},{status:403});
  const token=process.env.LOCAL_API_TOKEN;if(!token)return NextResponse.json({detail:'Inicialize o ambiente local.'},{status:503});
  const uploading=request.method==='POST'&&route.endsWith('/audio-assets'),type=request.headers.get('content-type')??'';
  if(writing&&!uploading&&!type.startsWith('application/json'))return NextResponse.json({detail:'Envie JSON válido.'},{status:415});
  if(uploading&&!type.startsWith('multipart/form-data;'))return NextResponse.json({detail:'Envie WAV/MP3 no formulário.'},{status:415});
  try{
    let body:Uint8Array|undefined;
    if(writing){const limit=uploading?22*1024*1024:1024*1024;if(Number(request.headers.get('content-length')??0)>limit)return NextResponse.json({detail:'Requisição excede o limite local.'},{status:413});const reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;if(reader)while(true){const{value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();return NextResponse.json({detail:'Requisição excede o limite local.'},{status:413});}chunks.push(value);}body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}}
    const upstream=route.replace(/^assets\//,'audio-assets/');
    const response=await fetch(`${process.env.API_BASE_URL??'http://127.0.0.1:8080'}/api/v1/${upstream}`,{method:request.method,headers:{'Content-Type':type||'application/json','X-StrumLab-Local-Token':token},body:body as BodyInit|undefined,cache:'no-store',signal:AbortSignal.timeout(30000)});
    if(route.endsWith('/audio')&&response.ok)return new NextResponse(new Uint8Array(await response.arrayBuffer()),{headers:{'Content-Type':response.headers.get('content-type')??'application/octet-stream','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
    return NextResponse.json(await response.json(),{status:response.status,headers:{'Cache-Control':'private, no-store'}});
  }catch{return NextResponse.json({detail:'Não foi possível acessar as análises. O processamento já recebido continua independente desta tela.'},{status:503});}
}
export const GET=proxy;export const POST=proxy;export const DELETE=proxy;
