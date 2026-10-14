# 02 — Requisitos e critérios de aceite

**Prioridades:** `P0` = indispensável na respectiva fase; `P1` = relevante após fluxo mínimo; `Futuro` = fora do compromisso. Estados exibidos a seguir são requisitos planejados, **não implementação concluída**.

## Requisitos funcionais

| ID | Funcionalidade | Fase | Pri. | Critério verificável |
|---|---|---:|---|---|
| RF-01 | Navegação responsiva e identidade StrumLab | 1 | P0 | Rotas acessíveis, telas vazias identificadas como protótipo |
| RF-02 | API e persistência local | 1 | P0 | Frontend chama `health`, PostgreSQL com migrations aplicadas |
| RF-03 | Criar, editar, listar e arquivar músicas | 2 | P0 | CRUD preserva dados e ownership |
| RF-04 | Editor com seções, linhas e acordes estruturados | 2 | P0 | Acordes permanecem associados ao texto após salvar/reabrir |
| RF-05 | Histórico e controle de revisão de cifras | 2 | P0 | Versão anterior recuperável, conflito de edição detectável |
| RF-06 | Transposição e capo | 2 | P0 | Transposição altera acordes corretos, não altera letra |
| RF-07 | Importar/exportar ChordPro simples | 2 | P1 | Round-trip dos acordes e texto suportados, sem perda silenciosa |
| RF-08 | Criar cancioneiro e ordenar músicas | 3 | P0 | Inclusão, exclusão e reordenação persistidas |
| RF-09 | Capa, índice, paginação, prévia e PDF | 3 | P0 | A4 legível, índice/ordem coerentes, páginas sem truncamento |
| RF-10 | Prévia consistente com exportação | 3 | P0 | Mesmo conteúdo e mesmas revisões selecionadas |
| RF-11 | Catálogo de batidas com filtros | 4 | P0 | Pop/Folk encontrável por estilo, compasso e dificuldade |
| RF-12 | Player de violão com BPM, loop e acorde | 4 | P0 | Áudio licenciado audível, sem trilhas duplicadas; G/C/D/Em |
| RF-13 | Metrônomo, setas e animação sincronizados | 4 | P0 | Tempos/coincidência auditiva-visuais testados |
| RF-14 | Aplicar batida à cifra e ao PDF | 4 | P0 | Associação persistida e legenda opcional no PDF |
| RF-15 | Diagramas/simplificação de acordes | 4 | P1 | Posições verificadas, alterações do usuário preservadas |
| RF-16 | Upload MP3/WAV/gravação autorizada | 5 | P0 | Upload validado, erros claros, retenção/limites aplicados |
| RF-17 | Estimar BPM, tom e acordes temporais | 5 | P0 | Resultado editável, com proveniência, confiança e avisos |
| RF-18 | Reprocessar sem perder cifra revisada | 5 | P0 | Resultado novo separado de revisão humana |
| RF-19 | Importar metadados de playlist por API oficial | 6 | P0 | Não há download de áudio implícito |
| RF-20 | Jobs individuais, retomada e pendências de playlist | 6 | P0 | Falha isolada, reprocessamento seguro e exportação parcial explícita |
| RF-21 | Compartilhamento/collaboração | Futuro | - | Requer política de direitos e privacidade |
| RF-22 | Notas, tablaturas e separação de instrumentos | Futuro | - | Necessita avaliação de viabilidade técnica |

## Regras de negócio transversais

