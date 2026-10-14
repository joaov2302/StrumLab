'use client';
import { useEffect, useState } from 'react';
import { loadHealth } from '@/lib/health';

export function HealthStatus() {
  const [status, setStatus] = useState<'loading' | 'up' | 'down'>('loading');
  async function check(signal?: AbortSignal) {
    try {
      await loadHealth(signal);
      if (!signal?.aborted) setStatus('up');
    } catch {
      if (!signal?.aborted) setStatus('down');
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    loadHealth(controller.signal).then(
      () => { if (!controller.signal.aborted) setStatus('up'); },
      () => { if (!controller.signal.aborted) setStatus('down'); },
    );
    return () => controller.abort();
  }, []);
  return <section className="status-panel" aria-labelledby="connection-title">
    <div><p className="eyebrow">Ambiente local</p><h2 id="connection-title">Conexão da biblioteca</h2></div>
    <p role="status" aria-live="polite">{status === 'loading' ? 'Verificando API e banco…' : status === 'up' ? 'API e PostgreSQL disponíveis' : 'API ou banco indisponível'}</p>
    {status === 'down' ? <><p className="muted">Inicie os serviços locais e tente novamente.</p><button onClick={() => { setStatus('loading'); void check(); }}>Tentar novamente</button></> : null}
  </section>;
}
