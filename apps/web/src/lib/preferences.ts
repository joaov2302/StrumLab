'use client';
import {useSyncExternalStore} from 'react';
const key='strumlab.preferences.v1',event='strumlab-preferences';
export type Preferences={size:'normal'|'large'|'extra';contrast:boolean;reduceMotion:boolean};
const defaults:Preferences={size:'normal',contrast:false,reduceMotion:false};
export function readPreferences():Preferences{try{const p=JSON.parse(localStorage.getItem(key)??'{}');return {size:['normal','large','extra'].includes(p.size)?p.size:'normal',contrast:p.contrast===true,reduceMotion:p.reduceMotion===true};}catch{return defaults;}}
function subscribe(fn:()=>void){window.addEventListener('storage',fn);window.addEventListener(event,fn);return()=>{window.removeEventListener('storage',fn);window.removeEventListener(event,fn);};}
function snapshot(){try{return localStorage.getItem(key)??'';}catch{return '';}}
export function usePreferences(){const value=useSyncExternalStore(subscribe,snapshot,()=> '');let preferences=defaults;try{const p=JSON.parse(value||'{}');preferences={size:['normal','large','extra'].includes(p.size)?p.size:'normal',contrast:p.contrast===true,reduceMotion:p.reduceMotion===true};}catch{}
  function update(patch:Partial<Preferences>){localStorage.setItem(key,JSON.stringify({...readPreferences(),...patch}));window.dispatchEvent(new Event(event));}
  return [preferences,update] as const;
}
