import { SongReader } from '@/components/songs/reader';
export const metadata = { title:'Leitura de cifra' };
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{revision?:string}>}) { const {id}=await params;const {revision}=await searchParams;return <SongReader id={id} revisionId={revision}/>; }
