"""One bounded job per process; durable claims/leases and no revision writes."""
import os,json,time,uuid,hashlib,tempfile,pathlib,subprocess
import psycopg
from psycopg.rows import dict_row
ALGORITHM='chroma-baseline-v1'

def connect():
    return psycopg.connect(host=os.getenv('PGHOST','postgres'),port=os.getenv('PGPORT','5432'),dbname=os.environ.get('POSTGRES_DB','strumlab'),user=os.environ['POSTGRES_USER'],password=os.environ['POSTGRES_PASSWORD'],row_factory=dict_row,connect_timeout=5)

def claim(conn):
    with conn.transaction():
        conn.execute("UPDATE processing_job SET status='failed',error_code='lease_expired',finished_at=CURRENT_TIMESTAMP WHERE status='processing' AND lease_until<CURRENT_TIMESTAMP AND attempts>=3")
        row=conn.execute("""SELECT j.id,j.asset_id FROM processing_job j JOIN audio_asset a ON a.id=j.asset_id
          WHERE a.audio_bytes IS NOT NULL AND a.status<>'deleted' AND j.attempts<3 AND j.algorithm_version=%s
          AND (j.status='pending' OR (j.status='processing' AND j.lease_until<CURRENT_TIMESTAMP))
          ORDER BY j.created_at FOR UPDATE OF j SKIP LOCKED LIMIT 1""",(ALGORITHM,)).fetchone()
        if not row:return None
        lease=uuid.uuid4();conn.execute("UPDATE processing_job SET status='processing',attempts=attempts+1,lease_token=%s,lease_until=CURRENT_TIMESTAMP+INTERVAL '240 seconds',error_code=NULL WHERE id=%s",(lease,row['id']))
        asset=conn.execute("SELECT audio_bytes,sha256,extension FROM audio_asset WHERE id=%s",(row['asset_id'],)).fetchone()
        return {**row,**asset,'lease':lease}

def finish(conn,job,payload):
    with conn.transaction():
        # Same lock order as deletion: asset first, then job. Late/cancelled leases cannot publish.
        asset=conn.execute("SELECT status FROM audio_asset WHERE id=%s FOR UPDATE",(job['asset_id'],)).fetchone()
        current=conn.execute("SELECT status,lease_token,lease_until>CURRENT_TIMESTAMP AS live FROM processing_job WHERE id=%s FOR UPDATE",(job['id'],)).fetchone()
        if not asset or asset['status']=='deleted' or current['status']!='processing' or current['lease_token']!=job['lease'] or not current['live']:return False
        if 'error' in payload:
            code=payload['error'] if payload['error'] in ['invalid_format','invalid_audio','duration_or_channels','integrity_failed','timeout','processing_failed'] else 'processing_failed'
            conn.execute("UPDATE processing_job SET status='failed',error_code=%s,finished_at=CURRENT_TIMESTAMP,lease_token=NULL,lease_until=NULL WHERE id=%s",(code,job['id']))
            if code in ['invalid_format','invalid_audio','duration_or_channels']:conn.execute("UPDATE audio_asset SET status='invalid' WHERE id=%s",(job['asset_id'],))
        else:
            result=payload['result'];needed=result['bpm'] is None and result['key'] is None and not any(e['chord']!='N' for e in result['chords'])
            conn.execute("INSERT INTO analysis_result(id,job_id,result_json) VALUES (%s,%s,%s::jsonb)",(uuid.uuid4(),job['id'],json.dumps(result,allow_nan=False)))
            conn.execute("UPDATE audio_asset SET status='valid',duration_seconds=%s WHERE id=%s",(result['duration'],job['asset_id']))
            conn.execute("UPDATE processing_job SET status=%s,finished_at=CURRENT_TIMESTAMP,lease_token=NULL,lease_until=NULL WHERE id=%s",('needs_input' if needed else 'completed',job['id']))
        return True

def process(job):
    raw=bytes(job['audio_bytes']) if job['audio_bytes'] is not None else b''
    if hashlib.sha256(raw).hexdigest()!=job['sha256']:return {'error':'integrity_failed'}
    with tempfile.TemporaryDirectory(prefix='analysis-') as directory:
        path=pathlib.Path(directory)/('input.'+job['extension']);path.write_bytes(raw)
        try:
            run=subprocess.run(['python','/app/analyzer.py',str(path),job['extension']],capture_output=True,timeout=180)
            if run.returncode or len(run.stdout)>1000000:return {'error':'processing_failed'}
            payload=json.loads(run.stdout)
            if 'result' in payload and payload['result'].get('algorithmVersion')!=ALGORITHM:return {'error':'processing_failed'}
            return payload
        except subprocess.TimeoutExpired:return {'error':'timeout'}
        except (ValueError,OSError):return {'error':'processing_failed'}

def main():
    while True:
        try:
            with connect() as conn:
                job=claim(conn)
                if job:
                    started=time.monotonic();payload=process(job);finish(conn,job,payload)
                    print(json.dumps({'event':'analysis_finished','elapsedSeconds':round(time.monotonic()-started,2),'outcome':'failed' if 'error' in payload else 'result'}),flush=True)
                else:time.sleep(1)
        except psycopg.Error:
            print('{"event":"database_unavailable"}',flush=True);time.sleep(3)

if __name__=='__main__':main()
