import type {SongContent} from './songs';
import {chordPattern} from './music';
/** E A D G B e; -1 = muted. Standard tuning, no capo. */
export const chordShapes:Record<string,readonly number[]>={C:[-1,3,2,0,1,0],D:[-1,-1,0,2,3,2],E:[0,2,2,1,0,0],G:[3,2,0,0,0,3],A:[-1,0,2,2,2,0],Am:[-1,0,2,2,1,0],Dm:[-1,-1,0,2,3,1],Em:[0,2,2,0,0,0],F:[1,3,3,2,1,1],Bm:[-1,2,4,4,3,2],A7:[-1,0,2,0,2,0],D7:[-1,-1,0,2,1,2],E7:[0,2,0,1,0,0],G7:[3,2,0,0,0,1],C7:[-1,3,2,3,1,0]};
export function simplifyChord(symbol:string):string{if(!chordPattern.test(symbol))return symbol;const match=/^([A-G][#b]?)(.*?)(\/[A-G][#b]?)?$/.exec(symbol)!;const quality=match[2];if(/dim|aug|sus|[+o°]|[#b]/.test(quality))return symbol;return match[1]+(/^(m(?!aj)|min)/.test(quality)?'m':'')+(match[3]??'');}
export function simplifyContent(content:SongContent):SongContent{return {...content,sections:content.sections.map(s=>({...s,lines:s.lines.map(l=>({...l,tokens:l.tokens.map(t=>t.type==='chord'?{...t,symbol:simplifyChord(t.symbol)}:t)}))}))};}
