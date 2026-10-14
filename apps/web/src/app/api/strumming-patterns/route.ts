import {NextRequest,NextResponse} from 'next/server';
export async function GET(request:NextRequest){
  if(!/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(request.headers.get('host')??''))return NextResponse.json({detail:'Use a interface local.'},{status:403});
  const token=process.env.LOCAL_API_TOKEN;if(!token)return NextResponse.json({detail:'Inicialize o ambiente local.'},{status:503});
  try{const response=await fetch(`${process.env.API_BASE_URL??'http://127.0.0.1:8080'}/api/v1/strumming-patterns`,{headers:{'X-StrumLab-Local-Token':token},cache:'no-store',signal:AbortSignal.timeout(10000)});return NextResponse.json(await response.json(),{status:response.status});}
  catch{return NextResponse.json({detail:'Não foi possível carregar os modelos. Tente novamente.'},{status:503});}
}
