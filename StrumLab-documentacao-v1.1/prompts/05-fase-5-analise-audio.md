# Prompt Codex — Fase 5 — Análise de áudio

Atue como engenheiro responsável pelo StrumLab. **Não implemente outra fase.**

## Contexto obrigatório
Leia `AGENTS.md`, `README.md`, `docs/10-roadmap.md`, `docs/12-decisoes.md` e docs/08-analise-audio.md, docs/04-modelo-de-dados.md, docs/11-testes.md. Inspecione código, Git, migrations e testes existentes. Preserve trabalho válido.

## Antes de editar
Apresente plano curto, arquivos previstos, riscos, critérios de aceite e decisões bloqueantes. Confirme apenas decisões bloqueantes ainda não resolvidas; reutilize decisões já autorizadas. Não peça nova aprovação para ações reversíveis dentro da fase autorizada. e não invente credenciais, integrações ou serviços.

## Implementação
Implemente upload validado, storage privado, ProcessingJob e AnalysisResult separados da revisão, worker Python/FFmpeg, estimativas de BPM/tom/acordes, tratamento de erros e revisão seletiva. Antes de escolher modelo final, execute spike de qualidade com dados autorizados.

## Critério de aceite
processamento assíncrono, resultados rotulados como estimativas e correções preservadas.

## Qualidade e entrega
Crie testes de unidade, integração e/ou E2E proporcionais à fase; valide entradas e permissões; registre migrations e documentação. Execute os comandos realmente disponíveis. Ao final, reporte arquivos alterados, decisões tomadas, testes executados com resultado, limitações e próximo passo. Não alegue sucesso de teste/deploy não executado.

## Contexto visual complementar
Leia DESIGN.md e docs/14-telas-funcionalidades.md; consulte docs/15-contratos-ux-dados.md. Mockups são referência visual proposta, não evidência de código pronto. Implemente apenas comportamentos da fase autorizada.
