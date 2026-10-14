"""Small, inspectable baseline. Outputs estimates, never probabilities or lyrics."""
import json, subprocess, pathlib
import numpy as np
import librosa

VERSION = "chroma-baseline-v1"
ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MAJOR = np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88])
MINOR = np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])

class InvalidAudio(Exception):
    pass

def decode(path, extension):
    # No URL/protocol supplied by users; whitelist fixed local media formats.
    raw = pathlib.Path(path).read_bytes()
    if extension == "wav":
        if len(raw)<44 or raw[:4]!=b"RIFF" or raw[8:12]!=b"WAVE": raise InvalidAudio("invalid_format")
    elif extension == "mp3":
        if not (raw[:3]==b"ID3" or (len(raw)>2 and raw[0]==255 and raw[1]&224==224)): raise InvalidAudio("invalid_format")
    else: raise InvalidAudio("invalid_format")
    probe = subprocess.run(["ffprobe","-v","error","-protocol_whitelist","file,pipe","-f",extension,"-show_entries","format=duration:stream=codec_type,codec_name,sample_rate,channels","-of","json",str(path)],capture_output=True,timeout=15)
    if probe.returncode: raise InvalidAudio("invalid_audio")
    metadata=json.loads(probe.stdout);streams=metadata.get("streams",[])
    if len(streams)!=1 or streams[0].get("codec_type")!="audio": raise InvalidAudio("invalid_audio")
    duration=float(metadata.get("format",{}).get("duration",0));rate=int(streams[0].get("sample_rate",0));channels=int(streams[0].get("channels",0))
    if not 2<=duration<=600 or not 8000<=rate<=192000 or not 1<=channels<=2: raise InvalidAudio("duration_or_channels")
    result=subprocess.run(["ffmpeg","-nostdin","-v","error","-protocol_whitelist","file,pipe","-f",extension,"-i",str(path),"-map","0:a:0","-t","601","-ac","1","-ar","16000","-f","f32le","pipe:1"],capture_output=True,timeout=45)
    if result.returncode: raise InvalidAudio("invalid_audio")
    audio=np.frombuffer(result.stdout,dtype="<f4").copy()
    if not 2*16000<=len(audio)<=600*16000 or not np.isfinite(audio).all(): raise InvalidAudio("duration_or_channels")
    return audio,16000,len(audio)/16000

def key_estimate(chroma):
    mean=np.mean(chroma,axis=1)
    if np.std(mean)<.015: return None
    candidates=[]
    for root in range(12):
        for mode,profile in [("",MAJOR),("m",MINOR)]:
            score=float(np.corrcoef(mean,np.roll(profile,root))[0,1]);candidates.append((score,ROOTS[root]+mode))
    candidates.sort(reverse=True)
    return candidates[0][1] if candidates[0][0]>.45 and candidates[0][0]-candidates[1][0]>.035 else None

def chord_events(chroma,sr,hop,duration):
    templates=[];names=[]
    for root in range(12):
        for suffix,third in [("",4),("m",3)]:
            template=np.zeros(12);template[[root,(root+third)%12,(root+7)%12]]=1;templates.append(template/np.linalg.norm(template));names.append(ROOTS[root]+suffix)
    # Half-second windows, separate from lyrics/tokens. Unknown windows remain N.
    events=[]
    for start in np.arange(0,duration,.5):
        a=int(start*sr/hop);b=max(a+1,int(min(start+.5,duration)*sr/hop));vector=np.median(chroma[:,a:b],axis=1);norm=np.linalg.norm(vector)
        scores=np.array(templates)@(vector/(norm+1e-9));order=np.argsort(scores);best=float(scores[order[-1]]);margin=best-float(scores[order[-2]])
        chord=names[order[-1]] if norm>.15 and best>.7 and margin>.045 else "N"
        if events and events[-1]["chord"]==chord: events[-1]["end"]=round(min(start+.5,duration),3)
        else: events.append({"start":round(float(start),3),"end":round(min(float(start)+.5,duration),3),"chord":chord})
    return events

def analyze(audio,sr,duration,variant="cqt"):
    warnings=["Estimativa experimental: sem confiança probabilística calibrada.","Somente tríades maiores/menores; modulações, rubato, sobreposição e afinações alternativas podem reduzir a precisão."]
    if float(np.sqrt(np.mean(audio**2)))<.0001:
        return {"schemaVersion":1,"algorithmVersion":VERSION,"duration":duration,"bpm":None,"key":None,"meter":None,"confidence":None,"chords":[],"warnings":warnings+["Áudio sem sinal suficiente; informe os dados manualmente."]}
    hop=512
    harmonic=librosa.effects.harmonic(audio)
    if variant=="stft":chroma=librosa.feature.chroma_stft(y=harmonic,sr=sr,hop_length=hop,n_fft=8192)
    else:chroma=librosa.feature.chroma_cqt(y=harmonic,sr=sr,hop_length=hop)
    onset=librosa.onset.onset_strength(y=audio,sr=sr,hop_length=hop)
    tempo,beats=librosa.beat.beat_track(onset_envelope=onset,sr=sr,hop_length=hop,trim=False)
    bpm=round(float(np.asarray(tempo).reshape(-1)[0]),1) if len(beats)>=4 and float(np.max(onset))>.1 else None
    return {"schemaVersion":1,"algorithmVersion":VERSION,"duration":round(duration,3),"bpm":bpm,"key":key_estimate(chroma),"meter":None,"confidence":None,"chords":chord_events(chroma,sr,hop,duration),"warnings":warnings+["BPM pode representar metade ou dobro do pulso. Compasso não estimado."]}

if __name__=="__main__":
    import sys
    try:
        audio,sr,duration=decode(sys.argv[1],sys.argv[2]);result=analyze(audio,sr,duration);print(json.dumps({"result":result}))
    except InvalidAudio as e: print(json.dumps({"error":str(e)}))
    except Exception: print(json.dumps({"error":"processing_failed"}))
