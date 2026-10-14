import {BookMontage} from '@/components/songbooks/montage';
export const metadata={title:'Montagem do cancioneiro'};
export default async function Page({params}:{params:Promise<{id:string}>}){const{id}=await params;return <BookMontage id={id}/>;}
