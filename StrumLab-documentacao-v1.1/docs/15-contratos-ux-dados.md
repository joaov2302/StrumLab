# 15 — Contratos complementares de UX e dados

Propostas da revisão v1.1 a validar na implementação; não acrescentam fase nem serviço novo.

## Snapshot musical de revisão

`Song` mantém metadados de descoberta/estado atual. `SongRevision.content_json` deve capturar título/artista, tom escrito, capo, BPM/compasso e tokens usados na renderização. Leitura histórica e PDF usam snapshot; editar o título atual não modifica a revisão N. Distinguir “tom escrito” de “tom soando”: capo 2 com forma G corresponde a A se não houver outra transposição. Não modificar acordes apenas por editar capo.

`SongSection` não exige tabela separada: seções com IDs já pertencem a `content_json`. Se for normalizado depois, registrar migração sem manter duas fontes divergentes.

## Snapshot da batida no cancioneiro

O vínculo ativo `SongStrummingPattern` pode mudar para prática. Isso não deve mudar automaticamente livro já preparado. Proposta: `SongbookItem.strumming_snapshot_json?` guarda ID/versão do padrão, eventos/símbolos, compasso, BPM override, notas/personalização e opção de exibição. Capturar ao adicionar/atualizar explicitamente um item após Fase 4. Versão do padrão deve permanecer resolvível; excluir catálogo não apaga snapshot já usado.

Exportação captura snapshot completo de cada item, revisão musical, ordem, layout, fonte e versão do renderizador. Prévia e exportação referem-se ao mesmo manifesto. Hash ou ID identifica prévia atual; alterações invalidam sua disponibilidade até regenerar. Volume, acorde de demonstração e posição do player não são conteúdo impresso.

## Rascunho, revisão e conflito

- Editar cria rascunho com `base_revision_id`. Autosave grava rascunho, não publica automaticamente revisão final.
- “Salvar revisão” cria N+1 e atualiza base. Distinguir “rascunho salvo” de “revisão salva”.
- Erro não remove dados locais em memória; recuperação persistente offline depende de contrato separado.
- 409 preserva rascunho; comparar ou salvar cópia requer ação explícita. Restaurar N cria revisão nova baseada em N.

## Aplicar batida

Selecionar música existente; confirmar batida/versão/BPM; persistir vínculo somente após sucesso. Livro existente exige atualização explícita de seu snapshot. A demo G/C/D/Em não promete acompanhamento da progressão da cifra.

## Player

Slots zero-based. Silêncio nos slots 1 e 4. Mão continua alternando down/up. Clique nos pares 0,2,4,6. Troca de BPM no próximo limite de compasso é a proposta inicial; UI informa “BPM pendente”. Pausa cancela fontes futuras, preserva posição; reinício retorna a zero. Resume em novo marco de áudio com compensação visual. Ganhos do violão e metrônomo independentes; “reduzir movimento” troca animação por contorno/posição numérica. Não anunciar todo slot em aria-live.

## Estados e fases

Fase 1 contém shell e rotas vazias identificadas. Não tornar funcionalidades posteriores ativas para combinar com mockup. Prévia de futuro no material de design é permitida, sem prometer disponibilidade. Autenticação pública, importação de PDF, categorias editoriais e offline completo permanecem pendentes/futuros.
