# Estado real da implementação

Data: 14/10/2026. Escopo autorizado: iniciar a produção seguindo a sequência v1.1,
com confirmação explícita da stack e do protótipo local de usuário único.

## Análise inicial

O repositório tinha README, licença e pacote documental com galeria de mockups;
nenhuma aplicação, dependência, migration ou teste de produto existia.
Foram lidos README/AGENTS, visão, requisitos, arquitetura, modelo de dados,
roadmap, decisões, testes, DESIGN, telas, contratos complementares e validação visual.
Fonte normativa preservada em `StrumLab-documentacao-v1.1/`; prompts operacionais
seguem essa especificação. A Fase 1 precede biblioteca/editor, livros e áudio.

## Entrega da Fase 1

- `apps/web`: Next.js 16.4.0, React 19.3.0 e TypeScript; shell Papel & Cordas,
  navegação Início/Músicas/Cancioneiros/Batidas/Preferências, foco, skip link,
  layout móvel e redução de movimento conforme sistema.
- Rotas de fases posteriores exibem somente estados de preparação, sem catálogo,
  estatísticas simuladas, criação, áudio, exportação ou ações falsas.
- `apps/api`: Java 21, Spring Boot 4.1.1, JDBC/Flyway e Spring Security;
  somente GET `/api/v1/health` permitido; demais endpoints negados.
  Login público indisponível e sem usuário/senha padrão gerados pelo framework.
- Health consulta a tabela migrada; falha de banco/workspace retorna 503 sem
  detalhes internos. Frontend usa proxy same-origin com timeout e contrato validado.
- `infra/compose.yaml`: PostgreSQL 17.6, healthcheck e volume local persistente.
- Migration V1 cria apenas workspace sintético local. Nenhuma entidade musical
  ou módulo de fase futura foi criado.
- `packages/contracts/openapi.yaml`: contrato versionado e tipos TypeScript gerados.
- Maven Wrapper, lockfile npm, `.env.example`, inicialização com senha aleatória,
  scripts PowerShell, README operacional e workflow GitHub Actions.

## Evidências e critérios

| Verificação | Resultado local |
|---|---|
| Docker Compose up com wait | PostgreSQL saudável em 127.0.0.1:5433 |
| Maven Wrapper verify | Build da API, 3 testes unitários e 2 testes de integração aprovados |
| Flyway V1 | Aplicada em banco inicialmente vazio; reexecução valida schema sem duplicar migration |
| Segurança HTTP | GET de músicas e actuator negados com 403 |
| ESLint | Aprovado |
| TypeScript | Aprovado |
| Vitest | 8 testes aprovados: contrato, formato inválido, resposta 503 e banco indisponível |
| Next.js build | Build otimizado e rotas geradas |
| Build em execução | Smoke test com next start: navegação, health real e ausência de erros JavaScript no navegador |
| Playwright | 5 cenários aprovados, incluindo jornada com API e PostgreSQL reais |
| Responsividade/teclado | Rotas em 360/390/1440 px, sem overflow horizontal; skip link e foco verificados |
| Inspeção visual | Capturas reais desktop e celular inspecionadas; evidências locais em `.cache/` |
| Auditoria de produção npm | Zero vulnerabilidades com `npm audit --omit=dev` |
| Git | `.env`, caches, logs e artefatos de build ignorados; diff sem erros de whitespace |

Comandos reproduzíveis estão no README. Os testes de navegador de recuperação usam
respostas simuladas; somente o cenário `LIVE_API=1` testa os serviços reais.
Integração Java usa PostgreSQL real, não SQLite/H2. CI usa banco efêmero isolado.

## Ocorrências resolvidas no ambiente

- `npm.ps1` bloqueado pela política local: usado `npm.cmd`.
- Cache global npm restrito ao agente: usado `--cache .cache/npm` nas instalações.
- Docker Desktop instalado, mas inicialmente sem engine ativo: iniciado e validado.
- O gerador Spring retornou versão com sufixo `.RELEASE`; corrigida para a versão
  publicada no Maven Central (`4.1.1`).
- O compilador Java encontrou AccessDenied ao resolver JARs no sandbox Windows;
  compilação/testes executados com permissão ampliada, sem alterar a implementação.
- A primeira integração não carregou `.env` por política PowerShell; corrigida com
  scripts executados via `-ExecutionPolicy Bypass` apenas no processo.
- JAR em execução bloqueou repackage no Windows; encerrado antes da repetição.
- Limpeza automática do servidor E2E ficou aguardando no Windows; servidor
  temporário encerrado e adicionada opção `EXTERNAL_WEB=1` para frontend separado.
- A variável de ambiente herdada `DEBUG=release` ativava o modo de teste interno
  do Next.js e gerava recarregamentos contínuos no dev. Removida apenas do processo
  web; configuração E2E limpa DEBUG e README documenta o comando. Repetição final
  dos cinco cenários passou em 5,7 segundos, sem esperas de limpeza. CI foi configurado
  para executar E2E sobre `next start` após o build.

## Limitações e próximo gate

Fase 1 validada localmente. Workflow CI criado, mas não executado no GitHub nesta
sessão. Nenhum commit, push, deploy, serviço remoto ou contratação realizado.
QA em Chromium; Firefox/Safari, leitor de tela e auditoria WCAG integral não realizados.
PWA/offline e controles personalizados de leitura ainda não implementados.
Protótipo vinculado ao loopback; workspace fixo **não é autenticação** e não autoriza
hospedagem pública, contas ou armazenamento multiusuário.

Auditoria completa npm registrou cinco alertas altos derivados de `braces` na
cadeia `micromatch/fast-glob/eslint-config-next`, usada no desenvolvimento.
O registry não oferecia versão corrigida de braces; não foi aplicado downgrade
incompatível sugerido por `audit fix --force`. Auditoria de produção passou.
Reavaliar a cadeia de lint quando houver correção compatível.

Próximo trabalho: prompt `02-fase-2-biblioteca-editor.md`, após autorização da fase
e revisão das decisões pertinentes (ChordPro, revisões e modelo de ownership).
Não iniciar análise musical, samples, PDF ou playlists durante esse gate.
