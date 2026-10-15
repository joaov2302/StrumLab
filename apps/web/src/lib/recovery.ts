import type {EditorBuffer} from './music';
export type Recovery={version:number;baseRevisionId:string|null;buffer:EditorBuffer;updatedAt:string};
const key=(id:string)=>`strumlab.recovery.v1.${id}`;
export function readRecovery(id:string):Recovery|null{try{const v=JSON.parse(localStorage.getItem(key(id))??'null');if(!v||!Number.isInteger(v.version)||!Array.isArray(v.buffer?.sections)||typeof v.buffer?.title!=='string'||!Number.isFinite(Date.parse(v.updatedAt)))return null;if(!v.buffer.sections.every((s:Partial<EditorBuffer['sections'][number]>)=>typeof s.id==='string'&&typeof s.text==='string'&&typeof s.label==='string'&&Array.isArray(s.lineIds)))return null;return v;}catch{return null;}}
export function saveRecovery(id:string,value:Recovery){localStorage.setItem(key(id),JSON.stringify(value));}
export function clearRecovery(id:string){localStorage.removeItem(key(id));}
