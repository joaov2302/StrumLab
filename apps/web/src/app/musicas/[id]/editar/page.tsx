import { SongEditor } from '@/components/songs/editor';
export const metadata = { title:'Editor de cifra' };
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params;return <SongEditor id={id}/>; }
