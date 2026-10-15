import {it,expect} from 'vitest';
import {simplifyChord,chordShapes} from './chord-tools';
it('preserves basses and altered qualities while simplifying extensions',()=>{expect(simplifyChord('Cmaj7/G')).toBe('C/G');expect(simplifyChord('F#m7')).toBe('F#m');expect(simplifyChord('G7')).toBe('G');for(const c of ['Bdim7','Dsus4','C7b9','Faug','invalid'])expect(simplifyChord(c)).toBe(c);});
it('stores six string positions within the diagram range',()=>{for(const s of Object.values(chordShapes)){expect(s).toHaveLength(6);expect(s.every(f=>Number.isInteger(f)&&f>=-1&&f<=4)).toBe(true);}});
