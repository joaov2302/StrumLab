import type {components} from './api.generated';
export type Pattern=components['schemas']['StrummingPattern'];
export type StrummingSnapshot=components['schemas']['StrummingSnapshot'];
export type Binding=components['schemas']['StrummingBinding'];
export const counts=['1','&','2','&','3','&','4','&'];
export const symbol=(event:Pattern['events'][number])=>event.play?(event.direction==='down'?'↓':'↑'):'·';
