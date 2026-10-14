import unittest,tempfile,pathlib,wave,uuid
import numpy as np
from analyzer import decode,analyze,InvalidAudio,chord_events

class AnalysisTests(unittest.TestCase):
    def test_silence_has_no_fabricated_estimates(self):
        result=analyze(np.zeros(48000,dtype=np.float32),16000,3)
        self.assertIsNone(result['bpm']);self.assertIsNone(result['key']);self.assertIsNone(result['confidence']);self.assertEqual(result['chords'],[])
    def test_triad_windows_preserve_timestamps(self):
        c=np.zeros((12,64));c[[0,4,7],:32]=1;c[[7,11,2],32:]=1
        events=chord_events(c,16000,512,2)
        self.assertEqual(events[0]['chord'],'C');self.assertEqual(events[-1]['chord'],'G');self.assertEqual(events[-1]['end'],2)
    def test_ffmpeg_decodes_real_pcm_and_rejects_disguised_file(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d)/'input.wav'
            with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(16000);w.writeframes(np.zeros(48000,dtype='<i2').tobytes())
            audio,sr,duration=decode(p,'wav');self.assertEqual(sr,16000);self.assertEqual(duration,3);self.assertEqual(len(audio),48000)
            import subprocess
            mp3=pathlib.Path(d)/'encoded.mp3'
            subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(p),str(mp3)],check=True,timeout=10)
            _,rate,seconds=decode(mp3,'mp3');self.assertEqual(rate,16000);self.assertGreater(seconds,2.9);self.assertLess(seconds,3.2)
            with self.assertRaises(InvalidAudio):decode(p,'mp3')
            p.write_bytes(b'RIFF'+b'\0'*4+b'WAVE'+b'\0'*100)
            with self.assertRaises(InvalidAudio):decode(p,'wav')
    def test_duration_limit_is_real_not_client_metadata(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d)/'short.wav'
            with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(16000);w.writeframes(np.zeros(1000,dtype='<i2').tobytes())
            with self.assertRaises(InvalidAudio):decode(p,'wav')

class WorkerLeaseTests(unittest.TestCase):
    @unittest.skipUnless(__import__('os').getenv('RUN_DB_TESTS')=='1','requires isolated strumlab_test')
    def test_expired_cancelled_claims_cannot_publish_and_skip_locked(self):
        from worker import connect,claim,finish
        import os
        self.assertEqual(os.getenv('POSTGRES_DB'),'strumlab_test')
        with connect() as conn:
            owner=uuid.uuid4();song=uuid.uuid4();asset=uuid.uuid4();job=uuid.uuid4()
            conn.execute('INSERT INTO workspace(id,name) VALUES (%s,%s)',(owner,'Worker fixture'))
            conn.execute("INSERT INTO song(id,owner_id,title,status) VALUES (%s,%s,'Worker fixture','draft')",(song,owner))
            conn.execute("INSERT INTO audio_asset(id,song_id,owner_id,sha256,extension,mime,rights_basis,size_bytes,audio_bytes) VALUES (%s,%s,%s,'test','wav','audio/wav','own',44,%s)",(asset,song,owner,b'0'*44))
            conn.execute("INSERT INTO processing_job(id,asset_id,generation,algorithm_version) VALUES (%s,%s,1,'chroma-baseline-v1')",(job,asset));conn.commit()
            # Own fixture only; do not claim unrelated tests' jobs.
            lease=uuid.uuid4();conn.execute("UPDATE processing_job SET status='processing',attempts=1,lease_token=%s,lease_until=CURRENT_TIMESTAMP-INTERVAL '1 second' WHERE id=%s",(lease,job));conn.commit()
            stale={'id':job,'asset_id':asset,'lease':lease};self.assertFalse(finish(conn,stale,{'error':'processing_failed'}))
            conn.execute("UPDATE processing_job SET status='cancelled',lease_until=CURRENT_TIMESTAMP+INTERVAL '1 minute' WHERE id=%s",(job,));conn.commit();self.assertFalse(finish(conn,stale,{'error':'processing_failed'}))
            second=uuid.uuid4()
            conn.execute("UPDATE processing_job SET status='pending',created_at='1970-01-01',lease_token=NULL,lease_until=NULL WHERE id=%s",(job,))
            conn.execute("INSERT INTO processing_job(id,asset_id,generation,algorithm_version,created_at) VALUES (%s,%s,2,'chroma-baseline-v1','1970-01-02')",(second,asset));conn.commit()
            with connect() as locked:
                locked.execute("SELECT id FROM processing_job WHERE id=%s FOR UPDATE",(job,))
                next_job=claim(conn);self.assertEqual(next_job['id'],second)
                self.assertTrue(finish(conn,next_job,{'error':'processing_failed'}))
            recovered=claim(conn);self.assertEqual(recovered['id'],job);self.assertNotEqual(recovered['lease'],lease)
            self.assertTrue(finish(conn,recovered,{'error':'processing_failed'}))
            conn.execute("UPDATE audio_asset SET status='deleted',audio_bytes=NULL WHERE id=%s",(asset,));conn.commit()

if __name__=='__main__':unittest.main()
