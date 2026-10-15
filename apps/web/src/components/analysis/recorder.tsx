'use client';
import {useEffect,useRef,useState} from 'react';
import {encodeWav} from '@/lib/wav';

export function AudioRecorder({disabled,onRecorded,onBusyChange}:{disabled:boolean;onRecorded:(file:File)=>void;onBusyChange:(busy:boolean)=>void}){
  const [status,setStatus]=useState<'idle'|'requesting'|'recording'|'converting'>('idle'),[error,setError]=useState('');
  const recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),mounted=useRef(true);
  function release(){stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;}
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(recorder.current?.state==='recording')recorder.current.stop();release();};},[]);
  async function start(){
    setError('');if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setError('Este navegador não oferece gravação. Envie um arquivo MP3/WAV.');return;}
    setStatus('requesting');onBusyChange(true);
    try{
      const input=await navigator.mediaDevices.getUserMedia({audio:true});if(!mounted.current){input.getTracks().forEach(t=>t.stop());return;}stream.current=input;
      const active=new MediaRecorder(input),chunks:Blob[]=[];recorder.current=active;
      active.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      active.onerror=()=>{release();if(mounted.current){setError('A gravação foi interrompida. Tente novamente ou envie um arquivo.');setStatus('idle');onBusyChange(false);}active.onstop=null;};
      active.onstop=async()=>{
        release();if(!mounted.current)return;setStatus('converting');let context:AudioContext|undefined;
        try{context=new AudioContext();const decoded=await context.decodeAudioData(await new Blob(chunks,{type:active.mimeType}).arrayBuffer());if(decoded.duration<2)throw new Error('Grave pelo menos dois segundos.');const wav=encodeWav(Array.from({length:decoded.numberOfChannels},(_,i)=>decoded.getChannelData(i)),decoded.sampleRate);if(mounted.current)onRecorded(new File([wav],'gravacao-propria.wav',{type:'audio/wav'}));}
        catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Não foi possível converter a gravação. Envie um arquivo MP3/WAV.');}
        finally{await context?.close();if(mounted.current){setStatus('idle');onBusyChange(false);}}
      };
      active.start();setStatus('recording');timer.current=setTimeout(()=>{if(active.state==='recording')active.stop();},120000);
    }catch{release();if(mounted.current){setStatus('idle');onBusyChange(false);setError('Não foi possível acessar o microfone. Confira a permissão do navegador ou envie um arquivo.');}}
  }
  return <div className="settings-panel"><p>Grave seu instrumento pelo microfone, até dois minutos. A gravação fica neste navegador até você confirmar o envio.</p><div className="actions"><button className="secondary" disabled={disabled||status!=='idle'} onClick={()=>void start()}>Gravar áudio próprio</button>{status==='recording'?<button onClick={()=>recorder.current?.stop()}>Parar gravação</button>:null}</div><p role="status">{status==='requesting'?'Aguardando permissão do microfone…':status==='recording'?'Gravando · parada automática em dois minutos':status==='converting'?'Preparando WAV…':''}</p>{error?<p role="alert">{error}</p>:null}</div>;
}