- **RB-01:** `Song` independente de `Songbook`; mesma música pode estar em múltiplos cancioneiros; a posição pertence a `SongbookItem`.
- **RB-02:** revisão humana nunca é sobrescrita por sugestão de IA; análise origina um `AnalysisResult` separado.
- **RB-03:** `SongbookItem` aponta explicitamente para a revisão usada; atualizar a música não altera silenciosamente um cancioneiro já preparado.
- **RB-04:** exportar PDF captura o conjunto exato de revisões, layout e ordenação; alterações futuras não mutam PDF histórico.
- **RB-05:** o usuário só acessa ou altera conteúdo que lhe pertence ou lhe foi explicitamente compartilhado (compartilhamento futuro).
- **RB-06:** batida de catálogo é **modelo didático**; batida sugerida por algoritmo é **estimativa**. Ambas distinguem-se de atribuição autoral/precisão garantida.
- **RB-07:** link externo fornece metadados/URL; não pressupõe licença de áudio, letra ou cifras.
- **RB-08:** cada item de playlist possui status próprio; erro individual não impede itens saudáveis.
- **RB-09:** upload exige autorização declarada e política de armazenamento/exclusão; não publicar o arquivo automaticamente.
- **RB-10:** indisponibilidade de amostras musicais não pode travar tela nem gerar sons mascarados como violão real.

## Requisitos não funcionais (metas iniciais propostas)

| ID | Tema | Meta verificável / ressalva |
|---|---|---|
| RNF-01 | Responsividade | Navegação e tarefas P0 utilizáveis a partir de 360 px; editor otimizado para desktop |
| RNF-02 | Acessibilidade | Foco visível, teclado, rótulos, redução de movimento, meta WCAG 2.2 AA para fluxos P0 |
| RNF-03 | Dados | PostgreSQL, migrations repetíveis e integridade referencial |
| RNF-04 | Segurança | Sem segredos no git, endpoints validados, isolamento por usuário, CORS por allowlist |
| RNF-05 | Jobs | Estados `pending/processing/completed/failed/needs_input`, tentativas limitadas, idempotência |
| RNF-06 | Observabilidade | Logs estruturados sem áudio/letras/tokens de usuário; correlation ID |
| RNF-07 | Performance web | Evitar bloqueio do thread de interface; carregamento progressivo de PDFs e amostras |
| RNF-08 | Áudio interativo | Agendamento pelo relógio do `AudioContext`; medir jitter real, não declarar sincronia perfeita |
| RNF-09 | Portabilidade | Compose local e `.env.example`; deploy desacoplado do fornecedor |
| RNF-10 | Licenças | Proveniência, direitos e licenças de áudio/lyrics/rasgueados verificáveis |
| RNF-11 | Compatibilidade | Testes em Chrome/Edge/Firefox/Safari atualizados, inclusive restrições de autoplay |
| RNF-12 | Exclusão/retensão | Prazos definidos antes de habilitar uploads públicos; remoção de blobs e referências |

## Estados relevantes

- Música: `draft`, `reviewed`, `archived` (o processamento de análise é separado).
- Job: `pending`, `processing`, `completed`, `failed`, `needs_input`, `cancelled` (último se suportado na implementação).
- PlaylistItem: `pending_metadata`, `needs_audio`, `ready`, `processing`, `completed`, `failed`.
- Revisão de cifra: imutável uma vez confirmada; editor trabalha em rascunho/revisão de trabalho.

## Critérios de sucesso por marco

**MVP 1 (fases 1–4):** sem depender de IA, usuário cadastra uma cifra, edita acordes, transpõe, organiza cancioneiro, pratica Pop/Folk e exporta PDF coerente.

**MVP 2 (fase 5):** arquivo autorizado gera BPM, tonalidade e acordes **aproximados**, todos editáveis, sem sobrescrever versões revisadas.

**MVP 3 (fase 6):** importar metadados da playlist, tratar pendências item a item e exportar somente músicas com conteúdo autorizado/revisado.

## Limites não fixados

Valores definitivos de MB/minutos/janela de retenção, escolha de autenticação e metas quantitativas de acurácia do modelo dependem de teste e aprovação. **Não inventar números vinculantes** durante implementação; usar configurações explícitas e documentar seus defaults antes de publicar.

## Referência de UX v1.1
Telas, estados e rotas propostos em docs/14-telas-funcionalidades.md; contratos complementares em docs/15-contratos-ux-dados.md. Não considerar imagens como funcionalidades implementadas.
