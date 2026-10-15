'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [['/', 'Início', '01'], ['/musicas', 'Músicas', '02'], ['/cancioneiros', 'Cancioneiros', '03'], ['/batidas', 'Batidas', '04'], ['/analise', 'Análise de áudio', '05'], ['/importacoes', 'Playlists', '06'], ['/preferencias', 'Preferências', '07']];
export function Navigation() {
  const path = usePathname();
  return <nav aria-label="Navegação principal">{links.map(([href, label, number]) => <Link key={href} href={href} aria-current={(path === href || (href !== '/' && path.startsWith(`${href}/`))) ? 'page' : undefined}><span className="nav-number" aria-hidden="true">{number}</span>{label}</Link>)}</nav>;
}
