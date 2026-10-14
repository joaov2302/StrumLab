import {BookPreview} from '@/components/songbooks/preview';
export const metadata={title:'Prévia do cancioneiro'};
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{export?:string}>}){const{id}=await params,{export:exportId}=await searchParams;return <BookPreview id={id} exportId={exportId}/>;}
