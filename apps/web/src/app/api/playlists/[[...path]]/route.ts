import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
export const runtime='nodejs';
const uuid='[0-9a-fA-F-]{36}';
const allowed=new RegExp(`^(?:|connection(?:/(?:start|callback))?|${uuid}(?:/items/${uuid}|/songbooks)?)$`);
const cookie='strumlab-spotify-connect';
async function proxy(request:NextRequest,context:{params:Promise<{path?:string[]}>}){
  const{path=[]}=await context.params,route=path.join('/'),host=request.headers.get('host')??'',origin=request.headers.get('origin');
  const callback=route==='connection/callback'&&request.method==='GET',writing=request.method!=='GET';
  if(!allowed.test(route))return NextResponse.json({detail:'Endpoint indisponível.'},{status:404});
  if(!/^127\.0\.0\.1(?::\d+)?$/.test(host)||(!callback&&(request.headers.get('sec-fetch-site')==='cross-site'||(origin!==null&&origin!==`http://${host}`)||(writing&&origin!==`http://${host}`))))return NextResponse.json({detail:'Use a interface local em 127.0.0.1 para acessar playlists.'},{status:403});
  const token=process.env.LOCAL_API_TOKEN;if(!token)return NextResponse.json({detail:'Inicialize o ambiente local.'},{status:503});
  if(route==='connection/callback'&&!callback)return NextResponse.json({detail:'Callback indisponível.'},{status:405});
  if(writing&&!(request.headers.get('content-type')??'').startsWith('application/json'))return NextResponse.json({detail:'Envie JSON válido.'},{status:415});
  try{
    let body:string|undefined,binding:string|undefined;
    if(callback){body=JSON.stringify({state:request.nextUrl.searchParams.get('state'),code:request.nextUrl.searchParams.get('code'),error:request.nextUrl.searchParams.get('error'),browserSession:request.cookies.get(cookie)?.value??''});}
    else if(writing){const reader=request.body?.getReader();const chunks:Uint8Array[]=[];let size=0;if(reader)while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>65536){await reader.cancel();return NextResponse.json({detail:'Requisição excede 64 KiB.'},{status:413});}chunks.push(next.value);}body=Buffer.concat(chunks).toString('utf8');JSON.parse(body||'{}');}
    if(route==='connection/start'&&request.method==='POST'){binding=randomUUID();body=JSON.stringify({browserSession:binding});}
    const response=await fetch(`${process.env.API_BASE_URL??'http://127.0.0.1:8080'}/api/v1/playlist-imports${route?`/${route}`:''}`,{method:callback?'POST':request.method,headers:{'Content-Type':'application/json','X-StrumLab-Local-Token':token},body,cache:'no-store',signal:AbortSignal.timeout(20000)});
    if(callback){const result=NextResponse.redirect(new URL(`/importacoes?connection=${response.ok?'ok':'failed'}`,`http://${host}`),303);result.cookies.set(cookie,'',{path:'/api/playlists/connection',maxAge:0,httpOnly:true,sameSite:'lax'});result.headers.set('Cache-Control','no-store');result.headers.set('Referrer-Policy','no-referrer');return result;}
    const value=await response.json();
    if(binding&&response.ok){const auth=new URL(value.authorizationUrl);if(auth.searchParams.get('redirect_uri')!==`http://${host}/api/playlists/connection/callback`)return NextResponse.json({detail:'SPOTIFY_REDIRECT_URI deve corresponder à porta desta interface local.'},{status:409});}
    const result=NextResponse.json(value,{status:response.status,headers:{'Cache-Control':'private, no-store'}});
    if(binding&&response.ok)result.cookies.set(cookie,binding,{httpOnly:true,sameSite:'lax',path:'/api/playlists/connection',maxAge:600});
    return result;
  }catch{return NextResponse.json({detail:'Não foi possível acessar as importações. Recarregue para conferir o estado salvo.'},{status:503});}
}
export const GET=proxy;export const POST=proxy;export const PATCH=proxy;export const DELETE=proxy;
