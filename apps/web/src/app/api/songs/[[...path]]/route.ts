import { NextRequest, NextResponse } from 'next/server';

const uuid = '[0-9a-fA-F-]{36}';
const allowed = new RegExp(`^(?:|transpose|${uuid}(?:/(?:strumming|draft|revisions(?:/${uuid}/restore)?))?)$`);
async function proxy(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  const route = path.join('/');
  if (!allowed.test(route)) return NextResponse.json({status:404, title:'Não encontrado', detail:'Endpoint indisponível.'}, {status:404});
  const writing = request.method !== 'GET';
  // Next may normalize request.nextUrl to localhost internally. Compare the
  // browser's Origin to the validated HTTP Host, restricted to loopback names.
  const host=request.headers.get('host')??'';
  const localHost=/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(host);
  if (!localHost || (writing && (request.headers.get('origin') !== `http://${host}` || request.headers.get('content-type')?.split(';')[0] !== 'application/json'))) {
    return NextResponse.json({status:403, title:'Acesso negado', detail:'Use a interface local para editar.'}, {status:403});
  }
  const token = process.env.LOCAL_API_TOKEN;
  if (!token) return NextResponse.json({status:503, title:'Configuração local pendente', detail:'Execute a inicialização do ambiente e reinicie o frontend.'}, {status:503});
  try {
    const body = writing ? await request.text() : undefined;
    if (body && Buffer.byteLength(body) > 1048576) return NextResponse.json({status:413,title:'Cifra muito grande',detail:'O limite local é 1 MiB por requisição.'},{status:413});
    const base = process.env.API_BASE_URL ?? 'http://127.0.0.1:8080';
    const query = new URLSearchParams();
    for (const name of ['q','status','offset']) if (request.nextUrl.searchParams.has(name)) query.set(name, request.nextUrl.searchParams.get(name)!);
    const response = await fetch(`${base}/api/v1/songs${route ? `/${route}` : ''}${query.size ? `?${query}` : ''}`, {
      method: request.method, headers: { 'Content-Type':'application/json', 'X-StrumLab-Local-Token':token }, body, cache:'no-store', signal:AbortSignal.timeout(10000),
    });
    const data: unknown = await response.json();
    return NextResponse.json(data, {status:response.status});
  } catch {
    return NextResponse.json({status:503,title:'API indisponível',detail:'Não foi possível acessar a biblioteca. Seu rascunho permanece nesta tela.'},{status:503});
  }
}
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
