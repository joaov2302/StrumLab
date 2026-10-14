# 11 — Estratégia de testes e qualidade

## Níveis
- **Unitários:** transposição (incluindo sustenidos/bemóis e slash chords), parser de cifra, ordenação, cálculo de BPM/slots, estado do player, idempotência.
- **Integração:** API + PostgreSQL com migrations, persistência de revisões, vínculo de batidas, geração de manifesto, jobs.
- **E2E:** criar cifra → salvar → incluir em livro → exportar; player Pop/Folk → BPM → pausa → metrônomo.
- **Visuais:** PDF A4 com música longa, acordes complexos, Unicode, 1/2 colunas, capa e sumário real; responsividade em celular.
- **Acessibilidade:** teclado, foco, leitores de tela, contraste, `prefers-reduced-motion`, controles de áudio com rótulos.
- **Segurança:** autorização por dono, uploads, limites, validação, ausência de segredos em logs e artefatos.

## Gates
1. `lint`, `typecheck`, `test` e `build` passam; CI com passos reproduzíveis.
2. Backend health e migrations em banco limpo.
3. Fase 2: nenhuma alteração manual é perdida após reabrir ou transpor.
4. Fase 3: PDF com índice correto, sem acordes deslocados e sem texto cortado.
5. Fase 4: 90 BPM = 8 slots / 4 cliques / 6 ataques em um compasso Pop/Folk; teste real de sincronização e fallback.
6. Fase 5: análise não bloqueia API e não sobrescreve revisão.
7. Fase 6: falha de item não cancela importação inteira.

## Testes de propriedade sugeridos
- Transpor +N e depois -N restaura símbolos normalizados conforme política enarmônica.
- Ordenar músicas não altera identidade/revisão de Song.
- Exportação repetida com mesmo manifesto preserva conteúdo lógico.
- Player mantém um único scheduler após mudanças rápidas de BPM/play/pause.

## Qualidade mínima
Não declarar testes aprovados sem executar; registrar comandos, versões, ambiente, evidências e falhas conhecidas. Usar dados sintéticos/licenciados em testes e não colocar áudio ou letras de terceiros no repositório.
