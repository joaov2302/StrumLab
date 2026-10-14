import Link from 'next/link';
export function FutureModule({ title, phase, description }: { title: string; phase: number; description: string }) {
  return <><p className="eyebrow">Seu espaço musical · Fase {phase}</p><h1>{title}</h1><section className="empty-panel"><span className="phase-mark" aria-hidden="true">0{phase}</span><h2>Este espaço está em preparação</h2><p>{description}</p><p className="muted">Disponível após a implementação e validação da Fase {phase}.</p><Link className="button" href="/">Voltar ao início</Link></section></>;
}
