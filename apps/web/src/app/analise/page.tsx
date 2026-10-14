import {AnalysisWorkspace} from '@/components/analysis/workspace';
export const metadata={title:'Análise assistida'};
export default async function Page({searchParams}:{searchParams:Promise<{song?:string}>}){const{song}=await searchParams;return <AnalysisWorkspace key={song??'library'} songId={song}/>;}
