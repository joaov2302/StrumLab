import {PlaylistWorkspace} from '@/components/playlists/workspace';
export const metadata={title:'Playlists Spotify'};
export default async function Page({searchParams}:{searchParams:Promise<{connection?:string}>}){const{connection}=await searchParams;return <PlaylistWorkspace connectionResult={connection}/>;}
