# Prompt Codex — Fase 1 — Fundação

Atue como engenheiro responsável pelo StrumLab. **Não implemente outra fase.**

## Contexto obrigatório
Leia `AGENTS.md`, `README.md`, `docs/10-roadmap.md`, `docs/12-decisoes.md` e docs/03-arquitetura.md, docs/10-roadmap.md, docs/12-decisoes.md. Inspecione código, Git, migrations e testes existentes. Preserve trabalho válido.

## Antes de editar
Apresente plano curto, arquivos previstos, riscos, critérios de aceite e decisões bloqueantes. Confirme apenas decisões bloqueantes ainda não resolvidas; reutilize decisões já autorizadas. Não peça nova aprovação para ações reversíveis dentro da fase autorizada. e não invente credenciais, integrações ou serviços.

## Implementação
Inicialize frontend Next.js/TypeScript, API Spring Boot/Java 21 (após validação), PostgreSQL local via Docker Compose, migrations, scripts, README, `.env.example`, health, testes e rotas com placeholders: Início, Músicas, Batidas, Cancioneiros e Preferências; funções de fases posteriores ficam vazias e claramente identificadas, sem ações falsas. Estruture componentes responsivos e acessíveis. Não implemente regras de fases futuras.

## Critério de aceite
frontend chama health da API local; migrations executam; build/lint/test passam; nenhum segredo em Git.

## Qualidade e entrega
Crie testes de unidade, integração e/ou E2E proporcionais à fase; valide entradas e permissões; registre migrations e documentação. Execute os comandos realmente disponíveis. Ao final, reporte arquivos alterados, decisões tomadas, testes executados com resultado, limitações e próximo passo. Não alegue sucesso de teste/deploy não executado.

## Contexto visual complementar
Leia DESIGN.md e docs/14-telas-funcionalidades.md; consulte docs/15-contratos-ux-dados.md. Mockups são referência visual proposta, não evidência de código pronto. Implemente apenas comportamentos da fase autorizada.
