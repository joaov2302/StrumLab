/** PCM16 mono for the existing private WAV pipeline. No streaming capture. */
export function encodeWav(channels: Float32Array[], sampleRate: number): ArrayBuffer {
  if (!channels.length || !Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 192000 || channels.some(c=>c.length!==channels[0].length)) throw new Error('Formato de gravação inválido.');
  const length=channels[0].length;
  if (!length || length/sampleRate>121 || length*2+44>20*1024*1024) throw new Error('Gravação excede o limite. Grave até dois minutos.');
  const bytes=new ArrayBuffer(44+length*2), view=new DataView(bytes);
  const str=(at:number,value:string)=>{for(let i=0;i<value.length;i++)view.setUint8(at+i,value.charCodeAt(i));};
  str(0,'RIFF');view.setUint32(4,36+length*2,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,length*2,true);
  for(let i=0;i<length;i++){const mixed=channels.reduce((sum,c)=>sum+(Number.isFinite(c[i])?c[i]:0),0)/channels.length;const value=Math.max(-1,Math.min(1,mixed));view.setInt16(44+i*2,Math.round(value*(value<0?32768:32767)),true);}
  return bytes;
}
