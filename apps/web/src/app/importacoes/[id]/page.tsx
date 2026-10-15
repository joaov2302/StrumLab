import {PlaylistDetailView} from '@/components/playlists/detail';
export const metadata={title:'Preparar playlist'};
export default async function Page({params}:{params:Promise<{id:string}>}){const{id}=await params;return <PlaylistDetailView id={id}/>;}
