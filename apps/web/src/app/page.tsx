import Link from 'next/link';
import { HealthStatus } from '@/components/health-status';
const modules = [
  { href: '/musicas', number: '02', title: 'Sua biblioteca de cifras', text: 'Um lugar para escrever, revisar e encontrar seu repertório.', phase: 'Disponível · Biblioteca e editor' },
  { href: '/cancioneiros', number: '03', title: 'Repertórios que viram livros', text: 'Reúna músicas na ordem do ensaio e prepare seu cancioneiro.', phase: 'Disponível · Montagem, prévia e PDF' },
  { href: '/batidas', number: '04', title: 'Seu próximo ritmo', text: 'Pratique modelos de batida com violão e metrônomo.', phase: 'Fase 4 · Disponível localmente' },
];
export default function Home() {
  return <><p className="eyebrow">Sua bancada musical</p><h1>O repertório começa aqui.</h1><p className="intro">Das primeiras anotações ao próximo ensaio.<br />Um espaço para dar forma às suas músicas.</p><section className="welcome-panel"><div><span className="badge">Biblioteca e editor disponíveis</span><h2>Um novo espaço para tocar.</h2><p>Crie sua cifra, organize os acordes e preserve cada revisão. Seu repertório fica na sua biblioteca local.</p><Link className="button" href="/musicas">Abrir minhas músicas <span aria-hidden="true">↗</span></Link></div><div className="strings" aria-hidden="true"><span /><span /><span /><span /><span /><span /><b>S</b></div></section><section className="module-section" aria-labelledby="modules-title"><h2 id="modules-title">Explore sua bancada</h2><div className="module-list">{modules.map(module => <Link className="module" href={module.href} key={module.href}><span className="module-number" aria-hidden="true">{module.number}</span><div><h3>{module.title}</h3><p>{module.text}</p><span className="phase-label">{module.phase}</span></div><span aria-hidden="true">↗</span></Link>)}</div></section><HealthStatus /></>;
}
