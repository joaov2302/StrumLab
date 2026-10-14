# Prompt Codex — Fase 4 — Biblioteca de batidas

Atue como engenheiro responsável pelo StrumLab. **Não implemente outra fase.**

## Contexto obrigatório
Leia `AGENTS.md`, `README.md`, `docs/10-roadmap.md`, `docs/12-decisoes.md` e docs/07-biblioteca-batidas.md, docs/06-cancioneiros.md, docs/11-testes.md. Inspecione código, Git, migrations e testes existentes. Preserve trabalho válido.

## Antes de editar
Apresente plano curto, arquivos previstos, riscos, critérios de aceite e decisões bloqueantes. Confirme apenas decisões bloqueantes ainda não resolvidas; reutilize decisões já autorizadas. Não peça nova aprovação para ações reversíveis dentro da fase autorizada. e não invente credenciais, integrações ou serviços.

## Implementação
Implemente Pop/Folk básico a partir de examples/pop-folk-basic.json, UI de setas, Web Audio API com amostras de violão licenciadas, metrônomo, BPM, loop, play/pause, reinício, seleção G/C/D/Em, animação sincronizada e vínculo à cifra/PDF. Se não houver samples licenciados, solicitar assets ou entregar fallback claramente provisório.

## Critério de aceite
90 BPM: 8 movimentos, 4 cliques, 6 ataques; sem duplicação de schedulers; fallback seguro.

## Qualidade e entrega
Crie testes de unidade, integração e/ou E2E proporcionais à fase; valide entradas e permissões; registre migrations e documentação. Execute os comandos realmente disponíveis. Ao final, reporte arquivos alterados, decisões tomadas, testes executados com resultado, limitações e próximo passo. Não alegue sucesso de teste/deploy não executado.

## Contexto visual complementar
Leia DESIGN.md e docs/14-telas-funcionalidades.md; consulte docs/15-contratos-ux-dados.md. Mockups são referência visual proposta, não evidência de código pronto. Implemente apenas comportamentos da fase autorizada.
