import {StrummingPractice} from '@/components/strumming/practice';
export const metadata={title:'Prática de batida'};
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{version?:string;song?:string}>}){const{id}=await params,query=await searchParams;return <StrummingPractice key={`${id}-${query.version??1}-${query.song??''}`} id={id} version={Number(query.version??1)} songId={query.song}/>;}
