# 10 — Roadmap revisado

**Mudança importante em relação à v0.2:** editor, cancioneiro e batidas vêm **antes** da análise automática. A v0.2 tinha análise na Fase 3; na v1.0 passa à Fase 5. A sequência abaixo é proposta, não implementação existente.

| Fase | Entrega verificável | Dependências | Prompt |
|---|---|---|---|
| 1 Fundação | Frontend + API + PostgreSQL + navegação + health + testes | Decisões D-001–D-004 | `prompts/01-fase-1-fundacao.md` |
| 2 Biblioteca e editor | CRUD, cifra estruturada, revisões, transposição, capo | Fase 1 | `prompts/02-fase-2-biblioteca-editor.md` |
| 3 Cancioneiros | Coleções, ordem, capa, índice, prévia e PDF | Fase 2 | `prompts/03-fase-3-cancioneiros.md` |
| 4 Biblioteca de batidas | Pop/Folk, samples reais, metrônomo, setas e vínculo | Fases 2–3 | `prompts/04-fase-4-batidas.md` |
| 5 Análise de áudio | Upload, worker, BPM/tom/acordes sugeridos | Fases 1–2 | `prompts/05-fase-5-analise-audio.md` |
| 6 Playlists | Importação de metadados, seleção e jobs isolados | Fases 2 e 5 | `prompts/06-fase-6-playlists.md` |
| 7 Futuro | Compartilhamento, colaboração, tablaturas e recursos avançados | Validação de demanda e licenças | Sem prompt inicial |

## Marco MVP manual
Fases 1–4: usuário cria/edita cifra, organiza biblioteca, gera cancioneiro imprimível e pratica batida Pop/Folk com metrônomo e timbre de violão. **Não exigir IA para entregar valor.**

## Marco análise assistida
Fase 5: arquivo autorizado vira sugestão de BPM/tom/acordes, revisada manualmente.

## Marco playlist
Fase 6: importação de metadados e preparação de cancioneiro, sem prometer acesso a áudio de streaming.

## Sessão inicial — 14/10/2026
1. Criar repositório; copiar pacote; conferir README, AGENTS e decisões.
2. Confirmar stack e modo de autenticação para desenvolvimento.
3. Rodar prompt Fase 1: infraestrutura local, rotas vazias e health.
4. Validar `docker compose up`, migrations, testes, lint e build.
5. Registrar decisões e bloqueios; não antecipar análise de áudio.

## Definition of Done por fase
Código inspecionado, testes executados, critérios demonstrados, migrations versionadas, documentação e decisões atualizadas, riscos e limitações declarados; não alegar validação não realizada.

## Execução — 14/10/2026

Fase 1 implementada e validada localmente com a stack e o modo local confirmados
pelo usuário. PostgreSQL real, migration Flyway, API e jornada de health no navegador
verificados. Evidências, comandos e limitações em [docs/execucao.md](../../docs/execucao.md)
e [README operacional](../../README.md). CI preparado, ainda não executado remotamente.
Fases 2–6 não implementadas. Próximo gate: biblioteca/editor, conforme prompt 02,
com revisão das decisões específicas e autorização dessa fase.

## Continuação — 14/10/2026 — Fase 2

Biblioteca/editor implementados após o pedido do usuário para continuar. CRUD por
criação/edição/listagem/arquivo, tokens semânticos, revisões imutáveis, rascunho,
conflito, transposição/capo e ChordPro básico validados em PostgreSQL real e navegador.
Gate local aprovado: 49 testes, lint, tipos e build. Evidências e limitações no
[registro de execução](../../docs/execucao.md), contrato em [editor.md](../../docs/editor.md).
CI preparado, não executado remotamente. Fases 3–6 não implementadas.
Próximo gate: prompt 03, Cancioneiros, incluindo spike da renderização PDF.

## Continuação — 14/10/2026 — Fase 3

Cancioneiros implementados: revisão fixada, ordenação atômica por drag/botões,
capa/texto/imagem, A4/1–2 colunas, índice real, PDF persistido e prévia dos mesmos bytes.
Spike PDFKit/Chromium executado antes da seleção do motor. Gate local validado:
59 testes, lint, tipos, build e renderização/inspeção PDF, com PostgreSQL separado.
Evidências em [execucao.md](../../docs/execucao.md), contrato em
[cancioneiros.md](../../docs/cancioneiros.md). Fases 4–6 não implementadas.
Próximo gate: Fase 4 — biblioteca de batidas, com origem/licenças de samples de
violão real verificadas antes de disponibilizar áudio.

## Continuação — 14/10/2026 — Fase 4

Pop/Folk v1, samples FreePats CC0, metrônomo, grade sincronizada, transporte/BPM/
G-C-D-Em, vínculo versionado e snapshot por item/PDF implementados após autorização
explícita. Gate local: 76 testes (27 Java, 35 Vitest, 14 Playwright), lint, tipos,
build, hashes/áudio offline, PostgreSQL real e inspeção de PDFs A4/1–2 colunas.
Marco MVP manual das Fases 1–4 disponível localmente. Evidências/limites no
[registro de execução](../../docs/execucao.md) e [contrato de batidas](../../docs/batidas.md).
CI preparado e não executado remotamente; sem publicação. Fases 5–6 não implementadas.
Próximo gate: Fase 5 — análise assistida de arquivos autorizados, somente após pedido.

## Continuação — 15/10/2026 — Fase 5

Análise assistida privada concluída e validada localmente: upload autorizado,
fila persistida, worker Python/FFmpeg, sugestões experimentais de BPM/tom/tríades,
revisão seletiva com conflito e preservação das correções humanas. Spike STFT/CQT
reexecutado; CQT é baseline experimental para o conjunto pequeno, sem confiança
calibrada. Gate: 90 testes (32 Java, 35 Vitest, sete Python, 16 Playwright), sem skips,
lint, tipos, build, PostgreSQL exclusivo de QA e inspeção visual desktop/celular.
Comandos/limites em [analise-audio.md](../../docs/analise-audio.md), evidências em
[execucao.md](../../docs/execucao.md). CI preparado; execução remota não verificada.
Fase 6 não implementada. Próximo gate: playlists por metadados autorizados,
somente após nova solicitação e revisão das condições dos provedores.

## Continuação — 15/10/2026 — Fase 6

Spotify escolhido pelo usuário. Importação oficial de metadados, OAuth/PKCE,
fila persistida, seleção/pendências por item, cópia/vínculo de revisões e livro
parcial com duplicatas explícitas implementados. Gate controlado: 107 testes
(47 Java, 35 Vitest, sete Python, 18 Playwright), sem skips, lint/tipos/build,
PostgreSQL exclusivo de QA e inspeção visual desktop/celular.
Spotify simulado por servidor HTTP somente em testes; conexão/importação da
conta real ainda depende do consentimento OAuth do usuário. CI preparado e não
executado remotamente. Fontes, limites e comandos em
[playlists.md](../../docs/playlists.md); evidências em
[execucao.md](../../docs/execucao.md). Fase 7 não iniciada e exige definição de
escopo/autorização própria; não há próximo prompt de implementação automática.
