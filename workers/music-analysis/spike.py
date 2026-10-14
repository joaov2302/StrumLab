"""Authorized benchmark: own signals and CC0 recorded guitar montages, annotated."""
import json,time,wave,pathlib
import numpy as np
import librosa
from analyzer import analyze

def fixtures():
    root=pathlib.Path('/fixtures/guitar');sr=16000
    for bpm in [90,120,160]:
        duration=32*60/bpm;audio=np.zeros(int((duration+2)*sr),dtype=np.float32);truth=[]
        for bar,chord in enumerate(['G','C','D','G','Em','C','D','G']):
            for beat in range(4):
                with wave.open(str(root/f'{chord}-down.wav')) as source:sample=np.frombuffer(source.readframes(source.getnframes()),'<i2').astype(np.float32)/32768;sample=librosa.resample(sample,orig_sr=source.getframerate(),target_sr=sr)
                start=int((bar*4+beat)*60/bpm*sr);audio[start:start+len(sample)]+=sample*.5
                click=np.sin(2*np.pi*1800*np.arange(320)/sr)*np.exp(-np.arange(320)/40)*.1;audio[start:start+len(click)]+=click
            truth.append((bar*4*60/bpm,(bar+1)*4*60/bpm,chord))
        yield f'cc0-guitar-{bpm}',audio[:int(duration*sr)],sr,duration,bpm,'G',truth
    # Independently generated annotated arpeggios including minor harmony.
    for key,bpm,chords in [('C',100,[(0,4,7),(5,9,0),(7,11,2),(0,4,7)]),('Am',110,[(9,0,4),(2,5,9),(4,8,11),(9,0,4)])]:
        duration=32*60/bpm;audio=np.zeros(int(duration*sr),dtype=np.float32);truth=[]
        names=['C','F','G','C'] if key=='C' else ['Am','Dm','E','Am']
        for bar in range(8):
            for beat in range(4):
                start=int((bar*4+beat)*60/bpm*sr);length=min(int(.5*sr),len(audio)-start);t=np.arange(length)/sr
                for pc in chords[bar%4]:
                    f=440*2**((60+pc-69)/12);audio[start:start+length]+=.06*(np.sin(2*np.pi*f*t)+.2*np.sin(4*np.pi*f*t))*np.exp(-t*5)
                audio[start:start+min(320,length)]+=.1*np.sin(2*np.pi*1800*t[:min(320,length)])*np.exp(-np.arange(min(320,length))/40)
            truth.append((bar*4*60/bpm,(bar+1)*4*60/bpm,names[bar%4]))
        yield f'own-arpeggio-{key}',audio,sr,duration,bpm,key,truth

def main():
    rows=[]
    for name,audio,sr,duration,bpm,key,truth in fixtures():
        for variant in ['stft','cqt']:
            started=time.perf_counter();result=analyze(audio,sr,duration,variant);elapsed=time.perf_counter()-started
            samples=np.arange(.75,duration-.5,.5);correct=0
            for t in samples:
                expected=next((c for s,e,c in truth if s<=t<e),'N');observed=next((v['chord'] for v in result['chords'] if v['start']<=t<v['end']),'N');correct+=expected==observed
            rows.append({'fixture':name,'variant':variant,'seconds':round(elapsed,3),'bpmExpected':bpm,'bpmObserved':result['bpm'],'tempoErrorPercent':round(abs(result['bpm']-bpm)/bpm*100,2) if result['bpm'] else None,'keyExpected':key,'keyObserved':result['key'],'chordAccuracy':round(correct/len(samples),3)})
    print(json.dumps(rows,indent=2))
if __name__=='__main__':main()
