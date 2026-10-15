import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import './globals.css';

export const metadata: Metadata = { title: { default: 'StrumLab — Sua bancada musical', template: '%s | StrumLab' }, description: 'Seu espaço para cifras, cancioneiros e prática de violão.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><div className="app-shell"><aside className="sidebar"><Link className="brand" href="/">StrumLab<span>Da música ao seu cancioneiro.</span></Link><Navigation /><div className="sidebar-note"><span className="local-dot" aria-hidden="true" />Protótipo local<span>Repertório e playlists · Fase 6</span></div></aside><div className="workspace"><header className="topbar"><span>Biblioteca pessoal</span><span className="badge">Uso local · sem login público</span></header><main id="conteudo" tabIndex={-1}>{children}</main><footer>StrumLab <span>Um espaço para o seu repertório.</span></footer></div></div></body></html>;
}
