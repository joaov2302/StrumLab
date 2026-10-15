import {describe,it,expect} from 'vitest';
import {encodeWav} from './wav';
describe('PCM WAV microphone export',()=>{
  it('writes a valid mono header and downmixes/clamps signed samples',()=>{const data=encodeWav([new Float32Array([-2,1,1,NaN]),new Float32Array([-2,1,-1,NaN])],8000),view=new DataView(data);expect(new TextDecoder().decode(data.slice(0,4))).toBe('RIFF');expect(view.getUint32(4,true)).toBe(data.byteLength-8);expect(view.getUint16(22,true)).toBe(1);expect(view.getUint32(24,true)).toBe(8000);expect(view.getInt16(44,true)).toBe(-32768);expect(view.getInt16(46,true)).toBe(32767);expect(view.getInt16(48,true)).toBe(0);expect(view.getInt16(50,true)).toBe(0);});
  it('rejects empty, mismatched and excessive recordings',()=>{expect(()=>encodeWav([],44100)).toThrow();expect(()=>encodeWav([new Float32Array(1),new Float32Array(2)],44100)).toThrow();expect(()=>encodeWav([new Float32Array(8000*122)],8000)).toThrow();});
});
